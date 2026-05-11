-- 3 productos adicionales con fotos de sesion1

INSERT INTO products (name, description, price, stock, category, images, featured, active)
SELECT * FROM (VALUES
  (
    'Polera Open Court',
    'Polera 100% algodón peinado con bordado minimalista en el pecho. Corte recto, apta para cancha y ciudad.',
    57900::numeric,
    20,
    'Polera',
    ARRAY['/images/sesion1-040.jpg', '/images/sesion1-041.jpg', '/images/sesion1-042.jpg'],
    true,
    true
  ),
  (
    'Short Rally',
    'Short técnico con forro interno y bolsillos laterales con cierre invisible. Corte por encima de la rodilla.',
    47900::numeric,
    18,
    'Short',
    ARRAY['/images/sesion1-050.jpg', '/images/sesion1-051.jpg', '/images/sesion1-052.jpg'],
    true,
    true
  ),
  (
    'Poleron Deuce',
    'Poleron pesado con capucha y canguro. Logo CeroCuarenta reflectante. Edición limitada Drop 01.',
    89900::numeric,
    10,
    'Poleron',
    ARRAY['/images/sesion1-060.jpg', '/images/sesion1-061.jpg', '/images/sesion1-062.jpg'],
    true,
    true
  )
) AS v(name, description, price, stock, category, images, featured, active)
WHERE NOT EXISTS (
  SELECT 1 FROM products WHERE name = v.name
);
