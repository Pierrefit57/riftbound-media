# Riftbound Media

Site média francophone pour l'univers Riftbound — propulsé par **Astro** + **Supabase**.

## Stack

- **Framework** : Astro 4 (SSR hybride)
- **Style** : Tailwind CSS
- **BDD & Auth** : Supabase (PostgreSQL + Auth Discord/Email)
- **Déploiement** : Docker

## Installation

```bash
# 1. Cloner le repo
git clone https://github.com/Pierrefit57/riftbound-media.git
cd riftbound-media

# 2. Installer les dépendances
npm install

# 3. Copier et remplir les variables d'env
cp .env.example .env
# → Remplir PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY

# 4. Lancer le dev server
npm run dev
# → http://localhost:4321
```

## Setup Supabase

1. Créer un projet sur [supabase.com](https://supabase.com)
2. Copier les clés API depuis **Settings > API**
3. Activer **Discord OAuth** dans **Authentication > Providers**
4. Exécuter le SQL de `supabase/schema.sql` dans l'**éditeur SQL**
5. Te donner le rôle admin :
```sql
UPDATE profiles SET role = 'admin' WHERE username = 'TON_USERNAME';
```

## Structure

```
src/
├── components/      # Composants réutilisables
├── content/         # Content Collections (règles)
├── layouts/         # MainLayout + AdminLayout
├── lib/             # Supabase client helpers
├── pages/
│   ├── admin/       # Panel admin (SSR, protégé)
│   ├── api/         # Endpoints API (auth, etc.)
│   ├── news/        # Pages news
│   ├── index.astro  # Homepage
│   ├── login.astro  # Connexion
│   ├── register.astro # Inscription
│   └── rules.astro  # Règles du jeu
└── middleware.ts    # Auth middleware
```

## Docker

```bash
docker compose up --build
```

## Pages

| Route | Type | Description |
|-------|------|-------------|
| `/` | Publique | Homepage |
| `/news` | Publique | Listing des actualités |
| `/news/[slug]` | Publique | Article |
| `/rules` | Publique | Règles du jeu |
| `/login` | Publique | Connexion Discord / Email |
| `/register` | Publique | Inscription |
| `/admin` | Protégée | Dashboard admin |
| `/admin/articles` | Protégée | Gestion des articles |
| `/admin/articles/new` | Protégée | Créer un article |
| `/admin/articles/[id]` | Protégée | Éditer un article |
