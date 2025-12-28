-- ============================================
-- SCRIPT SQL COMPLET - SYSTÈME DE TRANSPORT SCOLAIRE
-- ============================================
-- Ce script crée la base de données complète avec toutes les tables,
-- les mises à jour nécessaires et les données de test
-- ============================================

-- Créer la base de données
CREATE DATABASE IF NOT EXISTS transport_scolaire;
USE transport_scolaire;

-- ============================================
-- PARTIE 1: CRÉATION DES TABLES
-- ============================================

-- Table utilisateurs (admins, chauffeurs, responsables, tuteurs)
CREATE TABLE IF NOT EXISTS utilisateurs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nom VARCHAR(100) NOT NULL,
    prenom VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    mot_de_passe VARCHAR(255) NOT NULL,
    telephone VARCHAR(20),
    role ENUM('admin', 'chauffeur', 'responsable', 'tuteur') NOT NULL,
    statut ENUM('Actif', 'Inactif') DEFAULT 'Actif',
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    date_modification TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Table eleves
CREATE TABLE IF NOT EXISTS eleves (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nom VARCHAR(100) NOT NULL,
    prenom VARCHAR(100) NOT NULL,
    date_naissance DATE,
    adresse TEXT,
    telephone_parent VARCHAR(20),
    email_parent VARCHAR(150),
    classe VARCHAR(50),
    tuteur_id INT,
    statut ENUM('Actif', 'Inactif') DEFAULT 'Actif',
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tuteur_id) REFERENCES utilisateurs(id) ON DELETE SET NULL
);

-- Table chauffeurs
CREATE TABLE IF NOT EXISTS chauffeurs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    utilisateur_id INT UNIQUE,
    numero_permis VARCHAR(50) UNIQUE NOT NULL,
    date_expiration_permis DATE,
    nombre_accidents INT DEFAULT 0,
    statut ENUM('Actif', 'Licencié', 'Suspendu') DEFAULT 'Actif',
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (utilisateur_id) REFERENCES utilisateurs(id) ON DELETE CASCADE
);

-- Table responsables_bus
CREATE TABLE IF NOT EXISTS responsables_bus (
    id INT PRIMARY KEY AUTO_INCREMENT,
    utilisateur_id INT UNIQUE,
    zone_responsabilite VARCHAR(100),
    statut ENUM('Actif', 'Inactif') DEFAULT 'Actif',
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (utilisateur_id) REFERENCES utilisateurs(id) ON DELETE CASCADE
);

