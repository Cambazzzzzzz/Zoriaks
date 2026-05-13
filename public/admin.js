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
  loadTickets();
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
  if (!collectionsCache.length) { tbody.innerHTML = '<tr><td colspan="7" class="table-empty">Koleksiyon yok</td></tr>'; return; }
  tbody.innerHTML = collectionsCache.map(c => {
    const layoutLabel = c.card_layout === 'large' ? 'Genis' : 'Normal';
    return '<tr>'
      + '<td>' + (c.sort_order != null ? c.sort_order : 0) + '</td>'
      + '<td><code style="font-size:11px;color:#666">' + esc(c.id) + '</code></td>'
      + '<td><strong>' + esc(c.name) + '</strong></td>'
      + '<td><code style="font-size:12px;color:#888">' + esc(c.slug) + '</code></td>'
      + '<td>' + layoutLabel + '</td>'
      + '<td style="color:#666;max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + esc(c.description || '') + '</td>'
      + '<td><div class="btn-actions">'
      + '<a class="btn-edit" href="/koleksiyon/' + encodeURIComponent(c.slug || c.id) + '" target="_blank" rel="noopener" style="text-decoration:none;display:inline-flex;align-items:center;margin-right:4px">Site</a>'
      + '<button class="btn-edit" onclick="editCollection(\'' + c.id + '\')">Duzenle</button>'
      + '<button class="btn-delete" onclick="deleteCollection(\'' + c.id + '\',\'' + esc(c.name) + '\')">Sil</button></div></td>'
      + '</tr>';
  }).join('');
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
  document.getElementById('c-sort').value = '0';
  document.getElementById('c-layout').value = 'normal';
  openCollectionModal();
});

function editCollection(id) {
  const c = collectionsCache.find(x => x.id === id);
  if (!c) return;
  document.getElementById('collectionModalTitle').textContent = 'Koleksiyonu Duzenle';
  document.getElementById('collectionId').value = c.id;
  document.getElementById('c-name').value = c.name;
  document.getElementById('c-desc').value = c.description || '';
  document.getElementById('c-slug').value = c.slug || '';
  document.getElementById('c-sort').value = c.sort_order != null ? c.sort_order : 0;
  document.getElementById('c-layout').value = c.card_layout === 'large' ? 'large' : 'normal';
  document.getElementById('c-overlay').value = c.overlay_text || '';
  document.getElementById('c-image').value = c.image_url || '';
  document.getElementById('c-gradient').value = c.gradient || '';
  openCollectionModal();
}

