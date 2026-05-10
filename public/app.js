// ── NEXO Frontend App ────────────────────────────────────────────
let cart = JSON.parse(localStorage.getItem('nexo_cart') || '[]');
let allProducts = [];
let currentFilter = 'all';
let visibleCount = 8;
const LOAD_MORE = 8;

document.addEventListener('DOMContentLoaded', async () => {
  await loadSettings();
  await loadProducts();
  await checkAuth();
  setupNavbar();
  setupCart();
  setupSearch();
  setupMobileMenu();
  setupFilterTabs();
  setupModal();
  setupAuth();
  updateCartUI();
});

async function loadSettings() {
  try {
    const r = await fetch('/api/settings');
    const d = await r.json();
    if (!d.settings) return;
    const s = d.settings;

    // Announcement bar
    const bar = document.querySelector('.announcement-bar');
    const track = document.querySelector('.announcement-track');
    if (bar && track) {
      if (s.announcement_enabled === '0') {
        bar.style.display = 'none';
      } else {
        bar.style.display = '';
        if (s.announcement_bg) bar.style.background = s.announcement_bg;
        if (s.announcement_color) bar.style.color = s.announcement_color;
        if (s.announcement) track.innerHTML = s.announcement + '   ' + s.announcement;
        if (s.announcement_speed) {
          track.style.animationDuration = s.announcement_speed + 's';
        }
      }
    }
  } catch(e) {}
}

async function loadProducts() {
  try {
    const r = await fetch('/api/products');
    const d = await r.json();
    allProducts = d.products || [];
    renderProducts();
  } catch(e) {
    const grid = document.getElementById('productsGrid');
    if (grid) grid.innerHTML = '<p class="no-products">Sunucu baglantisi kurulamadi.</p>';
  }
}

function renderProducts() {
  const grid = document.getElementById('productsGrid');
  if (!grid) return;
  const filtered = currentFilter === 'all' ? allProducts : allProducts.filter(p => p.category === currentFilter);
  const toShow = filtered.slice(0, visibleCount);
  const loadBtn = document.getElementById('loadMoreBtn');
  if (filtered.length === 0) {
    grid.innerHTML = '<p class="no-products">Bu kategoride urun bulunamadi.</p>';
    if (loadBtn) loadBtn.style.display = 'none';
    return;
  }
  grid.innerHTML = toShow.map(productCard).join('');
  if (loadBtn) loadBtn.style.display = filtered.length > visibleCount ? 'inline-flex' : 'none';
}

function productCard(p) {
  const img = p.images && p.images[0] ? '<img src="' + p.images[0] + '" alt="' + p.name + '" loading="lazy">' : '<div class="product-img-placeholder">N</div>';
  const badge = p.old_price ? '<span class="product-badge sale">INDIRIM</span>' : (p.featured ? '<span class="product-badge">YENI</span>' : '');
  const oldPrice = p.old_price ? '<span class="price-old">₺' + Number(p.old_price).toLocaleString('tr-TR') + '</span>' : '';
  return '<div class="product-card" onclick="openProduct(\'' + p.id + '\')">'
    + '<div class="product-img">' + img + badge + '</div>'
    + '<div class="product-info"><div class="product-cat">' + p.category + '</div>'
    + '<div class="product-name">' + p.name + '</div>'
    + '<div class="product-price"><span class="price-current">₺' + Number(p.price).toLocaleString('tr-TR') + '</span>' + oldPrice + '</div>'
    + '</div></div>';
}

function setupFilterTabs() {
  document.querySelectorAll('.filter-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-tab').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentFilter = btn.dataset.filter;
      visibleCount = LOAD_MORE;
      renderProducts();
    });
  });
  const loadBtn = document.getElementById('loadMoreBtn');
  if (loadBtn) loadBtn.addEventListener('click', () => { visibleCount += LOAD_MORE; renderProducts(); });
}

function setupModal() {
  const closeBtn = document.getElementById('closeModal');
  if (closeBtn) closeBtn.addEventListener('click', closeModal);

  // Keyboard navigation
  document.addEventListener('keydown', (e) => {
    const modal = document.getElementById('productModal');
    if (!modal.classList.contains('open')) return;
    if (e.key === 'Escape') closeModal();
    if (e.key === 'ArrowLeft') galleryPrev();
    if (e.key === 'ArrowRight') galleryNext();
  });
}

