const express = require('express');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');
const { nanoid } = require('nanoid');
const Database = require('better-sqlite3');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;

const app = express();
const PORT = process.env.PORT || 3000;

// ─── CLOUDINARY ───────────────────────────────────────────────────
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dahj5lxvv',
  api_key:    process.env.CLOUDINARY_API_KEY    || '357814355274844',
  api_secret: process.env.CLOUDINARY_API_SECRET || '5xeYrf6y36YL58tlQZwlVO3-WtQ',
});

async function uploadToCloudinary(buffer, filename) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: 'nexo/products', resource_type: 'image', public_id: nanoid(10) },
      (err, result) => err ? reject(err) : resolve(result.secure_url)
    );
    stream.end(buffer);
  });
}

// ─── DATABASE ─────────────────────────────────────────────────────
// Kalici veri: Railway'de Volume ekleyince RAILWAY_VOLUME_MOUNT_PATH otomatik gelir.
// Ornegin mount /data ise DB: /data/db/nexo.db — deploy'da silinmez.
const VOLUME = process.env.RAILWAY_VOLUME_MOUNT_PATH
  || process.env.VOLUME_PATH
  || path.join(__dirname, 'data');
const dataDir = path.join(VOLUME, 'db');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const db = new Database(path.join(dataDir, 'nexo.db'));

db.exec(`
  CREATE TABLE IF NOT EXISTS admin (
    id INTEGER PRIMARY KEY,
    username TEXT NOT NULL DEFAULT 'admin',
    password TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    price REAL NOT NULL,
    old_price REAL,
    category TEXT NOT NULL,
    sizes TEXT DEFAULT '["S","M","L","XL","XXL"]',
    colors TEXT DEFAULT '[]',
    images TEXT DEFAULT '[]',
    stock INTEGER,
    stock_unlimited INTEGER DEFAULT 0,
    stock_status TEXT DEFAULT 'in_stock',
    featured INTEGER DEFAULT 0,
    collection TEXT DEFAULT 'drop01',
    created_at TEXT DEFAULT (datetime('now')),
    active INTEGER DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS collections (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    image_url TEXT,
    overlay_text TEXT,
    gradient TEXT,
    card_layout TEXT DEFAULT 'normal',
    sort_order INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    customer_name TEXT,
    customer_email TEXT,
    customer_phone TEXT,
    address TEXT,
    items TEXT,
    total REAL,
    status TEXT DEFAULT 'pending',
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT
  );

  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    name TEXT,
    surname TEXT,
    phone TEXT,
    city TEXT,
    district TEXT,
    address TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS discount_codes (
    id TEXT PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    type TEXT NOT NULL DEFAULT 'percent',
    value REAL NOT NULL,
    min_order REAL DEFAULT 0,
    max_uses INTEGER DEFAULT 0,
    used_count INTEGER DEFAULT 0,
    active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS user_activity (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT,
    user_email TEXT,
    action TEXT NOT NULL,
    data TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS shipping_methods (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    price REAL NOT NULL DEFAULT 0,
    free_threshold REAL DEFAULT 0,
    active INTEGER DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS tickets (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    user_name TEXT,
    user_email TEXT,
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    status TEXT DEFAULT 'open',
    admin_reply TEXT,
    admin_reply_at TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );
`);

// Migrate: add new columns if they don't exist
try { db.exec("ALTER TABLE products ADD COLUMN stock_unlimited INTEGER DEFAULT 0"); } catch {}
try { db.exec("ALTER TABLE products ADD COLUMN stock_status TEXT DEFAULT 'in_stock'"); } catch {}
try { db.exec("ALTER TABLE users ADD COLUMN surname TEXT"); } catch {}
try { db.exec("ALTER TABLE users ADD COLUMN phone TEXT"); } catch {}
try { db.exec("ALTER TABLE users ADD COLUMN city TEXT"); } catch {}
try { db.exec("ALTER TABLE users ADD COLUMN district TEXT"); } catch {}
try { db.exec("ALTER TABLE users ADD COLUMN address TEXT"); } catch {}
try { db.exec("ALTER TABLE orders ADD COLUMN user_id TEXT"); } catch {}
try { db.exec("ALTER TABLE orders ADD COLUMN discount_code TEXT"); } catch {}
try { db.exec("ALTER TABLE orders ADD COLUMN discount_amount REAL DEFAULT 0"); } catch {}
try { db.exec("ALTER TABLE orders ADD COLUMN shipping_cost REAL DEFAULT 0"); } catch {}
try { db.exec("ALTER TABLE orders ADD COLUMN shipping_method TEXT"); } catch {}
try { db.exec("ALTER TABLE orders ADD COLUMN city TEXT"); } catch {}
try { db.exec("ALTER TABLE orders ADD COLUMN district TEXT"); } catch {}
try { db.exec("ALTER TABLE orders ADD COLUMN zip_code TEXT"); } catch {}
try { db.exec("ALTER TABLE orders ADD COLUMN address_detail TEXT"); } catch {}
try { db.exec("ALTER TABLE products ADD COLUMN slug TEXT"); } catch {}
try { db.exec("ALTER TABLE products ADD COLUMN active INTEGER DEFAULT 1"); } catch {}
try { db.prepare("UPDATE products SET active = 1 WHERE active IS NULL").run(); } catch {}
try { db.exec("ALTER TABLE orders ADD COLUMN custom_slug TEXT"); } catch {}
try { db.exec("ALTER TABLE orders ADD COLUMN card_last4 TEXT"); } catch {}
try { db.exec("ALTER TABLE orders ADD COLUMN payment_status TEXT DEFAULT 'pending'"); } catch {}
try { db.exec("ALTER TABLE orders ADD COLUMN tracking_number TEXT"); } catch {}
try { db.exec("ALTER TABLE orders ADD COLUMN tracking_url TEXT"); } catch {}
try { db.exec("ALTER TABLE orders ADD COLUMN shipping_company TEXT"); } catch {}
try { db.exec('ALTER TABLE collections ADD COLUMN image_url TEXT'); } catch {}
try { db.exec('ALTER TABLE collections ADD COLUMN overlay_text TEXT'); } catch {}
try { db.exec('ALTER TABLE collections ADD COLUMN gradient TEXT'); } catch {}
try { db.exec("ALTER TABLE collections ADD COLUMN card_layout TEXT DEFAULT 'normal'"); } catch {}
try { db.exec('ALTER TABLE collections ADD COLUMN sort_order INTEGER DEFAULT 0'); } catch {}

