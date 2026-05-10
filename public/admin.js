// ── NEXO Admin Panel ─────────────────────────────────────────────
let selectedFiles = [];
let collectionsCache = [];

// ── Login ─────────────────────────────────────────────────────────
document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const pw = document.getElementById('loginPassword').value;
  const errEl = document.getElementById('loginError');
  try {
    const r = await fetch('/api/admin/login', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ password: pw }) });
    const d = await r.json();
    if (d.success) { document.getElementById('loginScreen').style.display = 'none'; document.getElementById('adminWrap').style.display = 'flex'; initAdmin(); }
    else errEl.textContent = d.message || 'Hatali sifre';
  } catch(e) { errEl.textContent = 'Sunucu hatasi'; }
});

window.addEventListener('DOMContentLoaded', async () => {
  try {
    const r = await fetch('/api/admin/check');
    const d = await r.json();
    if (d.isAdmin) { document.getElementById('loginScreen').style.display = 'none'; document.getElementById('adminWrap').style.display = 'flex'; initAdmin(); }
  } catch(e) {}
});

// ── Init ──────────────────────────────────────────────────────────
function initAdmin() {
  setupSidebar();
  loadStats();
  loadCollections();
  loadProducts();
  loadOrders();
  loadUsers();
  loadDiscounts();
  loadSettings();
  setupProductForm();
  setupCollectionForm();
  setupSettingsForms();
  setupImageUpload();
  setupStockOptions();
  document.getElementById('logoutBtn').addEventListener('click', async () => { await fetch('/api/admin/logout', { method:'POST' }); location.reload(); });
}

// ── Sidebar ───────────────────────────────────────────────────────
function setupSidebar() {
  document.querySelectorAll('.sidebar-link').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.sidebar-link').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById('page-' + btn.dataset.page).classList.add('active');
    });
  });
}

// ── Stats ─────────────────────────────────────────────────────────
async function loadStats() {
  try {
    const r = await fetch('/api/admin/stats');
    const d = await r.json();
    if (d.success) {
      document.getElementById('stat-products').textContent = d.stats.totalProducts;
      document.getElementById('stat-orders').textContent = d.stats.totalOrders;
      document.getElementById('stat-pending').textContent = d.stats.pendingOrders;
      document.getElementById('stat-revenue').textContent = '₺' + Number(d.stats.totalRevenue).toLocaleString('tr-TR');
    }
  } catch(e) {}
}

// ── Collections ───────────────────────────────────────────────────
async function loadCollections() {
  try {
    const r = await fetch('/api/admin/collections');
    const d = await r.json();
    collectionsCache = d.collections || [];
    renderCollectionsTable();
    updateCollectionSelect();
  } catch(e) {}
}

function renderCollectionsTable() {
  const tbody = document.getElementById('collectionsTableBody');
  if (!collectionsCache.length) { tbody.innerHTML = '<tr><td colspan="5" class="table-empty">Koleksiyon yok</td></tr>'; return; }
  tbody.innerHTML = collectionsCache.map(c => '<tr>'
    + '<td><code style="font-size:11px;color:#666">' + c.id + '</code></td>'
    + '<td><strong>' + esc(c.name) + '</strong></td>'
    + '<td><code style="font-size:12px;color:#888">' + esc(c.slug) + '</code></td>'
    + '<td style="color:#666">' + esc(c.description || '') + '</td>'
    + '<td><div class="btn-actions"><button class="btn-edit" onclick="editCollection(\'' + c.id + '\')">Duzenle</button><button class="btn-delete" onclick="deleteCollection(\'' + c.id + '\',\'' + esc(c.name) + '\')">Sil</button></div></td>'
    + '</tr>').join('');
}

function updateCollectionSelect() {
  const sel = document.getElementById('p-collection');
  if (!sel) return;
  sel.innerHTML = collectionsCache.map(c => '<option value="' + c.id + '">' + esc(c.name) + '</option>').join('');
}

document.getElementById('addCollectionBtn').addEventListener('click', () => {
  document.getElementById('collectionModalTitle').textContent = 'Yeni Koleksiyon';
  document.getElementById('collectionId').value = '';
  document.getElementById('collectionForm').reset();
  openCollectionModal();
});

function editCollection(id) {
  const c = collectionsCache.find(x => x.id === id);
  if (!c) return;
  document.getElementById('collectionModalTitle').textContent = 'Koleksiyonu Duzenle';
  document.getElementById('collectionId').value = c.id;
  document.getElementById('c-name').value = c.name;
  document.getElementById('c-desc').value = c.description || '';
  openCollectionModal();
}

function setupCollectionForm() {
  document.getElementById('collectionForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('collectionId').value;
    const body = { name: document.getElementById('c-name').value, description: document.getElementById('c-desc').value };
    try {
      const url = id ? '/api/admin/collections/' + id : '/api/admin/collections';
      const method = id ? 'PUT' : 'POST';
      const r = await fetch(url, { method, headers:{'Content-Type':'application/json'}, body: JSON.stringify(body) });
      const d = await r.json();
      if (d.success) { showToast(id ? 'Koleksiyon guncellendi' : 'Koleksiyon eklendi'); closeCollectionModal(); loadCollections(); }
      else showToast(d.message || 'Hata', true);
    } catch(e) { showToast('Sunucu hatasi', true); }
  });
}

