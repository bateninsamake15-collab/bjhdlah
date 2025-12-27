# À propos de test_data.sql

## 📝 Qu'est-ce que test_data.sql ?

`test_data.sql` est un fichier **OPTIONNEL** qui contient des données de test pour remplir la base de données avec des exemples.

## 🎯 Dois-je l'utiliser ?

### ✅ Utilisez test_data.sql si :
- Vous voulez tester l'application avec des données d'exemple
- Vous voulez voir comment le système fonctionne avec des données
- Vous développez/testez des fonctionnalités

### ❌ N'utilisez PAS test_data.sql si :
- Vous partez d'une base de données vide
- Vous voulez créer vos propres données
- Vous êtes en production

## 📋 Que contient test_data.sql ?

Le fichier contient des données de test pour :
- ✅ Utilisateurs (admin, tuteurs, chauffeurs, responsables)
- ✅ Chauffeurs
- ✅ Responsables bus
- ✅ Trajets
- ✅ Bus
- ✅ Élèves
- ✅ Inscriptions
- ✅ Paiements
- ✅ Notifications

**Mot de passe par défaut pour tous les comptes de test :** `test123`

## 🚀 Comment l'utiliser ?

### Étape 1 : Créer d'abord la base de données
1. Importez d'abord `transport_scolaire.sql` dans phpMyAdmin
2. Cela crée la structure (tables) de la base de données

### Étape 2 : Importer les données de test (optionnel)
1. Dans phpMyAdmin, sélectionnez la base `transport_scolaire`
2. Cliquez sur l'onglet "Importer"
3. Sélectionnez le fichier `test_data.sql`
4. Cliquez sur "Exécuter"

### Ou via ligne de commande MySQL :
```sql
USE transport_scolaire;
SOURCE test_data.sql;
```

## ⚠️ Important

- `test_data.sql` doit être exécuté **APRÈS** `transport_scolaire.sql`
- Si vous importez `test_data.sql`, il remplira votre base avec des données de test
- Vous pouvez supprimer ces données plus tard si nécessaire

## 🔄 Réinitialiser la base de données

Si vous voulez repartir à zéro après avoir importé test_data.sql :

1. Supprimez la base de données `transport_scolaire`
2. Recréez-la en important `transport_scolaire.sql`
3. Ne réimportez PAS `test_data.sql` si vous voulez une base vide

## ✅ Recommandation

Pour votre première utilisation, je recommande :
1. D'abord créer la base avec `transport_scolaire.sql`
2. Créer votre propre compte admin (voir GUIDE_DEMARRAGE_XAMPP.md)
3. Tester l'application avec votre propre compte
4. Plus tard, si vous voulez tester avec des données, importez `test_data.sql`



