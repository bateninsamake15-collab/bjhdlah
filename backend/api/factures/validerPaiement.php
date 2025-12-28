<?php
require_once '../../config/headers.php';
require_once '../../config/database.php';

if ($_SERVER['REQUEST_METHOD'] !== 'PUT') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Méthode non autorisée']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);

if (!isset($data['code_verification'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Code de vérification requis']);
    exit;
}

try {
    $pdo = getDBConnection();
    $pdo->beginTransaction();
    
    // Récupérer la facture avec les infos de la demande
    $stmt = $pdo->prepare('
        SELECT f.*, d.description, e.adresse as eleve_adresse
        FROM factures f
        LEFT JOIN demandes d ON f.demande_id = d.id
        LEFT JOIN eleves e ON f.eleve_id = e.id
        WHERE f.code_verification = ? AND f.statut = "En attente"
    ');
    $stmt->execute([$data['code_verification']]);
    $facture = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$facture) {
        $pdo->rollBack();
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Code de vérification invalide ou facture déjà payée']);
        exit;
    }
    
    // Extraire la zone de l'élève depuis la description de la demande
    $description = json_decode($facture['description'] ?? '{}', true);
    $zoneEleve = $description['zone'] ?? $facture['eleve_adresse'] ?? '';
    
    // Trouver un bus disponible pour cette zone
    $busId = null;
    if ($zoneEleve) {
        // Récupérer tous les bus actifs avec leurs trajets
        $stmt = $pdo->prepare('
            SELECT b.id, b.numero, b.capacite, b.trajet_id, t.zones
            FROM bus b
            LEFT JOIN trajets t ON b.trajet_id = t.id
            WHERE b.statut = "Actif"
        ');
        $stmt->execute();
        $allBuses = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Pour chaque bus, vérifier s'il a de la place et si sa zone correspond
        foreach ($allBuses as $bus) {
            $zonesTrajet = [];
            if ($bus['zones']) {
                try {
                    $zonesTrajet = json_decode($bus['zones'], true);
                    if (!is_array($zonesTrajet)) {
                        $zonesTrajet = explode(',', $bus['zones']);
                        $zonesTrajet = array_map('trim', $zonesTrajet);
                    }
                } catch (Exception $e) {
                    $zonesTrajet = explode(',', $bus['zones']);
                    $zonesTrajet = array_map('trim', $zonesTrajet);
                }
            }
            
            // Vérifier si la zone de l'élève correspond
            $zoneMatch = false;
            if (empty($zonesTrajet)) {
                $zoneMatch = true; // Si le trajet n'a pas de zones définies, accepter
            } else {
                foreach ($zonesTrajet as $zt) {
                    if (stripos($zt, $zoneEleve) !== false || stripos($zoneEleve, $zt) !== false) {
                        $zoneMatch = true;
                        break;
                    }
                }
            }
            
            if ($zoneMatch) {
                // Compter les inscriptions actives pour ce bus
                $stmt = $pdo->prepare('
                    SELECT COUNT(*) as count
                    FROM inscriptions
                    WHERE bus_id = ? AND statut IN ("Active", "Suspendue")
                ');
                $stmt->execute([$bus['id']]);
                $count = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
                
                if ($count < $bus['capacite']) {
                    $busId = $bus['id'];
                    break; // Prendre le premier bus disponible
                }
            }
        }
    }
    
    if (!$busId) {
        // Si aucun bus trouvé, prendre le premier bus actif avec de la place
        $stmt = $pdo->prepare('
            SELECT b.id, b.capacite
            FROM bus b
            WHERE b.statut = "Actif"
            ORDER BY b.id
            LIMIT 1
        ');
        $stmt->execute();
        $bus = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($bus) {
            // Vérifier s'il y a de la place
            $stmt = $pdo->prepare('
                SELECT COUNT(*) as count
                FROM inscriptions
                WHERE bus_id = ? AND statut IN ("Active", "Suspendue")
            ');
            $stmt->execute([$bus['id']]);
            $count = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
            
            if ($count < $bus['capacite']) {
                $busId = $bus['id'];
            }
        }
    }
    
    if (!$busId) {
        $pdo->rollBack();
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Aucun bus disponible pour cette zone']);
        exit;
    }
    
    // Marquer la facture comme payée
    $stmt = $pdo->prepare('UPDATE factures SET statut = "Payée", date_paiement = NOW() WHERE id = ?');
    $stmt->execute([$facture['id']]);
    
    // Mettre à jour la demande (déjà faite lors de la validation admin)
    // $stmt = $pdo->prepare('UPDATE demandes SET statut = "Approuvée", date_traitement = NOW() WHERE id = ?');
    // $stmt->execute([$facture['demande_id']]);
    
    // Créer l'inscription avec le bus
    $montantMensuel = $facture['montant'];
    if (isset($description['abonnement']) && $description['abonnement'] === 'Annuel') {
        $montantMensuel = $facture['montant'] / 10; // Diviser par 10 si annuel
    }
    
    $stmt = $pdo->prepare('
        INSERT INTO inscriptions (eleve_id, bus_id, date_inscription, date_debut, statut, montant_mensuel)
        VALUES (?, ?, CURDATE(), CURDATE(), "Active", ?)
    ');
    $stmt->execute([
        $facture['eleve_id'],
        $busId,
        $montantMensuel
    ]);
    
    $inscriptionId = $pdo->lastInsertId();
    
    // Créer le paiement
    $stmt = $pdo->prepare('
        INSERT INTO paiements (inscription_id, facture_id, montant, mois, annee, date_paiement, statut, code_verification)
        VALUES (?, ?, ?, MONTH(CURDATE()), YEAR(CURDATE()), CURDATE(), "Payé", ?)
    ');
    $stmt->execute([
        $inscriptionId,
        $facture['id'],
        $facture['montant'],
        $data['code_verification']
    ]);
    
    // Mettre à jour le statut de l'élève
    $stmt = $pdo->prepare('UPDATE eleves SET statut = "Actif" WHERE id = ?');
    $stmt->execute([$facture['eleve_id']]);
    
    // Récupérer les infos de l'élève, du bus et trouver un admin pour la notification
    $stmt = $pdo->prepare('SELECT e.nom as eleve_nom, e.prenom as eleve_prenom FROM eleves e WHERE e.id = ?');
    $stmt->execute([$facture['eleve_id']]);
    $eleve = $stmt->fetch(PDO::FETCH_ASSOC);
    
    $stmt = $pdo->prepare('SELECT numero FROM bus WHERE id = ?');
    $stmt->execute([$busId]);
    $bus = $stmt->fetch(PDO::FETCH_ASSOC);
    
    // Trouver un admin pour notifier
    $stmt = $pdo->prepare('SELECT id FROM utilisateurs WHERE role = "admin" AND statut = "Actif" LIMIT 1');
    $stmt->execute();
    $admin = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($admin) {
        // Créer la notification pour l'admin
        $stmt = $pdo->prepare('
            INSERT INTO notifications (destinataire_id, destinataire_type, titre, message, type, date)
            VALUES (?, "admin", ?, ?, "info", NOW())
        ');
        $stmt->execute([
            $admin['id'],
            'Paiement validé - Inscription confirmée',
            "Le paiement pour {$eleve['eleve_prenom']} {$eleve['eleve_nom']} a été validé. L'élève a été affecté au bus {$bus['numero']}. Montant: {$facture['montant']} DH."
        ]);
    }
    
    $pdo->commit();
    
    echo json_encode([
        'success' => true,
        'message' => 'Paiement validé et élève affecté au bus',
        'data' => [
            'facture_id' => $facture['id'],
            'inscription_id' => $inscriptionId,
            'bus_id' => $busId,
            'bus_numero' => $bus['numero'],
            'eleve_nom' => $eleve['eleve_nom'],
            'eleve_prenom' => $eleve['eleve_prenom']
        ]
    ]);
} catch (PDOException $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Erreur lors de la validation: ' . $e->getMessage()]);
}
?>

