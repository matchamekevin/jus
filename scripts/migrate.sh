#!/bin/bash
# Script de migration - Ajouter la table sessions et les nouvelles zones

echo "📦 Application des migrations..."

# Créer la table sessions si elle n'existe pas
docker exec -i jus_postgres psql -U jus_user -d jus_db << 'EOF'
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

-- Supprimer les anciennes zones et ajouter les nouvelles
DELETE FROM deliveries;

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
  ('Kpalimé / Atakpamé', 2000, true);

SELECT 'Migrations appliquées avec succès !' as status;
SELECT COUNT(*) as zones_count FROM deliveries;
EOF

echo "✅ Migrations terminées !"