// Seed admin — her zaman şifreyi güncelle
const adminExists = db.prepare('SELECT id FROM admin WHERE id = 1').get();
if (!adminExists) {
  db.prepare('INSERT INTO admin (id, username, password) VALUES (1, ?, ?)').run('admin', bcrypt.hashSync('33133', 10));
} else {
  // Şifre hash'i geçerliyse dokunma, değilse yenile
  const admin = db.prepare('SELECT password FROM admin WHERE id = 1').get();
  if (!bcrypt.compareSync('33133', admin.password)) {
    db.prepare('UPDATE admin SET password = ? WHERE id = 1').run(bcrypt.hashSync('33133', 10));
  }
}

// Seed default collections
const defaultCollections = [
  { id: 'drop01', name: 'Drop 01', slug: 'drop01', description: 'Ilk koleksiyon', overlay_text: 'DROP 01', gradient: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%)', card_layout: 'large', sort_order: 0 },
  { id: 'essentials', name: 'Essentials', slug: 'essentials', description: 'Temel parcalar', overlay_text: 'ESS', gradient: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)', card_layout: 'normal', sort_order: 1 },
  { id: 'limited', name: 'Limited', slug: 'limited', description: 'Sinirli uretim', overlay_text: 'LTD', gradient: 'linear-gradient(135deg, #0d0d0d 0%, #1a0a2e 100%)', card_layout: 'normal', sort_order: 2 },
];
for (const c of defaultCollections) {
  const exists = db.prepare('SELECT id FROM collections WHERE id = ?').get(c.id);
  if (!exists) {
    db.prepare(`INSERT INTO collections (id, name, slug, description, image_url, overlay_text, gradient, card_layout, sort_order)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(c.id, c.name, c.slug, c.description, c.image_url || null, c.overlay_text || null, c.gradient || null, c.card_layout || 'normal', c.sort_order ?? 0);
  }
}
// Eski DB: varsayilan gorsel alanlari doldur (bos ise)
try {
  db.prepare(`UPDATE collections SET overlay_text = 'DROP 01', gradient = 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%)', card_layout = 'large', sort_order = 0
    WHERE id = 'drop01' AND (overlay_text IS NULL OR overlay_text = '')`).run();
  db.prepare(`UPDATE collections SET overlay_text = 'ESS', gradient = 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)', card_layout = 'normal', sort_order = 1
    WHERE id = 'essentials' AND (overlay_text IS NULL OR overlay_text = '')`).run();
  db.prepare(`UPDATE collections SET overlay_text = 'LTD', gradient = 'linear-gradient(135deg, #0d0d0d 0%, #1a0a2e 100%)', card_layout = 'normal', sort_order = 2
    WHERE id = 'limited' AND (overlay_text IS NULL OR overlay_text = '')`).run();
} catch {}

function collectionSlugFromName(name) {
  return String(name || 'koleksiyon')
    .toLowerCase()
    .replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's').replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'koleksiyon';
}

function uniqueCollectionSlug(base) {
  let s = base;
  let n = 0;
  while (db.prepare('SELECT id FROM collections WHERE slug = ?').get(s)) {
    s = base + '-' + nanoid(4).toLowerCase();
    if (++n > 20) break;
  }
  return s;
}

// Seed default settings
const settingsDefaults = {
  site_name: 'NEXO',
  announcement_enabled: '1',
  announcement: 'UCRETSIZ KARGO — 1500 TL VE UZERI|YENI KOLEKSIYON — NEXO DROP 01|30 GUN IADE HAKKI',
  announcement_speed: '30',
  announcement_bg: '#000000',
  announcement_color: '#ffffff',
  marquee_enabled: '1',
  marquee_line: 'NEXO|STREETWEAR|DROP 01|2026|DEFINE YOUR ERA',
  marquee_speed: '20',
  free_shipping_threshold: '1500',
  free_shipping_all: '0',
  shipping_cost: '49.90',
  instagram: 'https://instagram.com/nexo',
  email: 'info@nexo.com.tr',
  site_status: 'open',
  site_closed_message: 'Sitemiz gecici olarak kapalidir. Yakinda gorusmek uzere.',
};
for (const [key, value] of Object.entries(settingsDefaults)) {
  const exists = db.prepare('SELECT key FROM settings WHERE key = ?').get(key);
  if (!exists) db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)').run(key, value);
}

db.exec(`
  CREATE TABLE IF NOT EXISTS season_templates (
    id TEXT PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    is_active INTEGER DEFAULT 0
  );
  CREATE TABLE IF NOT EXISTS template_products (
    template_id TEXT NOT NULL,
    product_id TEXT NOT NULL,
    PRIMARY KEY (template_id, product_id)
  );
`);
const tplSeed = [
  { id: 'tpl_yazlik', code: 'yazlik', name: 'Yazlik sablon' },
  { id: 'tpl_kislik', code: 'kislik', name: 'Kislik sablon' },
  { id: 'tpl_genel', code: 'genel', name: 'Genel sablon' },
];
for (const t of tplSeed) {
  const ex = db.prepare('SELECT id FROM season_templates WHERE id = ?').get(t.id);
  if (!ex) db.prepare('INSERT INTO season_templates (id, code, name, is_active) VALUES (?, ?, ?, 0)').run(t.id, t.code, t.name);
}

// ─── MULTER (memory storage for Cloudinary) ───────────────────────
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Sadece resim dosyalari yuklenebilir'));
  },
});

// ─── MIDDLEWARE ───────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
  secret: process.env.SESSION_SECRET || 'nexo-secret-2026-xK9mP',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 24 * 60 * 60 * 1000 },
}));

function requireAdmin(req, res, next) {
  if (req.session && req.session.isAdmin) return next();
  return res.status(401).json({ success: false, message: 'Yetkisiz erisim' });
}

function parseProduct(p) {
  return {
    ...p,
    sizes: JSON.parse(p.sizes || '[]'),
    colors: JSON.parse(p.colors || '[]'),
    images: JSON.parse(p.images || '[]'),
    featured: Boolean(p.featured),
    stock_unlimited: Boolean(p.stock_unlimited),
    active: p.active === undefined || p.active === null ? true : Boolean(p.active),
  };
}

function isSiteClosed() {
  try {
    const r = db.prepare("SELECT value FROM settings WHERE key = 'site_status'").get();
    return r && r.value === 'closed';
  } catch (e) {
    return false;
  }
}

function getActiveSeasonTemplateId() {
  try {
    const r = db.prepare('SELECT id FROM season_templates WHERE is_active = 1 LIMIT 1').get();
    return r ? r.id : null;
  } catch (e) {
    return null;
  }
}

function productAllowedInPublicStorefront(productId) {
  const tplId = getActiveSeasonTemplateId();
  if (!tplId) return true;
  const row = db.prepare('SELECT 1 FROM template_products WHERE template_id = ? AND product_id = ?').get(tplId, productId);
  return Boolean(row);
}

// ─── PUBLIC API ───────────────────────────────────────────────────

function makeSlug(name) {
  return name.toLowerCase()
    .replace(/ğ/g,'g').replace(/ü/g,'u').replace(/ş/g,'s').replace(/ı/g,'i').replace(/ö/g,'o').replace(/ç/g,'c')
    .replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')
    + '-' + nanoid(6).toLowerCase();
}

app.get('/api/products', (req, res) => {
  if (isSiteClosed()) {
    return res.json({ success: true, products: [], total: 0, site_closed: true });
  }
  const { category, collection, featured, limit, offset, search } = req.query;
  const tplId = getActiveSeasonTemplateId();
  let query;
  const params = [];
  if (tplId) {
    query = 'SELECT p.* FROM products p INNER JOIN template_products tp ON tp.product_id = p.id AND tp.template_id = ? WHERE COALESCE(p.active,1) = 1';
    params.push(tplId);
    if (category && category !== 'all') { query += ' AND p.category = ?'; params.push(category); }
    if (collection) { query += ' AND p.collection = ?'; params.push(collection); }
    if (featured === '1') { query += ' AND p.featured = 1'; }
    if (search) { query += ' AND (p.name LIKE ? OR p.description LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }
    query += ' ORDER BY p.created_at DESC';
  } else {
    query = 'SELECT * FROM products WHERE COALESCE(active,1) = 1';
    if (category && category !== 'all') { query += ' AND category = ?'; params.push(category); }
    if (collection) { query += ' AND collection = ?'; params.push(collection); }
    if (featured === '1') { query += ' AND featured = 1'; }
    if (search) { query += ' AND (name LIKE ? OR description LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }
    query += ' ORDER BY created_at DESC';
  }
  if (limit) { query += ' LIMIT ?'; params.push(parseInt(limit, 10)); }
  if (offset) { query += ' OFFSET ?'; params.push(parseInt(offset, 10)); }
  const products = db.prepare(query).all(...params).map(parseProduct);
  res.json({ success: true, products, total: products.length });
});

app.get('/api/products/:id', (req, res) => {
  if (isSiteClosed()) {
    return res.status(404).json({ success: false, message: 'Urun bulunamadi', site_closed: true });
  }
  const p = db.prepare('SELECT * FROM products WHERE id = ? OR slug = ?').get(req.params.id, req.params.id);
  if (!p) return res.status(404).json({ success: false, message: 'Urun bulunamadi' });
  if (p.active != null && Number(p.active) === 0) return res.status(404).json({ success: false, message: 'Urun bulunamadi' });
  if (!productAllowedInPublicStorefront(p.id)) return res.status(404).json({ success: false, message: 'Urun bulunamadi' });
  res.json({ success: true, product: parseProduct(p) });
});

app.get('/api/admin/products', requireAdmin, (req, res) => {
  const search = req.query.search;
  let rows;
  if (search && String(search).trim()) {
    const q = '%' + String(search).trim() + '%';
    rows = db.prepare('SELECT * FROM products WHERE name LIKE ? OR id LIKE ? OR slug LIKE ? ORDER BY created_at DESC').all(q, q, q);
  } else {
    rows = db.prepare('SELECT * FROM products ORDER BY created_at DESC').all();
  }
  res.json({ success: true, products: rows.map(parseProduct) });
});

app.get('/api/collections', (req, res) => {
  if (isSiteClosed()) return res.json({ success: true, collections: [] });
  const collections = db.prepare('SELECT * FROM collections ORDER BY sort_order ASC, name ASC').all();
  res.json({ success: true, collections });
});

app.get('/api/collections/by-slug/:slug', (req, res) => {
  if (isSiteClosed()) return res.status(404).json({ success: false, message: 'Koleksiyon bulunamadi' });
  const slug = String(req.params.slug || '').trim();
  if (!slug) return res.status(400).json({ success: false, message: 'Slug gerekli' });
  const col = db.prepare('SELECT * FROM collections WHERE slug = ? OR id = ?').get(slug, slug);
  if (!col) return res.status(404).json({ success: false, message: 'Koleksiyon bulunamadi' });
  res.json({ success: true, collection: col });
});

app.get('/api/settings', (req, res) => {
  const rows = db.prepare('SELECT key, value FROM settings').all();
  const settings = {};
  rows.forEach(r => (settings[r.key] = r.value));
  res.json({ success: true, settings });
});

app.post('/api/orders', (req, res) => {
  if (isSiteClosed()) return res.status(403).json({ success: false, message: 'Site su an kapali' });
  const { customer_name, customer_email, customer_phone, address, items, total } = req.body;
  if (!customer_name || !customer_email || !items || !total) {
    return res.status(400).json({ success: false, message: 'Eksik bilgi' });
  }
  const id = nanoid(12).toUpperCase();
  db.prepare('INSERT INTO orders (id, customer_name, customer_email, customer_phone, address, items, total) VALUES (?, ?, ?, ?, ?, ?, ?)')
    .run(id, customer_name, customer_email, customer_phone || '', address || '', JSON.stringify(items), total);
  res.json({ success: true, orderId: id, message: 'Siparisıniz alindi!' });
});

app.get('/api/orders/:id', (req, res) => {
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id.toUpperCase());
  if (!order) return res.status(404).json({ success: false, message: 'Siparis bulunamadi' });
  res.json({ success: true, order: { ...order, items: JSON.parse(order.items || '[]') } });
});

// ─── USER AUTH ───────────────────────────────────────────────────

function logActivity(userId, userEmail, action, data) {
  try {
    db.prepare('INSERT INTO user_activity (user_id, user_email, action, data) VALUES (?, ?, ?, ?)')
      .run(userId || null, userEmail || null, action, data ? JSON.stringify(data) : null);
  } catch(e) {}
}

app.post('/api/auth/register', (req, res) => {
  const { email, password, name, surname, phone, city, district, address } = req.body;
  if (!email || !password) return res.status(400).json({ success: false, message: 'Email ve sifre gerekli' });
  if (password.length < 6) return res.status(400).json({ success: false, message: 'Sifre en az 6 karakter olmali' });
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase());
  if (existing) return res.status(400).json({ success: false, message: 'Bu email zaten kayitli' });
  const id = nanoid(12);
  const hashed = bcrypt.hashSync(password, 10);
  db.prepare('INSERT INTO users (id, email, password, name, surname, phone, city, district, address) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)')
    .run(id, email.toLowerCase(), hashed, name || '', surname || '', phone || '', city || '', district || '', address || '');
  req.session.userId = id;
  req.session.userEmail = email.toLowerCase();
  req.session.userName = (name || '') + ' ' + (surname || '');
  logActivity(id, email.toLowerCase(), 'register', { name, city });
  res.json({ success: true, user: { id, email: email.toLowerCase(), name: name || '', surname: surname || '', phone: phone || '', city: city || '', district: district || '' } });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ success: false, message: 'Email ve sifre gerekli' });
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase());
  if (!user || !bcrypt.compareSync(password, user.password))
    return res.status(401).json({ success: false, message: 'Email veya sifre hatali' });
  req.session.userId = user.id;
  req.session.userEmail = user.email;
  req.session.userName = (user.name || '') + ' ' + (user.surname || '');
  logActivity(user.id, user.email, 'login', null);
  res.json({ success: true, user: { id: user.id, email: user.email, name: user.name, surname: user.surname, phone: user.phone, city: user.city, district: user.district, address: user.address } });
});

app.post('/api/auth/logout', (req, res) => {
  if (req.session.userId) logActivity(req.session.userId, req.session.userEmail, 'logout', null);
  req.session.userId = null; req.session.userEmail = null; req.session.userName = null;
  res.json({ success: true });
});

app.get('/api/auth/me', (req, res) => {
  if (!req.session.userId) return res.json({ user: null });
  const user = db.prepare('SELECT id, email, name, surname, phone, city, district, address FROM users WHERE id = ?').get(req.session.userId);
  res.json({ user });
});

app.put('/api/auth/profile', (req, res) => {
  if (!req.session.userId) return res.status(401).json({ success: false, message: 'Giris yapiniz' });
  const { name, surname, phone, city, district, address } = req.body;
  db.prepare('UPDATE users SET name=?, surname=?, phone=?, city=?, district=?, address=? WHERE id=?')
    .run(name || '', surname || '', phone || '', city || '', district || '', address || '', req.session.userId);
  res.json({ success: true, message: 'Profil guncellendi' });
});

// ─── DISCOUNT CODES ───────────────────────────────────────────────

app.post('/api/discount/check', (req, res) => {
  const { code, total } = req.body;
  if (!code) return res.status(400).json({ success: false, message: 'Kod gerekli' });
  const dc = db.prepare('SELECT * FROM discount_codes WHERE code = ? AND active = 1').get(code.toUpperCase());
  if (!dc) return res.status(404).json({ success: false, message: 'Gecersiz indirim kodu' });
  if (dc.max_uses > 0 && dc.used_count >= dc.max_uses) return res.status(400).json({ success: false, message: 'Bu kod kullanim limitine ulasti' });
  if (dc.min_order > 0 && total < dc.min_order) return res.status(400).json({ success: false, message: 'Minimum siparis tutari: TL' + dc.min_order });
  const discount = dc.type === 'percent' ? (total * dc.value / 100) : dc.value;
  res.json({ success: true, discount: Math.min(discount, total), type: dc.type, value: dc.value, code: dc.code });
});

// ─── ORDERS (enhanced) ────────────────────────────────────────────

app.post('/api/orders', (req, res) => {
  const { customer_name, customer_email, customer_phone, address, address_detail, city, district, zip_code, items, total, discount_code, discount_amount, shipping_cost, shipping_method, card_last4 } = req.body;
  if (!customer_name || !customer_email || !items || total === undefined) {
    return res.status(400).json({ success: false, message: 'Eksik bilgi' });
  }

  // user_id: session'dan al, yoksa email ile bul
  let userId = req.session.userId || null;
  if (!userId && customer_email) {
    const u = db.prepare('SELECT id FROM users WHERE email = ?').get(customer_email.toLowerCase());
    if (u) userId = u.id;
  }

  // Validate discount code if provided
  if (discount_code) {
    const dc = db.prepare('SELECT * FROM discount_codes WHERE code = ? AND active = 1').get(discount_code.toUpperCase());
    if (dc) db.prepare('UPDATE discount_codes SET used_count = used_count + 1 WHERE code = ?').run(discount_code.toUpperCase());
  }

  const id = nanoid(12).toUpperCase();
  db.prepare(`INSERT INTO orders (id, user_id, customer_name, customer_email, customer_phone, address, address_detail, city, district, zip_code, items, total, discount_code, discount_amount, shipping_cost, shipping_method, card_last4, payment_status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    .run(id, userId, customer_name, customer_email, customer_phone || '', address || '', address_detail || '', city || '', district || '', zip_code || '',
      JSON.stringify(items), parseFloat(total), discount_code || null, parseFloat(discount_amount || 0),
      parseFloat(shipping_cost || 0), shipping_method || 'standard', card_last4 || null, 'pending');

  logActivity(userId, customer_email, 'order_placed', { orderId: id, total });
  res.json({ success: true, orderId: id, message: 'Siparisıniz alindi!' });
});

