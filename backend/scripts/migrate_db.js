#!/usr/bin/env node
import dotenv from "dotenv";
import pkg from "pg";
import fs from "fs";

// Charger .env : prioriser la racine du repo puis le dossier backend
const rootEnv = new URL('../../.env', import.meta.url).pathname;
const backendEnv = new URL('../.env', import.meta.url).pathname;
if (fs.existsSync(rootEnv)) {
  dotenv.config({ path: rootEnv });
} else if (fs.existsSync(backendEnv)) {
  dotenv.config({ path: backendEnv });
} else {
  dotenv.config();
}

const { Pool } = pkg;

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL non défini. Vérifie ton fichier .env (root ou backend).');
}

console.log('Using DATABASE_URL=', process.env.DATABASE_URL ? '[REDACTED]' : 'undefined');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const sql = `
-- Table des sessions utilisateur
CREATE TABLE IF NOT EXISTS sessions (
  token UUID PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMP NOT NULL DEFAULT (NOW() + INTERVAL '30 days')
);

CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);

-- Ajouter la colonne active à la table users si elle n'existe pas
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'active'
  ) THEN
    ALTER TABLE users ADD COLUMN active BOOLEAN NOT NULL DEFAULT true;
  END IF;
END $$;

-- ============================================================
-- MIGRATION UUID : ajouter colonne uid à chaque table
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY['users','products','product_variants','deliveries','orders','order_items','payments','promos'])
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = tbl AND column_name = 'uid'
    ) THEN
      EXECUTE format('ALTER TABLE %I ADD COLUMN uid UUID DEFAULT uuid_generate_v4()', tbl);
      EXECUTE format('UPDATE %I SET uid = uuid_generate_v4() WHERE uid IS NULL', tbl);
      EXECUTE format('ALTER TABLE %I ALTER COLUMN uid SET NOT NULL', tbl);
      EXECUTE format('ALTER TABLE %I ALTER COLUMN uid SET DEFAULT uuid_generate_v4()', tbl);
      EXECUTE format('CREATE UNIQUE INDEX IF NOT EXISTS idx_%I_uid ON %I(uid)', tbl, tbl);
    END IF;
  END LOOP;
END $$;

-- ============================================================
-- Ajouter fingerprint aux sessions (sécurité anti-vol de token)
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sessions' AND column_name = 'fingerprint'
  ) THEN
    ALTER TABLE sessions ADD COLUMN fingerprint TEXT;
  END IF;
END $$;

-- Remplir les zones de livraison (idempotent suppression/insertion)
DELETE FROM deliveries;

-- ============================================================
-- Table panier persistant (lié au compte utilisateur)
-- ============================================================
CREATE TABLE IF NOT EXISTS cart_items (
  id SERIAL PRIMARY KEY,
  uid UUID NOT NULL DEFAULT uuid_generate_v4(),
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  variant_id INTEGER NOT NULL REFERENCES product_variants(id) ON DELETE CASCADE,
  qty INTEGER NOT NULL DEFAULT 1 CHECK (qty > 0),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, variant_id)
);
CREATE INDEX IF NOT EXISTS idx_cart_items_user_id ON cart_items(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_cart_items_uid ON cart_items(uid);

INSERT INTO deliveries (zone, fee_xof, active)
VALUES
  ('Lomé Centre (Dékon, Nyékonakpoè, Assivito)', 500, true),
  ('Hédzranawoé / Agoè / Doumasséssé', 600, true),
  ('Tokoin / Hôpital / Forever', 600, true),
  ('Adidogomé / Agoè Assiyéyé', 700, true),
  ('Bè / Kégué / Aflao', 700, true),
  ('Amadahomé / Attiégou / Kégué', 700, true),
  ('Zanguéra / Djidjolé / Baguida', 800, true),
  ('Agoènyivé / Agoè Zongo', 800, true),
  ('Totsi / Avepozo / Gbodjomé', 900, true),
  ('Kpémé / Aného', 1200, true),
  ('Tsévié / Noépé', 1500, true),
  ('Kpalimé / Atakpamé', 2000, true)
ON CONFLICT DO NOTHING;
`;

async function run() {
  const client = await pool.connect();
  try {
    console.log('📦 Exécution des migrations...');
    await client.query('BEGIN');
    await client.query(sql);
    await client.query('COMMIT');
    const res = await client.query('SELECT COUNT(*)::int as zones_count FROM deliveries');
    console.log('✅ Migrations appliquées avec succès ! Zones count =', res.rows[0].zones_count);
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('Erreur migration:', err.message || err);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

run();