-- Table trajets
CREATE TABLE IF NOT EXISTS trajets (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nom VARCHAR(255) NOT NULL,
    zones TEXT,
    heure_depart_matin_a TIME,
    heure_arrivee_matin_a TIME,
    heure_depart_soir_a TIME,
    heure_arrivee_soir_a TIME,
    heure_depart_matin_b TIME,
    heure_arrivee_matin_b TIME,
    heure_depart_soir_b TIME,
    heure_arrivee_soir_b TIME,
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table bus
CREATE TABLE IF NOT EXISTS bus (
    id INT PRIMARY KEY AUTO_INCREMENT,
    numero VARCHAR(20) UNIQUE NOT NULL,
    marque VARCHAR(50),
    modele VARCHAR(50),
    annee_fabrication YEAR,
    capacite INT NOT NULL,
    chauffeur_id INT,
    responsable_id INT,
    trajet_id INT,
    statut ENUM('Actif', 'En maintenance', 'Hors service') DEFAULT 'Actif',
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (chauffeur_id) REFERENCES chauffeurs(id) ON DELETE SET NULL,
    FOREIGN KEY (responsable_id) REFERENCES responsables_bus(id) ON DELETE SET NULL,
    FOREIGN KEY (trajet_id) REFERENCES trajets(id) ON DELETE SET NULL
);

-- Table accidents
CREATE TABLE IF NOT EXISTS accidents (
    id INT PRIMARY KEY AUTO_INCREMENT,
    date DATE NOT NULL,
    heure TIME,
    bus_id INT,
    chauffeur_id INT,
    description TEXT NOT NULL,
    degats TEXT,
    lieu VARCHAR(255),
    gravite ENUM('Légère', 'Moyenne', 'Grave') NOT NULL,
    blesses BOOLEAN DEFAULT FALSE,
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (bus_id) REFERENCES bus(id) ON DELETE SET NULL,
    FOREIGN KEY (chauffeur_id) REFERENCES chauffeurs(id) ON DELETE SET NULL
);

-- Table notifications
CREATE TABLE IF NOT EXISTS notifications (
    id INT PRIMARY KEY AUTO_INCREMENT,
    destinataire_id INT NOT NULL,
    destinataire_type ENUM('chauffeur', 'responsable', 'tuteur', 'admin') NOT NULL,
    titre VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type ENUM('info', 'alerte', 'avertissement') DEFAULT 'info',
    lue BOOLEAN DEFAULT FALSE,
    date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table demandes (avec support des nouveaux types)
CREATE TABLE IF NOT EXISTS demandes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    eleve_id INT,
    tuteur_id INT NOT NULL,
    type_demande ENUM('inscription', 'modification', 'desinscription', 'Augmentation', 'Congé', 'Déménagement', 'Autre') NOT NULL,
    description TEXT,
    commentaire TEXT NULL,
    statut ENUM('En attente', 'Approuvée', 'Rejetée') DEFAULT 'En attente',
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    date_traitement TIMESTAMP NULL,
    traite_par INT,
    FOREIGN KEY (eleve_id) REFERENCES eleves(id) ON DELETE CASCADE,
    FOREIGN KEY (tuteur_id) REFERENCES utilisateurs(id) ON DELETE CASCADE,
    FOREIGN KEY (traite_par) REFERENCES utilisateurs(id) ON DELETE SET NULL
);

-- Table inscriptions
CREATE TABLE IF NOT EXISTS inscriptions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    eleve_id INT NOT NULL,
    bus_id INT,
    date_inscription DATE NOT NULL,
    date_debut DATE,
    date_fin DATE,
    statut ENUM('Active', 'Suspendue', 'Terminée') DEFAULT 'Active',
    montant_mensuel DECIMAL(10,2),
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (eleve_id) REFERENCES eleves(id) ON DELETE CASCADE,
    FOREIGN KEY (bus_id) REFERENCES bus(id) ON DELETE SET NULL
);

-- Table factures (pour les inscriptions)
CREATE TABLE IF NOT EXISTS factures (
    id INT PRIMARY KEY AUTO_INCREMENT,
    demande_id INT NOT NULL,
    eleve_id INT NOT NULL,
    tuteur_id INT NOT NULL,
    montant DECIMAL(10,2) NOT NULL,
    code_verification VARCHAR(20) UNIQUE NOT NULL,
    type_transport VARCHAR(50),
    statut ENUM('En attente', 'Payée', 'Annulée') DEFAULT 'En attente',
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    date_paiement TIMESTAMP NULL,
    FOREIGN KEY (demande_id) REFERENCES demandes(id) ON DELETE CASCADE,
    FOREIGN KEY (eleve_id) REFERENCES eleves(id) ON DELETE CASCADE,
    FOREIGN KEY (tuteur_id) REFERENCES utilisateurs(id) ON DELETE CASCADE
);

-- Table paiements
CREATE TABLE IF NOT EXISTS paiements (
    id INT PRIMARY KEY AUTO_INCREMENT,
    inscription_id INT NOT NULL,
    facture_id INT,
    montant DECIMAL(10,2) NOT NULL,
    mois INT NOT NULL,
    annee YEAR NOT NULL,
    date_paiement DATE NOT NULL,
    mode_paiement ENUM('Espèces', 'Virement', 'Carte bancaire', 'Chèque') DEFAULT 'Espèces',
    statut ENUM('Payé', 'En attente', 'Échoué') DEFAULT 'Payé',
    code_verification VARCHAR(20),
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (inscription_id) REFERENCES inscriptions(id) ON DELETE CASCADE,
    FOREIGN KEY (facture_id) REFERENCES factures(id) ON DELETE SET NULL
);