async function deleteCollection(id, name) {
  if (!confirm(name + ' silinsin mi?')) return;
  try {
    const r = await fetch('/api/admin/collections/' + id, { method:'DELETE' });
    const d = await r.json();
    if (d.success) { showToast('Koleksiyon silindi'); loadCollections(); }
    else showToast(d.message || 'Hata', true);
  } catch(e) { showToast('Sunucu hatasi', true); }
}

function openCollectionModal() { document.getElementById('collectionModal').classList.add('open'); document.getElementById('collectionModalOverlay').classList.add('open'); }
function closeCollectionModal() { document.getElementById('collectionModal').classList.remove('open'); document.getElementById('collectionModalOverlay').classList.remove('open'); }

// ── Products ──────────────────────────────────────────────────────
let allProductsCache = [];

async function loadProducts(search) {
  try {
    const url = search ? '/api/products?search=' + encodeURIComponent(search) : '/api/products';
    const r = await fetch(url);
    const d = await r.json();
    allProductsCache = d.products || [];
    renderProductsTable(allProductsCache);
  } catch(e) {}
}

function renderProductsTable(products) {
  const tbody = document.getElementById('productsTableBody');
  if (!products || !products.length) { tbody.innerHTML = '<tr><td colspan="8" class="table-empty">Urun bulunamadi</td></tr>'; return; }
  tbody.innerHTML = products.map(p => {
    const stockLabel = p.stock_unlimited ? 'Sinirsiz' : (p.stock_status === 'out_of_stock' ? '<span style="color:#ff4444">Stokta Yok</span>' : (p.stock !== null ? p.stock : '-'));
    const colName = collectionsCache.find(c => c.id === p.collection);
    const thumb = p.images && p.images[0] ? '<img src="' + p.images[0] + '" style="width:40px;height:40px;object-fit:cover;border-radius:6px;border:1px solid #2a2a2a">' : '<div style="width:40px;height:40px;background:#1a1a1a;border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:10px;color:#444">N</div>';
    return '<tr>'
      + '<td>' + thumb + '</td>'
      + '<td><code style="font-size:11px;color:#666">' + p.id + '</code></td>'
      + '<td><strong>' + esc(p.name) + '</strong></td>'
      + '<td>' + esc(p.category) + '</td>'
      + '<td>' + esc(colName ? colName.name : p.collection) + '</td>'
      + '<td>₺' + Number(p.price).toLocaleString('tr-TR') + '</td>'
      + '<td>' + stockLabel + '</td>'
      + '<td><div class="btn-actions"><button class="btn-edit" onclick="editProduct(\'' + p.id + '\')">Duzenle</button><button class="btn-delete" onclick="deleteProduct(\'' + p.id + '\',\'' + esc(p.name) + '\')">Sil</button></div></td>'
      + '</tr>';
  }).join('');
}

// ── Product Modal ─────────────────────────────────────────────────
function setupImageUpload() {
  const fileInput = document.getElementById('p-images-file');
  fileInput.addEventListener('change', (e) => {
    for (const file of e.target.files) {
      if (!selectedFiles.find(f => f.name === file.name && f.size === file.size)) {
        selectedFiles.push(file);
      }
    }
    renderImagePreviews();
    fileInput.value = '';
  });
}

function renderImagePreviews() {
  const container = document.getElementById('imagePreviews');
  container.innerHTML = selectedFiles.map((f, i) => {
    const url = URL.createObjectURL(f);
    return '<div class="image-preview-item"><img src="' + url + '" alt=""/><button type="button" class="image-preview-remove" onclick="removePreview(' + i + ')">x</button></div>';
  }).join('');
}

function removePreview(i) {
  selectedFiles.splice(i, 1);
  renderImagePreviews();
}

function setupStockOptions() {
  document.querySelectorAll('input[name="stock_type"]').forEach(radio => {
    radio.addEventListener('change', () => {
      const wrap = document.getElementById('stock-count-wrap');
      wrap.style.display = radio.value === 'count' ? 'block' : 'none';
    });
  });
}

document.getElementById('addProductBtn').addEventListener('click', () => {
  document.getElementById('productModalTitle').textContent = 'Yeni Urun';
  document.getElementById('productId').value = '';
  document.getElementById('productForm').reset();
  document.getElementById('p-sizes').value = 'S,M,L,XL,XXL';
  document.getElementById('p-stock').value = '100';
  document.getElementById('stock-count-wrap').style.display = 'block';
  document.getElementById('stock-type-count').checked = true;
  selectedFiles = [];
  renderImagePreviews();
  updateCollectionSelect();
  openProductModal();
});

async function editProduct(id) {
  try {
    const r = await fetch('/api/products/' + id);
    const d = await r.json();
    if (!d.success) return;
    const p = d.product;
    document.getElementById('productModalTitle').textContent = 'Urunu Duzenle';
    document.getElementById('productId').value = p.id;
    document.getElementById('p-name').value = p.name;
    document.getElementById('p-category').value = p.category;
    document.getElementById('p-price').value = p.price;
    document.getElementById('p-old-price').value = p.old_price || '';
    document.getElementById('p-desc').value = p.description || '';
    document.getElementById('p-sizes').value = (p.sizes || []).join(',');
    document.getElementById('p-images-url').value = (p.images || []).join(',');
    document.getElementById('p-featured').checked = p.featured;
    document.getElementById('p-keep-images').checked = true;
    updateCollectionSelect();
    document.getElementById('p-collection').value = p.collection || 'drop01';

    // Stock
    if (p.stock_unlimited) {
      document.getElementById('stock-type-unlimited').checked = true;
      document.getElementById('stock-count-wrap').style.display = 'none';
    } else if (p.stock_status === 'out_of_stock') {
      document.getElementById('stock-type-out').checked = true;
      document.getElementById('stock-count-wrap').style.display = 'none';
    } else {
      document.getElementById('stock-type-count').checked = true;
      document.getElementById('stock-count-wrap').style.display = 'block';
      document.getElementById('p-stock').value = p.stock || 0;
    }

    selectedFiles = [];
    renderImagePreviews();
    openProductModal();
  } catch(e) {}
}