// ── Gallery state ─────────────────────────────────────────────────
let galleryImages = [];
let galleryIndex = 0;
let zoomActive = false;
let zoomScale = 1;
let zoomOrigin = { x: 50, y: 50 };

function gallerySet(index) {
  if (!galleryImages.length) return;
  galleryIndex = (index + galleryImages.length) % galleryImages.length;
  const mainImg = document.getElementById('galleryMain');
  if (mainImg) {
    mainImg.style.transform = 'scale(1)';
    mainImg.style.transformOrigin = '50% 50%';
    zoomActive = false;
    zoomScale = 1;
    mainImg.src = galleryImages[galleryIndex];
  }
  // Update thumbnails
  document.querySelectorAll('.gallery-thumb').forEach((t, i) => {
    t.classList.toggle('active', i === galleryIndex);
  });
}

function galleryPrev() { gallerySet(galleryIndex - 1); }
function galleryNext() { gallerySet(galleryIndex + 1); }

function setupZoom(imgEl) {
  imgEl.addEventListener('click', (e) => {
    if (!zoomActive) {
      const rect = imgEl.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      imgEl.style.transformOrigin = x + '% ' + y + '%';
      imgEl.style.transform = 'scale(2.5)';
      imgEl.style.cursor = 'zoom-out';
      zoomActive = true;
    } else {
      imgEl.style.transform = 'scale(1)';
      imgEl.style.transformOrigin = '50% 50%';
      imgEl.style.cursor = 'zoom-in';
      zoomActive = false;
    }
  });

  imgEl.addEventListener('mousemove', (e) => {
    if (!zoomActive) return;
    const rect = imgEl.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    imgEl.style.transformOrigin = x + '% ' + y + '%';
  });
}

async function openProduct(id) {
  try {
    const r = await fetch('/api/products/' + id);
    const d = await r.json();
    if (!d.success) return;
    const p = d.product;

    galleryImages = (p.images && p.images.length) ? p.images : [];
    galleryIndex = 0;
    zoomActive = false;

    // Main image area
    const mainImgHtml = galleryImages.length
      ? '<img id="galleryMain" src="' + galleryImages[0] + '" alt="' + p.name + '" style="cursor:zoom-in;transition:transform .2s">'
      : '<div class="modal-img-placeholder">N</div>';

    // Thumbnails
    const thumbsHtml = galleryImages.length > 1
      ? '<div class="gallery-thumbs">' + galleryImages.map((img, i) =>
          '<button class="gallery-thumb' + (i === 0 ? ' active' : '') + '" onclick="gallerySet(' + i + ')">'
          + '<img src="' + img + '" alt=""/></button>'
        ).join('') + '</div>'
      : '';

    // Nav arrows
    const arrowsHtml = galleryImages.length > 1
      ? '<button class="gallery-arrow gallery-prev" onclick="galleryPrev()"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg></button>'
        + '<button class="gallery-arrow gallery-next" onclick="galleryNext()"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg></button>'
      : '';

    const sizes = (p.sizes || ['S','M','L','XL','XXL']).map(s => '<button class="size-btn" onclick="selectSize(this)">' + s + '</button>').join('');
    const oldPrice = p.old_price ? '<span class="modal-old-price">₺' + Number(p.old_price).toLocaleString('tr-TR') + '</span>' : '';

    const stockBadge = p.stock_status === 'out_of_stock'
      ? '<div class="modal-stock out">Stokta Yok</div>'
      : (p.stock_unlimited ? '' : (p.stock !== null && p.stock <= 5 && p.stock > 0 ? '<div class="modal-stock low">Son ' + p.stock + ' urun</div>' : ''));

    document.getElementById('modalContent').innerHTML =
      '<div class="modal-gallery">'
      + '<div class="gallery-main-wrap">'
      + arrowsHtml
      + '<div class="gallery-main-img">' + mainImgHtml + '</div>'
      + '</div>'
      + thumbsHtml
      + '</div>'
      + '<div class="modal-details">'
      + '<div class="modal-cat">' + p.category + '</div>'
      + '<div class="modal-name">' + p.name + '</div>'
      + '<div class="modal-price">₺' + Number(p.price).toLocaleString('tr-TR') + oldPrice + '</div>'
      + stockBadge
      + '<div class="modal-desc">' + (p.description || '') + '</div>'
      + '<div class="size-label">Beden Sec</div>'
      + '<div class="size-options">' + sizes + '</div>'
      + '<div class="modal-actions">'
      + (p.stock_status === 'out_of_stock'
        ? '<button class="btn-primary full-width" disabled style="opacity:.4;cursor:not-allowed">Stokta Yok</button>'
        : '<button class="btn-primary full-width" onclick="addToCartModal(\'' + p.id + '\',\'' + p.name.replace(/'/g,"\\'") + '\',' + p.price + ',\'' + (galleryImages[0] || '') + '\')">Sepete Ekle</button>')
      + '</div>'
      + '</div>';

    // Setup zoom on main image
    const mainImg = document.getElementById('galleryMain');
    if (mainImg) setupZoom(mainImg);

    document.getElementById('productModal').classList.add('open');
    document.getElementById('modalOverlay').classList.add('open');
    document.body.style.overflow = 'hidden';
  } catch(e) { console.error(e); }
}

function closeModal() {
  document.getElementById('productModal').classList.remove('open');
  document.getElementById('modalOverlay').classList.remove('open');
  document.body.style.overflow = '';
}

function selectSize(btn) {
  document.querySelectorAll('.size-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
}

function addToCartModal(id, name, price, img) {
  const active = document.querySelector('.size-btn.active');
  addToCart({ id, name, price, image: img, size: active ? active.textContent : 'M' });
  closeModal();
}

function setupCart() {
  document.getElementById('cartBtn').addEventListener('click', openCart);
  document.getElementById('closeCart').addEventListener('click', closeCart);
}

function openCart() {
  document.getElementById('cartDrawer').classList.add('open');
  document.getElementById('cartOverlay').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeCart() {
  document.getElementById('cartDrawer').classList.remove('open');
  document.getElementById('cartOverlay').classList.remove('open');
  document.body.style.overflow = '';
}

function addToCart(item) {
  if (!currentUser) {
    openAuthModal();
    showToast('Sepete eklemek icin giris yapiniz');
    return;
  }
  fetch('/api/cart/log', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ action:'cart_add', product_id: item.id, product_name: item.name, size: item.size }) }).catch(()=>{});
  const existing = cart.find(c => c.id === item.id && c.size === item.size);
  if (existing) existing.qty = (existing.qty || 1) + 1;
  else cart.push({ ...item, qty: 1 });
  saveCart(); updateCartUI();
  showToast(item.name + ' sepete eklendi!');
  openCart();
}

function removeFromCart(id, size) {
  const item = cart.find(c => c.id === id && c.size === size);
  if (item) fetch('/api/cart/log', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ action:'cart_remove', product_id: id, product_name: item.name, size }) }).catch(()=>{});
  cart = cart.filter(c => !(c.id === id && c.size === size));
  saveCart(); updateCartUI();
}

