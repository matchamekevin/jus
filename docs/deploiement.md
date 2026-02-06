# JusTogo — Déploiement Vercel + Render (Free Tier)

## URLs de production

| Service | URL | Plateforme |
|---------|-----|------------|
| **Frontend** | https://frontend-sooty-one-op41x7nji3.vercel.app | Vercel |
| **Admin** | https://admin-chi-swart.vercel.app | Vercel |
| **Backend API** | https://justogo-api.onrender.com | Render |
| **Health check** | https://justogo-api.onrender.com/api/health | Render |

---

## Architecture

```
Utilisateur
   │
   ├── frontend-sooty-one-op41x7nji3.vercel.app ► Vercel (Frontend React)
   │        │ rewrites /api/*
   │        ▼
   │   justogo-api.onrender.com ──────────────► Render (Backend Express)
   │        │                                        │
   │        ▼                                        ▼
   │   PostgreSQL (Render)                     /uploads (Render)
   │
   └── admin-chi-swart.vercel.app ────────────► Vercel (Admin React)
            │ rewrites /api/*
            ▼
       justogo-api.onrender.com
```

**Vercel** sert les fichiers statiques (frontend + admin) et proxy les appels `/api/*` vers le backend.
**Render** héberge le backend Node.js et la base PostgreSQL.

---

## Identifiants Vercel

- **Compte** : zeks-projects-191b2943
- **Projet Frontend** : `frontend` → https://vercel.com/zeks-projects-191b2943/frontend
- **Projet Admin** : `admin` → https://vercel.com/zeks-projects-191b2943/admin

---

## Variables d'environnement Render

À configurer sur Render → Service `justogo-api` → Environment :

| Variable | Valeur |
|----------|--------|
| `NODE_ENV` | `production` |
| `PORT` | `4000` |
| `DATABASE_URL` | `postgresql://jus_user:CM7OIBrH9CQBX5EwPLRuRquOIfSFCBIV@dpg-d634396r433s73cnpo50-a.oregon-postgres.render.com/jus_db` |
| `ADMIN_API_KEY` | `admin_key_2026_jus_togo_secure` |
| `ALLOWED_ORIGINS` | `https://frontend-sooty-one-op41x7nji3.vercel.app,https://admin-chi-swart.vercel.app` |

⚠️ **Important** : La clé `ADMIN_API_KEY` sur Render **doit** correspondre à celle utilisée par l'admin frontend (`VITE_ADMIN_KEY` dans `admin/.env`). Si elles ne matchent pas → erreur `401 Unauthorized` sur toutes les requêtes admin.

---

## Variables d'environnement Vercel (Admin)

L'admin lit la clé API depuis `VITE_ADMIN_KEY`. Deux options :
1. Le fichier `admin/.env` (déjà configuré, inclus au build local)
2. Sur Vercel : Dashboard → Projet Admin → Settings → Environment Variables → ajouter `VITE_ADMIN_KEY` = `admin_key_2026_jus_togo_secure`

---

## Commandes de déploiement

### Redéployer le frontend
```bash
cd frontend && vercel --prod --yes
```

### Redéployer l'admin
```bash
cd admin && vercel --prod --yes
```

### Redéployer le backend
Push sur GitHub → Render redéploie automatiquement.
Ou manuellement : Dashboard Render → Service → Manual Deploy.

### Tout redéployer
```bash
git add -A && git commit -m "update" && git push
# Render redéploie auto, puis :
cd frontend && vercel --prod --yes
cd ../admin && vercel --prod --yes
```

---

## Migrations base de données

Dans le shell Render (Dashboard → Service → Shell) :
```bash
node scripts/migrate_db.js
```

---

## Domaine personnalisé (optionnel)

### Vercel
- Dashboard → Project → Settings → Domains → Ajouter votre domaine
- Configurer le DNS : `A` ou `CNAME` selon les instructions Vercel
- Mettre à jour `ALLOWED_ORIGINS` sur Render avec le nouveau domaine

---

## Limites du Free Tier

| Service | Limite | Impact |
|---------|--------|--------|
| **Render Web Service** | Spin down après 15 min d'inactivité | Premier appel = ~30s de latence (cold start) |
| **Render PostgreSQL** | Expire après 90 jours | Recréer la DB ou passer au plan payant ($7/mois) |
| **Render Disk** | Pas de disque persistant en free | Les images uploadées sont perdues au redéploiement |
| **Vercel** | 100 Go bandwidth/mois | Largement suffisant |

### Solution pour les images

Les fichiers uploadés dans `/uploads` sur Render **seront perdus** au redéploiement. Solutions :

1. **Cloudinary** (gratuit 25 Go) — stocker les images produits
2. **Supabase Storage** (gratuit 1 Go)
3. **Render Starter** ($7/mois) — inclut un disque persistant
