# 🥤 Jus Locaux - Togo

Plateforme e-commerce simple et élégante pour la vente de jus locaux togolais (Bissap, Alangba, Citron, Ananas, Sodja, Yaourt, Milo, Tamarin).

**Stack:** React (Vite) + Node.js (Express) + PostgreSQL

---

## 🚀 Démarrage ultra-rapide

```bash
sh start.sh
```

**C'est tout !** Le script unique gère automatiquement :
- ✅ Installation de Docker (si nécessaire)
- ✅ Démarrage de PostgreSQL dans Docker
- ✅ Création de la base de données avec 8 jus togolais
- ✅ Installation des dépendances
- ✅ Création de la configuration
- ✅ Lancement backend (port 4000) + frontend (port 5173)

---

## 🛠️ Commandes du script unique

### Installation de Docker uniquement
```bash
sudo sh start.sh install-docker
```

### Installation de PostgreSQL uniquement
```bash
sudo sh start.sh install-postgres
```

### Configuration de la base de données
```bash
sh start.sh setup-db
```

### Génération d'images placeholder
```bash
sh start.sh generate-images
```

### Tests automatiques
```bash
sh start.sh test
```

### Démarrage avec Docker uniquement
```bash
sh start.sh docker-start
```

### Démarrage avec PostgreSQL local
```bash
sh start.sh postgres-start
```

### Arrêt propre
```bash
# Dans le terminal où tourne l'app : Ctrl+C
# Ou manuellement :
docker-compose down
pkill -f "node.*backend"
pkill -f "vite"
```

---

## 📁 Structure du projet

```
jus/
├── start.sh              ✅ Script unique (toutes les fonctionnalités)
├── docker-compose.yml    ✅ Configuration PostgreSQL Docker
├── backend/              ✅ API Node.js + Express
│   ├── src/
│   │   ├── index.js      ✅ Point d'entrée
│   │   ├── server.js     ✅ Configuration serveur
│   │   ├── db/
│   │   │   ├── pool.js   ✅ Connexion PostgreSQL
│   │   │   ├── schema.sql ✅ Structure base de données
│   │   │   └── seed.sql  ✅ Données initiales (8 jus)
│   │   ├── routes/       ✅ API endpoints
│   │   ├── services/     ✅ Logique métier
│   │   └── uploads/      ✅ Images produits
│   └── package.json
├── frontend/             ✅ Interface React + Vite
│   ├── src/
│   │   ├── main.jsx      ✅ Point d'entrée
│   │   ├── components/   ✅ Composants réutilisables
│   │   ├── pages/        ✅ Pages de l'application
│   │   └── services/     ✅ Appels API
│   ├── public/           ✅ Assets statiques
│   └── package.json
├── logs/                 ✅ Logs d'exécution
└── .env.example          ✅ Configuration exemple
```

---

## 🏗️ Architecture technique

### Stack technologique
- **Frontend** : React 18 + Vite + React Router
- **Backend** : Node.js + Express.js + PostgreSQL
- **Base de données** : PostgreSQL 15
- **Conteneurisation** : Docker + Docker Compose
- **Paiement** : PayGate (TMoney/Flooz)
- **Déploiement** : Docker containers

### Vue d'ensemble
```
Client Web (React)
   │
   ▼
API REST (Express)
   │
   ▼
PostgreSQL Database
   │
   ▼
PayGate (Mobile Money)
```

### Modules backend
- **Authentification** : Gestion admin
- **Catalogue** : Produits et variantes
- **Commandes** : Panier, checkout, suivi
- **Paiements** : Intégration PayGate
- **Livraison** : Zones et frais de livraison
- **Administration** : Gestion des commandes

---

## 🗄️ Schéma de base de données

### Tables principales
- `users` : Utilisateurs (admin)
- `products` : Produits (jus)
- `product_variants` : Variantes (25cl, 50cl, 1L)
- `product_images` : Images des produits
- `orders` : Commandes
- `order_items` : Articles des commandes
- `payments` : Paiements
- `deliveries` : Zones de livraison
- `promos` : Codes promotionnels

