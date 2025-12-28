# 🔧 Guide de Dépannage

## ✅ Vérifications de Base

### 1. Vérifier que XAMPP est démarré
- Ouvrez le panneau de contrôle XAMPP
- Vérifiez que **Apache** est démarré (bouton "Stop" visible = démarré)
- Vérifiez que **MySQL** est démarré

### 2. Vérifier l'emplacement du backend
Le dossier `backend` doit être dans : `C:\xampp\htdocs\backend`

Structure attendue :
```
C:\xampp\htdocs\
└── backend\
    ├── api\
    │   ├── auth\
    │   ├── chauffeurs\
    │   ├── bus\
    │   └── ...
    └── config\
        ├── database.php
        └── headers.php
```

### 3. Tester l'API dans le navigateur
Ouvrez votre navigateur et testez ces URLs :

1. **Test de connexion API** :
   ```
   http://localhost/backend/api/test-connection.php
   ```
   ✅ Devrait retourner : `{"success": true, "message": "API backend accessible", ...}`

2. **Test de connexion base de données** :
   ```
   http://localhost/backend/test.php
   ```
   ✅ Devrait retourner : `{"success": true, "message": "Backend accessible et base de données connectée", ...}`

### 4. Vérifier la console du navigateur (F12)
1. Ouvrez les outils de développement (F12)
2. Allez dans l'onglet **Console**
3. Allez dans l'onglet **Network** (Réseau)
4. Rechargez la page qui pose problème
5. Regardez les requêtes qui échouent (en rouge)
6. Cliquez sur une requête échouée pour voir les détails

### 5. Vérifier les erreurs PHP
Si vous voyez des erreurs PHP dans le navigateur, vérifiez :
- Le fichier `C:\xampp\php\php.ini` - assurez-vous que `display_errors = On` (pour le développement)
- Les logs Apache dans `C:\xampp\apache\logs\error.log`

## 🔍 Problèmes Courants

### ❌ Erreur : "Impossible de se connecter au serveur"
**Causes possibles :**
1. Apache n'est pas démarré → Démarrez Apache dans XAMPP
2. Le backend n'est pas au bon endroit → Vérifiez `C:\xampp\htdocs\backend`
3. Le port 80 est occupé → Vérifiez dans XAMPP quel port Apache utilise

**Solution :**
- Vérifiez que `http://localhost/backend/api/test-connection.php` fonctionne dans le navigateur
- Si ça fonctionne, le problème vient peut-être de CORS ou d'une erreur dans le code PHP

### ❌ Erreur : "Erreur lors du chargement des données"
**Causes possibles :**
1. La base de données n'existe pas → Importez `database_setup.sql`
2. Les identifiants MySQL sont incorrects → Vérifiez `backend/config/database.php`
3. Une erreur dans le code PHP → Vérifiez les logs Apache

**Solution :**
- Testez `http://localhost/backend/test.php` pour voir si la base de données est accessible
- Vérifiez la console du navigateur (F12) pour voir l'erreur exacte

### ❌ Erreur CORS
**Symptômes :**
- Erreur dans la console : "Access to fetch at '...' from origin '...' has been blocked by CORS policy"
- Les requêtes OPTIONS échouent

**Solution :**
- Vérifiez que `backend/config/headers.php` est bien inclus dans tous les fichiers API
- Vérifiez que les headers CORS sont envoyés avant toute sortie (echo, print, etc.)

### ❌ Erreur : "Réponse invalide du serveur. Le backend ne renvoie pas du JSON valide"
**Causes possibles :**
1. Une erreur PHP qui affiche du texte avant le JSON
2. Un `echo` ou `print` avant le JSON
3. Des warnings PHP

**Solution :**
- Ouvrez l'onglet Network dans la console (F12)
- Cliquez sur la requête qui échoue
- Regardez l'onglet "Response" pour voir ce que le serveur renvoie vraiment
- Vérifiez les logs PHP pour voir les warnings/erreurs

## 🧪 Tests à Effectuer

### Test 1 : Vérifier que l'API répond
```bash
# Dans le navigateur, ouvrez :
http://localhost/backend/api/test-connection.php
```

### Test 2 : Vérifier la base de données
```bash
# Dans le navigateur, ouvrez :
http://localhost/backend/test.php
```

### Test 3 : Tester une API spécifique
```bash
# Test de récupération des chauffeurs :
http://localhost/backend/api/chauffeurs/getAll.php

# Devrait retourner un JSON avec la liste des chauffeurs
```

### Test 4 : Vérifier les logs
1. Ouvrez `C:\xampp\apache\logs\error.log`
2. Rechargez la page qui pose problème
3. Regardez les dernières lignes du fichier pour voir les erreurs PHP

## 📝 Checklist de Vérification

- [ ] XAMPP Apache est démarré
- [ ] XAMPP MySQL est démarré
- [ ] Le dossier `backend` est dans `C:\xampp\htdocs\backend`
- [ ] `http://localhost/backend/api/test-connection.php` fonctionne
- [ ] `http://localhost/backend/test.php` fonctionne
- [ ] La base de données `transport_scolaire` existe
- [ ] Le fichier `database_setup.sql` a été importé
- [ ] Les identifiants dans `backend/config/database.php` sont corrects
- [ ] La console du navigateur (F12) ne montre pas d'erreurs CORS
- [ ] Les requêtes dans l'onglet Network (F12) ne sont pas toutes en rouge

## 🆘 Si Rien Ne Fonctionne

1. **Redémarrez XAMPP** :
   - Arrêtez Apache et MySQL
   - Redémarrez-les

2. **Vérifiez les ports** :
   - Apache devrait utiliser le port 80 (ou 8080)
   - MySQL devrait utiliser le port 3306
   - Vérifiez dans XAMPP si des ports sont en conflit

3. **Vérifiez les permissions** :
   - Assurez-vous que le dossier `backend` est accessible en lecture
   - Vérifiez que PHP peut écrire dans les dossiers si nécessaire

4. **Vérifiez la version PHP** :
   - XAMPP devrait utiliser PHP 7.4 ou supérieur
   - Vérifiez dans `http://localhost/backend/api/test-connection.php` la version PHP