function setupCollectionForm() {
  document.getElementById('collectionForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('collectionId').value;
    const body = {
      name: document.getElementById('c-name').value,
      description: document.getElementById('c-desc').value,
      slug: document.getElementById('c-slug').value.trim(),
      sort_order: document.getElementById('c-sort').value,
      card_layout: document.getElementById('c-layout').value,
      overlay_text: document.getElementById('c-overlay').value.trim(),
      image_url: document.getElementById('c-image').value.trim(),
      gradient: document.getElementById('c-gradient').value.trim(),
    };
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
let seasonTemplatesCache = [];

async function loadProducts(search) {
  try {
    const url = search ? '/api/admin/products?search=' + encodeURIComponent(search) : '/api/admin/products';
    const r = await fetch(url);
    const d = await r.json();
    allProductsCache = d.products || [];
    renderProductsTable(allProductsCache);
  } catch(e) {}
  await loadSeasonTemplates();
}

async function loadSeasonTemplates() {
  const mount = document.getElementById('seasonTemplatesMount');
  if (!mount) return;
  try {
    const r = await fetch('/api/admin/season-templates');
    const d = await r.json();
    if (!d.success) {
      mount.innerHTML = '<p style="color:#888">Sablonlar yuklenemedi.</p>';
      return;
    }
    seasonTemplatesCache = d.templates || [];
    renderSeasonTemplates();
  } catch (e) {
    mount.innerHTML = '<p style="color:#888">Sablonlar yuklenemedi.</p>';
  }
}

function renderSeasonTemplates() {
  const mount = document.getElementById('seasonTemplatesMount');
  if (!mount) return;
  const anyActive = seasonTemplatesCache.some(function (t) { return t.is_active; });
  let radios = '<div class="form-group"><label>Sitede hangi sablon aktif?</label><div style="display:flex;flex-wrap:wrap;gap:12px;margin-top:8px">';
  radios += '<label style="display:flex;align-items:center;gap:6px;font-weight:400"><input type="radio" name="nexo-active-tpl" value=""' + (!anyActive ? ' checked' : '') + '/> Hicbiri (tum aktif urunler)</label>';
  seasonTemplatesCache.forEach(function (t) {
    radios += '<label style="display:flex;align-items:center;gap:6px;font-weight:400"><input type="radio" name="nexo-active-tpl" value="' + esc(t.id) + '"' + (t.is_active ? ' checked' : '') + '/> ' + esc(t.name) + '</label>';
  });
  radios += '</div><button type="button" class="btn-save" style="margin-top:10px" onclick="saveSeasonActiveTemplate()">Aktif sablonu kaydet</button></div>';

  const cards = seasonTemplatesCache.map(function (t) {
    const checks = (allProductsCache || []).map(function (p) {
      const checked = (t.product_ids || []).indexOf(p.id) !== -1 ? ' checked' : '';
      return '<label style="display:flex;align-items:center;gap:8px;padding:4px 0;font-size:13px;font-weight:400"><input type="checkbox" class="tpl-chk-' + t.id + '" value="' + esc(p.id) + '"' + checked + '/> ' + esc(p.name) + '</label>';
    }).join('');
    return '<div style="border:1px solid #2a2a2a;border-radius:8px;padding:16px;margin-top:12px;background:#0f0f0f">'
      + '<div style="display:flex;flex-wrap:wrap;justify-content:space-between;gap:12px;align-items:center;margin-bottom:10px">'
      + '<strong>' + esc(t.name) + '</strong><code style="font-size:11px;color:#666">' + esc(t.code) + '</code></div>'
      + '<div class="form-group"><label>Sablon adi</label><div style="display:flex;gap:8px"><input type="text" id="tpl-rename-' + t.id + '" value="' + esc(t.name) + '" style="flex:1"/>'
      + '<button type="button" class="btn-edit" onclick="saveSeasonTemplateName(\'' + t.id.replace(/'/g, "\\'") + '\')">Ismi kaydet</button></div></div>'
      + '<div class="form-group"><label>Bu sablona ait urunler</label>'
      + '<div style="max-height:220px;overflow:auto;border:1px solid #2a2a2a;border-radius:6px;padding:10px">' + (checks || '<span style="color:#666">Once urunleri yukleyin.</span>') + '</div></div>'
      + '<button type="button" class="btn-save" onclick="saveSeasonTemplateProducts(\'' + t.id.replace(/'/g, "\\'") + '\')">Urun listesini kaydet</button>'
      + '</div>';
  }).join('');
  mount.innerHTML = radios + cards;
}

async function saveSeasonActiveTemplate() {
  const el = document.querySelector('input[name="nexo-active-tpl"]:checked');
  const template_id = el && el.value ? el.value : null;
  try {
    const r = await fetch('/api/admin/season-templates/active', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ template_id: template_id }) });
    const d = await r.json();
    showToast(d.success ? (d.message || 'Kaydedildi') : (d.message || 'Hata'), !d.success);
    if (d.success) await loadSeasonTemplates();
  } catch (e) { showToast('Sunucu hatasi', true); }
}

async function saveSeasonTemplateName(id) {
  const inp = document.getElementById('tpl-rename-' + id);
  const name = inp ? inp.value : '';
  try {
    const r = await fetch('/api/admin/season-templates/' + encodeURIComponent(id), { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: name }) });
    const d = await r.json();
    showToast(d.success ? 'Isim guncellendi' : (d.message || 'Hata'), !d.success);
    if (d.success) await loadSeasonTemplates();
  } catch (e) { showToast('Sunucu hatasi', true); }
}