### Données initiales
- **8 jus togolais** : Bissap, Alangba, Citron, Ananas, Sodja, Yaourt, Milo, Tamarin
- **20 variantes** : Différents formats (25cl, 50cl, 1L)
- **5 zones de livraison** : Lomé et régions
- **Prix en XOF** : Adaptés au marché togolais

---

## 🔌 API REST

### Endpoints principaux

#### Produits
- `GET /api/products` - Liste des produits
- `GET /api/products/:id` - Détail d'un produit

#### Panier & Commandes
- `POST /api/cart` - Ajouter au panier
- `POST /api/checkout` - Finaliser commande
- `GET /api/orders/:id` - Suivre commande

#### Paiements
- `POST /api/payments/init` - Initier paiement
- `POST /api/payments/callback` - Callback PayGate

#### Administration
- `POST /api/admin/products` - Ajouter produit
- `PATCH /api/admin/orders/:id/status` - Changer statut commande

---

## 🔧 Migrations de base de données

Si vous avez besoin d'appliquer manuellement les migrations (création de la table `sessions`, ajout de la colonne `active` et insertion des zones de livraison), exécutez :

```bash
# depuis la racine du projet
node backend/scripts/migrate_db.js
```

Le script lit la variable `DATABASE_URL` depuis `backend/.env` (ou depuis la racine `.env`), applique les migrations et affiche le nombre de zones insérées.

---

## 🎨 Interface utilisateur

### Pages principales
- **Accueil** : Catalogue des jus
- **Produit** : Détail et variantes
- **Panier** : Gestion des articles
- **Checkout** : Formulaire de commande
- **Suivi** : Statut de livraison
- **Admin** : Gestion des commandes