function setupProductForm() {
  document.getElementById('productForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitBtn = document.getElementById('productSubmitBtn');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Yukleniyor...';

    const id = document.getElementById('productId').value;
    const stockType = document.querySelector('input[name="stock_type"]:checked').value;

    const formData = new FormData();
    formData.append('name', document.getElementById('p-name').value);
    formData.append('category', document.getElementById('p-category').value);
    formData.append('price', document.getElementById('p-price').value);
    formData.append('old_price', document.getElementById('p-old-price').value || '');
    formData.append('collection', document.getElementById('p-collection').value);
    formData.append('description', document.getElementById('p-desc').value);
    formData.append('sizes', document.getElementById('p-sizes').value);
    formData.append('featured', document.getElementById('p-featured').checked ? '1' : '0');
    formData.append('keep_images', document.getElementById('p-keep-images').checked ? '1' : '0');

    // Stock
    formData.append('stock_unlimited', stockType === 'unlimited' ? '1' : '0');
    formData.append('stock_status', stockType === 'out' ? 'out_of_stock' : 'in_stock');
    if (stockType === 'count') formData.append('stock', document.getElementById('p-stock').value);

    // Image URLs
    const urlVal = document.getElementById('p-images-url').value.trim();
    if (urlVal) {
      const urls = urlVal.split(',').map(s => s.trim()).filter(Boolean);
      formData.append('image_urls', JSON.stringify(urls));
    }

    // File uploads
    for (const file of selectedFiles) formData.append('images', file);

    try {
      const url = id ? '/api/admin/products/' + id : '/api/admin/products';
      const method = id ? 'PUT' : 'POST';
      const r = await fetch(url, { method, body: formData });
      const d = await r.json();
      if (d.success) {
        showToast(id ? 'Urun guncellendi' : 'Urun eklendi (ID: ' + d.id + ')');
        closeProductModal();
        loadProducts();
        loadStats();
      } else showToast(d.message || 'Hata', true);
    } catch(e) { showToast('Sunucu hatasi', true); }
    finally { submitBtn.disabled = false; submitBtn.textContent = 'Kaydet'; }
  });
}

async function deleteProduct(id, name) {
  if (!confirm(name + ' silinsin mi?')) return;
  try {
    const r = await fetch('/api/admin/products/' + id, { method:'DELETE' });
    const d = await r.json();
    if (d.success) { showToast('Urun silindi'); loadProducts(); loadStats(); }
    else showToast(d.message || 'Hata', true);
  } catch(e) { showToast('Sunucu hatasi', true); }
}

function openProductModal() { document.getElementById('productModal').classList.add('open'); document.getElementById('productModalOverlay').classList.add('open'); }
function closeProductModal() { document.getElementById('productModal').classList.remove('open'); document.getElementById('productModalOverlay').classList.remove('open'); selectedFiles = []; }

// ── Orders ────────────────────────────────────────────────────────
let allOrdersCache = [];

async function loadOrders(search) {
  try {
    const url = search ? '/api/admin/orders?search=' + encodeURIComponent(search) : '/api/admin/orders';
    const r = await fetch(url);
    const d = await r.json();
    allOrdersCache = d.orders || [];
    renderOrdersTable(allOrdersCache);
  } catch(e) {}
}

function renderOrdersTable(orders) {
  const tbody = document.getElementById('ordersTableBody');
  if (!orders || !orders.length) { tbody.innerHTML = '<tr><td colspan="7" class="table-empty">Siparis bulunamadi</td></tr>'; return; }
  const labels = { pending:'Bekliyor', processing:'Isleniyor', shipped:'Kargoda', delivered:'Teslim Edildi', cancelled:'Iptal' };
  tbody.innerHTML = orders.map(o => '<tr>'
    + '<td><code style="font-size:11px;color:#666">' + o.id + '</code></td>'
    + '<td>' + esc(o.customer_name) + '<br><small style="color:#666">' + esc(o.customer_email) + '</small></td>'
    + '<td>' + esc((o.city||'') + (o.district?' / '+o.district:'')) + '</td>'
    + '<td>₺' + Number(o.total).toLocaleString('tr-TR') + '</td>'
    + '<td><span class="status status-' + o.status + '">' + (labels[o.status] || o.status) + '</span></td>'
    + '<td style="color:#666;font-size:12px">' + new Date(o.created_at).toLocaleString('tr-TR') + '</td>'
    + '<td><div class="btn-actions"><button class="btn-edit" onclick="editOrder(\'' + o.id + '\')">Duzenle</button><select class="status-select" onchange="updateOrderStatus(\'' + o.id + '\',this.value)">'
    + Object.entries(labels).map(([v,l]) => '<option value="' + v + '"' + (v===o.status?' selected':'') + '>' + l + '</option>').join('')
    + '</select></div></td>'
    + '</tr>').join('');
}