function saveCart() { localStorage.setItem('nexo_cart', JSON.stringify(cart)); }

function updateCartUI() {
  const count = cart.reduce((s, c) => s + (c.qty || 1), 0);
  const countEl = document.getElementById('cartCount');
  if (countEl) { countEl.textContent = count; countEl.style.display = count > 0 ? 'flex' : 'none'; }
  const itemsEl = document.getElementById('cartItems');
  const footerEl = document.getElementById('cartFooter');
  if (!itemsEl) return;
  if (cart.length === 0) {
    itemsEl.innerHTML = '<div class="cart-empty"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg><p>Sepetiniz bos</p></div>';
    if (footerEl) footerEl.style.display = 'none';
    return;
  }
  itemsEl.innerHTML = cart.map(item => {
    const imgHtml = item.image ? '<img src="' + item.image + '" alt="' + item.name + '">' : '';
    return '<div class="cart-item"><div class="cart-item-img">' + imgHtml + '</div>'
      + '<div class="cart-item-info"><div class="cart-item-name">' + item.name + '</div>'
      + '<div class="cart-item-meta">Beden: ' + item.size + ' - Adet: ' + (item.qty||1) + '</div>'
      + '<div class="cart-item-price">₺' + Number(item.price * (item.qty||1)).toLocaleString('tr-TR') + '</div></div>'
      + '<button class="cart-item-remove" onclick="removeFromCart(\'' + item.id + '\',\'' + item.size + '\')">x</button></div>';
  }).join('');
  const total = cart.reduce((s, c) => s + c.price * (c.qty || 1), 0);
  const totalEl = document.getElementById('cartTotal');
  if (totalEl) totalEl.textContent = '₺' + Number(total).toLocaleString('tr-TR');
  if (footerEl) footerEl.style.display = 'block';
}