-- Table presences
CREATE TABLE IF NOT EXISTS presences (
    id INT PRIMARY KEY AUTO_INCREMENT,
    eleve_id INT NOT NULL,
    date DATE NOT NULL,
    present_matin BOOLEAN DEFAULT FALSE,
    present_soir BOOLEAN DEFAULT FALSE,
    bus_id INT,
    responsable_id INT,
    chauffeur_id INT,
    remarque TEXT,
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (eleve_id) REFERENCES eleves(id) ON DELETE CASCADE,
    FOREIGN KEY (bus_id) REFERENCES bus(id) ON DELETE SET NULL,
    FOREIGN KEY (responsable_id) REFERENCES responsables_bus(id) ON DELETE SET NULL,
    FOREIGN KEY (chauffeur_id) REFERENCES chauffeurs(id) ON DELETE SET NULL,
    UNIQUE KEY unique_presence (eleve_id, date)
);

-- Table conduire
CREATE TABLE IF NOT EXISTS conduire (
    id INT PRIMARY KEY AUTO_INCREMENT,
    chauffeur_id INT NOT NULL,
    trajet_id INT NOT NULL,
    bus_id INT,
    date_debut DATE NOT NULL,
    date_fin DATE,
    statut ENUM('Actif', 'Terminé', 'Suspendu') DEFAULT 'Actif',
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (chauffeur_id) REFERENCES chauffeurs(id) ON DELETE CASCADE,
    FOREIGN KEY (trajet_id) REFERENCES trajets(id) ON DELETE CASCADE,
    FOREIGN KEY (bus_id) REFERENCES bus(id) ON DELETE SET NULL
);

-- ============================================
-- PARTIE 2: MISE À JOUR DES TABLES EXISTANTES
-- ============================================

-- Mettre à jour la table eleves pour ajouter 'Refusé' au statut ENUM
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = 'transport_scolaire' AND TABLE_NAME = 'eleves' AND COLUMN_NAME = 'statut');
SET @enum_has_refuse = (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = 'transport_scolaire' 
    AND TABLE_NAME = 'eleves' 
    AND COLUMN_NAME = 'statut' 
    AND COLUMN_TYPE LIKE '%Refusé%'
);

SET @sql_add_refuse = IF(@col_exists > 0 AND @enum_has_refuse = 0, 
    'ALTER TABLE eleves MODIFY statut ENUM(\'Actif\', \'Inactif\', \'Refusé\') DEFAULT \'Actif\'', 
    'SELECT "Column statut already has Refusé or does not exist" AS message');
PREPARE stmt FROM @sql_add_refuse; 
EXECUTE stmt; 
DEALLOCATE PREPARE stmt;

-- Ajouter le champ commentaire à demandes si il n'existe pas
SET @col_exists = (SELECT COUNT(*) 
  FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = 'transport_scolaire' 
  AND TABLE_NAME = 'demandes' 
  AND COLUMN_NAME = 'commentaire');

SET @sql = IF(@col_exists = 0,
    'ALTER TABLE demandes ADD COLUMN commentaire TEXT NULL AFTER description',
    'SELECT "Column commentaire already exists" AS message');

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Mettre à jour l'ENUM type_demande pour supporter les nouveaux types
ALTER TABLE demandes 
MODIFY COLUMN type_demande ENUM(
    'inscription', 
    'modification', 
    'desinscription',
    'Augmentation',
    'Congé',
    'Déménagement',
    'Autre'
) NOT NULL;

-- Mettre à jour la table eleves pour ajouter 'Refusé' au statut ENUM
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = 'transport_scolaire' AND TABLE_NAME = 'eleves' AND COLUMN_NAME = 'statut');
SET @enum_has_refuse = (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = 'transport_scolaire' 
    AND TABLE_NAME = 'eleves' 
    AND COLUMN_NAME = 'statut' 
    AND COLUMN_TYPE LIKE '%Refusé%'
);

SET @sql_add_refuse = IF(@col_exists > 0 AND @enum_has_refuse = 0, 
    'ALTER TABLE eleves MODIFY statut ENUM(\'Actif\', \'Inactif\', \'Refusé\') DEFAULT \'Actif\'', 
    'SELECT "Column statut already has Refusé or does not exist" AS message');
