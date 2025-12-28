<?php
require_once '../../config/headers.php';
require_once '../../config/database.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Méthode non autorisée']);
    exit;
}

$code = $_GET['code'] ?? $_GET['code_verification'] ?? null;

if (!$code) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Code de vérification requis']);
    exit;
}

try {
    $pdo = getDBConnection();
    
    $stmt = $pdo->prepare('
        SELECT f.*, 
               e.nom as eleve_nom, 
               e.prenom as eleve_prenom,
               e.classe,
               e.adresse as eleve_adresse,
               u.nom as tuteur_nom,
               u.prenom as tuteur_prenom,
               d.description
        FROM factures f
        LEFT JOIN eleves e ON f.eleve_id = e.id
        LEFT JOIN utilisateurs u ON f.tuteur_id = u.id
        LEFT JOIN demandes d ON f.demande_id = d.id
        WHERE f.code_verification = ? AND f.statut = "En attente"
    ');
    
    $stmt->execute([$code]);
    $facture = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$facture) {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Code de vérification invalide ou facture déjà payée']);
        exit;
    }
    
    echo json_encode([
        'success' => true,
        'data' => $facture
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Erreur: ' . $e->getMessage()]);
}
?>

