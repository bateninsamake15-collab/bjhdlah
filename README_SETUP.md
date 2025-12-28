# Guide d'Installation et de Lancement du Projet

## 📋 Prérequis

- **XAMPP** (ou WAMP/LAMP) avec Apache et MySQL
- **Node.js** (version 16 ou supérieure)
- **npm** (généralement inclus avec Node.js)

## 🗄️ Étape 1: Installation de la Base de Données

1. **Démarrez XAMPP** et activez les services **Apache** et **MySQL**

2. **Importez la base de données** :
   - Ouvrez phpMyAdmin (http://localhost/phpmyadmin)
   - Créez une nouvelle base de données ou utilisez l'existante
   - Cliquez sur l'onglet "Importer"
   - Sélectionnez le fichier `database_setup.sql`
   - Cliquez sur "Exécuter"
   
   **OU** exécutez le fichier SQL directement dans l'onglet SQL de phpMyAdmin

   ```sql
   -- Le fichier database_setup.sql contient tout ce qu'il faut :
   -- - Création de la base de données transport_scolaire
   -- - Création de toutes les tables
   -- - Mise à jour des tables (ajout commentaire, types de demandes, etc.)
   -- - Données de test avec comptes utilisables
   ```

3. **Vérifiez la connexion** :
   - La base de données `transport_scolaire` devrait être créée
   - Toutes les tables devraient être présentes

## 🔧 Étape 2: Configuration du Backend

1. **Placez le dossier backend dans XAMPP** :
   ```
   C:\xampp\htdocs\backend
   ```

   ⚠️ **Important** : Le dossier `backend` doit être directement dans `htdocs`

2. **Vérifiez la configuration de la base de données** :
   - Ouvrez `backend/config/database.php`
   - Assurez-vous que les paramètres correspondent à votre configuration MySQL :
   ```php
   $host = 'localhost';
   $dbname = 'transport_scolaire';
   $username = 'root';  // Par défaut dans XAMPP
   $password = '';      // Par défaut vide dans XAMPP
   ```

3. **Testez la connexion au backend** :
   - Ouvrez votre navigateur
   - Allez à : `http://localhost/backend/api/test-connection.php`
   - Vous devriez voir un message de succès

## 📦 Étape 3: Installation des Dépendances Frontend

1. **Ouvrez un terminal** dans le dossier du projet :
   ```bash
   cd C:\Users\LENOVO\Documents\GitHub\bjhdlah
   ```

2. **Installez les dépendances npm** :
   ```bash
   npm install
   ```

   Cela installera toutes les dépendances nécessaires (React, Vite, Tailwind CSS, etc.)

## ⚙️ Étape 4: Configuration de l'API (si nécessaire)

1. **Vérifiez l'URL de l'API** dans `src/services/apiService.js` :
   ```javascript
   const API_BASE_URL = 'http://localhost/backend/api';
   ```

   Si votre backend est à un autre endroit, modifiez cette URL.

## 🚀 Étape 5: Lancement de l'Application

1. **Assurez-vous que XAMPP est démarré** :
   - Apache ✅
   - MySQL ✅

2. **Lancez le serveur de développement** :
   ```bash
   npm run dev
   ```

3. **Ouvrez votre navigateur** :
   - L'application devrait s'ouvrir automatiquement à : `http://localhost:5173`
   - Si ce n'est pas le cas, ouvrez cette URL manuellement

## 🔑 Comptes de Test

Après avoir importé `database_setup.sql`, vous pouvez utiliser ces comptes :

### 👤 Administrateur
- **Email** : `admin@transport.ma`
- **Mot de passe** : `test123`

### 🚗 Chauffeurs
- **Email 1** : `ahmed.idrissi@transport.ma` / `test123`
- **Email 2** : `youssef.tazi@transport.ma` / `test123`
- **Email 3** : `karim.elfassi@transport.ma` / `test123`

### 👥 Responsables
- **Email 1** : `nadia.kettani@transport.ma` / `test123`
- **Email 2** : `omar.benjelloun@transport.ma` / `test123`

### 👨‍👩‍👧‍👦 Tuteurs
- **Email 1** : `mohammed.alami@email.ma` / `test123`
- **Email 2** : `fatima.benjelloun@email.ma` / `test123`

## 📁 Structure du Projet

```
bjhdlah/
├── backend/              # API PHP (à placer dans C:\xampp\htdocs\backend)
│   ├── api/
│   │   ├── auth/
│   │   ├── chauffeurs/
│   │   ├── demandes/
│   │   └── ...
│   └── config/
│       ├── database.php
│       └── headers.php
├── src/                  # Code React
│   ├── components/
│   ├── pages/
│   └── services/
│       └── apiService.js
├── database_setup.sql    # ⭐ Script SQL complet (à importer)
├── package.json
└── vite.config.js
```

## 🔍 Dépannage

### ❌ Problème: L'API ne répond pas
- ✅ Vérifiez que XAMPP Apache est démarré
- ✅ Vérifiez que le dossier backend est dans `C:\xampp\htdocs\backend`
- ✅ Vérifiez l'URL dans `src/services/apiService.js`
- ✅ Testez `http://localhost/backend/api/test-connection.php` dans le navigateur

### ❌ Problème: Erreur de connexion à la base de données
- ✅ Vérifiez que MySQL est démarré dans XAMPP
- ✅ Vérifiez les identifiants dans `backend/config/database.php`
- ✅ Vérifiez que la base de données `transport_scolaire` existe
- ✅ Importez `database_setup.sql` si nécessaire

### ❌ Problème: Erreur npm install
- ✅ Assurez-vous d'avoir Node.js installé (version 16+)
- ✅ Supprimez `node_modules` et `package-lock.json`, puis relancez `npm install`

### ❌ Problème: Port déjà utilisé
- ✅ Si le port 5173 est occupé, Vite utilisera automatiquement un autre port
- ✅ Regardez le terminal pour voir sur quel port l'application tourne

### ❌ Problème: Erreur CORS
- ✅ Assurez-vous que le backend est accessible via `http://localhost/backend/api`
- ✅ Vérifiez les headers CORS dans `backend/config/headers.php`

## 📝 Commandes Utiles

```bash
# Installer les dépendances
npm install

# Lancer le serveur de développement
npm run dev

# Build pour la production
npm run build

# Prévisualiser le build de production
npm run preview
```

## ⚠️ Notes Importantes

1. **Un seul fichier SQL** : `database_setup.sql` contient tout (structure + données de test)
2. Le fichier `database_setup.sql` inclut :
   - La création de toutes les tables
   - Les mises à jour nécessaires (champ commentaire, types de demandes, etc.)
   - Les données de test avec comptes utilisables
3. Pour un environnement de production, modifiez les mots de passe par défaut
4. Assurez-vous que le backend est accessible depuis le frontend

## 🎯 Checklist de Démarrage Rapide

- [ ] XAMPP installé et démarré (Apache + MySQL)
- [ ] Base de données `transport_scolaire` créée via `database_setup.sql`
- [ ] Dossier `backend` copié dans `C:\xampp\htdocs\`
- [ ] Test de connexion backend : `http://localhost/backend/api/test-connection.php` fonctionne
- [ ] Dépendances npm installées : `npm install`
- [ ] Application lancée : `npm run dev`
- [ ] Application accessible sur `http://localhost:5173`

## 💡 Astuces

- Pour redémarrer rapidement : `npm run dev` dans le terminal
- Pour voir les erreurs backend : consultez les logs Apache dans XAMPP
- Pour voir les erreurs frontend : ouvrez la console du navigateur (F12)
