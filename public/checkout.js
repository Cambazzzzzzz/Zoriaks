// NEXO Checkout

// ─── TURKEY CITIES & DISTRICTS ────────────────────────────────────
const TR_CITIES = {"Adana":["Aladağ","Ceyhan","Çukurova","Feke","İmamoğlu","Karaisalı","Karataş","Kozan","Pozantı","Saimbeyli","Sarıçam","Seyhan","Tufanbeyli","Yumurtalık","Yüreğir"],"Adıyaman":["Adıyaman Merkez","Besni","Çelikhan","Gerger","Gölbaşı","Kahta","Samsat","Sincik","Tut"],"Afyonkarahisar":["Afyonkarahisar Merkez","Başmakçı","Bayat","Bolvadin","Çay","Çobanlar","Dazkırı","Dinar","Emirdağ","Evciler","Hocalar","İhsaniye","İscehisar","Kızılören","Sandıklı","Sinanpaşa","Sultandağı","Şuhut"],"Ağrı":["Ağrı Merkez","Diyadin","Doğubayazıt","Eleşkirt","Hamur","Patnos","Taşlıçay","Tutak"],"Aksaray":["Aksaray Merkez","Ağaçören","Eskil","Gülağaç","Güzelyurt","Ortaköy","Sarıyahşi"],"Amasya":["Amasya Merkez","Göynücek","Gümüşhacıköy","Hamamözü","Merzifon","Suluova","Taşova"],"Ankara":["Altındağ","Ayaş","Bala","Beypazarı","Çamlıdere","Çankaya","Çubuk","Elmadağ","Etimesgut","Evren","Gölbaşı","Güdül","Haymana","Kalecik","Kazan","Keçiören","Kızılcahamam","Mamak","Nallıhan","Polatlı","Pursaklar","Sincan","Şereflikoçhisar","Yenimahalle"],"Antalya":["Akseki","Aksu","Alanya","Demre","Döşemealtı","Elmalı","Finike","Gazipaşa","Gündoğmuş","İbradı","Kaş","Kemer","Kepez","Konyaaltı","Korkuteli","Kumluca","Manavgat","Muratpaşa","Serik"],"Ardahan":["Ardahan Merkez","Çıldır","Damal","Göle","Hanak","Posof"],"Artvin":["Ardanuç","Arhavi","Artvin Merkez","Borçka","Hopa","Kemalpaşa","Murgul","Şavşat","Yusufeli"],"Aydın":["Bozdoğan","Buharkent","Çine","Didim","Efeler","Germencik","İncirliova","Karacasu","Karpuzlu","Koçarlı","Köşk","Kuşadası","Kuyucak","Nazilli","Söke","Sultanhisar","Yenipazar"],"Balıkesir":["Altıeylül","Ayvalık","Balya","Bandırma","Bigadiç","Burhaniye","Dursunbey","Edremit","Erdek","Gömeç","Gönen","Havran","İvrindi","Karesi","Kepsut","Manyas","Marmara","Savaştepe","Sındırgı","Susurluk"],"Bartın":["Arit","Bartın Merkez","Kurucaşile","Ulus"],"Batman":["Batman Merkez","Beşiri","Gercüş","Hasankeyf","Kozluk","Sason"],"Bayburt":["Aydıntepe","Bayburt Merkez","Demirözü"],"Bilecik":["Bozüyük","Gölpazarı","İnhisar","Merkez","Osmaneli","Pazaryeri","Söğüt","Yenipazar"],"Bingöl":["Adaklı","Bingöl Merkez","Genç","Karlıova","Kiğı","Solhan","Yayladere","Yedisu"],"Bitlis":["Adilcevaz","Ahlat","Bitlis Merkez","Güroymak","Hizan","Mutki","Tatvan"],"Bolu":["Bolu Merkez","Dörtdivan","Gerede","Göynük","Kıbrıscık","Mengen","Mudurnu","Seben","Yeniçağa"],"Burdur":["Ağlasun","Altınyayla","Bucak","Burdur Merkez","Çavdır","Çeltikçi","Gölhisar","Karamanlı","Kemer","Tefenni","Yeşilova"],"Bursa":["Büyükorhan","Gemlik","Gürsu","Harmancık","İnegöl","İznik","Karacabey","Keles","Kestel","Mudanya","Mustafakemalpaşa","Nilüfer","Orhaneli","Orhangazi","Osmangazi","Yenişehir","Yıldırım"],"Çanakkale":["Ayvacık","Bayramiç","Biga","Bozcaada","Çan","Çanakkale Merkez","Eceabat","Ezine","Gelibolu","Gökçeada","Lapseki","Yenice"],"Çankırı":["Atkaracalar","Bayramören","Çankırı Merkez","Eldivan","Ilgaz","Khanköy","Korgun","Kurşunlu","Orta","Şabanözü","Yapraklı"],"Çorum":["Alaca","Bayat","Boğazkale","Dodurga","İskilip","Kargı","Laçin","Mecitözü","Merkez","Oğuzlar","Ortaköy","Osmancık","Sungurlu","Uğurludağ"],"Denizli":["Acıpayam","Babadağ","Baklan","Bekilli","Beyağaç","Bozkurt","Buldan","Çal","Çameli","Çardak","Çivril","Güney","Honaz","Kale","Merkezefendi","Pamukkale","Sarayköy","Serinhisar","Tavas"],"Diyarbakır":["Bağlar","Bismil","Çermik","Çınar","Çüngüş","Dicle","Eğil","Ergani","Hani","Hazro","Kayapınar","Kocaköy","Kulp","Lice","Silvan","Sur","Yenişehir"],"Düzce":["Akçakoca","Cumayeri","Çilimli","Düzce Merkez","Gölyaka","Gümüşova","Kaynaşlı","Yığılca"],"Edirne":["Edirne Merkez","Enez","Havsa","İpsala","Keşan","Lalapaşa","Meriç","Süloğlu","Uzunköprü"],"Elazığ":["Ağın","Alacakaya","Arıcak","Baskil","Elazığ Merkez","Karakoçan","Keban","Kovancılar","Maden","Palu","Sivrice"],"Erzincan":["Çayırlı","Erzincan Merkez","İliç","Kemah","Kemaliye","Otlukbeli","Refahiye","Tercan","Üzümlü"],"Erzurum":["Aşkale","Aziziye","Çat","Hınıs","Horasan","İspir","Karaçoban","Karayazı","Köprüköy","Narman","Oltu","Olur","Palandöken","Pasinler","Pazaryolu","Şenkaya","Tekman","Tortum","Uzundere","Yakutiye"],"Eskişehir":["Alpu","Beylikova","Çifteler","Günyüzü","Han","İnönü","Mahmudiye","Mihalgazi","Mihalıççık","Odunpazarı","Sarıcakaya","Seyitgazi","Sivrihisar","Tepebaşı"],"Gaziantep":["Araban","İslahiye","Karkamış","Nizip","Nurdağı","Oğuzeli","Şahinbey","Şehitkamil","Yavuzeli"],"Giresun":["Alucra","Bulancak","Çamoluk","Çanakçı","Dereli","Doğankent","Espiye","Eynesil","Giresun Merkez","Görele","Güce","Keşap","Piraziz","Şebinkarahisar","Tirebolu","Yağlıdere"],"Gümüşhane":["Gümüşhane Merkez","Kelkit","Köse","Kürtün","Şiran","Torul"],"Hakkari":["Çukurca","Hakkari Merkez","Şemdinli","Yüksekova"],"Hatay":["Altınözü","Antakya","Arsuz","Belen","Defne","Dörtyol","Erzin","Hassa","İskenderun","Kırıkhan","Kumlu","Payas","Reyhanlı","Samandağ","Yayladağı"],"Iğdır":["Aralık","Iğdır Merkez","Karakoyunlu","Tuzluca"],"Isparta":["Aksu","Atabey","Eğirdir","Gelendost","Gönen","Keçiborlu","Merkez","Senirkent","Sütçüler","Şarkikaraağaç","Uluborlu","Yalvaç","Yenişarbademli"],"İstanbul":["Adalar","Arnavutköy","Ataşehir","Avcılar","Bağcılar","Bahçelievler","Bakırköy","Başakşehir","Bayrampaşa","Beşiktaş","Beykoz","Beylikdüzü","Beyoğlu","Büyükçekmece","Çatalca","Çekmeköy","Esenler","Esenyurt","Eyüpsultan","Fatih","Gaziosmanpaşa","Güngören","Kadıköy","Kağıthane","Kartal","Küçükçekmece","Maltepe","Pendik","Sancaktepe","Sarıyer","Silivri","Sultanbeyli","Sultangazi","Şile","Şişli","Tuzla","Ümraniye","Üsküdar","Zeytinburnu"],"İzmir":["Aliağa","Balçova","Bayındır","Bayraklı","Bergama","Beydağ","Bornova","Buca","Çeşme","Çiğli","Dikili","Foça","Gaziemir","Güzelbahçe","Karabağlar","Karaburun","Karşıyaka","Kemalpaşa","Kınık","Kiraz","Konak","Menderes","Menemen","Narlıdere","Ödemiş","Seferihisar","Selçuk","Tire","Torbalı","Urla"],"Kahramanmaraş":["Afşin","Andırın","Çağlayancerit","Dulkadiroğlu","Ekinözü","Elbistan","Göksun","Nurhak","Onikişubat","Pazarcık","Türkoğlu"],"Karabük":["Eflani","Eskipazar","Karabük Merkez","Ovacık","Safranbolu","Yenice"],"Karaman":["Ayrancı","Başyayla","Ermenek","Karaman Merkez","Kazımkarabekir","Sarıveliler"],"Kars":["Akyaka","Arpaçay","Digor","Kağızman","Kars Merkez","Sarıkamış","Selim","Susuz"],"Kastamonu":["Abana","Ağlı","Araç","Azdavay","Bozkurt","Cide","Çatalzeytin","Daday","Devrekani","Doğanyurt","Hanönü","İhsangazi","İnebolu","Kastamonu Merkez","Küre","Pınarbaşı","Seydiler","Şenpazar","Taşköprü","Tosya"],"Kayseri":["Akkışla","Bünyan","Develi","Felahiye","Hacılar","İncesu","Kocasinan","Melikgazi","Özvatan","Pınarbaşı","Sarıoğlan","Sarız","Talas","Tomarza","Yahyalı","Yeşilhisar"],"Kırıkkale":["Bahşili","Balışeyh","Çelebi","Delice","Karakeçili","Keskin","Kırıkkale Merkez","Sulakyurt","Yahşihan"],"Kırklareli":["Babaeski","Demirköy","Kırklareli Merkez","Kofçaz","Lüleburgaz","Pehlivanköy","Pınarhisar","Vize"],"Kırşehir":["Akçakent","Akpınar","Boztepe","Çiçekdağı","Kaman","Kırşehir Merkez","Mucur"],"Kilis":["Elbeyli","Kilis Merkez","Musabeyli","Polateli"],"Kocaeli":["Başiskele","Çayırova","Darıca","Derince","Dilovası","Gebze","Gölcük","İzmit","Kandıra","Karamürsel","Kartepe","Körfez"],"Konya":["Ahırlı","Akören","Akşehir","Altınekin","Beyşehir","Bozkır","Cihanbeyli","Çeltik","Çumra","Derbent","Derebucak","Doğanhisar","Emirgazi","Ereğli","Güneysınır","Hadim","Halkapınar","Hüyük","Ilgın","Kadınhanı","Karapınar","Karatay","Kulu","Meram","Sarayönü","Selçuklu","Seydişehir","Taşkent","Tuzlukçu","Yalıhüyük","Yunak"],"Kütahya":["Altıntaş","Aslanapa","Çavdarhisar","Domaniç","Dumlupınar","Emet","Gediz","Hisarcık","Kütahya Merkez","Pazarlar","Simav","Şaphane","Tavşanlı"],"Malatya":["Akçadağ","Arapgir","Arguvan","Battalgazi","Darende","Doğanşehir","Doğanyol","Hekimhan","Kale","Kuluncak","Pütürge","Yazıhan","Yeşilyurt"],"Manisa":["Ahmetli","Akhisar","Alaşehir","Demirci","Gölmarmara","Gördes","Kırkağaç","Köprübaşı","Kula","Merkez","Salihli","Sarıgöl","Saruhanlı","Selendi","Soma","Turgutlu","Yunusemre"],"Mardin":["Artuklu","Dargeçit","Derik","Kızıltepe","Mazıdağı","Midyat","Nusaybin","Ömerli","Savur","Yeşilli"],"Mersin":["Akdeniz","Anamur","Aydıncık","Bozyazı","Çamlıyayla","Erdemli","Gülnar","Mezitli","Mut","Silifke","Tarsus","Toroslar","Yenişehir"],"Muğla":["Bodrum","Dalaman","Datça","Fethiye","Kavaklıdere","Köyceğiz","Marmaris","Menteşe","Milas","Ortaca","Seydikemer","Ula","Yatağan"],"Muş":["Bulanık","Hasköy","Korkut","Malazgirt","Merkez","Varto"],"Nevşehir":["Acıgöl","Avanos","Derinkuyu","Gülşehir","Hacıbektaş","Kozaklı","Merkez","Ürgüp"],"Niğde":["Altunhisar","Bor","Çamardı","Çiftlik","Merkez","Ulukışla"],"Ordu":["Akkuş","Altınordu","Aybastı","Çamaş","Çatalpınar","Çaybaşı","Fatsa","Gölköy","Gülyalı","Gürgentepe","İkizce","Kabadüz","Kabataş","Korgan","Kumru","Mesudiye","Perşembe","Ulubey","Ünye"],"Osmaniye":["Bahçe","Düziçi","Hasanbeyli","Kadirli","Merkez","Sumbas","Toprakkale"],"Rize":["Ardeşen","Çamlıhemşin","Çayeli","Derepazarı","Fındıklı","Güneysu","Hemşin","İkizdere","İyidere","Kalkandere","Merkez","Pazar"],"Sakarya":["Adapazarı","Akyazı","Arifiye","Erenler","Ferizli","Geyve","Hendek","Karapürçek","Karasu","Kaynarca","Kocaali","Mithatpaşa","Pamukova","Sapanca","Serdivan","Söğütlü","Taraklı"],"Samsun":["Alaçam","Asarcık","Atakum","Ayvacık","Bafra","Canik","Çarşamba","İlkadım","Kavak","Ladik","Ondokuzmayıs","Salıpazarı","Tekkeköy","Terme","Vezirköprü","Yakakent"],"Siirt":["Baykan","Eruh","Kurtalan","Merkez","Pervari","Şirvan","Tillo"],"Sinop":["Ayancık","Boyabat","Dikmen","Durağan","Erfelek","Gerze","Merkez","Saraydüzü","Türkeli"],"Sivas":["Akıncılar","Altınyayla","Divriği","Doğanşar","Gemerek","Gölova","Hafik","İmranlı","Kangal","Koyulhisar","Merkez","Suşehri","Şarkışla","Ulaş","Yıldızeli","Zara"],"Şanlıurfa":["Akçakale","Birecik","Bozova","Ceylanpınar","Eyyübiye","Halfeti","Haliliye","Harran","Hilvan","Karaköprü","Siverek","Suruç","Viranşehir"],"Şırnak":["Beytüşşebap","Cizre","Güçlükonak","İdil","Merkez","Silopi","Uludere"],"Tekirdağ":["Çerkezköy","Çorlu","Ergene","Hayrabolu","Kapaklı","Malkara","Marmaraereğlisi","Muratlı","Saray","Süleymanpaşa","Şarköy"],"Tokat":["Almus","Artova","Başçiftlik","Erbaa","Merkez","Niksar","Pazar","Reşadiye","Sulusaray","Turhal","Yeşilyurt","Zile"],"Trabzon":["Akçaabat","Araklı","Arsin","Beşikdüzü","Çarşıbaşı","Çaykara","Dernekpazarı","Düzköy","Hayrat","Köprübaşı","Maçka","Of","Ortahisar","Sürmene","Şalpazarı","Tonya","Vakfıkebir","Yomra"],"Tunceli":["Çemişgezek","Hozat","Mazgirt","Merkez","Nazımiye","Ovacık","Pertek","Pülümür"],"Uşak":["Banaz","Eşme","Karahallı","Merkez","Sivaslı","Ulubey"],"Van":["Bahçesaray","Başkale","Çaldıran","Çatak","Edremit","Erciş","Gevaş","Gürpınar","İpekyolu","Muradiye","Özalp","Saray","Tuşba"],"Yalova":["Altınova","Armutlu","Çınarcık","Çiftlikköy","Merkez","Termal"],"Yozgat":["Akdağmadeni","Aydıncık","Boğazlıyan","Çandır","Çayıralan","Çekerek","Kadışehri","Merkez","Saraykent","Sarıkaya","Şefaatli","Sorgun","Yenifakılı","Yerköy"],"Zonguldak":["Alaplı","Çaycuma","Devrek","Ereğli","Gökçebey","Kilimli","Kozlu","Merkez"]};