async function editOrder(id) {
  try {
    const r = await fetch('/api/admin/orders/' + id);
    const d = await r.json();
    if (!d.success) return;
    const o = d.order;
    const labels = { pending:'Bekliyor', processing:'Isleniyor', shipped:'Kargoda', delivered:'Teslim Edildi', cancelled:'Iptal' };

    document.getElementById('orderEditId').value = o.id;
    document.getElementById('oe-name').value = o.customer_name || '';
    document.getElementById('oe-phone').value = o.customer_phone || '';
    document.getElementById('oe-address').value = o.address || '';
    document.getElementById('oe-city').value = o.city || '';
    document.getElementById('oe-district').value = o.district || '';
    document.getElementById('oe-status').value = o.status || 'pending';
    document.getElementById('oe-tracking-num').value = o.tracking_number || '';
    document.getElementById('oe-tracking-url').value = o.tracking_url || '';
    document.getElementById('oe-shipping-co').value = o.shipping_company || '';
    document.getElementById('oe-total').value = o.total || '';

    // Items
    const itemsContainer = document.getElementById('oe-items');
    itemsContainer.innerHTML = (o.items || []).map((item, i) =>
      '<div class="oe-item" data-index="' + i + '">'
      + '<div class="oe-item-img">' + (item.image ? '<img src="' + item.image + '">' : '') + '</div>'
      + '<div class="oe-item-info">'
      + '<input class="oe-item-name" value="' + esc(item.name||'') + '" placeholder="Urun adi"/>'
      + '<div class="oe-item-row">'
      + '<input class="oe-item-size" value="' + esc(item.size||'') + '" placeholder="Beden" style="width:80px"/>'
      + '<input class="oe-item-qty" type="number" value="' + (item.qty||1) + '" min="1" style="width:60px"/>'
      + '<input class="oe-item-price" type="number" value="' + (item.price||0) + '" step="0.01" style="width:100px"/>'
      + '<button type="button" class="btn-delete" onclick="removeOrderItem(' + i + ')" style="padding:4px 10px">Sil</button>'
      + '</div></div></div>'
    ).join('');

    document.getElementById('orderEditModal').classList.add('open');
    document.getElementById('orderEditOverlay').classList.add('open');
  } catch(e) { showToast('Hata', true); }
}

function removeOrderItem(index) {
  const items = document.querySelectorAll('.oe-item');
  if (items[index]) items[index].remove();
}

async function saveOrderEdit() {
  const id = document.getElementById('orderEditId').value;
  const itemEls = document.querySelectorAll('.oe-item');
  const items = Array.from(itemEls).map(el => ({
    name: el.querySelector('.oe-item-name').value,
    size: el.querySelector('.oe-item-size').value,
    qty: parseInt(el.querySelector('.oe-item-qty').value) || 1,
    price: parseFloat(el.querySelector('.oe-item-price').value) || 0,
    image: el.querySelector('img') ? el.querySelector('img').src : '',
  }));
  const body = {
    status: document.getElementById('oe-status').value,
    customer_name: document.getElementById('oe-name').value,
    customer_phone: document.getElementById('oe-phone').value,
    address: document.getElementById('oe-address').value,
    city: document.getElementById('oe-city').value,
    district: document.getElementById('oe-district').value,
    tracking_number: document.getElementById('oe-tracking-num').value,
    tracking_url: document.getElementById('oe-tracking-url').value,
    shipping_company: document.getElementById('oe-shipping-co').value,
    total: parseFloat(document.getElementById('oe-total').value),
    items,
  };
  try {
    const r = await fetch('/api/admin/orders/' + id, { method:'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body) });
    const d = await r.json();
    if (d.success) { showToast('Siparis guncellendi'); closeOrderEdit(); loadOrders(); }
    else showToast(d.message || 'Hata', true);
  } catch(e) { showToast('Sunucu hatasi', true); }
}

function closeOrderEdit() {
  document.getElementById('orderEditModal').classList.remove('open');
  document.getElementById('orderEditOverlay').classList.remove('open');
}}

async function updateOrderStatus(id, status) {
  try {
    const r = await fetch('/api/admin/orders/' + id + '/status', { method:'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ status }) });
    const d = await r.json();
    if (d.success) showToast('Durum guncellendi');
    else showToast(d.message || 'Hata', true);
  } catch(e) {}
}

// ── Settings ──────────────────────────────────────────────────────
async function loadSettings() {
  try {
    const r = await fetch('/api/admin/settings');
    const d = await r.json();
    if (!d.settings) return;
    const s = d.settings;
    document.getElementById('set-site-name').value = s.site_name || '';
    document.getElementById('set-shipping').value = s.free_shipping_threshold || '';
    document.getElementById('set-instagram').value = s.instagram || '';
    document.getElementById('set-email').value = s.email || '';
    document.getElementById('set-ann-enabled').value = s.announcement_enabled || '1';
    document.getElementById('set-announcement').value = s.announcement || '';
    document.getElementById('set-ann-speed').value = s.announcement_speed || '30';
    document.getElementById('set-ann-bg').value = s.announcement_bg || '#000000';
    document.getElementById('set-ann-bg-text').value = s.announcement_bg || '#000000';
    document.getElementById('set-ann-color').value = s.announcement_color || '#ffffff';
    document.getElementById('set-ann-color-text').value = s.announcement_color || '#ffffff';
  } catch(e) {}
}

function setupSettingsForms() {
  // Sync color pickers with text inputs
  document.getElementById('set-ann-bg').addEventListener('input', (e) => { document.getElementById('set-ann-bg-text').value = e.target.value; });
  document.getElementById('set-ann-bg-text').addEventListener('input', (e) => { document.getElementById('set-ann-bg').value = e.target.value; });
  document.getElementById('set-ann-color').addEventListener('input', (e) => { document.getElementById('set-ann-color-text').value = e.target.value; });
  document.getElementById('set-ann-color-text').addEventListener('input', (e) => { document.getElementById('set-ann-color').value = e.target.value; });

  document.getElementById('announcementForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const settings = {
      announcement_enabled: document.getElementById('set-ann-enabled').value,
      announcement: document.getElementById('set-announcement').value,
      announcement_speed: document.getElementById('set-ann-speed').value,
      announcement_bg: document.getElementById('set-ann-bg-text').value,
      announcement_color: document.getElementById('set-ann-color-text').value,
    };
    await saveSettings(settings);
  });

  document.getElementById('siteSettingsForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const settings = {
      site_name: document.getElementById('set-site-name').value,
      free_shipping_threshold: document.getElementById('set-shipping').value,
      instagram: document.getElementById('set-instagram').value,
      email: document.getElementById('set-email').value,
    };
    await saveSettings(settings);
  });

  document.getElementById('passwordForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const cur = document.getElementById('cur-pass').value;
    const nw = document.getElementById('new-pass').value;
    const nw2 = document.getElementById('new-pass2').value;
    const errEl = document.getElementById('passError');
    if (nw !== nw2) { errEl.textContent = 'Yeni sifreler eslesmiyor'; return; }
    if (nw.length < 4) { errEl.textContent = 'Sifre en az 4 karakter olmali'; return; }
    errEl.textContent = '';
    try {
      const r = await fetch('/api/admin/password', { method:'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ current_password: cur, new_password: nw }) });
      const d = await r.json();
      if (d.success) { showToast('Sifre degistirildi'); e.target.reset(); }
      else errEl.textContent = d.message || 'Hata';
    } catch(e) { errEl.textContent = 'Sunucu hatasi'; }
  });
}