PREPARE stmt FROM @sql_add_refuse; 
EXECUTE stmt; 
DEALLOCATE PREPARE stmt;

-- ============================================
-- PARTIE 3: CRÉATION DES INDEX
-- ============================================

CREATE INDEX IF NOT EXISTS idx_utilisateurs_email ON utilisateurs(email);
CREATE INDEX IF NOT EXISTS idx_utilisateurs_role ON utilisateurs(role);
CREATE INDEX IF NOT EXISTS idx_eleves_tuteur ON eleves(tuteur_id);
CREATE INDEX IF NOT EXISTS idx_bus_chauffeur ON bus(chauffeur_id);
CREATE INDEX IF NOT EXISTS idx_bus_responsable ON bus(responsable_id);
CREATE INDEX IF NOT EXISTS idx_bus_trajet ON bus(trajet_id);
CREATE INDEX IF NOT EXISTS idx_accidents_bus ON accidents(bus_id);
CREATE INDEX IF NOT EXISTS idx_accidents_chauffeur ON accidents(chauffeur_id);
CREATE INDEX IF NOT EXISTS idx_notifications_destinataire ON notifications(destinataire_id, destinataire_type);
CREATE INDEX IF NOT EXISTS idx_demandes_statut ON demandes(statut);
CREATE INDEX IF NOT EXISTS idx_inscriptions_bus ON inscriptions(bus_id);
CREATE INDEX IF NOT EXISTS idx_factures_demande ON factures(demande_id);
CREATE INDEX IF NOT EXISTS idx_factures_code ON factures(code_verification);
CREATE INDEX IF NOT EXISTS idx_factures_eleve ON factures(eleve_id);
CREATE INDEX IF NOT EXISTS idx_paiements_inscription ON paiements(inscription_id);
CREATE INDEX IF NOT EXISTS idx_paiements_facture ON paiements(facture_id);
CREATE INDEX IF NOT EXISTS idx_presences_eleve ON presences(eleve_id);
CREATE INDEX IF NOT EXISTS idx_presences_date ON presences(date);
CREATE INDEX IF NOT EXISTS idx_presences_bus ON presences(bus_id);
CREATE INDEX IF NOT EXISTS idx_conduire_chauffeur ON conduire(chauffeur_id);
CREATE INDEX IF NOT EXISTS idx_conduire_trajet ON conduire(trajet_id);

-- ============================================
-- PARTIE 4: DONNÉES DE TEST
-- ============================================
-- Mot de passe pour tous les comptes de test : test123
-- Hash du mot de passe : $2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi

-- Nettoyer les données existantes (optionnel - décommentez si nécessaire)
-- TRUNCATE TABLE notifications;
-- TRUNCATE TABLE paiements;
-- TRUNCATE TABLE demandes;
-- TRUNCATE TABLE presences;
-- TRUNCATE TABLE inscriptions;
-- TRUNCATE TABLE eleves;
-- TRUNCATE TABLE bus;
-- TRUNCATE TABLE trajets;
-- TRUNCATE TABLE responsables_bus;
-- TRUNCATE TABLE chauffeurs;
-- DELETE FROM utilisateurs WHERE role != 'admin';

-- 1. Créer les utilisateurs de test (sans spécifier les IDs pour éviter les conflits)
INSERT IGNORE INTO utilisateurs (nom, prenom, email, mot_de_passe, telephone, role, statut) VALUES
-- Admin de test
('Admin', 'Système', 'admin@transport.ma', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '0612345678', 'admin', 'Actif'),
-- Chauffeurs de test
('Idrissi', 'Ahmed', 'ahmed.idrissi@transport.ma', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '0612345682', 'chauffeur', 'Actif'),
('Tazi', 'Youssef', 'youssef.tazi@transport.ma', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '0612345683', 'chauffeur', 'Actif'),
('El Fassi', 'Karim', 'karim.elfassi@transport.ma', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '0612345684', 'chauffeur', 'Actif'),
-- Responsables de test
('Kettani', 'Nadia', 'nadia.kettani@transport.ma', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '0612345685', 'responsable', 'Actif'),
('Benjelloun', 'Omar', 'omar.benjelloun@transport.ma', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '0612345686', 'responsable', 'Actif'),
-- Tuteurs de test
('Alami', 'Mohammed', 'mohammed.alami@email.ma', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '0612345679', 'tuteur', 'Actif'),
('Benjelloun', 'Fatima', 'fatima.benjelloun@email.ma', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '0612345680', 'tuteur', 'Actif');