// ─── STATE ────────────────────────────────────────────────────────
let cart = JSON.parse(localStorage.getItem('nexo_cart') || '[]');
let currentStep = 1;
let selectedShipping = null;
let discountData = null;
let settings = {};
let currentUser = null;

// ─── INIT ─────────────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', async () => {
  if (!cart.length) { window.location.href = '/'; return; }
  await loadSettings();
  await checkAuth();
  populateCities();
  renderSummary();
  renderShippingOptions();
});

async function loadSettings() {
  try {
    const r = await fetch('/api/settings');
    const d = await r.json();
    settings = d.settings || {};
  } catch(e) {}
}

async function checkAuth() {
  try {
    const r = await fetch('/api/auth/me');
    const d = await r.json();
    currentUser = d.user;
    if (currentUser) {
      if (document.getElementById('f-name')) document.getElementById('f-name').value = currentUser.name || '';
      if (document.getElementById('f-surname')) document.getElementById('f-surname').value = currentUser.surname || '';
      if (document.getElementById('f-email')) document.getElementById('f-email').value = currentUser.email || '';
      if (document.getElementById('f-phone')) document.getElementById('f-phone').value = currentUser.phone || '';
      if (document.getElementById('f-address')) document.getElementById('f-address').value = currentUser.address || '';
      if (currentUser.city) {
        document.getElementById('f-city').value = currentUser.city;
        loadDistricts();
        setTimeout(() => { if (currentUser.district) document.getElementById('f-district').value = currentUser.district; }, 100);
      }
    }
  } catch(e) {}
}

