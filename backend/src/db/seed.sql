-- Jus locaux togolais authentiques
INSERT INTO products (name, description, category, image_url, active)
VALUES
  ('Bissap', 'Jus d''hibiscus rouge, frais et désaltérant. Boisson traditionnelle togolaise très appréciée.', 'Jus Traditionnel', '/images/products/bissap.jpg', true),
  ('Alangba', 'Jus de gingembre épicé et revigorant. Parfait pour la digestion et l''énergie.', 'Jus Traditionnel', '/images/products/bissap2.jpg', true),
  ('Citron', 'Jus de citron local pressé, naturel et vitaminé. Idéal pour se rafraîchir.', 'Jus Naturel', '/images/products/citron.jpg', true),
  ('Baobab', 'Jus de baobab (bouye) riche en vitamines. Boisson énergétique naturelle du Togo.', 'Jus Naturel', '/images/products/baobab.jpg', true),
  ('Sodja', 'Boisson au soja local, riche en protéines. Délicieuse et nutritive.', 'Boisson Protéinée', '/images/products/bissap3.jpg', true),
  ('Yaourt', 'Yaourt à boire onctueux et frais, saveur nature ou vanille.', 'Produits Laitiers', '/images/products/yaourt.jpg', true),
  ('Tamarin', 'Jus de tamarin acidulé et rafraîchissant. Recette traditionnelle.', 'Jus Traditionnel', '/images/products/bissap.jpg', true),
  ('Ananas', 'Jus d''ananas frais et sucré, 100% naturel du Togo.', 'Jus Naturel', '/images/products/citron.jpg', true);

-- Formats et prix réalistes pour le marché togolais
INSERT INTO product_variants (product_id, size_label, price_xof, stock, active)
VALUES
  -- Bissap
  (1, '33 cl', 800, 100, true),
  (1, '50 cl', 1200, 80, true),
  (1, '1 L', 2000, 50, true),
  -- Alangba
  (2, '33 cl', 1000, 60, true),
  (2, '50 cl', 1500, 50, true),
  -- Citron
  (3, '33 cl', 700, 90, true),
  (3, '50 cl', 1000, 70, true),
  (3, '1 L', 1800, 40, true),
  -- Ananas
  (4, '33 cl', 900, 80, true),
  (4, '50 cl', 1300, 60, true),
  (4, '1 L', 2200, 35, true),
  -- Sodja
  (5, '33 cl', 800, 70, true),
  (5, '50 cl', 1200, 55, true),
  -- Yaourt
  (6, '25 cl', 600, 100, true),
  (6, '50 cl', 1000, 80, true),
  -- Milo
  (7, '33 cl', 1000, 90, true),
  (7, '50 cl', 1500, 65, true),
  -- Tamarin
  (8, '33 cl', 800, 50, true),
  (8, '50 cl', 1200, 40, true);

-- Zones de livraison à Lomé et périphérie (quartiers réels)
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