-- 2. Créer les chauffeurs (en utilisant les IDs des utilisateurs créés)
INSERT IGNORE INTO chauffeurs (utilisateur_id, numero_permis, date_expiration_permis, nombre_accidents, statut)
SELECT id, 'CH-001956', DATE_ADD(CURDATE(), INTERVAL 2 YEAR), 0, 'Actif' FROM utilisateurs WHERE email = 'ahmed.idrissi@transport.ma' LIMIT 1;

INSERT IGNORE INTO chauffeurs (utilisateur_id, numero_permis, date_expiration_permis, nombre_accidents, statut)
SELECT id, 'CH-002147', DATE_ADD(CURDATE(), INTERVAL 3 YEAR), 1, 'Actif' FROM utilisateurs WHERE email = 'youssef.tazi@transport.ma' LIMIT 1;

INSERT IGNORE INTO chauffeurs (utilisateur_id, numero_permis, date_expiration_permis, nombre_accidents, statut)
SELECT id, 'CH-003258', DATE_ADD(CURDATE(), INTERVAL 1 YEAR), 0, 'Actif' FROM utilisateurs WHERE email = 'karim.elfassi@transport.ma' LIMIT 1;

-- 3. Créer les responsables
INSERT IGNORE INTO responsables_bus (utilisateur_id, zone_responsabilite, statut)
SELECT id, 'Zone Centre', 'Actif' FROM utilisateurs WHERE email = 'nadia.kettani@transport.ma' LIMIT 1;

INSERT IGNORE INTO responsables_bus (utilisateur_id, zone_responsabilite, statut)
SELECT id, 'Zone Nord', 'Actif' FROM utilisateurs WHERE email = 'omar.benjelloun@transport.ma' LIMIT 1;

-- 4. Créer des trajets
INSERT IGNORE INTO trajets (nom, zones, heure_depart_matin_a, heure_arrivee_matin_a, heure_depart_soir_a, heure_arrivee_soir_a, heure_depart_matin_b, heure_arrivee_matin_b, heure_depart_soir_b, heure_arrivee_soir_b) VALUES
('Trajet Centre-Agdal', 'agdal,hay riad', '07:00:00', '08:00:00', '17:00:00', '18:00:00', '07:30:00', '08:30:00', '17:30:00', '18:30:00'),
('Trajet Nord-Medina', 'medina,hay el fath', '07:15:00', '08:15:00', '17:15:00', '18:15:00', '07:45:00', '08:45:00', '17:45:00', '18:45:00');

-- 5. Créer des bus (en utilisant les IDs des chauffeurs et responsables créés)
INSERT IGNORE INTO bus (numero, marque, modele, annee_fabrication, capacite, chauffeur_id, responsable_id, trajet_id, statut)
SELECT 'BUS-001', 'Mercedes', 'Sprinter', 2020, 50, c.id, r.id, 1, 'Actif'
FROM chauffeurs c, responsables_bus r
WHERE c.utilisateur_id = (SELECT id FROM utilisateurs WHERE email = 'ahmed.idrissi@transport.ma')
AND r.utilisateur_id = (SELECT id FROM utilisateurs WHERE email = 'nadia.kettani@transport.ma')
LIMIT 1;

INSERT IGNORE INTO bus (numero, marque, modele, annee_fabrication, capacite, chauffeur_id, responsable_id, trajet_id, statut)
SELECT 'BUS-002', 'Volvo', '9700', 2019, 45, c.id, r.id, 1, 'Actif'
FROM chauffeurs c, responsables_bus r
WHERE c.utilisateur_id = (SELECT id FROM utilisateurs WHERE email = 'youssef.tazi@transport.ma')
AND r.utilisateur_id = (SELECT id FROM utilisateurs WHERE email = 'nadia.kettani@transport.ma')
LIMIT 1;