// ─── CITIES & DISTRICTS ───────────────────────────────────────────
function populateCities() {
  const sel = document.getElementById('f-city');
  Object.keys(TR_CITIES).sort().forEach(city => {
    const opt = document.createElement('option');
    opt.value = city; opt.textContent = city;
    sel.appendChild(opt);
  });
}

function loadDistricts() {
  const city = document.getElementById('f-city').value;
  const sel = document.getElementById('f-district');
  sel.innerHTML = '<option value="">Ilce secin</option>';
  if (!city || !TR_CITIES[city]) return;
  TR_CITIES[city].forEach(d => {
    const opt = document.createElement('option');
    opt.value = d; opt.textContent = d;
    sel.appendChild(opt);
  });
  
  // Auto-fill postal code
  const zipEl = document.getElementById('f-zip');
  if (zipEl && city && TR_POSTAL[city]) {
    zipEl.value = TR_POSTAL[city] + '000';
    zipEl.readOnly = true;
    zipEl.style.color = '#888';
  } else if (zipEl) {
    zipEl.readOnly = false;
    zipEl.style.color = '';
  }
}

// ─── SUMMARY ──────────────────────────────────────────────────────
function renderSummary() {
  const container = document.getElementById('summaryItems');
  container.innerHTML = cart.map(item => {
    const img = item.image ? '<img src="' + item.image + '" alt=""/>' : '';
    return '<div class="co-summary-item">'
      + '<div class="co-summary-item-img">' + img + '<span class="co-summary-item-badge">' + (item.qty||1) + '</span></div>'
      + '<div class="co-summary-item-info"><div class="co-summary-item-name">' + item.name + '</div><div class="co-summary-item-meta">Beden: ' + item.size + '</div></div>'
      + '<div class="co-summary-item-price">₺' + Number(item.price * (item.qty||1)).toLocaleString('tr-TR') + '</div>'
      + '</div>';
  }).join('');
  updateTotals();
}

