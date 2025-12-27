# Guide de Démarrage - Système de Transport Scolaire

> **⚠️ Note : Ce guide utilise le serveur PHP intégré. Pour XAMPP, consultez [GUIDE_DEMARRAGE_XAMPP.md](GUIDE_DEMARRAGE_XAMPP.md)**

## 📋 Prérequis

Avant de commencer, assurez-vous d'avoir installé :
- **Node.js** (version 16 ou supérieure) - [Télécharger Node.js](https://nodejs.org/)
- **PHP** (version 7.4 ou supérieure) - [Télécharger PHP](https://www.php.net/downloads.php)
- **MySQL/MariaDB** - [Télécharger MySQL](https://dev.mysql.com/downloads/mysql/)
- **Composer** (optionnel, pour gérer les dépendances PHP si nécessaire)

## 🚀 Étapes pour Démarrer le Site

### Étape 1 : Installer les Dépendances Frontend

Ouvrez un terminal dans le dossier du projet et exécutez :

```bash
npm install
```

Cette commande installera toutes les dépendances React nécessaires (react, react-router-dom, tailwindcss, etc.).

### Étape 2 : Configurer la Base de Données MySQL

1. **Démarrer MySQL** sur votre machine

2. **Créer la base de données** :
   - Ouvrez MySQL (phpMyAdmin, MySQL Workbench, ou ligne de commande)
   - Exécutez le fichier `transport_scolaire.sql` pour créer la base de données et toutes les tables nécessaires
   - Ou exécutez manuellement :
     ```sql
     SOURCE transport_scolaire.sql;
     ```

3. **Configurer la connexion** :
   - Ouvrez `backend/config/database.php`
   - Modifiez les informations de connexion selon votre configuration :
     ```php
     define('DB_HOST', 'localhost');
     define('DB_NAME', 'transport_scolaire');
     define('DB_USER', 'root');          // Votre nom d'utilisateur MySQL
     define('DB_PASS', '');              // Votre mot de passe MySQL
     ```

### Étape 3 : Démarrer le Backend PHP

Ouvrez un **premier terminal** et exécutez :

```bash
cd backend
php -S localhost:8000
```

Le serveur backend PHP démarrera sur `http://localhost:8000`

**Note :** Si vous utilisez Apache/Nginx, placez le dossier `backend` dans votre répertoire web (htdocs, www, etc.) et accédez via `http://localhost/backend/api`

### Étape 4 : Démarrer le Frontend React

Ouvrez un **deuxième terminal** (gardez le premier ouvert pour le backend) et exécutez :

```bash
npm run dev
```

Le serveur de développement Vite démarrera automatiquement et ouvrira votre navigateur sur `http://localhost:3000` (ou le port indiqué dans la console).

### Étape 5 : Accéder au Site

Une fois les deux serveurs démarrés, vous pouvez :

1. **Accéder à la page d'accueil** : `http://localhost:3000`
2. **Choisir un espace** :
   - Espace Tuteur
   - Espace Responsable Bus
   - Espace Chauffeur
   - Espace Administrateur

## 🔐 Comptes par Défaut

Après avoir créé la base de données, vous pouvez créer un compte admin en exécutant cette requête SQL :

```sql
INSERT INTO utilisateurs (nom, prenom, email, mot_de_passe, role, statut)
VALUES ('Admin', 'System', 'admin@admin.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', 'Actif');
```

**Mot de passe par défaut :** `admin123`

## 📁 Structure des URLs

### Pages Publiques
- `/` - Page d'accueil
- `/Home` - Page d'accueil (alias)

### Authentification
- `/TuteurLogin` - Connexion Tuteur
- `/TuteurRegister` - Inscription Tuteur
- `/ResponsableLogin` - Connexion Responsable
- `/ChauffeurLogin` - Connexion Chauffeur
- `/AdminLogin` - Connexion Admin

### Espace Tuteur
- `/TuteurDashboard` - Tableau de bord
- `/TuteurProfile` - Profil
- `/TuteurInscription` - Inscrire un élève
- `/TuteurPaiement` - Paiements
- `/TuteurEleveDetails` - Détails d'un élève

### Espace Admin
- `/AdminDashboard` - Tableau de bord
- `/AdminBus` - Gestion des bus
- `/AdminChauffeurs` - Gestion des chauffeurs
- `/AdminResponsables` - Gestion des responsables
- `/AdminInscriptions` - Gestion des inscriptions
- `/AdminDemandes` - Gestion des demandes
- `/AdminAccidents` - Gestion des accidents
- `/AdminStats` - Statistiques
- `/AdminPaiements` - Gestion des paiements

## ⚠️ Dépannage

### Le backend ne démarre pas
- Vérifiez que PHP est installé : `php -v`
- Vérifiez que le port 8000 n'est pas déjà utilisé
- Vérifiez les permissions d'accès au dossier backend

### Le frontend ne démarre pas
- Vérifiez que Node.js est installé : `node -v`
- Vérifiez que npm est installé : `npm -v`
- Supprimez `node_modules` et réinstallez : `rm -rf node_modules && npm install`

### Erreurs de connexion à la base de données
- Vérifiez que MySQL est démarré
- Vérifiez les identifiants dans `backend/config/database.php`
- Vérifiez que la base de données `transport_scolaire` existe

### Les pages ne se chargent pas
- Vérifiez que les deux serveurs sont démarrés (backend PHP et frontend React)
- Vérifiez la console du navigateur pour les erreurs
- Vérifiez que l'URL du backend dans `src/services/apiService.js` correspond à votre configuration

## 🔧 Configuration Avancée

### Changer le port du backend PHP
Si le port 8000 est occupé, changez-le :
```bash
php -S localhost:8080
```
Puis modifiez `src/services/apiService.js` :
```javascript
const API_BASE_URL = 'http://localhost:8080/api';
```

### Changer le port du frontend
Modifiez `vite.config.js` :
```javascript
server: {
  port: 3001,  // Changez le port ici
  open: true
}
```

## ✅ Vérification

Pour vérifier que tout fonctionne :

1. ✅ Backend PHP démarré (message dans le terminal)
2. ✅ Frontend React démarré (message dans le terminal)
3. ✅ Page d'accueil accessible dans le navigateur
4. ✅ Les liens vers les espaces fonctionnent
5. ✅ La connexion à la base de données fonctionne (pas d'erreur dans la console)

## 📞 Support

Si vous rencontrez des problèmes, vérifiez :
- Les logs dans les terminaux (backend et frontend)
- La console du navigateur (F12)
- Les fichiers de configuration (database.php, apiService.js)