function setupNavbar() {
  window.addEventListener('scroll', () => {
    const nav = document.getElementById('navbar');
    if (nav) nav.classList.toggle('scrolled', window.scrollY > 60);
  });
}

function setupSearch() {
  const btn = document.getElementById('searchBtn');
  const overlay = document.getElementById('searchOverlay');
  const closeBtn = document.getElementById('closeSearch');
  const input = document.getElementById('searchInput');
  if (btn) btn.addEventListener('click', () => { overlay.classList.add('open'); setTimeout(() => input && input.focus(), 100); });
  if (closeBtn) closeBtn.addEventListener('click', () => overlay.classList.remove('open'));
  if (input) input.addEventListener('keydown', e => {
    if (e.key !== 'Enter') return;
    const q = input.value.trim().toLowerCase();
    if (!q) return;
    overlay.classList.remove('open');
    const results = allProducts.filter(p => p.name.toLowerCase().includes(q) || (p.description||'').toLowerCase().includes(q));
    const grid = document.getElementById('productsGrid');
    if (grid) grid.innerHTML = results.length ? results.map(productCard).join('') : '<p class="no-products">Sonuc bulunamadi.</p>';
    document.getElementById('products') && document.getElementById('products').scrollIntoView({ behavior: 'smooth' });
  });
}

function searchFor(term) {
  const input = document.getElementById('searchInput');
  if (input) { input.value = term; input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })); }
}

function setupMobileMenu() {
  const menuBtn = document.getElementById('menuBtn');
  const closeBtn = document.getElementById('closeMenu');
  if (menuBtn) menuBtn.addEventListener('click', () => {
    document.getElementById('mobileMenu').classList.add('open');
    document.getElementById('menuOverlay').classList.add('open');
    document.body.style.overflow = 'hidden';
  });
  if (closeBtn) closeBtn.addEventListener('click', closeMobileMenu);
}

function closeMobileMenu() {
  document.getElementById('mobileMenu').classList.remove('open');
  document.getElementById('menuOverlay').classList.remove('open');
  document.body.style.overflow = '';
}

// ── Auth ──────────────────────────────────────────────────────────
let currentUser = null;

async function checkAuth() {
  try {
    const r = await fetch('/api/auth/me');
    const d = await r.json();
    currentUser = d.user;
    updateAuthUI();
  } catch(e) {}
}

function setupAuth() {
  const authBtn = document.getElementById('authBtn');
  const authClose = document.getElementById('authClose');
  if (authBtn) authBtn.addEventListener('click', (e) => { e.preventDefault(); openAuthModal(); });
  if (authClose) authClose.addEventListener('click', closeAuthModal);

  document.querySelectorAll('.auth-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const isLogin = tab.dataset.tab === 'login';
      document.getElementById('loginForm').style.display = isLogin ? 'flex' : 'none';
      document.getElementById('registerForm').style.display = isLogin ? 'none' : 'flex';
    });
  });

  const loginForm = document.getElementById('loginForm');
  if (loginForm) loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const errEl = document.getElementById('loginError');
    try {
      const r = await fetch('/api/auth/login', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ email: document.getElementById('loginEmail').value, password: document.getElementById('loginPass').value }) });
      const d = await r.json();
      if (d.success) { currentUser = d.user; updateAuthUI(); closeAuthModal(); showToast('Hosgeldin ' + (d.user.name || d.user.email) + '!'); }
      else errEl.textContent = d.message || 'Hata';
    } catch(e) { errEl.textContent = 'Sunucu hatasi'; }
  });

  const registerForm = document.getElementById('registerForm');
  if (registerForm) registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const errEl = document.getElementById('registerError');
    try {
      const r = await fetch('/api/auth/register', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({
        name: document.getElementById('regName').value,
        surname: document.getElementById('regSurname') ? document.getElementById('regSurname').value : '',
        email: document.getElementById('regEmail').value,
        password: document.getElementById('regPass').value
      }) });
      const d = await r.json();
      if (d.success) { currentUser = d.user; updateAuthUI(); closeAuthModal(); showToast('Hosgeldin ' + (d.user.name || d.user.email) + '!'); }
      else errEl.textContent = d.message || 'Hata';
    } catch(e) { errEl.textContent = 'Sunucu hatasi'; }
  });

  const logoutBtn = document.getElementById('logoutUserBtn');
  if (logoutBtn) logoutBtn.addEventListener('click', async () => {
    await fetch('/api/auth/logout', { method:'POST' });
    currentUser = null; updateAuthUI(); closeAuthModal(); showToast('Cikis yapildi');
  });
}