function updateTotals() {
  const subtotal = cart.reduce((s, c) => s + c.price * (c.qty||1), 0);
  const threshold = parseFloat(settings.free_shipping_threshold || 1500);
  const shippingCost = parseFloat(settings.shipping_cost || 49.90);
  const shipping = subtotal >= threshold ? 0 : (selectedShipping ? selectedShipping.price : shippingCost);
  const discount = discountData ? discountData.discount : 0;
  const total = subtotal - discount + shipping;

  document.getElementById('summarySubtotal').textContent = '₺' + subtotal.toLocaleString('tr-TR');
  document.getElementById('summaryShipping').textContent = shipping === 0 ? 'Ucretsiz' : '₺' + shipping.toLocaleString('tr-TR');
  document.getElementById('summaryTotal').textContent = '₺' + total.toLocaleString('tr-TR');

  if (discount > 0) {
    document.getElementById('discountLine').style.display = 'flex';
    document.getElementById('summaryDiscount').textContent = '-₺' + discount.toLocaleString('tr-TR');
  }
}

// ─── SHIPPING OPTIONS ─────────────────────────────────────────────
function renderShippingOptions() {
  const subtotal = cart.reduce((s, c) => s + c.price * (c.qty||1), 0);
  const threshold = parseFloat(settings.free_shipping_threshold || 1500);
  const shippingCost = parseFloat(settings.shipping_cost || 49.90);
  const isFree = subtotal >= threshold;

  const container = document.getElementById('shippingOptions');
  const opts = [
    { id: 'standard', name: 'Standart Kargo', desc: '3-5 is gunu', price: isFree ? 0 : shippingCost },
    { id: 'express', name: 'Hizli Kargo', desc: '1-2 is gunu', price: isFree ? 0 : shippingCost + 30 },
  ];

  container.innerHTML = opts.map((o, i) => '<div class="co-shipping-opt' + (i===0?' selected':'') + '" onclick="selectShipping(this,\'' + o.id + '\',' + o.price + ',\'' + o.name + '\')">'
    + '<div class="co-shipping-opt-left"><div class="co-shipping-radio"></div><div><div class="co-shipping-name">' + o.name + '</div><div class="co-shipping-desc">' + o.desc + '</div></div></div>'
    + '<div class="co-shipping-price' + (o.price===0?' free':'') + '">' + (o.price===0?'Ucretsiz':'₺'+o.price.toLocaleString('tr-TR')) + '</div>'
    + '</div>').join('');

  selectedShipping = { id: opts[0].id, price: opts[0].price, name: opts[0].name };
  updateTotals();
}

