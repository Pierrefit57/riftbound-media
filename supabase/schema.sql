-- ============================================================
-- Riftbound Media — Supabase Schema
-- Exécuter ce SQL dans l'éditeur SQL de Supabase
-- ============================================================

-- 1. Table des profils utilisateurs
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  username text unique,
  avatar_url text,
  role text not null default 'user' check (role in ('user', 'editor', 'admin')),
  created_at timestamptz default now()
);

-- Activer RLS
alter table public.profiles enable row level security;

-- Tout le monde peut voir les profils
create policy "Profiles are viewable by everyone"
  on public.profiles for select
  using (true);

-- Les users peuvent modifier leur propre profil
create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- 2. Trigger : auto-créer un profil quand un user s'inscrit
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username, avatar_url, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'user_name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'avatar_url', ''),
    'user'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 3. Table des articles
create table public.articles (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text unique not null,
  content text not null default '',
  summary text default '',
  image_url text default '',
  tags text[] default '{}',
  author_id uuid references public.profiles(id),
  published boolean default false,
  featured boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Activer RLS
alter table public.articles enable row level security;

-- Tout le monde peut voir les articles publiés
create policy "Published articles are viewable by everyone"
  on public.articles for select
  using (published = true);

-- Les admins et éditeurs peuvent tout voir
create policy "Admins and editors can view all articles"
  on public.articles for select
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.role in ('admin', 'editor')
    )
  );

-- Les admins et éditeurs peuvent créer des articles
create policy "Admins and editors can insert articles"
  on public.articles for insert
  with check (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.role in ('admin', 'editor')
    )
  );

-- Les admins et éditeurs peuvent modifier des articles
create policy "Admins and editors can update articles"
  on public.articles for update
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.role in ('admin', 'editor')
    )
  );

-- Les admins peuvent supprimer des articles
create policy "Admins can delete articles"
  on public.articles for delete
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.role = 'admin'
    )
  );

-- 4. Trigger : mettre à jour updated_at automatiquement
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger on_article_updated
  before update on public.articles
  for each row execute function public.handle_updated_at();

-- 5. Insérer les articles de démo
insert into public.articles (title, slug, content, summary, tags, published, featured) values
(
  'La Faille s''Ouvre : Une Nouvelle Ère Commence',
  'la-faille-souvre',
  '# La Faille s''Ouvre : Une Nouvelle Ère Commence

Le monde de Riftbound a été changé à jamais. Des rapports venus des royaumes du nord font état d''une déchirure massive dans la réalité elle-même — une **Faille** pulsant d''énergie surnaturelle.

## Ce que nous savons

- **Localisation** : Pics de Givre nord
- **Niveau de danger** : Extrême
- **Cartes rares repérées** : Multiples créatures de tier Légendaire et Mythique

## Nouvelles mécaniques

1. **Énergie de Faille** : Un nouveau type de ressource
2. **Cartes Corrompues** : Les cartes existantes peuvent être corrompues
3. **Batailles Dimensionnelles** : Combattez à travers plusieurs plans

La conceptrice en chef Maria Chen déclare : *"C''est l''extension la plus ambitieuse que nous ayons jamais créée."*',
  'Une mystérieuse faille est apparue dans les royaumes du nord, libérant des pouvoirs inconnus et des créatures légendaires.',
  ARRAY['Mise à jour', 'Lore', 'Événement'],
  true,
  true
),
(
  'Interview Exclusive : Lyra, Championne du Tournoi de la Faille',
  'interview-lyra-championne',
  '# Interview Exclusive : Lyra, Championne du Tournoi

Après une finale palpitante qui a captivé des milliers de spectateurs, **Lyra** s''est imposée comme la première championne du Tournoi de la Faille.

## Sur sa victoire

**Riftbound Media** : Félicitations pour cette victoire ! Comment te sens-tu ?

**Lyra** : *"C''est surréaliste. Mon deck Shadow Control a vraiment bien fonctionné dans ce méta."*

## Sa stratégie

**Lyra** : *"Je joue un deck basé sur le contrôle des ombres. Le Void Reaver est absolument central."*

Le prochain tournoi régional aura lieu les 15-16 mars 2026 à Paris.',
  'Après sa victoire écrasante au Tournoi de la Faille, Lyra nous livre ses secrets de deck building.',
  ARRAY['Interview', 'Compétitif', 'Tournoi'],
  true,
  true
),
(
  'Patch 3.2 : Équilibrage et Nouvelles Cartes',
  'patch-3-2-equilibrage',
  '# Patch 3.2 : Équilibrage et Nouvelles Cartes

Le patch 3.2 est maintenant disponible !

## Nouvelles Cartes

### Gardien des Flammes (Rare)
- **ATK** : 5 | **DEF** : 4

### Tisseuse d''Aether (Épique)
- **ATK** : 3 | **DEF** : 7

### Sentinelle du Vide (Légendaire)
- **ATK** : 6 | **DEF** : 8

## Changements d''Équilibrage

| Carte | Changement |
|-------|-----------|
| Void Reaver | DEF réduite de 6 → 5 |
| Lame de l''Aube | ATK augmentée de 4 → 5 |

*Ce patch sera déployé le 10 février 2026 à 06h00 CET.*',
  'Le patch 3.2 apporte d''importants changements d''équilibrage, trois nouvelles cartes et une refonte du matchmaking.',
  ARRAY['Patch Notes', 'Équilibrage', 'Cartes'],
  true,
  false
);