INSERT IGNORE INTO bus (numero, marque, modele, annee_fabrication, capacite, chauffeur_id, responsable_id, trajet_id, statut)
SELECT 'BUS-003', 'Iveco', 'Daily', 2021, 40, c.id, r.id, 2, 'Actif'
FROM chauffeurs c, responsables_bus r
WHERE c.utilisateur_id = (SELECT id FROM utilisateurs WHERE email = 'karim.elfassi@transport.ma')
AND r.utilisateur_id = (SELECT id FROM utilisateurs WHERE email = 'omar.benjelloun@transport.ma')
LIMIT 1;

-- 6. Créer des élèves (en utilisant les IDs des tuteurs)
INSERT IGNORE INTO eleves (nom, prenom, date_naissance, adresse, telephone_parent, email_parent, classe, tuteur_id, statut)
SELECT 'Alami', 'Hassan', '2010-05-15', '123 Rue Mohammed V, Agdal', '0612345679', 'mohammed.alami@email.ma', 'CM2', id, 'Actif'
FROM utilisateurs WHERE email = 'mohammed.alami@email.ma' LIMIT 1;

INSERT IGNORE INTO eleves (nom, prenom, date_naissance, adresse, telephone_parent, email_parent, classe, tuteur_id, statut)
SELECT 'Alami', 'Sara', '2012-08-20', '123 Rue Mohammed V, Agdal', '0612345679', 'mohammed.alami@email.ma', 'CE1', id, 'Actif'
FROM utilisateurs WHERE email = 'mohammed.alami@email.ma' LIMIT 1;

INSERT IGNORE INTO eleves (nom, prenom, date_naissance, adresse, telephone_parent, email_parent, classe, tuteur_id, statut)
SELECT 'Benjelloun', 'Yasmine', '2011-03-10', '456 Avenue Hassan II, Hay Riad', '0612345680', 'fatima.benjelloun@email.ma', 'CM1', id, 'Actif'
FROM utilisateurs WHERE email = 'fatima.benjelloun@email.ma' LIMIT 1;

-- 7. Créer des inscriptions (en utilisant les IDs des élèves et bus)
INSERT IGNORE INTO inscriptions (eleve_id, bus_id, date_inscription, date_debut, date_fin, statut, montant_mensuel)
SELECT e.id, b.id, CURDATE(), CURDATE(), DATE_ADD(CURDATE(), INTERVAL 6 MONTH), 'Active', 500.00
FROM eleves e, bus b
WHERE e.nom = 'Alami' AND e.prenom = 'Hassan' AND b.numero = 'BUS-001'
LIMIT 1;

INSERT IGNORE INTO inscriptions (eleve_id, bus_id, date_inscription, date_debut, date_fin, statut, montant_mensuel)
SELECT e.id, b.id, CURDATE(), CURDATE(), DATE_ADD(CURDATE(), INTERVAL 6 MONTH), 'Active', 500.00
FROM eleves e, bus b
WHERE e.nom = 'Alami' AND e.prenom = 'Sara' AND b.numero = 'BUS-001'
LIMIT 1;

INSERT IGNORE INTO inscriptions (eleve_id, bus_id, date_inscription, date_debut, date_fin, statut, montant_mensuel)
SELECT e.id, b.id, CURDATE(), CURDATE(), DATE_ADD(CURDATE(), INTERVAL 6 MONTH), 'Active', 500.00
FROM eleves e, bus b
WHERE e.nom = 'Benjelloun' AND e.prenom = 'Yasmine' AND b.numero = 'BUS-002'
LIMIT 1;

-- ============================================
-- FIN DU SCRIPT
-- ============================================
-- Comptes de test créés:
-- Admin: admin@transport.ma / test123
-- Chauffeur 1: ahmed.idrissi@transport.ma / test123
-- Chauffeur 2: youssef.tazi@transport.ma / test123
-- Responsable 1: nadia.kettani@transport.ma / test123
-- Responsable 2: omar.benjelloun@transport.ma / test123
-- Tuteur 1: mohammed.alami@email.ma / test123
-- Tuteur 2: fatima.benjelloun@email.ma / test123