function selectShipping(el, id, price, name) {
  document.querySelectorAll('.co-shipping-opt').forEach(o => o.classList.remove('selected'));
  el.classList.add('selected');
  selectedShipping = { id, price, name };
  updateTotals();
}

// ─── DISCOUNT ─────────────────────────────────────────────────────
async function applyDiscount() {
  const code = document.getElementById('discountInput').value.trim();
  const msgEl = document.getElementById('discountMsg');
  if (!code) return;
  const subtotal = cart.reduce((s, c) => s + c.price * (c.qty||1), 0);
  try {
    const r = await fetch('/api/discount/check', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ code, total: subtotal }) });
    const d = await r.json();
    if (d.success) {
      discountData = d;
      msgEl.className = 'co-discount-msg success';
      msgEl.textContent = (d.type==='percent' ? d.value+'% indirim' : '₺'+d.value+' indirim') + ' uygulandı!';
      updateTotals();
    } else {
      discountData = null;
      msgEl.className = 'co-discount-msg error';
      msgEl.textContent = d.message;
      updateTotals();
    }
  } catch(e) { msgEl.className = 'co-discount-msg error'; msgEl.textContent = 'Hata olustu'; }
}

// ─── STEPS ────────────────────────────────────────────────────────
function goToStep(n) {
  document.querySelectorAll('.co-section').forEach(s => s.classList.remove('active'));
  document.getElementById('section-' + n).classList.add('active');
  document.querySelectorAll('.co-step').forEach((s, i) => s.classList.toggle('active', i+1 === n));
  currentStep = n;
  window.scrollTo(0, 0);
}