async function saveSettings(settings) {
  try {
    const r = await fetch('/api/admin/settings', { method:'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ settings }) });
    const d = await r.json();
    showToast(d.success ? 'Ayarlar kaydedildi' : (d.message || 'Hata'), !d.success);
  } catch(e) { showToast('Sunucu hatasi', true); }
}

// ── Toast ─────────────────────────────────────────────────────────
function showToast(msg, isError) {
  const t = document.getElementById('adminToast');
  t.textContent = msg;
  t.className = 'toast' + (isError ? ' error' : '');
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3000);
}

// ── Helpers ───────────────────────────────────────────────────────
function esc(s) { return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

// ── Login ─────────────────────────────────────────────────────────
document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const pw = document.getElementById('loginPassword').value;
  const errEl = document.getElementById('loginError');
  try {
    const r = await fetch('/api/admin/login', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ password: pw }) });
    const d = await r.json();
    if (d.success) {
      document.getElementById('loginScreen').style.display = 'none';
      document.getElementById('adminWrap').style.display = 'flex';
      initAdmin();
    } else {
      errEl.textContent = d.message || 'Hatalı şifre';
    }
  } catch(e) { errEl.textContent = 'Sunucu hatası'; }
});

// Check existing session on load
window.addEventListener('DOMContentLoaded', async () => {
  try {
    const r = await fetch('/api/admin/check');
    const d = await r.json();
    if (d.isAdmin) {
      document.getElementById('loginScreen').style.display = 'none';
      document.getElementById('adminWrap').style.display = 'flex';
      initAdmin();
    }
  } catch(e) {}
});

// ── Init ──────────────────────────────────────────────────────────
function initAdmin() {
  setupSidebar();
  loadStats();
  loadProducts();
  loadOrders();
  loadSettings();
  setupProductForm();
  setupSettingsForms();
  document.getElementById('logoutBtn').addEventListener('click', async () => {
    await fetch('/api/admin/logout', { method:'POST' });
    location.reload();
  });
}

// ── Sidebar ───────────────────────────────────────────────────────
function setupSidebar() {
  document.querySelectorAll('.sidebar-link').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.sidebar-link').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById('page-' + btn.dataset.page).classList.add('active');
    });
  });
}

// ── Stats ─────────────────────────────────────────────────────────
async function loadStats() {
  try {
    const r = await fetch('/api/admin/stats');
    const d = await r.json();
    if (d.success) {
      document.getElementById('stat-products').textContent = d.stats.totalProducts;
      document.getElementById('stat-orders').textContent = d.stats.totalOrders;
      document.getElementById('stat-pending').textContent = d.stats.pendingOrders;
      document.getElementById('stat-revenue').textContent = '₺' + Number(d.stats.totalRevenue).toLocaleString('tr-TR');
    }
  } catch(e) {}
}