### Design system
- **Couleurs** : Vert (#1f6a3d), Crème (#f6f1e7), Or (#d1a24a)
- **Typographie** : Simple et lisible
- **Responsive** : Mobile-first
- **UX** : Processus d'achat simplifié

---

## 🚀 Déploiement

### Avec Docker (recommandé)
```bash
# Construction des images
docker build -t jus-backend ./backend
docker build -t jus-frontend ./frontend

# Lancement
docker-compose up -d
```

### Variables d'environnement
```bash
# Base de données
DATABASE_URL=postgresql://user:pass@host:5432/db

# API Admin
ADMIN_API_KEY=votre_cle_securisee

# PayGate
PAYGATE_MERCHANT_ID=your_id
PAYGATE_SECRET_KEY=your_key

# Serveur
PORT=4000
NODE_ENV=production
```

---

## 🧪 Tests et développement

### Tests automatiques
```bash
sh start.sh test
```

### Développement local
```bash
# Backend uniquement
cd backend && npm run dev

# Frontend uniquement
cd frontend && npm run dev

# Avec logs détaillés
tail -f logs/backend.log
```

### Debugging
- **Backend logs** : `tail -f logs/backend.log`
- **Frontend devtools** : Console navigateur
- **Database** : `docker exec -it jus_postgres psql -U jus_user -d jus_db`

---

## 📋 Checklist de développement

### ✅ Fonctionnalités implémentées
- [x] Catalogue produits avec variantes
- [x] Panier et système de commandes
- [x] Intégration PayGate (TMoney/Flooz)
- [x] Suivi de commandes
- [x] Interface admin
- [x] Design responsive
- [x] Dockerisation complète

### 🔄 État du projet
- [x] Base de données PostgreSQL
- [x] API REST complète
- [x] Frontend React moderne
- [x] Tests automatiques
- [x] Scripts de déploiement
- [x] Documentation complète

### 🎯 Prêt pour production
- [x] Code optimisé
- [x] Sécurité basique
- [x] Gestion d'erreurs
- [x] Logs appropriés
- [x] Configuration flexible

---

## 🤝 Contribution

### Structure des commits
```
feat: nouvelle fonctionnalité
fix: correction de bug
docs: documentation
style: formatage
refactor: réorganisation code
test: tests
```

### Code style
- **Backend** : ESLint + Prettier
- **Frontend** : ESLint React
- **Commits** : Conventional commits

---

## 📞 Support

### Démarrage rapide
```bash
sh start.sh
```

### Problèmes courants
1. **Port occupé** : `lsof -ti:4000 | xargs kill -9`
2. **Docker permission** : `sudo usermod -aG docker $USER`
3. **Base de données** : `docker-compose logs postgres`

### Logs et debugging
```bash
# Backend
tail -f logs/backend.log

# Docker
docker-compose logs -f

# Tests
sh start.sh test
```

---

## 🇹🇬 À propos

**Jus Locaux Togo** est une plateforme e-commerce développée spécifiquement pour le marché togolais, mettant en valeur les jus traditionnels locaux. Le projet valorise l'artisanat local et facilite l'accès aux produits authentiques.

**Développé avec ❤️ pour le Togo**

---

*Documentation générée automatiquement - Dernière mise à jour: 5 février 2026*
- Installation avec Docker
- Installation manuelle de PostgreSQL
- Configuration avancée
- Dépannage

---

## 🛠️ Développement manuel

### 1️⃣ Prérequis
- Node.js v18+
- PostgreSQL v14+
- Docker (optionnel)

### 2️⃣ Base de données

**Option A : Avec Docker**
```bash
docker-compose up -d postgres
```

**Option B : PostgreSQL local**
```bash
sh scripts/install-postgres.sh
sh scripts/setup-database.sh
```

### 3️⃣ Lancer manuellement

**Backend** (port 4000)
```bash
cd backend
npm install
npm run dev
```

**Frontend** (port 5173)
```bash
cd frontend
npm install
npm run dev
```

---

## 📁 Structure du projet

```
jus/
├── backend/          # API Node.js + Express
│   ├── src/
│   │   ├── routes/   # Routes API
│   │   ├── db/       # Pool PostgreSQL, schéma, seed
│   │   └── server.js
│   └── uploads/      # Images produits
├── frontend/         # Interface React
│   ├── src/
│   │   ├── pages/    # Pages (Home, Admin, Track...)
│   │   ├── components/
│   │   ├── services/ # API client
│   │   └── styles/
│   └── index.html
├── docs/             # Documentation
├── infra/docker/     # Docker Compose
└── scripts/          # Scripts utilitaires
```

---

## 🔌 API Endpoints

### Public
- `GET /api/health` - Statut du serveur
- `GET /api/products` - Liste des produits
- `GET /api/deliveries` - Zones de livraison
- `POST /api/orders` - Créer une commande
- `GET /api/orders/:id` - Détails d'une commande
- `POST /api/payments/init` - Initialiser un paiement
- `POST /api/payments/callback` - Callback PayGate

### Admin (header: `x-admin-key`)
- `GET /api/admin/products` - Tous les produits
- `POST /api/admin/products` - Créer un produit
- `PATCH /api/admin/products/:id` - Modifier un produit
- `POST /api/admin/variants` - Créer un variant (format/prix)
- `PATCH /api/admin/variants/:id` - Modifier un variant
- `GET /api/admin/orders` - Liste des commandes
- `PATCH /api/admin/orders/:id/status` - Modifier statut commande
- `GET /api/admin/dashboard` - Statistiques
- `POST /api/admin/upload` - Upload image

---

## 🎨 Design

**Palette de couleurs :**
- Vert principal : `#1f6a3d`
- Crème : `#f6f1e7`
- Accent doré : `#d1a24a`

**Principes :**
- Mobile-first
- Design épuré et lisible
- Palette limitée (2-3 couleurs max)
- Expérience utilisateur fluide

---

## 📦 Produits disponibles

| Produit | Description | Catégorie |
|---------|-------------|-----------|
| **Bissap** | Jus d'hibiscus rouge traditionnel | Jus Traditionnel |
| **Alangba** | Jus de gingembre épicé | Jus Traditionnel |
| **Citron** | Jus de citron pressé | Jus Naturel |
| **Ananas** | Jus d'ananas frais | Jus Naturel |
| **Sodja** | Boisson au soja protéinée | Boisson Protéinée |
| **Yaourt** | Yaourt à boire | Produits Laitiers |
| **Milo** | Boisson chocolatée | Boisson Énergétique |
| **Tamarin** | Jus de tamarin acidulé | Jus Traditionnel |

**Formats :** 25cl, 33cl, 50cl, 1L (selon produit)

---

## 💳 Paiements

Intégration **PayGate Global** pour Mobile Money :
- **T-Money** (Togocel)
- **Flooz** (Moov Africa)

Configuration dans `.env` :
```bash
PAYGATE_MEMBER_ID=...
PAYGATE_SECRET_KEY=...
```

---

## 🖼️ Images produits

Générer des placeholders :
```bash
sh scripts/generate-images.sh
```

Ou ajoutez vos propres images dans `backend/uploads/` :
- Format : JPG/PNG
- Taille : 400x400px minimum
- Poids : < 200KB

---

## 👨‍💼 Administration

Accédez au backoffice : [http://localhost:5173/admin](http://localhost:5173/admin)

Utilisez la clé API définie dans `.env` (`ADMIN_API_KEY`)

**Fonctionnalités :**
- Gestion produits et variants
- Suivi des commandes
- Mise à jour des stocks
- Statistiques de vente
- Upload d'images

---

## 📊 Base de données

**Tables principales :**
- `products` - Produits
- `product_variants` - Formats et prix
- `orders` - Commandes
- `order_items` - Détails commande
- `payments` - Paiements
- `deliveries` - Zones de livraison
- `users` - Utilisateurs/admins

Schéma complet : [backend/src/db/schema.sql](backend/src/db/schema.sql)

---

## 🚚 Zones de livraison (Lomé)

- Lomé Centre (Hédzranawoé, Agoè) - 500 XOF
- Lomé Nord (Tokoin, Adidogomé) - 800 XOF
- Lomé Est (Bè, Kégué) - 700 XOF
- Lomé Ouest (Aného route) - 900 XOF
- Périphérie (Tsévié, Kpalimé) - 1500 XOF

---

## 🛠️ Développement

**Technologies :**
- Frontend : React 18, Vite, React Router
- Backend : Node.js, Express, PostgreSQL (pg)
- Paiement : PayGate Global
- Upload : Multer
- Style : CSS vanilla

**Scripts utiles :**
```bash
# Générer des images placeholder
sh scripts/generate-images.sh

# Tout lancer en une commande
sh scripts/run-all.sh

# Backend en dev (watch mode)
cd backend && npm run dev

# Frontend en dev
cd frontend && npm run dev

# Build frontend pour production
cd frontend && npm run build
```

---

## 📚 Documentation

- [Cahier des charges](docs/cahier_des_charges.md)
- [Architecture technique](docs/architecture.md)
- [Guide de déploiement](docs/deploiement.md)
- [Structure du projet](docs/structure_projet.md)
- [UI/UX Design](docs/ui_ux.md)

---

## 🔐 Sécurité

- Validation des inputs
- Transactions SQL avec BEGIN/COMMIT
- Headers sécurisés (Helmet)
- CORS configuré
- Clés API pour l'admin
- Rate limiting (à implémenter)

---

## 📝 TODO / Améliorations futures

- [ ] Authentification client (JWT)
- [ ] Notifications WhatsApp/SMS
- [ ] Programme de fidélité
- [ ] Abonnements mensuels
- [ ] Application mobile (React Native)
- [ ] Statistiques avancées (graphiques)
- [ ] Multi-langue (Français/Ewe/English)
- [ ] Gestion des promotions actives
- [ ] Suivi de livraison en temps réel
- [ ] Paiement à la livraison

---

## 📄 Licence

MIT - Libre d'utilisation et modification

---

## 🤝 Contact & Support

Pour toute question ou assistance :
- Email : support@jus-togo.com (exemple)
- WhatsApp : +228 XX XX XX XX

---

**Fait avec ❤️ pour promouvoir les jus locaux togolais 🇹🇬**
- `PATCH /api/admin/products/:id`
- `POST /api/admin/variants`
- `PATCH /api/admin/variants/:id`
- `GET /api/admin/orders`
- `PATCH /api/admin/orders/:id/status`
- `GET /api/admin/dashboard`
- `POST /api/admin/upload`

## 5. PayGate (Standard Checkout)
Le backend renvoie un `endpoint` + `fields` pour faire un POST vers PayGate.
Champs envoyes :
- `memberId`
- `totype` (ex: `TMoney` ou `Flooz`)
- `amount` (ex: `1200.00`)
- `merchantTransactionId`
- `merchantRedirectUrl`
- `notificationUrl`
- `checksum`