app.get('/api/orders/:id', (req, res) => {
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id.toUpperCase());
  if (!order) return res.status(404).json({ success: false, message: 'Siparis bulunamadi' });
  if (req.session.userId && order.user_id !== req.session.userId && !req.session.isAdmin)
    return res.status(403).json({ success: false, message: 'Yetkisiz' });
  res.json({ success: true, order: { ...order, items: JSON.parse(order.items || '[]') } });
});

app.get('/api/my/orders', (req, res) => {
  if (!req.session.userId && !req.session.userEmail) return res.status(401).json({ success: false, message: 'Giris yapiniz' });
  let orders;
  if (req.session.userId) {
    // user_id ile bul, yoksa email ile de ara
    orders = db.prepare('SELECT * FROM orders WHERE user_id = ? OR customer_email = ? ORDER BY created_at DESC')
      .all(req.session.userId, req.session.userEmail || '');
  } else {
    orders = db.prepare('SELECT * FROM orders WHERE customer_email = ? ORDER BY created_at DESC')
      .all(req.session.userEmail);
  }
  res.json({ success: true, orders: orders.map(o => ({ ...o, items: JSON.parse(o.items || '[]') })) });
});

// Cart activity logging
app.post('/api/cart/log', (req, res) => {
  const { action, product_id, product_name, size } = req.body;
  logActivity(req.session.userId || null, req.session.userEmail || null, action, { product_id, product_name, size });
  res.json({ success: true });
});

