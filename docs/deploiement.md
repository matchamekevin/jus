# JusTogo — Déploiement Vercel + Render (Free Tier)

## Architecture

```
Utilisateur
   │
   ├── justogo.vercel.app ──────► Vercel (Frontend React)
   │        │ rewrites /api/*
   │        ▼
   │   justogo-api.onrender.com ► Render (Backend Express)
   │        │                          │
   │        ▼                          ▼
   │   PostgreSQL (Render)        /uploads (Render)
   │
   └── justogo-admin.vercel.app ► Vercel (Admin React)
            │ rewrites /api/*
            ▼
       justogo-api.onrender.com
```

**Vercel** sert les fichiers statiques (frontend + admin) et proxy les appels `/api/*` vers le backend.
**Render** héberge le backend Node.js et la base PostgreSQL.

---

## Prérequis

- Compte [Vercel](https://vercel.com) (gratuit)
- Compte [Render](https://render.com) (gratuit)
- Repo Git (GitHub recommandé)

---

## Étape 1 — Déployer le backend sur Render

### Option A : Blueprint automatique

1. Aller sur https://dashboard.render.com/blueprints
2. Connecter le repo GitHub
3. Render détecte `render.yaml` et crée :
   - **Web Service** `justogo-api` (Node.js, dossier `backend/`)
   - **PostgreSQL** `justogo-db`
4. Copier l'URL du service : `https://justogo-api-xxxx.onrender.com`

### Option B : Manuel

1. **PostgreSQL** : Dashboard → New → PostgreSQL
   - Name : `justogo-db`
   - Database : `jus_db`
   - User : `jus_user`
   - Plan : Free
   - → Copier la **Internal Database URL**

2. **Web Service** : Dashboard → New → Web Service
   - Connecter le repo
   - Root Directory : `backend`
   - Build Command : `npm install`
   - Start Command : `node src/server.js`
   - Plan : Free
   - Variables d'environnement :

| Variable | Valeur |
|----------|--------|
| `NODE_ENV` | `production` |
| `PORT` | `4000` |
| `DATABASE_URL` | *(Internal Database URL de l'étape 1)* |
| `ADMIN_API_KEY` | *(générer avec `openssl rand -hex 32`)* |
| `ALLOWED_ORIGINS` | `https://justogo.vercel.app,https://justogo-admin.vercel.app` |

3. Vérifier : `https://justogo-api-xxxx.onrender.com/api/health` → `{"status":"ok"}`

### Exécuter les migrations

Dans le shell Render (Dashboard → Service → Shell) :
```bash
node scripts/migrate_db.js
```

---

## Étape 2 — Déployer le frontend sur Vercel

1. Aller sur https://vercel.com/new
2. Importer le repo GitHub
3. **Root Directory** : `frontend`
4. Framework : Vite (auto-détecté)
5. Avant de déployer, éditer `frontend/vercel.json` :
   - Remplacer `https://VOTRE-APP.onrender.com` par l'URL réelle du backend Render

```json
{
  "rewrites": [
    { "source": "/api/events", "destination": "https://justogo-api-xxxx.onrender.com/api/events" },
    { "source": "/api/:path*", "destination": "https://justogo-api-xxxx.onrender.com/api/:path*" },
    { "source": "/uploads/:path*", "destination": "https://justogo-api-xxxx.onrender.com/uploads/:path*" },
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

6. Déployer → le site est live sur `https://justogo.vercel.app`

---

## Étape 3 — Déployer l'admin sur Vercel

1. Vercel → New Project → même repo
2. **Root Directory** : `admin`
3. Même chose : éditer `admin/vercel.json` avec l'URL Render réelle
4. Déployer → live sur `https://justogo-admin.vercel.app`

---

## Domaine personnalisé (optionnel)

### Vercel
- Dashboard → Project → Settings → Domains → Ajouter `justogo.com`
- Configurer le DNS : `A` ou `CNAME` selon les instructions Vercel

---

## Limites du Free Tier

| Service | Limite | Impact |
|---------|--------|--------|
| **Render Web Service** | Spin down après 15 min d'inactivité | Premier appel = ~30s de latence (cold start) |
| **Render PostgreSQL** | Expire après 90 jours | Recréer la DB et migrer (ou passer au plan payant $7/mois) |
| **Render Disk** | Pas de disque persistant en free | Les images uploadées sont perdues au redéploiement |
| **Vercel** | 100 Go bandwidth/mois | Largement suffisant |

### Solution pour les images

Les fichiers uploadés dans `/uploads` sur Render **seront perdus** au redéploiement. Solutions :

1. **Cloudinary** (gratuit 25 Go) — stocker les images produits
2. **Supabase Storage** (gratuit 1 Go)
3. **Render Starter** ($7/mois) — inclut un disque persistant

---

## Mise à jour

```bash
git add -A && git commit -m "update" && git push
```

Les deux plateformes redéploient automatiquement sur push.
