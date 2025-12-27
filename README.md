# Système de Transport Scolaire - Mohammed 5

Application web complète pour la gestion du transport scolaire avec différents espaces pour les tuteurs, responsables, chauffeurs et administrateurs.

## ⚡ Démarrage Rapide

Pour des instructions détaillées, consultez [GUIDE_DEMARRAGE.md](GUIDE_DEMARRAGE.md)

### Configuration avec XAMPP (Recommandé) :

1. **Copier le backend dans XAMPP** :
   - Copiez le dossier `backend` vers `C:\xampp\htdocs\backend`

2. **Créer la base de données** :
   - Démarrez Apache et MySQL dans XAMPP
   - Ouvrez phpMyAdmin : `http://localhost/phpmyadmin`
   - Créez la base `transport_scolaire` et importez `transport_scolaire.sql`

3. **Installer les dépendances frontend** :
   ```bash
   npm install
   ```

4. **Démarrer le frontend** :
   ```bash
   npm run dev
   ```

5. **Accéder au site** : `http://localhost:3000`

**📖 Pour un guide détaillé, consultez [GUIDE_DEMARRAGE_XAMPP.md](GUIDE_DEMARRAGE_XAMPP.md)**

## 📁 Structure du Projet

```
pliz/
├── backend/              # Backend PHP avec API REST
│   ├── config/          # Configuration (database, headers, jwt)
│   └── api/             # Routes API organisées par entité
├── src/                 # Frontend React
│   ├── components/      # Composants réutilisables
│   ├── pages/           # Pages de l'application
│   ├── services/        # Services API
│   └── utils.js         # Fonctions utilitaires
├── transport_scolaire.sql  # Script SQL pour créer la base de données
└── GUIDE_DEMARRAGE.md   # Guide complet de démarrage
```

## 🎯 Fonctionnalités

- **Espace Tuteur** : Gestion des inscriptions, suivi des enfants, paiements
- **Espace Responsable Bus** : Supervision des bus et gestion des présences
- **Espace Chauffeur** : Consultation des trajets et informations
- **Espace Administrateur** : Gestion complète du système (bus, chauffeurs, responsables, inscriptions, demandes, accidents, statistiques, paiements)

## 🔧 Technologies Utilisées

- **Frontend** : React, React Router, TailwindCSS, Framer Motion
- **Backend** : PHP, MySQL
- **Outils** : Vite, Node.js

## 📝 Notes

- Le backend utilise PHP avec MySQL
- Le frontend utilise React avec Vite
- Tous les fichiers sont organisés et fonctionnels
- Toutes les routes sont configurées dans `src/App.jsx`