// ─── ADMIN AUTH ───────────────────────────────────────────────────

app.post('/api/admin/login', (req, res) => {
  const { password } = req.body;
  if (!password) return res.status(400).json({ success: false, message: 'Sifre gerekli' });
  const admin = db.prepare('SELECT * FROM admin WHERE id = 1').get();
  if (!bcrypt.compareSync(password, admin.password))
    return res.status(401).json({ success: false, message: 'Hatali sifre' });
  req.session.isAdmin = true;
  res.json({ success: true });
});

app.post('/api/admin/logout', (req, res) => { req.session.destroy(); res.json({ success: true }); });
app.get('/api/admin/check', (req, res) => { res.json({ isAdmin: Boolean(req.session && req.session.isAdmin) }); });

// ─── ADMIN PRODUCTS ───────────────────────────────────────────────

app.post('/api/admin/products', requireAdmin, upload.array('images', 8), async (req, res) => {
  try {
    const { name, description, price, old_price, category, sizes, colors, stock, stock_unlimited, stock_status, featured, collection, active } = req.body;
    if (!name || !price || !category) return res.status(400).json({ success: false, message: 'Ad, fiyat ve kategori zorunlu' });

    const id = nanoid(10);
    const slug = makeSlug(name);

    // Upload files to Cloudinary
    const uploadedUrls = [];
    for (const file of (req.files || [])) {
      const url = await uploadToCloudinary(file.buffer, file.originalname);
      uploadedUrls.push(url);
    }

    let extraImages = [];
    try { extraImages = JSON.parse(req.body.image_urls || '[]'); } catch {}
    const allImages = [...uploadedUrls, ...extraImages];

    const parsedSizes = sizes ? (typeof sizes === 'string' ? (sizes.startsWith('[') ? JSON.parse(sizes) : sizes.split(',').map(s => s.trim()).filter(Boolean)) : sizes) : ['S','M','L','XL','XXL'];
    const parsedColors = colors ? (typeof colors === 'string' ? (colors.startsWith('[') ? JSON.parse(colors) : colors.split(',').map(s => s.trim()).filter(Boolean)) : colors) : [];

    db.prepare('INSERT INTO products (id, slug, name, description, price, old_price, category, sizes, colors, images, stock, stock_unlimited, stock_status, featured, collection, active) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
      .run(id, slug, name, description || '', parseFloat(price), old_price ? parseFloat(old_price) : null, category,
        JSON.stringify(parsedSizes), JSON.stringify(parsedColors), JSON.stringify(allImages),
        stock ? parseInt(stock) : null,
        stock_unlimited === '1' ? 1 : 0,
        stock_status || 'in_stock',
        featured === '1' ? 1 : 0,
        collection || 'drop01',
        active === '0' ? 0 : 1);

    res.json({ success: true, id, message: 'Urun eklendi' });
  } catch(e) {
    console.error(e);
    res.status(500).json({ success: false, message: 'Sunucu hatasi: ' + e.message });
  }
});

app.put('/api/admin/products/:id/active', requireAdmin, (req, res) => {
  const next = req.body.active === 0 || req.body.active === false || req.body.active === '0' ? 0 : 1;
  const info = db.prepare('UPDATE products SET active = ? WHERE id = ?').run(next, req.params.id);
  if (!info.changes) return res.status(404).json({ success: false, message: 'Urun bulunamadi' });
  res.json({ success: true, active: next });
});

app.put('/api/admin/products/:id', requireAdmin, upload.array('images', 8), async (req, res) => {
  try {
    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Urun bulunamadi' });

    const { name, description, price, old_price, category, sizes, colors, stock, stock_unlimited, stock_status, featured, collection, keep_images, active } = req.body;

    const uploadedUrls = [];
    for (const file of (req.files || [])) {
      const url = await uploadToCloudinary(file.buffer, file.originalname);
      uploadedUrls.push(url);
    }

    let extraImages = [];
    try { extraImages = JSON.parse(req.body.image_urls || '[]'); } catch {}

    let finalImages;
    if (keep_images === '1') {
      finalImages = [...JSON.parse(product.images || '[]'), ...uploadedUrls, ...extraImages];
    } else {
      finalImages = [...uploadedUrls, ...extraImages];
      if (finalImages.length === 0) finalImages = JSON.parse(product.images || '[]');
    }

    const parsedSizes = sizes ? (typeof sizes === 'string' ? (sizes.startsWith('[') ? JSON.parse(sizes) : sizes.split(',').map(s => s.trim()).filter(Boolean)) : sizes) : JSON.parse(product.sizes);
    const parsedColors = colors ? (typeof colors === 'string' ? (colors.startsWith('[') ? JSON.parse(colors) : colors.split(',').map(s => s.trim()).filter(Boolean)) : colors) : JSON.parse(product.colors);

    const prevActive = product.active == null || Number(product.active) !== 0 ? 1 : 0;
    let activeVal = prevActive;
    if (active !== undefined && active !== null && String(active) !== '') {
      activeVal = (active === '0' || active === 0 || active === false) ? 0 : 1;
    }

    db.prepare('UPDATE products SET name=?, description=?, price=?, old_price=?, category=?, sizes=?, colors=?, images=?, stock=?, stock_unlimited=?, stock_status=?, featured=?, collection=?, active=? WHERE id=?')
      .run(name || product.name, description !== undefined ? description : product.description,
        price ? parseFloat(price) : product.price, old_price ? parseFloat(old_price) : null,
        category || product.category, JSON.stringify(parsedSizes), JSON.stringify(parsedColors), JSON.stringify(finalImages),
        stock ? parseInt(stock) : null,
        stock_unlimited === '1' ? 1 : 0,
        stock_status || product.stock_status || 'in_stock',
        featured === '1' ? 1 : 0,
        collection || product.collection,
        activeVal,
        req.params.id);

    res.json({ success: true, message: 'Urun guncellendi' });
  } catch(e) {
    console.error(e);
    res.status(500).json({ success: false, message: 'Sunucu hatasi: ' + e.message });
  }
});

app.delete('/api/admin/products/:id', requireAdmin, (req, res) => {
  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  if (!product) return res.status(404).json({ success: false, message: 'Urun bulunamadi' });
  db.prepare('DELETE FROM products WHERE id = ?').run(req.params.id);
  res.json({ success: true, message: 'Urun silindi' });
});

// ─── ADMIN COLLECTIONS ────────────────────────────────────────────

app.get('/api/admin/collections', requireAdmin, (req, res) => {
  const collections = db.prepare('SELECT * FROM collections ORDER BY sort_order ASC, name ASC').all();
  res.json({ success: true, collections });
});

app.post('/api/admin/collections', requireAdmin, (req, res) => {
  const { name, description, slug: bodySlug, image_url, overlay_text, gradient, card_layout, sort_order } = req.body;
  if (!name) return res.status(400).json({ success: false, message: 'Koleksiyon adi zorunlu' });
  const id = nanoid(8);
  let slug = (bodySlug && String(bodySlug).trim()) ? collectionSlugFromName(bodySlug) : collectionSlugFromName(name);
  slug = uniqueCollectionSlug(slug);
  const layout = card_layout === 'large' ? 'large' : 'normal';
  const ord = sort_order !== undefined && sort_order !== '' && !Number.isNaN(parseInt(sort_order, 10)) ? parseInt(sort_order, 10) : 0;
  try {
    db.prepare(`INSERT INTO collections (id, name, slug, description, image_url, overlay_text, gradient, card_layout, sort_order)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
      id, name, slug, description || '',
      image_url || null,
      overlay_text || null,
      gradient || null,
      layout,
      ord
    );
    res.json({ success: true, id, message: 'Koleksiyon eklendi' });
  } catch (e) {
    res.status(400).json({ success: false, message: 'Slug veya veri hatasi' });
  }
});

app.put('/api/admin/collections/:id', requireAdmin, (req, res) => {
  const col = db.prepare('SELECT * FROM collections WHERE id = ?').get(req.params.id);
  if (!col) return res.status(404).json({ success: false, message: 'Koleksiyon bulunamadi' });
  const { name, description, slug: bodySlug, image_url, overlay_text, gradient, card_layout, sort_order } = req.body;
  let newSlug = col.slug;
  if (bodySlug !== undefined && String(bodySlug).trim()) {
    newSlug = collectionSlugFromName(bodySlug);
    if (newSlug !== col.slug) {
      const clash = db.prepare('SELECT id FROM collections WHERE slug = ? AND id != ?').get(newSlug, req.params.id);
      if (clash) newSlug = uniqueCollectionSlug(newSlug);
    }
  }
  const layout = card_layout === 'large' ? 'large' : (card_layout === 'normal' ? 'normal' : (col.card_layout || 'normal'));
  const ord = sort_order !== undefined && sort_order !== '' && !Number.isNaN(parseInt(sort_order, 10))
    ? parseInt(sort_order, 10)
    : (col.sort_order != null ? col.sort_order : 0);
  db.prepare(`UPDATE collections SET name=?, slug=?, description=?, image_url=?, overlay_text=?, gradient=?, card_layout=?, sort_order=? WHERE id=?`).run(
    name !== undefined && String(name).trim() ? name : col.name,
    newSlug,
    description !== undefined ? description : col.description,
    image_url !== undefined ? (image_url || null) : col.image_url,
    overlay_text !== undefined ? (overlay_text || null) : col.overlay_text,
    gradient !== undefined ? (gradient || null) : col.gradient,
    layout,
    ord,
    req.params.id
  );
  res.json({ success: true, message: 'Koleksiyon guncellendi' });
});

app.delete('/api/admin/collections/:id', requireAdmin, (req, res) => {
  db.prepare('DELETE FROM collections WHERE id = ?').run(req.params.id);
  res.json({ success: true, message: 'Koleksiyon silindi' });
});

// ─── ADMIN ORDERS ─────────────────────────────────────────────────

app.get('/api/admin/orders', requireAdmin, (req, res) => {
  const { search } = req.query;
  let orders;
  if (search) {
    const q = '%' + search + '%';
    orders = db.prepare(`SELECT * FROM orders WHERE
      id LIKE ? OR customer_name LIKE ? OR customer_email LIKE ?
      OR customer_phone LIKE ? OR city LIKE ?
      ORDER BY created_at DESC`).all(q, q, q, q, q);
  } else {
    orders = db.prepare('SELECT * FROM orders ORDER BY created_at DESC').all();
  }
  res.json({ success: true, orders: orders.map(o => ({ ...o, items: JSON.parse(o.items || '[]') })) });
});

app.get('/api/admin/orders/:id', requireAdmin, (req, res) => {
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id.toUpperCase());
  if (!order) return res.status(404).json({ success: false, message: 'Siparis bulunamadi' });
  res.json({ success: true, order: { ...order, items: JSON.parse(order.items || '[]') } });
});

app.put('/api/admin/orders/:id', requireAdmin, (req, res) => {
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id.toUpperCase());
  if (!order) return res.status(404).json({ success: false, message: 'Siparis bulunamadi' });
  const { status, items, total, customer_name, customer_phone, address, city, district, tracking_number, tracking_url, shipping_company } = req.body;
  const valid = ['pending','processing','shipped','delivered','cancelled'];
  if (status && !valid.includes(status)) return res.status(400).json({ success: false, message: 'Gecersiz durum' });
  db.prepare(`UPDATE orders SET
    status = COALESCE(?, status),
    items = COALESCE(?, items),
    total = COALESCE(?, total),
    customer_name = COALESCE(?, customer_name),
    customer_phone = COALESCE(?, customer_phone),
    address = COALESCE(?, address),
    city = COALESCE(?, city),
    district = COALESCE(?, district),
    tracking_number = COALESCE(?, tracking_number),
    tracking_url = COALESCE(?, tracking_url),
    shipping_company = COALESCE(?, shipping_company)
    WHERE id = ?`).run(
    status || null,
    items ? JSON.stringify(items) : null,
    total !== undefined ? parseFloat(total) : null,
    customer_name || null, customer_phone || null,
    address || null, city || null, district || null,
    tracking_number || null, tracking_url || null, shipping_company || null,
    req.params.id.toUpperCase()
  );
  res.json({ success: true, message: 'Siparis guncellendi' });
});

app.put('/api/admin/orders/:id/status', requireAdmin, (req, res) => {
  const { status } = req.body;
  const valid = ['pending','processing','shipped','delivered','cancelled'];
  if (!valid.includes(status)) return res.status(400).json({ success: false, message: 'Gecersiz durum' });
  db.prepare('UPDATE orders SET status = ? WHERE id = ?').run(status, req.params.id);
  res.json({ success: true, message: 'Durum guncellendi' });
});

// ─── ADMIN SETTINGS ───────────────────────────────────────────────

app.get('/api/admin/settings', requireAdmin, (req, res) => {
  const rows = db.prepare('SELECT key, value FROM settings').all();
  const settings = {};
  rows.forEach(r => (settings[r.key] = r.value));
  res.json({ success: true, settings });
});

app.put('/api/admin/settings', requireAdmin, (req, res) => {
  const { settings } = req.body;
  if (!settings || typeof settings !== 'object') return res.status(400).json({ success: false, message: 'Gecersiz veri' });
  const upsert = db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');
  const tx = db.transaction(obj => { for (const [k, v] of Object.entries(obj)) upsert.run(k, String(v)); });
  tx(settings);
  res.json({ success: true, message: 'Ayarlar kaydedildi' });
});

app.put('/api/admin/password', requireAdmin, (req, res) => {
  const { current_password, new_password } = req.body;
  if (!current_password || !new_password) return res.status(400).json({ success: false, message: 'Sifre gerekli' });
  if (new_password.length < 4) return res.status(400).json({ success: false, message: 'Sifre en az 4 karakter olmali' });
  const admin = db.prepare('SELECT * FROM admin WHERE id = 1').get();
  if (!bcrypt.compareSync(current_password, admin.password)) return res.status(401).json({ success: false, message: 'Mevcut sifre hatali' });
  db.prepare('UPDATE admin SET password = ? WHERE id = 1').run(bcrypt.hashSync(new_password, 10));
  res.json({ success: true, message: 'Sifre degistirildi' });
});

app.get('/api/admin/stats', requireAdmin, (req, res) => {
  const totalProducts = db.prepare('SELECT COUNT(*) as c FROM products').get().c;
  const totalOrders = db.prepare('SELECT COUNT(*) as c FROM orders').get().c;
  const pendingOrders = db.prepare("SELECT COUNT(*) as c FROM orders WHERE status = 'pending'").get().c;
  const totalRevenue = db.prepare("SELECT SUM(total) as s FROM orders WHERE status != 'cancelled'").get().s || 0;
  const totalUsers = db.prepare('SELECT COUNT(*) as c FROM users').get().c;
  res.json({ success: true, stats: { totalProducts, totalOrders, pendingOrders, totalRevenue, totalUsers } });
});

// ─── ADMIN USERS ──────────────────────────────────────────────────

app.get('/api/admin/users', requireAdmin, (req, res) => {
  const users = db.prepare('SELECT id, email, name, surname, phone, city, district, address, created_at FROM users ORDER BY created_at DESC').all();
  const result = users.map(u => {
    const orders = db.prepare('SELECT id, total, status, created_at FROM orders WHERE user_id = ? ORDER BY created_at DESC').all(u.id);
    const activity = db.prepare('SELECT action, data, created_at FROM user_activity WHERE user_id = ? ORDER BY created_at DESC LIMIT 50').all(u.id);
    return { ...u, orders, activity };
  });
  res.json({ success: true, users: result });
});

app.get('/api/admin/users/:id', requireAdmin, (req, res) => {
  const user = db.prepare('SELECT id, email, name, surname, phone, city, district, address, created_at FROM users WHERE id = ?').get(req.params.id);
  if (!user) return res.status(404).json({ success: false, message: 'Kullanici bulunamadi' });
  const orders = db.prepare('SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC').all(req.params.id)
    .map(o => ({ ...o, items: JSON.parse(o.items || '[]') }));
  const activity = db.prepare('SELECT * FROM user_activity WHERE user_id = ? ORDER BY created_at DESC').all(req.params.id);
  res.json({ success: true, user: { ...user, orders, activity } });
});

// ─── ADMIN DISCOUNT CODES ─────────────────────────────────────────

app.get('/api/admin/discounts', requireAdmin, (req, res) => {
  const codes = db.prepare('SELECT * FROM discount_codes ORDER BY created_at DESC').all();
  res.json({ success: true, codes });
});

app.post('/api/admin/discounts', requireAdmin, (req, res) => {
  const { code, type, value, min_order, max_uses } = req.body;
  if (!code || !value) return res.status(400).json({ success: false, message: 'Kod ve deger gerekli' });
  const id = nanoid(8);
  try {
    db.prepare('INSERT INTO discount_codes (id, code, type, value, min_order, max_uses) VALUES (?, ?, ?, ?, ?, ?)')
      .run(id, code.toUpperCase(), type || 'percent', parseFloat(value), parseFloat(min_order || 0), parseInt(max_uses || 0));
    res.json({ success: true, id, message: 'Indirim kodu eklendi' });
  } catch(e) {
    res.status(400).json({ success: false, message: 'Bu kod zaten mevcut' });
  }
});

app.put('/api/admin/discounts/:id', requireAdmin, (req, res) => {
  const { active } = req.body;
  db.prepare('UPDATE discount_codes SET active = ? WHERE id = ?').run(active ? 1 : 0, req.params.id);
  res.json({ success: true, message: 'Guncellendi' });
});

app.delete('/api/admin/discounts/:id', requireAdmin, (req, res) => {
  db.prepare('DELETE FROM discount_codes WHERE id = ?').run(req.params.id);
  res.json({ success: true, message: 'Silindi' });
});

// Admin: ürün slug değiştir
app.put('/api/admin/products/:id/slug', requireAdmin, (req, res) => {
  const { slug } = req.body;
  if (!slug) return res.status(400).json({ success: false, message: 'Slug gerekli' });
  const clean = slug.toLowerCase()
    .replace(/ğ/g,'g').replace(/ü/g,'u').replace(/ş/g,'s').replace(/ı/g,'i').replace(/ö/g,'o').replace(/ç/g,'c')
    .replace(/[^a-z0-9-]+/g,'-').replace(/^-|-$/g,'').substring(0, 80);
  const existing = db.prepare('SELECT id FROM products WHERE slug = ? AND id != ?').get(clean, req.params.id);
  if (existing) return res.status(400).json({ success: false, message: 'Bu slug zaten kullaniliyor' });
  db.prepare('UPDATE products SET slug = ? WHERE id = ?').run(clean, req.params.id);
  res.json({ success: true, slug: clean, url: '/urun/' + clean });
});

// Admin: siparis route degistir (custom slug)
app.put('/api/admin/orders/:id/slug', requireAdmin, (req, res) => {
  const { slug } = req.body;
  if (!slug) return res.status(400).json({ success: false, message: 'Slug gerekli' });
  // Slug sadece harf, rakam, tire icersin
  const clean = slug.toLowerCase().replace(/[^a-z0-9-]/g, '').substring(0, 50);
  // Baska siparisde ayni slug var mi?
  const existing = db.prepare('SELECT id FROM orders WHERE custom_slug = ? AND id != ?').get(clean, req.params.id);
  if (existing) return res.status(400).json({ success: false, message: 'Bu slug zaten kullaniliyor' });
  db.prepare('UPDATE orders SET custom_slug = ? WHERE id = ?').run(clean, req.params.id);
  res.json({ success: true, slug: clean, url: '/siparis/' + clean });
});

// Public: slug ile siparis getir
app.get('/api/order-by-slug/:slug', (req, res) => {
  const order = db.prepare('SELECT * FROM orders WHERE custom_slug = ? OR id = ?').get(req.params.slug, req.params.slug.toUpperCase());
  if (!order) return res.status(404).json({ success: false, message: 'Siparis bulunamadi' });
  res.json({ success: true, order: { ...order, items: JSON.parse(order.items || '[]') } });
});

// Kullanıcı talep gönder
app.post('/api/tickets', (req, res) => {
  const { subject, message } = req.body;
  if (!subject || !message) return res.status(400).json({ success: false, message: 'Konu ve mesaj gerekli' });
  const id = nanoid(10).toUpperCase();
  const userId = req.session.userId || null;
  const userName = req.session.userName || (req.body.name || '');
  const userEmail = req.session.userEmail || (req.body.email || '');
  db.prepare('INSERT INTO tickets (id, user_id, user_name, user_email, subject, message) VALUES (?, ?, ?, ?, ?, ?)')
    .run(id, userId, userName, userEmail, subject, message);
  res.json({ success: true, id, message: 'Talebiniz alindi' });
});

// Kullanıcı kendi taleplerini gör (aynı e-postayla acilmis veya user_id ile eslesen tum talepler)
app.get('/api/tickets/my', (req, res) => {
  if (!req.session.userId && !req.session.userEmail) return res.status(401).json({ success: false, message: 'Giris yapiniz' });
  let tickets;
  if (req.session.userId && req.session.userEmail) {
    tickets = db.prepare(
      "SELECT * FROM tickets WHERE user_id = ? OR lower(trim(COALESCE(user_email,''))) = lower(trim(?)) ORDER BY created_at DESC"
    ).all(req.session.userId, req.session.userEmail);
  } else if (req.session.userId) {
    tickets = db.prepare('SELECT * FROM tickets WHERE user_id = ? ORDER BY created_at DESC').all(req.session.userId);
  } else {
    tickets = db.prepare(
      "SELECT * FROM tickets WHERE lower(trim(COALESCE(user_email,''))) = lower(trim(?)) ORDER BY created_at DESC"
    ).all(req.session.userEmail);
  }
  const seen = new Set();
  const unique = [];
  for (const t of tickets) {
    if (seen.has(t.id)) continue;
    seen.add(t.id);
    unique.push(t);
  }
  res.json({ success: true, tickets: unique });
});

// Admin: tüm talepler
app.get('/api/admin/tickets', requireAdmin, (req, res) => {
  const { search } = req.query;
  let tickets;
  if (search) {
    const q = '%' + search + '%';
    tickets = db.prepare('SELECT * FROM tickets WHERE id LIKE ? OR user_name LIKE ? OR user_email LIKE ? OR subject LIKE ? OR message LIKE ? ORDER BY created_at DESC').all(q, q, q, q, q);
  } else {
    tickets = db.prepare('SELECT * FROM tickets ORDER BY created_at DESC').all();
  }
  res.json({ success: true, tickets });
});

// Admin: talebe cevap yaz / düzenle
app.put('/api/admin/tickets/:id', requireAdmin, (req, res) => {
  try {
    const { admin_reply, status } = req.body;
    const ticket = db.prepare('SELECT * FROM tickets WHERE id = ?').get(req.params.id);
    if (!ticket) return res.status(404).json({ success: false, message: 'Talep bulunamadi' });
    db.prepare("UPDATE tickets SET admin_reply = ?, admin_reply_at = datetime('now'), status = ? WHERE id = ?")
      .run(admin_reply !== undefined ? admin_reply : ticket.admin_reply, status || ticket.status, req.params.id);
    res.json({ success: true, message: 'Guncellendi' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, message: 'Sunucu hatasi' });
  }
});

// Admin: talep sil
app.delete('/api/admin/tickets/:id', requireAdmin, (req, res) => {
  db.prepare('DELETE FROM tickets WHERE id = ?').run(req.params.id);
  res.json({ success: true, message: 'Talep silindi' });
});

// ─── ADMIN SEASON TEMPLATES (yazlik / kislik / genel) ─────────────

app.get('/api/admin/season-templates', requireAdmin, (req, res) => {
  const templates = db.prepare('SELECT * FROM season_templates ORDER BY code').all();
  const out = templates.map((t) => ({
    id: t.id,
    code: t.code,
    name: t.name,
    is_active: Boolean(t.is_active),
    product_ids: db.prepare('SELECT product_id FROM template_products WHERE template_id = ?').all(t.id).map((r) => r.product_id),
  }));
  res.json({ success: true, templates: out });
});

app.put('/api/admin/season-templates/active', requireAdmin, (req, res) => {
  let { template_id } = req.body;
  template_id = template_id && String(template_id).trim() ? String(template_id).trim() : null;
  const tx = db.transaction(() => {
    db.prepare('UPDATE season_templates SET is_active = 0').run();
    if (template_id) {
      const t = db.prepare('SELECT id FROM season_templates WHERE id = ?').get(template_id);
      if (t) db.prepare('UPDATE season_templates SET is_active = 1 WHERE id = ?').run(template_id);
    }
  });
  tx();
  res.json({ success: true, message: 'Aktif sablon guncellendi' });
});

app.put('/api/admin/season-templates/:id/products', requireAdmin, (req, res) => {
  const { product_ids } = req.body;
  if (!Array.isArray(product_ids)) return res.status(400).json({ success: false, message: 'product_ids dizi olmali' });
  const t = db.prepare('SELECT id FROM season_templates WHERE id = ?').get(req.params.id);
  if (!t) return res.status(404).json({ success: false, message: 'Sablon bulunamadi' });
  const del = db.prepare('DELETE FROM template_products WHERE template_id = ?');
  const ins = db.prepare('INSERT OR IGNORE INTO template_products (template_id, product_id) VALUES (?, ?)');
  const tx = db.transaction(() => {
    del.run(req.params.id);
    for (const pid of product_ids) {
      if (!pid || typeof pid !== 'string') continue;
      const p = db.prepare('SELECT id FROM products WHERE id = ?').get(pid);
      if (p) ins.run(req.params.id, pid);
    }
  });
  tx();
  res.json({ success: true, message: 'Urun listesi kaydedildi' });
});

app.put('/api/admin/season-templates/:id', requireAdmin, (req, res) => {
  const { name } = req.body;
  const t = db.prepare('SELECT id FROM season_templates WHERE id = ?').get(req.params.id);
  if (!t) return res.status(404).json({ success: false, message: 'Sablon bulunamadi' });
  if (name != null && String(name).trim()) {
    db.prepare('UPDATE season_templates SET name = ? WHERE id = ?').run(String(name).trim(), req.params.id);
  }
  res.json({ success: true, message: 'Sablon guncellendi' });
});

// ─── SPA ROUTES ───────────────────────────────────────────────────

function redirectIfSiteClosed(req, res, next) {
  if (isSiteClosed()) return res.redirect(302, '/');
  next();
}

app.get('/admin', (req, res) => res.sendFile(path.join(__dirname, 'public', 'admin.html')));
app.get('/checkout', redirectIfSiteClosed, (req, res) => res.sendFile(path.join(__dirname, 'public', 'checkout.html')));
app.get('/siparis/:id', redirectIfSiteClosed, (req, res) => res.sendFile(path.join(__dirname, 'public', 'order.html')));
app.get('/urun/:id', redirectIfSiteClosed, (req, res) => res.sendFile(path.join(__dirname, 'public', 'product.html')));
app.get('/koleksiyon/:slug', redirectIfSiteClosed, (req, res) => res.sendFile(path.join(__dirname, 'public', 'collection.html')));
app.get('*', (req, res) => {
  const p = (req.path || '').split('?')[0];
  if (isSiteClosed() && p !== '/' && p !== '' && !p.startsWith('/admin')) {
    return res.redirect(302, '/');
  }
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ─── START ────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log('NEXO Server calisiyor -> http://localhost:' + PORT);
  console.log('Admin Panel -> http://localhost:' + PORT + '/admin');
});