// ── Products ──────────────────────────────────────────────────────
async function loadProducts() {
  try {
    const r = await fetch('/api/products');
    const d = await r.json();
    const tbody = document.getElementById('productsTableBody');
    if (!d.products || d.products.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" class="table-empty">Henüz ürün yok</td></tr>';
      return;
    }
    tbody.innerHTML = d.products.map(p => '<tr>'
      + '<td><code style="font-size:11px;color:#666">' + p.id + '</code></td>'
      + '<td><strong>' + esc(p.name) + '</strong></td>'
      + '<td>' + esc(p.category) + '</td>'
      + '<td>₺' + Number(p.price).toLocaleString('tr-TR') + '</td>'
      + '<td>' + p.stock + '</td>'
      + '<td><div class="btn-actions"><button class="btn-edit" onclick="editProduct(\'' + p.id + '\')">Düzenle</button><button class="btn-delete" onclick="deleteProduct(\'' + p.id + '\',\'' + esc(p.name) + '\')">Sil</button></div></td>'
      + '</tr>').join('');
  } catch(e) {}
}

// ── Product Modal ─────────────────────────────────────────────────
document.getElementById('addProductBtn').addEventListener('click', () => {
  document.getElementById('productModalTitle').textContent = 'Yeni Ürün';
  document.getElementById('productId').value = '';
  document.getElementById('productForm').reset();
  document.getElementById('p-sizes').value = 'S,M,L,XL,XXL';
  document.getElementById('p-stock').value = '100';
  openProductModal();
});

async function editProduct(id) {
  try {
    const r = await fetch('/api/products/' + id);
    const d = await r.json();
    if (!d.success) return;
    const p = d.product;
    document.getElementById('productModalTitle').textContent = 'Ürünü Düzenle';
    document.getElementById('productId').value = p.id;
    document.getElementById('p-name').value = p.name;
    document.getElementById('p-category').value = p.category;
    document.getElementById('p-price').value = p.price;
    document.getElementById('p-old-price').value = p.old_price || '';
    document.getElementById('p-stock').value = p.stock;
    document.getElementById('p-collection').value = p.collection || 'drop01';
    document.getElementById('p-desc').value = p.description || '';
    document.getElementById('p-sizes').value = (p.sizes || []).join(',');
    document.getElementById('p-images').value = (p.images || []).join(',');
    document.getElementById('p-featured').checked = p.featured;
    openProductModal();
  } catch(e) {}
}

function setupProductForm() {
  document.getElementById('productForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('productId').value;
    const isEdit = Boolean(id);
    const sizes = document.getElementById('p-sizes').value.split(',').map(s => s.trim()).filter(Boolean);
    const images = document.getElementById('p-images').value.split(',').map(s => s.trim()).filter(Boolean);
    const body = {
      name: document.getElementById('p-name').value,
      category: document.getElementById('p-category').value,
      price: document.getElementById('p-price').value,
      old_price: document.getElementById('p-old-price').value || null,
      stock: document.getElementById('p-stock').value,
      collection: document.getElementById('p-collection').value,
      description: document.getElementById('p-desc').value,
      sizes: JSON.stringify(sizes),
      image_urls: JSON.stringify(images),
      featured: document.getElementById('p-featured').checked ? '1' : '0',
    };
    try {
      const url = isEdit ? '/api/admin/products/' + id : '/api/admin/products';
      const method = isEdit ? 'PUT' : 'POST';
      const r = await fetch(url, { method, headers:{'Content-Type':'application/json'}, body: JSON.stringify(body) });
      const d = await r.json();
      if (d.success) {
        showToast(isEdit ? 'Ürün güncellendi' : 'Ürün eklendi (ID: ' + d.id + ')');
        closeProductModal();
        loadProducts();
        loadStats();
      } else { showToast(d.message || 'Hata', true); }
    } catch(e) { showToast('Sunucu hatası', true); }
  });
}

async function deleteProduct(id, name) {
  if (!confirm(name + ' silinsin mi?')) return;
  try {
    const r = await fetch('/api/admin/products/' + id, { method:'DELETE' });
    const d = await r.json();
    if (d.success) { showToast('Ürün silindi'); loadProducts(); loadStats(); }
    else showToast(d.message || 'Hata', true);
  } catch(e) { showToast('Sunucu hatası', true); }
}

function openProductModal() {
  document.getElementById('productModal').classList.add('open');
  document.getElementById('productModalOverlay').classList.add('open');
}
function closeProductModal() {
  document.getElementById('productModal').classList.remove('open');
  document.getElementById('productModalOverlay').classList.remove('open');
}

// ── Orders ────────────────────────────────────────────────────────
async function loadOrders() {
  try {
    const r = await fetch('/api/admin/orders');
    const d = await r.json();
    const tbody = document.getElementById('ordersTableBody');
    if (!d.orders || d.orders.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" class="table-empty">Henüz sipariş yok</td></tr>';
      return;
    }
    const statusLabels = { pending:'Bekliyor', processing:'İşleniyor', shipped:'Kargoda', delivered:'Teslim Edildi', cancelled:'İptal' };
    tbody.innerHTML = d.orders.map(o => '<tr>'
      + '<td><code style="font-size:11px;color:#666">' + o.id + '</code></td>'
      + '<td>' + esc(o.customer_name) + '<br><small style="color:#666">' + esc(o.customer_email) + '</small></td>'
      + '<td>₺' + Number(o.total).toLocaleString('tr-TR') + '</td>'
      + '<td><span class="status status-' + o.status + '">' + (statusLabels[o.status] || o.status) + '</span></td>'
      + '<td style="color:#666;font-size:12px">' + new Date(o.created_at).toLocaleDateString('tr-TR') + '</td>'
      + '<td><select class="status-select" onchange="updateOrderStatus(\'' + o.id + '\',this.value)">'
      + ['pending','processing','shipped','delivered','cancelled'].map(s => '<option value="' + s + '"' + (s===o.status?' selected':'') + '>' + (statusLabels[s]||s) + '</option>').join('')
      + '</select></td>'
      + '</tr>').join('');
  } catch(e) {}
}