async function saveSeasonTemplateProducts(id) {
  const boxes = document.querySelectorAll('.tpl-chk-' + id);
  const product_ids = [];
  boxes.forEach(function (b) { if (b.checked) product_ids.push(b.value); });
  try {
    const r = await fetch('/api/admin/season-templates/' + encodeURIComponent(id) + '/products', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ product_ids: product_ids }) });
    const d = await r.json();
    showToast(d.success ? (d.message || 'Kaydedildi') : (d.message || 'Hata'), !d.success);
    if (d.success) await loadSeasonTemplates();
  } catch (e) { showToast('Sunucu hatasi', true); }
}

function renderProductsTable(products) {
  const tbody = document.getElementById('productsTableBody');
  if (!products || !products.length) { tbody.innerHTML = '<tr><td colspan="9" class="table-empty">Urun bulunamadi</td></tr>'; return; }
  tbody.innerHTML = products.map(p => {
    const stockLabel = p.stock_unlimited ? 'Sinirsiz' : (p.stock_status === 'out_of_stock' ? '<span style="color:#ff4444">Stokta Yok</span>' : (p.stock !== null ? p.stock : '-'));
    const colName = collectionsCache.find(c => c.id === p.collection);
    const thumb = p.images && p.images[0] ? '<img src="' + p.images[0] + '" style="width:40px;height:40px;object-fit:cover;border-radius:6px;border:1px solid #2a2a2a">' : '<div style="width:40px;height:40px;background:#1a1a1a;border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:10px;color:#444">N</div>';
    const isActive = p.active !== false;
    const vitrinBtn = '<button type="button" class="' + (isActive ? 'btn-edit' : 'btn-delete') + '" onclick="toggleProductActive(\'' + p.id + '\',' + (isActive ? 'false' : 'true') + ')">' + (isActive ? 'Aktif' : 'Pasif') + '</button>';
    return '<tr>'
      + '<td>' + thumb + '</td>'
      + '<td><code style="font-size:11px;color:#666">' + p.id + '</code></td>'
      + '<td><strong>' + esc(p.name) + '</strong></td>'
      + '<td>' + esc(p.category) + '</td>'
      + '<td>' + esc(colName ? colName.name : p.collection) + '</td>'
      + '<td>₺' + Number(p.price).toLocaleString('tr-TR') + '</td>'
      + '<td>' + stockLabel + '</td>'
      + '<td>' + vitrinBtn + '</td>'
      + '<td><div class="btn-actions"><button class="btn-edit" onclick="editProduct(\'' + p.id + '\')">Duzenle</button><button class="btn-delete" onclick="deleteProduct(\'' + p.id + '\',\'' + esc(p.name) + '\')">Sil</button></div></td>'
      + '</tr>';
  }).join('');
}

