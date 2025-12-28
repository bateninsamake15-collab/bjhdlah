<?php
require_once '../../config/headers.php';
require_once '../../config/database.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Méthode non autorisée']);
    exit;
}

$demandeId = $_GET['demande_id'] ?? null;

if (!$demandeId) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'demande_id requis']);
    exit;
}

try {
    $pdo = getDBConnection();
    
    $stmt = $pdo->prepare('
        SELECT f.*, 
               e.nom as eleve_nom, 
               e.prenom as eleve_prenom,
               e.classe
        FROM factures f
        LEFT JOIN eleves e ON f.eleve_id = e.id
        WHERE f.demande_id = ?
    ');
    
    $stmt->execute([$demandeId]);
    $facture = $stmt->fetch(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'success' => true,
        'data' => $facture ?: null
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Erreur: ' . $e->getMessage()]);
}
?>