function goToShipping() {
  const name = document.getElementById('f-name').value.trim();
  const surname = document.getElementById('f-surname').value.trim();
  const email = document.getElementById('f-email').value.trim();
  const phone = document.getElementById('f-phone').value.trim();
  const address = document.getElementById('f-address').value.trim();
  const city = document.getElementById('f-city').value;
  const district = document.getElementById('f-district').value;
  if (!name || !surname || !email || !phone || !address || !city || !district) {
    alert('Lutfen tum zorunlu alanlari doldurun'); return;
  }
  goToStep(2);
}

function goToPayment() {
  if (!selectedShipping) { alert('Lutfen kargo secenegi secin'); return; }
  goToStep(3);
}

// ─── CARD FORMATTING ──────────────────────────────────────────────
function formatCard(input) {
  let v = input.value.replace(/\D/g, '').substring(0, 16);
  input.value = v.replace(/(.{4})/g, '$1 ').trim();
}

function formatExp(input) {
  let v = input.value.replace(/\D/g, '').substring(0, 4);
  if (v.length >= 2) v = v.substring(0,2) + '/' + v.substring(2);
  input.value = v;
}

// ─── PLACE ORDER ──────────────────────────────────────────────────
async function placeOrder() {
  const agree = document.getElementById('f-agree').checked;
  if (!agree) { document.getElementById('orderError').textContent = 'Sozlesmeyi onaylamaniz gerekiyor'; return; }

  const cardNum = document.getElementById('f-card-num').value.replace(/\s/g,'');
  const cardName = document.getElementById('f-card-name').value.trim();
  const cardExp = document.getElementById('f-card-exp').value.trim();
  const cardCvc = document.getElementById('f-card-cvc').value.trim();

  if (!cardNum || !cardName || !cardExp || !cardCvc) {
    document.getElementById('orderError').textContent = 'Lutfen kart bilgilerini doldurun'; return;
  }

  const subtotal = cart.reduce((s, c) => s + c.price * (c.qty||1), 0);
  const discount = discountData ? discountData.discount : 0;
  const shippingCost = selectedShipping ? selectedShipping.price : 0;
  const total = subtotal - discount + shippingCost;

  const btn = document.getElementById('placeOrderBtn');
  btn.disabled = true; btn.textContent = 'Isleniyor...';

  try {
    const r = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customer_name: document.getElementById('f-name').value + ' ' + document.getElementById('f-surname').value,
        customer_email: document.getElementById('f-email').value,
        customer_phone: '+90' + document.getElementById('f-phone').value,
        address: document.getElementById('f-address').value,
        address_detail: document.getElementById('f-address2').value,
        city: document.getElementById('f-city').value,
        district: document.getElementById('f-district').value,
        zip_code: document.getElementById('f-zip').value,
        items: cart,
        total,
        discount_code: discountData ? discountData.code : null,
        discount_amount: discount,
        shipping_cost: shippingCost,
        shipping_method: selectedShipping ? selectedShipping.name : 'Standart',
        card_last4: cardNum.slice(-4),
      })
    });
    const d = await r.json();
    if (d.success) {
      localStorage.removeItem('nexo_cart');
      document.getElementById('successOrderId').textContent = d.orderId;
      goToStep('success');
      document.querySelectorAll('.co-section').forEach(s => s.classList.remove('active'));
      document.getElementById('section-success').classList.add('active');
    } else {
      document.getElementById('orderError').textContent = d.message || 'Hata olustu';
      btn.disabled = false; btn.textContent = 'Siparisi Tamamla';
    }
  } catch(e) {
    document.getElementById('orderError').textContent = 'Sunucu hatasi';
    btn.disabled = false; btn.textContent = 'Siparisi Tamamla';
  }
}

