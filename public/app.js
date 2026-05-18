// ── NEXO Frontend App ────────────────────────────────────────────
let cart = JSON.parse(localStorage.getItem('nexo_cart') || '[]');
let allProducts = [];
let currentFilter = 'all';
let visibleCount = 8;
const LOAD_MORE = 8;

function escHtml(s) {
  return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
}

function splitTickerLine(line) {
  if (!line || !String(line).trim()) return ['NEXO'];
  const t = String(line).trim();
  if (t.indexOf('|') !== -1) return t.split('|').map(function (x) { return x.trim(); }).filter(Boolean);
  return [t];
}

function buildMarqueeTrackHtml(parts, dotClass) {
  if (!parts.length) parts = ['NEXO'];
  const dot = '<span class="' + dotClass + '">✦</span>';
  let seg = '';
  for (let i = 0; i < parts.length; i++) seg += '<span>' + escHtml(parts[i]) + '</span>' + dot;
  return seg + seg;
}

document.addEventListener('DOMContentLoaded', async () => {
  // Splash screen — sadece ilk ziyarette goster (site acikken)
  if (!localStorage.getItem('nexo_visited')) {
    document.getElementById('splash').style.display = 'flex';
  } else {
    document.getElementById('splash').style.display = 'none';
  }

  await loadSettings();
  if (!window.__nexoSiteClosed) {
    await loadProducts();
    await loadCollectionsHome();
  }
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

function closeSplash() {
  if (window.__nexoSiteClosed) return;
  const splash = document.getElementById('splash');
  if (!splash) return;
  splash.classList.add('hide');
  localStorage.setItem('nexo_visited', '1');
  setTimeout(() => { splash.style.display = 'none'; }, 800);
}

async function loadSettings() {
  try {
    const r = await fetch('/api/settings');
    const d = await r.json();
    if (!d.settings) return;
    const s = d.settings;

    const splash = document.getElementById('splash');
    const mainSite = document.getElementById('mainSite');
    const splashBtn = document.getElementById('splashExploreBtn');
    const splashNote = document.getElementById('splashClosedNote');

    if (s.site_status === 'closed') {
      window.__nexoSiteClosed = true;
      if (splash) {
        splash.style.display = 'flex';
        splash.classList.remove('hide');
      }
      if (splashBtn) splashBtn.style.display = 'none';
      if (splashNote) {
        splashNote.style.display = 'block';
        splashNote.textContent = s.site_closed_message || 'Site su an kapali.';
      }
      if (mainSite) mainSite.style.display = 'none';
    } else {
      window.__nexoSiteClosed = false;
      if (splashNote) {
        splashNote.style.display = 'none';
        splashNote.textContent = '';
      }
      if (splashBtn) splashBtn.style.display = '';
      if (mainSite) mainSite.style.display = '';
      if (splash) {
        if (localStorage.getItem('nexo_visited')) splash.style.display = 'none';
        else splash.style.display = 'flex';
      }
    }

    // Announcement bar (iki yari esit — marqueeScroll -50% ile uyumlu)
    const bar = document.querySelector('.announcement-bar');
    const annTrack = document.querySelector('.announcement-track');
    if (bar && annTrack) {
      if (s.announcement_enabled === '0') {
        bar.style.display = 'none';
      } else {
        bar.style.display = '';
        if (s.announcement_bg) bar.style.background = s.announcement_bg;
        if (s.announcement_color) bar.style.color = s.announcement_color;
        annTrack.innerHTML = buildMarqueeTrackHtml(splitTickerLine(s.announcement), 'dot');
        if (s.announcement_speed) annTrack.style.animationDuration = s.announcement_speed + 's';
      }
    }

    // Marka kayan yazisi (navbar alti)
    const marqueeSec = document.querySelector('.marquee-section');
    const marqueeTrack = document.querySelector('.marquee-track');
    if (marqueeSec && marqueeTrack) {
      if (s.marquee_enabled === '0') {
        marqueeSec.style.display = 'none';
      } else {
        marqueeSec.style.display = '';
        marqueeTrack.innerHTML = buildMarqueeTrackHtml(splitTickerLine(s.marquee_line), 'mx');
        if (s.marquee_speed) marqueeTrack.style.animationDuration = s.marquee_speed + 's';
      }
    }

    // Contact section
    const emailEl = document.getElementById('contactEmail');
    const igEl = document.getElementById('contactInstagram');
    if (emailEl && s.email) { emailEl.href = 'mailto:' + s.email; emailEl.textContent = s.email; }
    if (igEl && s.instagram) { igEl.href = s.instagram; igEl.textContent = '@' + s.instagram.replace(/.*instagram\.com\//,'').replace(/\//,''); }

    // Footer
    const footerBrand = document.querySelector('.footer-brand p');
    if (footerBrand && s.site_name) footerBrand.textContent = s.site_name + ' — Olmayacak hayalleri olduran marka.';

  } catch(e) {}
}

async function loadCollectionsHome() {
  const grid = document.getElementById('collectionsGrid');
  if (!grid) return;
  try {
    const r = await fetch('/api/collections');
    const d = await r.json();
    const list = d.collections || [];
    if (!list.length) {
      grid.innerHTML = '<p style="color:#666;padding:24px">Koleksiyon bulunamadi.</p>';
      return;
    }
    grid.innerHTML = list.map(collectionHomeCard).join('');
  } catch (e) {
    grid.innerHTML = '<p style="color:#666;padding:24px">Koleksiyonlar yuklenemedi.</p>';
  }
}

function collectionHomeCard(c) {
  const large = (c.card_layout === 'large') ? 'collection-card large' : 'collection-card';
  const slug = encodeURIComponent(c.slug || c.id);
  const bg = (window.NexoImage && NexoImage.cssBackgroundUrl)
    ? NexoImage.cssBackgroundUrl(c.image_url)
    : null;
  const imgStyle = bg && bg !== 'none'
    ? 'background-image:' + bg + ';'
    : ('background:' + (c.gradient ? String(c.gradient) : 'linear-gradient(135deg,#0a0a0a,#1a1a2e)') + ';');
  const overlay = escHtml(c.overlay_text || c.name || '');
  return '<a href="/koleksiyon/' + slug + '" class="' + large + '">'
    + '<div class="collection-img" style="' + imgStyle + '"><div class="collection-overlay-text">' + overlay + '</div></div>'
    + '<div class="collection-info"><h3>' + escHtml(c.name) + '</h3><p>' + escHtml(c.description || '') + '</p><span class="collection-link">Goruntule →</span></div>'
    + '</a>';
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
  return '<div class="product-card" onclick="goToProduct(\'' + (p.slug||p.id) + '\')">'
    + '<div class="product-img">' + img + badge + '</div>'
    + '<div class="product-info"><div class="product-cat">' + p.category + '</div>'
    + '<div class="product-name">' + p.name + '</div>'
    + '<div class="product-price"><span class="price-current">₺' + Number(p.price).toLocaleString('tr-TR') + '</span>' + oldPrice + '</div>'
    + '</div></div>';
}

function goToProduct(slugOrId) {
  window.location.href = '/urun/' + slugOrId;
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

// ── Trendyol-style zoom ───────────────────────────────────────────
let _zoomCleanup = null;

function initProductZoom(imgEl) {
  // Temizle önceki zoom
  if (_zoomCleanup) { _zoomCleanup(); _zoomCleanup = null; }

  const wrap = imgEl.closest('.gallery-main-wrap');
  if (!wrap) return;

  // Mobilde zoom yok
  if (window.innerWidth < 1025) return;

  // Lens ve result panel oluştur
  const lens = document.createElement('div');
  lens.className = 'zoom-lens';
  const LENS_SIZE = 140;
  lens.style.width = LENS_SIZE + 'px';
  lens.style.height = LENS_SIZE + 'px';
  wrap.appendChild(lens);

  const result = document.createElement('div');
  result.className = 'zoom-result';
  const resultImg = document.createElement('img');
  resultImg.className = 'zoom-result-img';
  resultImg.src = imgEl.src;
  result.appendChild(resultImg);
  wrap.appendChild(result);

  // Result panel boyutu
  const RESULT_W = 420;
  const RESULT_H = 420;
  result.style.width = RESULT_W + 'px';
  result.style.height = RESULT_H + 'px';

  function onMove(e) {
    const rect = imgEl.getBoundingClientRect();
    let cx = e.clientX - rect.left;
    let cy = e.clientY - rect.top;

    // Lens'i sınırla
    cx = Math.max(LENS_SIZE / 2, Math.min(rect.width - LENS_SIZE / 2, cx));
    cy = Math.max(LENS_SIZE / 2, Math.min(rect.height - LENS_SIZE / 2, cy));

    lens.style.left = (cx - LENS_SIZE / 2) + 'px';
    lens.style.top  = (cy - LENS_SIZE / 2) + 'px';

    // Zoom oranı: result boyutu / lens boyutu
    const scaleX = (imgEl.naturalWidth  || imgEl.width)  / rect.width;
    const scaleY = (imgEl.naturalHeight || imgEl.height) / rect.height;
    const zoomX  = RESULT_W / LENS_SIZE;
    const zoomY  = RESULT_H / LENS_SIZE;

    // Result img boyutu
    const rw = rect.width  * zoomX;
    const rh = rect.height * zoomY;
    resultImg.style.width  = rw + 'px';
    resultImg.style.height = rh + 'px';

    // Result img pozisyonu: lens merkezini büyüt
    const rx = -(cx * zoomX - RESULT_W / 2);
    const ry = -(cy * zoomY - RESULT_H / 2);
    resultImg.style.left = rx + 'px';
    resultImg.style.top  = ry + 'px';
  }

  function onEnter() {
    lens.style.display   = 'block';
    result.style.display = 'block';
  }

  function onLeave() {
    lens.style.display   = 'none';
    result.style.display = 'none';
  }

  imgEl.addEventListener('mouseenter', onEnter);
  imgEl.addEventListener('mouseleave', onLeave);
  imgEl.addEventListener('mousemove',  onMove);

  _zoomCleanup = () => {
    imgEl.removeEventListener('mouseenter', onEnter);
    imgEl.removeEventListener('mouseleave', onLeave);
    imgEl.removeEventListener('mousemove',  onMove);
    if (lens.parentNode)   lens.parentNode.removeChild(lens);
    if (result.parentNode) result.parentNode.removeChild(result);
  };
}

function swapProductZoomImage(imgEl, src) {
  imgEl.src = src;
  // result panel varsa güncelle
  const wrap = imgEl.closest('.gallery-main-wrap');
  if (!wrap) return;
  const ri = wrap.querySelector('.zoom-result-img');
  if (ri) ri.src = src;
}

function gallerySet(index) {
  if (!galleryImages.length) return;
  galleryIndex = (index + galleryImages.length) % galleryImages.length;
  const mainImg = document.getElementById('galleryMain');
  if (mainImg) swapProductZoomImage(mainImg, galleryImages[galleryIndex]);
  document.querySelectorAll('.gallery-thumb').forEach((t, i) => {
    t.classList.toggle('active', i === galleryIndex);
  });
}

function galleryPrev() { gallerySet(galleryIndex - 1); }
function galleryNext() { gallerySet(galleryIndex + 1); }

async function openProduct(id) {
  try {
    const r = await fetch('/api/products/' + id);
    const d = await r.json();
    if (!d.success) return;
    const p = d.product;

    galleryImages = (window.NexoImage && NexoImage.normalizeImageList)
      ? NexoImage.normalizeImageList(p.images)
      : ((p.images && p.images.length) ? p.images : []);
    galleryIndex = 0;

    // Main image area
    const mainImgHtml = galleryImages.length
      ? (NexoImage && NexoImage.imgTag
        ? NexoImage.imgTag(galleryImages[0], p.name, 'id="galleryMain"')
        : '<img id="galleryMain" src="' + escHtml(galleryImages[0]) + '" alt="' + escHtml(p.name) + '">')
      : '<div class="modal-img-placeholder">N</div>';

    // Thumbnails
    const thumbsHtml = galleryImages.length > 1
      ? '<div class="gallery-thumbs">' + galleryImages.map((img, i) =>
          '<button class="gallery-thumb' + (i === 0 ? ' active' : '') + '" onclick="gallerySet(' + i + ')">'
          + (NexoImage && NexoImage.imgTag ? NexoImage.imgTag(img, '') : '<img src="' + escHtml(img) + '" alt=""/>') + '</button>'
        ).join('') + '</div>'
      : '';

    // Nav arrows
    const arrowsHtml = galleryImages.length > 1
      ? '<button type="button" class="gallery-arrow gallery-prev" onclick="event.stopPropagation();galleryPrev()"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg></button>'
        + '<button type="button" class="gallery-arrow gallery-next" onclick="event.stopPropagation();galleryNext()"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg></button>'
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

    const mainImg = document.getElementById('galleryMain');
    if (mainImg && typeof initProductZoom === 'function') initProductZoom(mainImg);

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

async function submitTicket(e) {
  e.preventDefault();
  const name = document.getElementById('ticketName').value;
  const email = document.getElementById('ticketEmail').value;
  const subject = document.getElementById('ticketSubject').value;
  const message = document.getElementById('ticketMessage').value;
  try {
    const r = await fetch('/api/tickets', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ subject, message, name, email }) });
    const d = await r.json();
    if (d.success) {
      showToast('Talebiniz alindi! Talep No: ' + d.id);
      e.target.reset();
    } else showToast(d.message || 'Hata', true);
  } catch(err) { showToast('Sunucu hatasi'); }
}

async function loadMyTickets() {
  const modal = document.getElementById('myTicketsModal');
  const content = document.getElementById('myTicketsContent');
  if (!modal || !content) return;
  try {
    const r = await fetch('/api/tickets/my');
    const d = await r.json();
    if (!d.success) { content.innerHTML = '<p style="color:#666;text-align:center;padding:40px">Giris yapmaniz gerekiyor.</p>'; }
    else if (!d.tickets || !d.tickets.length) { content.innerHTML = '<p style="color:#666;text-align:center;padding:40px">Henuz talebiniz yok.</p>'; }
    else {
      const statusLabels = { open:'Acik', answered:'Cevaplandi', closed:'Kapandi' };
      content.innerHTML = d.tickets.map(function (t) {
        const reply = (t.admin_reply && String(t.admin_reply).trim()) ? String(t.admin_reply).trim() : '';
        const replyAt = t.admin_reply_at ? new Date(t.admin_reply_at).toLocaleString('tr-TR') : '';
        const replyBlock = reply
          ? ('<div style="padding:12px 20px;background:rgba(74,222,128,.06);border-top:1px solid #1f1f1f">'
            + '<div style="font-size:11px;color:#4ade80;letter-spacing:.1em;margin-bottom:6px">NEXO CEVABI' + (replyAt ? ' <span style="color:#666;font-weight:400">(' + escHtml(replyAt) + ')</span>' : '') + '</div>'
            + '<div style="font-size:14px;color:#e5e5e5;line-height:1.65;white-space:pre-wrap">' + escHtml(reply) + '</div></div>')
          : ('<div style="padding:12px 20px;border-top:1px solid #1f1f1f;font-size:13px;color:#666">Henüz yönetimden cevap yok.</div>');
        return '<div class="mo-order">'
          + '<div class="mo-order-header"><div><div class="mo-order-id">#' + escHtml(t.id) + ' — ' + escHtml(t.subject || '') + '</div><div class="mo-order-date">' + new Date(t.created_at).toLocaleDateString('tr-TR') + '</div></div>'
          + '<span class="status status-' + (t.status === 'answered' ? 'delivered' : t.status === 'closed' ? 'cancelled' : 'pending') + '">' + escHtml(statusLabels[t.status] || t.status) + '</span></div>'
          + '<div style="padding:16px 20px;font-size:14px;color:#ccc;line-height:1.65;white-space:pre-wrap"><span style="font-size:11px;color:#666;display:block;margin-bottom:8px">Mesajiniz</span>' + escHtml(t.message || '') + '</div>'
          + replyBlock
          + '</div>';
      }).join('');
    }
  } catch(err) { content.innerHTML = '<p style="color:#666;text-align:center;padding:40px">Hata olustu.</p>'; }
  modal.classList.add('open');
  document.getElementById('myTicketsOverlay').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeMyTickets() {
  document.getElementById('myTicketsModal').classList.remove('open');
  document.getElementById('myTicketsOverlay').classList.remove('open');
  document.body.style.overflow = '';
}

// ── My Orders ─────────────────────────────────────────────────────
async function loadMyOrders() {
  if (!currentUser) { openAuthModal(); return; }
  const modal = document.getElementById('myOrdersModal');
  const content = document.getElementById('myOrdersContent');
  if (!modal || !content) return;

  // Önce modal'ı aç, loading göster
  content.innerHTML = '<p style="color:#666;text-align:center;padding:40px">Yukleniyor...</p>';
  modal.classList.add('open');
  document.getElementById('myOrdersOverlay').classList.add('open');
  document.body.style.overflow = 'hidden';

  try {
    const r = await fetch('/api/my/orders');
    const d = await r.json();
    const labels = { pending:'Bekliyor', processing:'Isleniyor', shipped:'Kargoda', delivered:'Teslim Edildi', cancelled:'Iptal' };

    if (!d.success) {
      content.innerHTML = '<p style="color:#ff4444;text-align:center;padding:40px">' + (d.message || 'Hata olustu') + '</p>';
      return;
    }
    if (!d.orders || !d.orders.length) {
      content.innerHTML = '<p style="color:#666;text-align:center;padding:40px">Henuz siparisiniz yok.</p>';
      return;
    }
    content.innerHTML = d.orders.map(o => {
      const trackingHtml = o.tracking_number
        ? '<div class="mo-tracking"><span>' + (o.shipping_company||'Kargo') + ' — ' + o.tracking_number + '</span>'
          + (o.tracking_url ? '<a href="' + o.tracking_url + '" target="_blank" class="mo-track-btn">Takip Et</a>' : '')
          + '</div>'
        : '';
      return '<div class="mo-order">'
        + '<div class="mo-order-header">'
        + '<div><div class="mo-order-id">#' + o.id + '</div><div class="mo-order-date">' + new Date(o.created_at).toLocaleDateString('tr-TR') + '</div></div>'
        + '<div style="display:flex;align-items:center;gap:8px">'
        + '<span class="status status-' + o.status + '">' + (labels[o.status]||o.status) + '</span>'
        + '<button onclick="copyOrderUrl(\'' + (o.custom_slug||o.id) + '\')" style="padding:4px 10px;background:#1a1a1a;border:1px solid #2a2a2a;border-radius:6px;color:#888;font-size:11px;cursor:pointer">Paylas</button>'
        + '</div></div>'
        + trackingHtml
        + '<div class="mo-items">' + (o.items||[]).map(item =>
            '<div class="mo-item">'
            + (item.image ? '<img src="' + item.image + '" alt=""/>' : '<div class="mo-item-placeholder">N</div>')
            + '<div class="mo-item-info"><div>' + item.name + '</div><div style="color:#666;font-size:12px">Beden: ' + item.size + ' x' + (item.qty||1) + '</div></div>'
            + '<div class="mo-item-price">\u20ba' + Number(item.price*(item.qty||1)).toLocaleString('tr-TR') + '</div>'
            + '</div>'
          ).join('') + '</div>'
        + '<div class="mo-order-total">Toplam: <strong>\u20ba' + Number(o.total).toLocaleString('tr-TR') + '</strong></div>'
        + '</div>';
    }).join('');
  } catch(e) {
    content.innerHTML = '<p style="color:#ff4444;text-align:center;padding:40px">Baglanti hatasi. Sunucunun calistigini kontrol edin.</p>';
  }
}

function closeMyOrders() {
  const modal = document.getElementById('myOrdersModal');
  const overlay = document.getElementById('myOrdersOverlay');
  if (modal) modal.classList.remove('open');
  if (overlay) overlay.classList.remove('open');
  document.body.style.overflow = '';
}

function copyOrderUrl(slugOrId) {
  const url = location.origin + '/siparis/' + slugOrId;
  navigator.clipboard.writeText(url).then(() => {
    showToast('Siparis linki kopyalandi!');
  }).catch(() => {
    prompt('Linki kopyala:', url);
  });
}

// Product slug URL helper - overrides productCard click behavior
// productCard already updated to use slug when available
