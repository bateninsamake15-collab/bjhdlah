<?php
require_once '../../config/headers.php';
require_once '../../config/database.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Méthode non autorisée']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);

if (!isset($data['demande_id']) || !isset($data['eleve_id']) || !isset($data['tuteur_id']) || !isset($data['montant'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Données incomplètes']);
    exit;
}

try {
    $pdo = getDBConnection();
    
    // Générer un code de vérification unique (8 caractères alphanumériques)
    function generateVerificationCode() {
        $characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Exclut les caractères ambigus
        $code = '';
        for ($i = 0; $i < 8; $i++) {
            $code .= $characters[rand(0, strlen($characters) - 1)];
        }
        return $code;
    }
    
    // Générer un code unique
    $codeVerification = generateVerificationCode();
    $maxAttempts = 10;
    $attempts = 0;
    
    while ($attempts < $maxAttempts) {
        $stmt = $pdo->prepare('SELECT id FROM factures WHERE code_verification = ?');
        $stmt->execute([$codeVerification]);
        if (!$stmt->fetch()) {
            break; // Code unique trouvé
        }
        $codeVerification = generateVerificationCode();
        $attempts++;
    }
    
    if ($attempts >= $maxAttempts) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Erreur lors de la génération du code de vérification']);
        exit;
    }
    
    $stmt = $pdo->prepare('
        INSERT INTO factures (demande_id, eleve_id, tuteur_id, montant, code_verification, type_transport, statut)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    ');
    
    $stmt->execute([
        $data['demande_id'],
        $data['eleve_id'],
        $data['tuteur_id'],
        $data['montant'],
        $codeVerification,
        $data['type_transport'] ?? null,
        'En attente'
    ]);
    
    $id = $pdo->lastInsertId();
    
    $stmt = $pdo->prepare('SELECT * FROM factures WHERE id = ?');
    $stmt->execute([$id]);
    $facture = $stmt->fetch(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'success' => true,
        'data' => $facture
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Erreur lors de la création de la facture: ' . $e->getMessage()]);
}
?>

