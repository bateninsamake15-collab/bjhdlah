# Installation avec XAMPP - Guide Rapide

## 🎯 Étapes Simplifiées

### 1️⃣ Installer les dépendances frontend
```bash
npm install
```

### 2️⃣ Copier le backend dans XAMPP
- Copier le dossier `backend` vers `C:\xampp\htdocs\backend`

### 3️⃣ Importer la base de données
- Démarrer Apache et MySQL dans XAMPP
- Ouvrir phpMyAdmin : http://localhost/phpmyadmin
- Créer une nouvelle base : `transport_scolaire`
- Importer le fichier `transport_scolaire.sql`

### 4️⃣ Démarrer le frontend
```bash
npm run dev
```

### 5️⃣ Accéder au site
- Frontend : http://localhost:3000
- Backend API : http://localhost/backend/api/

## ✅ Vérification

- ✅ XAMPP : Apache et MySQL démarrés (verts dans le panneau)
- ✅ Backend accessible : http://localhost/backend/api/auth/login.php
- ✅ Frontend démarré : Terminal affiche "Local: http://localhost:3000"
- ✅ Site accessible : Page d'accueil s'affiche

## 🔧 Configuration

Le fichier `src/services/apiService.js` est déjà configuré pour XAMPP avec l'URL :
```javascript
const API_BASE_URL = 'http://localhost/backend/api';
```

La configuration de la base de données dans `htdocs/backend/config/database.php` est prête pour XAMPP (root sans mot de passe par défaut).

## 📖 Pour plus de détails

Consultez [GUIDE_DEMARRAGE_XAMPP.md](GUIDE_DEMARRAGE_XAMPP.md) pour un guide complet avec dépannage.