async function toggleProductActive(id, makeActive) {
  try {
    const r = await fetch('/api/admin/products/' + id + '/active', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: makeActive === true || makeActive === 'true' })
    });
    const d = await r.json();
    if (d.success) { showToast('Urun durumu guncellendi'); loadProducts(document.getElementById('productSearch') && document.getElementById('productSearch').value); }
    else showToast(d.message || 'Hata', true);
  } catch(e) { showToast('Sunucu hatasi', true); }
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
  document.getElementById('p-active').checked = true;
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
    document.getElementById('p-active').checked = p.active !== false;
    document.getElementById('p-keep-images').checked = true;
    document.getElementById('p-slug').value = p.slug || '';
    document.getElementById('p-slug-msg').textContent = p.slug ? location.origin + '/urun/' + p.slug : '';
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
    formData.append('active', document.getElementById('p-active').checked ? '1' : '0');
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

    document.getElementById('oe-slug').value = o.custom_slug || '';
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
}

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
    const st = document.getElementById('set-site-status');
    if (st) st.value = s.site_status === 'closed' ? 'closed' : 'open';
    const scm = document.getElementById('set-site-closed-message');
    if (scm) scm.value = s.site_closed_message || '';
    document.getElementById('set-shipping').value = s.free_shipping_threshold || '';
    document.getElementById('set-shipping-cost').value = s.shipping_cost || '49.90';
    document.getElementById('set-free-ship-all').checked = s.free_shipping_all === '1';
    document.getElementById('set-instagram').value = s.instagram || '';
    document.getElementById('set-email').value = s.email || '';
    document.getElementById('set-ann-enabled').value = s.announcement_enabled || '1';
    document.getElementById('set-announcement').value = s.announcement || '';
    document.getElementById('set-ann-speed').value = s.announcement_speed || '30';
    document.getElementById('set-ann-bg').value = s.announcement_bg || '#000000';
    document.getElementById('set-ann-bg-text').value = s.announcement_bg || '#000000';
    document.getElementById('set-ann-color').value = s.announcement_color || '#ffffff';
    document.getElementById('set-ann-color-text').value = s.announcement_color || '#ffffff';
    document.getElementById('set-marquee-enabled').value = s.marquee_enabled || '1';
    document.getElementById('set-marquee-speed').value = s.marquee_speed || '20';
    document.getElementById('set-marquee-line').value = s.marquee_line || '';
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

  document.getElementById('marqueeForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const settings = {
      marquee_enabled: document.getElementById('set-marquee-enabled').value,
      marquee_speed: document.getElementById('set-marquee-speed').value,
      marquee_line: document.getElementById('set-marquee-line').value,
    };
    await saveSettings(settings);
  });

  document.getElementById('siteSettingsForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const settings = {
      site_name: document.getElementById('set-site-name').value,
      site_status: document.getElementById('set-site-status').value,
      site_closed_message: document.getElementById('set-site-closed-message').value,
      free_shipping_threshold: document.getElementById('set-shipping').value,
      free_shipping_all: document.getElementById('set-free-ship-all').checked ? '1' : '0',
      shipping_cost: document.getElementById('set-shipping-cost').value,
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

// ── Tickets ───────────────────────────────────────────────────────
async function loadTickets(search) {
  try {
    const url = search ? '/api/admin/tickets?search=' + encodeURIComponent(search) : '/api/admin/tickets';
    const r = await fetch(url);
    const d = await r.json();
    const tbody = document.getElementById('ticketsTableBody');
    if (!d.tickets || !d.tickets.length) { tbody.innerHTML = '<tr><td colspan="6" class="table-empty">Talep bulunamadi</td></tr>'; return; }
    const statusLabels = { open:'Acik', answered:'Cevaplandi', closed:'Kapandi' };
    const statusClass = { open:'status-pending', answered:'status-delivered', closed:'status-cancelled' };
    tbody.innerHTML = d.tickets.map(t => '<tr>'
      + '<td><code style="font-size:11px;color:#666">' + t.id + '</code></td>'
      + '<td>' + esc(t.user_name||'Misafir') + '<br><small style="color:#666">' + esc(t.user_email||'') + '</small></td>'
      + '<td>' + esc(t.subject||'') + '</td>'
      + '<td><span class="status ' + (statusClass[t.status]||'status-pending') + '">' + (statusLabels[t.status]||t.status) + '</span></td>'
      + '<td style="color:#666;font-size:12px">' + new Date(t.created_at).toLocaleString('tr-TR') + '</td>'
      + '<td><div class="btn-actions"><button class="btn-edit" onclick="openTicketReply(\'' + t.id + '\')">Goruntule / Cevapla</button><button class="btn-delete" onclick="deleteTicket(\'' + t.id + '\')">Sil</button></div></td>'
      + '</tr>').join('');
  } catch(e) {}
}

async function openTicketReply(id) {
  try {
    const r = await fetch('/api/admin/tickets?search=' + id);
    const d = await r.json();
    const ticket = d.tickets && d.tickets.find(t => t.id === id);
    if (!ticket) return;
    document.getElementById('ticketReplyId').value = ticket.id;
    document.getElementById('ticketReplyTitle').textContent = '#' + ticket.id + ' — ' + (ticket.subject||'');
    document.getElementById('ticketReplyContent').innerHTML =
      '<div style="margin-bottom:8px"><strong>' + esc(ticket.user_name||'Misafir') + '</strong> <span style="color:#666;font-size:12px">' + esc(ticket.user_email||'') + '</span></div>'
      + '<div>' + esc(ticket.message||'') + '</div>'
      + (ticket.admin_reply ? '<div style="margin-top:12px;padding-top:12px;border-top:1px solid #1f1f1f"><div style="font-size:11px;color:#4ade80;margin-bottom:4px">MEVCUT CEVAP</div>' + esc(ticket.admin_reply) + '</div>' : '');
    document.getElementById('ticketReplyText').value = ticket.admin_reply || '';
    document.getElementById('ticketReplyStatus').value = ticket.status || 'open';
    document.getElementById('ticketReplyModal').classList.add('open');
    document.getElementById('ticketReplyOverlay').classList.add('open');
  } catch(e) {}
}

async function saveTicketReply() {
  const id = document.getElementById('ticketReplyId').value;
  const body = {
    admin_reply: document.getElementById('ticketReplyText').value,
    status: document.getElementById('ticketReplyStatus').value,
  };
  try {
    const r = await fetch('/api/admin/tickets/' + encodeURIComponent(id), { method:'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body) });
    const text = await r.text();
    let d;
    try { d = JSON.parse(text); } catch (e) {
      showToast('Sunucu yaniti gecersiz (' + r.status + ')', true);
      return;
    }
    if (d.success) { showToast('Cevap kaydedildi'); closeTicketReply(); loadTickets(); }
    else showToast(d.message || 'Hata', true);
  } catch(e) { showToast('Sunucu hatasi', true); }
}

async function deleteTicket(id) {
  if (!confirm('Bu talep silinsin mi?')) return;
  try {
    const r = await fetch('/api/admin/tickets/' + id, { method:'DELETE' });
    const d = await r.json();
    if (d.success) { showToast('Talep silindi'); loadTickets(); }
    else showToast(d.message || 'Hata', true);
  } catch(e) {}
}

function closeTicketReply() {
  document.getElementById('ticketReplyModal').classList.remove('open');
  document.getElementById('ticketReplyOverlay').classList.remove('open');
}

async function saveOrderSlug() {
  const id = document.getElementById('orderEditId').value;
  const slug = document.getElementById('oe-slug').value.trim();
  const msgEl = document.getElementById('oe-slug-msg');
  try {
    const r = await fetch('/api/admin/orders/' + id + '/slug', { method:'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ slug }) });
    const d = await r.json();
    if (d.success) {
      msgEl.style.color = '#4ade80';
      msgEl.textContent = 'Kaydedildi: ' + location.origin + '/siparis/' + d.slug;
      document.getElementById('oe-slug').value = d.slug;
    } else {
      msgEl.style.color = '#ff4444';
      msgEl.textContent = d.message || 'Hata';
    }
  } catch(e) { msgEl.style.color = '#ff4444'; msgEl.textContent = 'Sunucu hatasi'; }
}

function copyAdminOrderUrl() {
  const id = document.getElementById('orderEditId').value;
  const slug = document.getElementById('oe-slug').value.trim() || id;
  const url = location.origin + '/siparis/' + slug;
  navigator.clipboard.writeText(url).then(() => {
    showToast('URL kopyalandi: ' + url);
  }).catch(() => {
    prompt('URL:', url);
  });
}

async function saveProductSlug() {
  const id = document.getElementById('productId').value;
  if (!id) { showToast('Once urunu kaydedin', true); return; }
  const slug = document.getElementById('p-slug').value.trim();
  const msgEl = document.getElementById('p-slug-msg');
  try {
    const r = await fetch('/api/admin/products/' + id + '/slug', { method:'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ slug }) });
    const d = await r.json();
    if (d.success) {
      msgEl.style.color = '#4ade80';
      msgEl.textContent = location.origin + '/urun/' + d.slug;
      document.getElementById('p-slug').value = d.slug;
    } else {
      msgEl.style.color = '#ff4444';
      msgEl.textContent = d.message || 'Hata';
    }
  } catch(e) { msgEl.style.color = '#ff4444'; msgEl.textContent = 'Sunucu hatasi'; }
}

function copyProductUrl() {
  const id = document.getElementById('productId').value;
  const slug = document.getElementById('p-slug').value.trim() || id;
  if (!slug) { showToast('Slug yok', true); return; }
  const url = location.origin + '/urun/' + slug;
  navigator.clipboard.writeText(url).then(() => showToast('URL kopyalandi!')).catch(() => prompt('URL:', url));
}