function updateAuthUI() {
  const authUser = document.getElementById('authUser');
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');
  const authTabs = document.querySelector('.auth-tabs');
  const authBtn = document.getElementById('authBtn');
  if (currentUser) {
    if (authUser) authUser.style.display = 'flex';
    if (loginForm) loginForm.style.display = 'none';
    if (registerForm) registerForm.style.display = 'none';
    if (authTabs) authTabs.style.display = 'none';
    const n = document.getElementById('authUserName');
    if (n) n.textContent = ((currentUser.name||'') + ' ' + (currentUser.surname||'')).trim() || 'Uye';
    const em = document.getElementById('authUserEmail'); if (em) em.textContent = currentUser.email;
    const av = document.getElementById('authAvatar');
    if (av) av.textContent = (currentUser.name || currentUser.email || 'U')[0].toUpperCase();
    if (authBtn) authBtn.classList.add('logged-in');
  } else {
    if (authUser) authUser.style.display = 'none';
    if (loginForm) loginForm.style.display = 'flex';
    if (registerForm) registerForm.style.display = 'none';
    if (authTabs) authTabs.style.display = 'flex';
    if (authBtn) authBtn.classList.remove('logged-in');
  }
}

function openAuthModal() {
  document.getElementById('authModal').classList.add('open');
  document.getElementById('authOverlay').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeAuthModal() {
  document.getElementById('authModal').classList.remove('open');
  document.getElementById('authOverlay').classList.remove('open');
  document.body.style.overflow = '';
}

function showToast(msg) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3000);
}

function submitForm(e) {
  e.preventDefault();
  showToast('Mesajiniz gonderildi!');
  e.target.reset();
}

// ── My Orders ─────────────────────────────────────────────────────
async function loadMyOrders() {
  if (!currentUser) { openAuthModal(); return; }
  try {
    const r = await fetch('/api/my/orders');
    const d = await r.json();
    const modal = document.getElementById('myOrdersModal');
    const content = document.getElementById('myOrdersContent');
    if (!modal || !content) return;
    const labels = { pending:'Bekliyor', processing:'Isleniyor', shipped:'Kargoda', delivered:'Teslim Edildi', cancelled:'Iptal' };
    if (!d.orders || !d.orders.length) {
      content.innerHTML = '<p style="color:#666;text-align:center;padding:40px">Henuz siparisiniz yok.</p>';
    } else {
      content.innerHTML = d.orders.map(o => {
        const trackingHtml = o.tracking_number
          ? '<div class="mo-tracking"><span>' + (o.shipping_company||'Kargo') + ' — ' + o.tracking_number + '</span>'
            + (o.tracking_url ? '<a href="' + o.tracking_url + '" target="_blank" class="mo-track-btn">Takip Et</a>' : '')
            + '</div>'
          : '';
        return '<div class="mo-order">'
          + '<div class="mo-order-header">'
          + '<div><div class="mo-order-id">#' + o.id + '</div><div class="mo-order-date">' + new Date(o.created_at).toLocaleDateString('tr-TR') + '</div></div>'
          + '<span class="status status-' + o.status + '">' + (labels[o.status]||o.status) + '</span>'
          + '</div>'
          + trackingHtml
          + '<div class="mo-items">' + (o.items||[]).map(item =>
              '<div class="mo-item">'
              + (item.image ? '<img src="' + item.image + '" alt=""/>' : '<div class="mo-item-placeholder">N</div>')
              + '<div class="mo-item-info"><div>' + item.name + '</div><div style="color:#666;font-size:12px">Beden: ' + item.size + ' x' + (item.qty||1) + '</div></div>'
              + '<div class="mo-item-price">₺' + Number(item.price*(item.qty||1)).toLocaleString('tr-TR') + '</div>'
              + '</div>'
            ).join('') + '</div>'
          + '<div class="mo-order-total">Toplam: <strong>₺' + Number(o.total).toLocaleString('tr-TR') + '</strong></div>'
          + '</div>';
      }).join('');
    }
    modal.classList.add('open');
    document.getElementById('myOrdersOverlay').classList.add('open');
    document.body.style.overflow = 'hidden';
  } catch(e) {}
}

function closeMyOrders() {
  const modal = document.getElementById('myOrdersModal');
  const overlay = document.getElementById('myOrdersOverlay');
  if (modal) modal.classList.remove('open');
  if (overlay) overlay.classList.remove('open');
  document.body.style.overflow = '';
}
