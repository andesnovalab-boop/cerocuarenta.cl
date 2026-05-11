-- Productos nueva sesión de fotos (sesion1-005 en adelante, sin repetir las usadas en el sitio)
-- sesion1-001: ElRaquetero hero bg
-- sesion1-002: ElRaquetero Agassi main image
-- sesion1-003: ElRaquetero Agassi small image
-- sesion1-004: ElRaquetero cover banner
-- sesion1-005 en adelante: productos

INSERT INTO products (name, description, price, stock, category, images, featured, active)
SELECT * FROM (VALUES
  (
    'Polera Court Vintage',
    'Polera de algodón pesado inspirada en el tenis de los 80s. Fit oversize, cuello redondo reforzado. Perfecta para la ciudad o la cancha.',
    59900::numeric,
    20,
    'Polera',
    ARRAY['/images/sesion1-005.jpg', '/images/sesion1-006.jpg', '/images/sesion1-007.jpg'],
    true,
    true
  ),
  (
    'Polera Drop Serve',
    'Corte slim con detalle gráfico en el pecho. Tejido técnico transpirable. Disponible en colores neutros.',
    54900::numeric,
    15,
    'Polera',
    ARRAY['/images/sesion1-008.jpg', '/images/sesion1-009.jpg', '/images/sesion1-010.jpg'],
    true,
    true
  ),
  (
    'Poleron CeroCuarenta Club',
    'Poleron pesado tipo college. Ribetes en contraste, logo bordado en el pecho. Ideal para noches de club.',
    84900::numeric,
    12,
    'Poleron',
    ARRAY['/images/sesion1-011.jpg', '/images/sesion1-012.jpg', '/images/sesion1-013.jpg'],
    true,
    true
  ),
  (
    'Short Algarrobo',
    'Short técnico de secado rápido. Cinturilla elástica con cordón, bolsillo lateral con cierre. Largo mid-thigh.',
    49900::numeric,
    18,
    'Short',
    ARRAY['/images/sesion1-014.jpg', '/images/sesion1-015.jpg', '/images/sesion1-016.jpg'],
    false,
    true
  ),
  (
    'Short Baseline',
    'Short deportivo con tela tipo mesh en los costados. Diseño limpio sin estampados. Corte clásico.',
    44900::numeric,
    25,
    'Short',
    ARRAY['/images/sesion1-017.jpg', '/images/sesion1-018.jpg', '/images/sesion1-019.jpg'],
    false,
    true
  ),
  (
    'Pantalon Court Wide',
    'Pantalón de corte ancho inspirado en el tenis retro. Tela suave tipo french terry. Un básico atemporal.',
    79900::numeric,
    10,
    'Pantalon',
    ARRAY['/images/sesion1-020.jpg', '/images/sesion1-021.jpg', '/images/sesion1-022.jpg'],
    true,
    true
  ),
  (
    'Gorro Raquetero',
    'Gorro 5-panel con bordado 0-40 en el frente. Correa ajustable trasera. Material canvas.',
    34900::numeric,
    30,
    'Gorro',
    ARRAY['/images/sesion1-023.jpg', '/images/sesion1-024.jpg', '/images/sesion1-025.jpg'],
    false,
    true
  ),
  (
    'Polera Match Point',
    'Polera técnica de doble tejido con ventilación en espalda. Logo reflectante en el hombro.',
    64900::numeric,
    14,
    'Polera',
    ARRAY['/images/sesion1-026.jpg', '/images/sesion1-027.jpg', '/images/sesion1-028.jpg'],
    false,
    true
  ),
  (
    'Accesorio Grip Tape Pack',
    'Pack de 3 overgrips de alta absorción. Branding CeroCuarenta. Compatible con todas las raquetas.',
    19900::numeric,
    50,
    'Accesorio',
    ARRAY['/images/sesion1-029.jpg', '/images/sesion1-030.jpg'],
    false,
    true
  ),
  (
    'Poleron Game Set WTF',
    'Edición limitada con el lema icónico de la marca. Poleron heavy-weight con capucha y cordones.',
    94900::numeric,
    8,
    'Poleron',
    ARRAY['/images/sesion1-031.jpg', '/images/sesion1-032.jpg', '/images/sesion1-033.jpg'],
    true,
    true
  )
) AS v(name, description, price, stock, category, images, featured, active)
WHERE NOT EXISTS (
  SELECT 1 FROM products WHERE name = v.name
);