// ─── POSTAL CODES ─────────────────────────────────────────────────
const TR_POSTAL = {"Adana":"01","Adıyaman":"02","Afyonkarahisar":"03","Ağrı":"04","Aksaray":"68","Amasya":"05","Ankara":"06","Antalya":"07","Ardahan":"75","Artvin":"08","Aydın":"09","Balıkesir":"10","Bartın":"74","Batman":"72","Bayburt":"69","Bilecik":"11","Bingöl":"12","Bitlis":"13","Bolu":"14","Burdur":"15","Bursa":"16","Çanakkale":"17","Çankırı":"18","Çorum":"19","Denizli":"20","Diyarbakır":"21","Düzce":"81","Edirne":"22","Elazığ":"23","Erzincan":"24","Erzurum":"25","Eskişehir":"26","Gaziantep":"27","Giresun":"28","Gümüşhane":"29","Hakkari":"30","Hatay":"31","Iğdır":"76","Isparta":"32","İstanbul":"34","İzmir":"35","Kahramanmaraş":"46","Karabük":"78","Karaman":"70","Kars":"36","Kastamonu":"37","Kayseri":"38","Kırıkkale":"71","Kırklareli":"39","Kırşehir":"40","Kilis":"79","Kocaeli":"41","Konya":"42","Kütahya":"43","Malatya":"44","Manisa":"45","Mardin":"47","Mersin":"33","Muğla":"48","Muş":"49","Nevşehir":"50","Niğde":"51","Ordu":"52","Osmaniye":"80","Rize":"53","Sakarya":"54","Samsun":"55","Siirt":"56","Sinop":"57","Sivas":"58","Şanlıurfa":"63","Şırnak":"73","Tekirdağ":"59","Tokat":"60","Trabzon":"61","Tunceli":"62","Uşak":"64","Van":"65","Yalova":"77","Yozgat":"66","Zonguldak":"67"};
