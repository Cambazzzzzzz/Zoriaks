const fs = require("fs");
const path = require("path");

const files = {
  "public/complete.css": `
/* NEXO - Complete Styles */
:root{--bg:#0a0a0a;--fg:#fff;--accent:#fff;--muted:#666;--border:#1f1f1f;--card:#111;--card2:#161616;--radius:12px;--radius-lg:20px}
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html{scroll-behavior:smooth}
body{background:var(--bg);color:var(--fg);font-family:Inter,sans-serif;overflow-x:hidden;-webkit-font-smoothing:antialiased;line-height:1.6}
a{color:inherit;text-decoration:none}
button{cursor:pointer;border:none;background:none;font-family:inherit}
img{max-width:100%;display:block}
.btn-primary{display:inline-flex;align-items:center;gap:8px;padding:14px 32px;background:#fff;color:#000;font-weight:700;font-size:13px;letter-spacing:.08em;text-transform:uppercase;border-radius:4px;transition:all .2s;border:2px solid #fff}
.btn-primary:hover{background:transparent;color:#fff}
.btn-ghost{display:inline-flex;align-items:center;gap:8px;padding:14px 32px;background:transparent;color:#fff;font-weight:600;font-size:13px;letter-spacing:.08em;text-transform:uppercase;border-radius:4px;border:2px solid rgba(255,255,255,.2);transition:all .2s}
.btn-ghost:hover{border-color:#fff}
.announcement-bar{background:#000;color:#fff;padding:10px 0;overflow:hidden;border-bottom:1px solid var(--border)}
.announcement-track{display:flex;gap:40px;animation:scroll 30s linear infinite;white-space:nowrap;font-size:11px;letter-spacing:.15em;font-weight:600}
@keyframes scroll{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}
.navbar{position:sticky;top:0;z-index:100;background:rgba(10,10,10,.95);backdrop-filter:blur(10px);border-bottom:1px solid var(--border);padding:16px 24px;display:flex;align-items:center;justify-content:space-between}
.nav-left,.nav-right{display:flex;gap:12px;align-items:center;flex:1}
.nav-right{justify-content:flex-end}
.logo{font-size:20px;font-weight:900;letter-spacing:.15em;font-family:Space Grotesk,sans-serif}
.nav-icon-btn{width:40px;height:40px;display:flex;align-items:center;justify-content:center;border-radius:50%;transition:background .2s;position:relative}
.nav-icon-btn:hover{background:var(--card)}
.cart-count{position:absolute;top:4px;right:4px;background:#fff;color:#000;font-size:9px;font-weight:700;width:16px;height:16px;border-radius:50%;display:flex;align-items:center;justify-content:center}
.hero{min-height:100vh;display:flex;align-items:center;justify-content:center;position:relative;padding:40px 20px}
.hero-bg{position:absolute;inset:0;background:radial-gradient(circle at 50% 50%,#1a1a2e 0%,#0a0a0a 100%);z-index:0}
.hero-content{position:relative;z-index:1;text-align:center;max-width:900px}
.hero-badge{display:inline-block;padding:8px 20px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);border-radius:30px;font-size:11px;letter-spacing:.15em;font-weight:600;margin-bottom:32px}
.hero-title{font-size:clamp(48px,10vw,120px);font-weight:900;line-height:.9;margin-bottom:24px;font-family:Space Grotesk,sans-serif}
.hero-line{display:block}
.hero-line.outline{-webkit-text-stroke:2px #fff;color:transparent}
.hero-sub{font-size:18px;color:var(--muted);margin-bottom:40px;max-width:500px;margin-left:auto;margin-right:auto}
.hero-actions{display:flex;gap:16px;justify-content:center;flex-wrap:wrap}
.section-header{text-align:center;margin-bottom:60px;padding:0 20px}
.section-tag{display:inline-block;font-size:11px;letter-spacing:.2em;text-transform:uppercase;font-weight:700;color:var(--muted);margin-bottom:12px}
.section-title{font-size:clamp(32px,5vw,56px);font-weight:900;font-family:Space Grotesk,sans-serif}
.collections{padding:100px 20px}
.collections-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:24px;max-width:1400px;margin:0 auto}
.collection-card{background:var(--card);border-radius:var(--radius-lg);overflow:hidden;cursor:pointer;transition:transform .3s}
.collection-card:hover{transform:translateY(-8px)}
.collection-img{height:400px;position:relative;display:flex;align-items:center;justify-content:center}
.collection-overlay-text{font-size:80px;font-weight:900;opacity:.1;font-family:Space Grotesk,sans-serif}
.collection-info{padding:24px}
.collection-info h3{font-size:20px;font-weight:700;margin-bottom:8px}
.collection-info p{color:var(--muted);font-size:14px;margin-bottom:16px}
.collection-link{font-size:13px;font-weight:600;letter-spacing:.08em}
.products-section{padding:100px 20px;background:var(--card2)}
.filter-tabs{display:flex;gap:12px;justify-content:center;margin-bottom:60px;flex-wrap:wrap}
.filter-tab{padding:10px 24px;background:transparent;color:var(--muted);font-size:13px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;border-radius:30px;border:1px solid var(--border);transition:all .2s}
.filter-tab.active,.filter-tab:hover{background:#fff;color:#000;border-color:#fff}
.products-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:32px;max-width:1400px;margin:0 auto}
.product-card{background:var(--card);border-radius:var(--radius);overflow:hidden;cursor:pointer;transition:transform .3s}
.product-card:hover{transform:translateY(-4px)}
.product-img{height:350px;background:var(--card2);display:flex;align-items:center;justify-content:center;position:relative;overflow:hidden}
.product-img img{width:100%;height:100%;object-fit:cover}
.product-badge{position:absolute;top:12px;right:12px;background:#fff;color:#000;padding:6px 12px;border-radius:4px;font-size:10px;font-weight:700;letter-spacing:.1em}
.product-info{padding:20px}
.product-name{font-size:16px;font-weight:700;margin-bottom:8px}
.product-price{font-size:18px;font-weight:900}
.product-old-price{font-size:14px;color:var(--muted);text-decoration:line-through;margin-left:8px}
.about-section{padding:120px 20px;background:var(--bg)}
.about-inner{max-width:1200px;margin:0 auto;display:grid;grid-template-columns:1fr 1fr;gap:80px;align-items:center}
.about-title{font-size:clamp(32px,5vw,48px);font-weight:900;margin-bottom:24px;line-height:1.1;font-family:Space Grotesk,sans-serif}
.about-desc{color:var(--muted);margin-bottom:20px;font-size:16px;line-height:1.8}
.features-section{padding:80px 20px;background:var(--card2)}
.features-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:32px;max-width:1200px;margin:0 auto}
.feature-item{text-align:center;padding:32px}
.feature-icon{width:56px;height:56px;margin:0 auto 20px;display:flex;align-items:center;justify-content:center;background:var(--card);border-radius:50%}
.feature-item h4{font-size:16px;font-weight:700;margin-bottom:8px}
.feature-item p{color:var(--muted);font-size:14px}
.footer{background:#000;padding:60px 20px 20px;border-top:1px solid var(--border)}
.footer-top{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:40px;max-width:1200px;margin:0 auto 40px}
.footer-logo{font-size:24px;font-weight:900;letter-spacing:.15em;display:block;margin-bottom:12px;font-family:Space Grotesk,sans-serif}
.footer-links-group h5{font-size:14px;font-weight:700;margin-bottom:16px;letter-spacing:.08em}
.footer-links-group a{display:block;color:var(--muted);font-size:14px;margin-bottom:12px;transition:color .2s}
.footer-links-group a:hover{color:#fff}
.footer-bottom{max-width:1200px;margin:0 auto;padding-top:20px;border-top:1px solid var(--border);display:flex;justify-content:space-between;align-items:center;font-size:12px;color:var(--muted)}
.toast{position:fixed;bottom:24px;right:24px;background:#fff;color:#000;padding:16px 24px;border-radius:8px;font-weight:600;z-index:1000;transform:translateY(100px);opacity:0;transition:all .3s}
.toast.show{transform:translateY(0);opacity:1}
@media(max-width:768px){.about-inner{grid-template-columns:1fr;gap:40px}.footer-bottom{flex-direction:column;gap:16px}}
`
};

Object.entries(files).forEach(([file, content]) => {
  const dir = path.dirname(file);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(file, content.trim(), "utf-8");
  console.log(`✓ ${file}`);
});

console.log("Done!");