async function updateOrderStatus(id, status) {
  try {
    const r = await fetch('/api/admin/orders/' + id + '/status', { method:'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ status }) });
    const d = await r.json();
    if (d.success) showToast('Durum güncellendi');
    else showToast(d.message || 'Hata', true);
  } catch(e) {}
}

// ── Settings ──────────────────────────────────────────────────────
async function loadSettings() {
  try {
    const r = await fetch('/api/admin/settings');
    const d = await r.json();
    if (d.settings) {
      document.getElementById('set-site-name').value = d.settings.site_name || '';
      document.getElementById('set-announcement').value = d.settings.announcement || '';
      document.getElementById('set-shipping').value = d.settings.free_shipping_threshold || '';
      document.getElementById('set-instagram').value = d.settings.instagram || '';
      document.getElementById('set-email').value = d.settings.email || '';
    }
  } catch(e) {}
}

function setupSettingsForms() {
  document.getElementById('siteSettingsForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const settings = {
      site_name: document.getElementById('set-site-name').value,
      announcement: document.getElementById('set-announcement').value,
      free_shipping_threshold: document.getElementById('set-shipping').value,
      instagram: document.getElementById('set-instagram').value,
      email: document.getElementById('set-email').value,
    };
    try {
      const r = await fetch('/api/admin/settings', { method:'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ settings }) });
      const d = await r.json();
      showToast(d.success ? 'Ayarlar kaydedildi' : (d.message || 'Hata'), !d.success);
    } catch(e) { showToast('Sunucu hatası', true); }
  });

  document.getElementById('passwordForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const cur = document.getElementById('cur-pass').value;
    const nw = document.getElementById('new-pass').value;
    const nw2 = document.getElementById('new-pass2').value;
    const errEl = document.getElementById('passError');
    if (nw !== nw2) { errEl.textContent = 'Yeni şifreler eşleşmiyor'; return; }
    if (nw.length < 4) { errEl.textContent = 'Şifre en az 4 karakter olmalı'; return; }
    errEl.textContent = '';
    try {
      const r = await fetch('/api/admin/password', { method:'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ current_password: cur, new_password: nw }) });
      const d = await r.json();
      if (d.success) { showToast('Şifre değiştirildi'); e.target.reset(); }
      else { errEl.textContent = d.message || 'Hata'; }
    } catch(e) { errEl.textContent = 'Sunucu hatası'; }
  });
}

// ── Toast ─────────────────────────────────────────────────────────
function showToast(msg, isError) {
  const t = document.getElementById('adminToast');
  t.textContent = msg;
  t.className = 'toast' + (isError ? ' error' : '');
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3000);
}

// ── Helpers ───────────────────────────────────────────────────────
function esc(s) { return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

// ── Users ─────────────────────────────────────────────────────────
async function loadUsers() {
  try {
    const r = await fetch('/api/admin/users');
    const d = await r.json();
    const tbody = document.getElementById('usersTableBody');
    if (!d.users || !d.users.length) { tbody.innerHTML = '<tr><td colspan="7" class="table-empty">Henuz kayitli kullanici yok</td></tr>'; return; }
    tbody.innerHTML = d.users.map(u => '<tr>'
      + '<td><strong>' + esc((u.name||'') + ' ' + (u.surname||'')) + '</strong></td>'
      + '<td>' + esc(u.email) + '</td>'
      + '<td>' + esc(u.phone||'-') + '</td>'
      + '<td>' + esc(u.city||'-') + (u.district ? ' / ' + esc(u.district) : '') + '</td>'
      + '<td>' + (u.orders ? u.orders.length : 0) + ' siparis</td>'
      + '<td style="color:#666;font-size:12px">' + new Date(u.created_at).toLocaleDateString('tr-TR') + '</td>'
      + '<td><button class="btn-edit" onclick="showUserDetail(\'' + u.id + '\')">Detay</button></td>'
      + '</tr>').join('');
  } catch(e) {}
}

async function showUserDetail(id) {
  try {
    const r = await fetch('/api/admin/users/' + id);
    const d = await r.json();
    if (!d.success) return;
    const u = d.user;
    const statusLabels = { pending:'Bekliyor', processing:'Isleniyor', shipped:'Kargoda', delivered:'Teslim', cancelled:'Iptal' };
    const actionLabels = { register:'Kayit', login:'Giris', logout:'Cikis', cart_add:'Sepete Ekle', cart_remove:'Sepetten Cikar', order_placed:'Siparis Verdi' };

    document.getElementById('userDetailTitle').textContent = (u.name||'') + ' ' + (u.surname||'') + ' — ' + u.email;
    document.getElementById('userDetailContent').innerHTML =
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:24px">'
      + '<div><div style="font-size:11px;color:#666;text-transform:uppercase;margin-bottom:4px">Telefon</div><div>' + esc(u.phone||'-') + '</div></div>'
      + '<div><div style="font-size:11px;color:#666;text-transform:uppercase;margin-bottom:4px">Sehir / Ilce</div><div>' + esc((u.city||'-') + (u.district?' / '+u.district:'')) + '</div></div>'
      + '<div style="grid-column:span 2"><div style="font-size:11px;color:#666;text-transform:uppercase;margin-bottom:4px">Adres</div><div>' + esc(u.address||'-') + '</div></div>'
      + '</div>'
      + '<h4 style="margin-bottom:12px;font-size:14px">Siparisler (' + u.orders.length + ')</h4>'
      + (u.orders.length ? '<table class="admin-table" style="margin-bottom:24px"><thead><tr><th>ID</th><th>Toplam</th><th>Durum</th><th>Tarih</th></tr></thead><tbody>'
        + u.orders.map(o => '<tr><td><code style="font-size:11px">' + o.id + '</code></td><td>₺' + Number(o.total).toLocaleString('tr-TR') + '</td><td><span class="status status-' + o.status + '">' + (statusLabels[o.status]||o.status) + '</span></td><td style="font-size:12px;color:#666">' + new Date(o.created_at).toLocaleString('tr-TR') + '</td></tr>').join('')
        + '</tbody></table>' : '<p style="color:#666;margin-bottom:24px">Siparis yok</p>')
      + '<h4 style="margin-bottom:12px;font-size:14px">Aktivite Gecmisi</h4>'
      + (u.activity.length ? '<div style="display:flex;flex-direction:column;gap:8px">'
        + u.activity.map(a => {
            let dataStr = '';
            try { const dd = JSON.parse(a.data||'{}'); dataStr = Object.entries(dd).map(([k,v])=>k+': '+v).join(', '); } catch{}
            return '<div style="display:flex;justify-content:space-between;padding:8px;background:#0a0a0a;border-radius:6px;font-size:13px"><span><strong>' + (actionLabels[a.action]||a.action) + '</strong>' + (dataStr?' — <span style="color:#666">'+dataStr+'</span>':'') + '</span><span style="color:#444;font-size:11px">' + new Date(a.created_at).toLocaleString('tr-TR') + '</span></div>';
          }).join('')
        + '</div>' : '<p style="color:#666">Aktivite yok</p>');

    document.getElementById('userDetailModal').classList.add('open');
    document.getElementById('userDetailOverlay').classList.add('open');
  } catch(e) {}
}

function closeUserDetail() {
  document.getElementById('userDetailModal').classList.remove('open');
  document.getElementById('userDetailOverlay').classList.remove('open');
}

// ── Discounts ─────────────────────────────────────────────────────
async function loadDiscounts() {
  try {
    const r = await fetch('/api/admin/discounts');
    const d = await r.json();
    const tbody = document.getElementById('discountsTableBody');
    if (!d.codes || !d.codes.length) { tbody.innerHTML = '<tr><td colspan="7" class="table-empty">Indirim kodu yok</td></tr>'; return; }
    tbody.innerHTML = d.codes.map(c => '<tr>'
      + '<td><strong style="letter-spacing:.1em">' + c.code + '</strong></td>'
      + '<td>' + (c.type==='percent'?'Yuzde':'Sabit') + '</td>'
      + '<td>' + (c.type==='percent'?c.value+'%':'₺'+c.value) + '</td>'
      + '<td>' + (c.min_order>0?'₺'+c.min_order:'-') + '</td>'
      + '<td>' + c.used_count + (c.max_uses>0?' / '+c.max_uses:' / Sinirsiz') + '</td>'
      + '<td><span class="status ' + (c.active?'status-delivered':'status-cancelled') + '">' + (c.active?'Aktif':'Pasif') + '</span></td>'
      + '<td><div class="btn-actions"><button class="btn-edit" onclick="toggleDiscount(\'' + c.id + '\',' + (c.active?0:1) + ')">' + (c.active?'Pasif Yap':'Aktif Yap') + '</button><button class="btn-delete" onclick="deleteDiscount(\'' + c.id + '\',\'' + c.code + '\')">Sil</button></div></td>'
      + '</tr>').join('');
  } catch(e) {}
}

document.addEventListener('DOMContentLoaded', () => {
  const addDiscBtn = document.getElementById('addDiscountBtn');
  if (addDiscBtn) addDiscBtn.addEventListener('click', () => {
    document.getElementById('discountModal').classList.add('open');
    document.getElementById('discountModalOverlay').classList.add('open');
  });

  const discForm = document.getElementById('discountForm');
  if (discForm) discForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const body = {
      code: document.getElementById('dc-code').value.toUpperCase(),
      type: document.getElementById('dc-type').value,
      value: document.getElementById('dc-value').value,
      min_order: document.getElementById('dc-min').value || 0,
      max_uses: document.getElementById('dc-max').value || 0,
    };
    try {
      const r = await fetch('/api/admin/discounts', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body) });
      const d = await r.json();
      if (d.success) { showToast('Indirim kodu eklendi'); closeDiscountModal(); loadDiscounts(); }
      else showToast(d.message||'Hata', true);
    } catch(e) { showToast('Sunucu hatasi', true); }
  });
});

async function toggleDiscount(id, active) {
  try {
    await fetch('/api/admin/discounts/' + id, { method:'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ active }) });
    loadDiscounts();
  } catch(e) {}
}

async function deleteDiscount(id, code) {
  if (!confirm(code + ' silinsin mi?')) return;
  try {
    await fetch('/api/admin/discounts/' + id, { method:'DELETE' });
    showToast('Silindi'); loadDiscounts();
  } catch(e) {}
}

function closeDiscountModal() {
  document.getElementById('discountModal').classList.remove('open');
  document.getElementById('discountModalOverlay').classList.remove('open');
}
