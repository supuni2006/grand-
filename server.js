// The Victoria Grand - order server (no npm packages needed).
//   Run:   node server.js        Customer site: http://localhost:3000
//   Staff: http://localhost:3000/admin.html   (admin key is printed on first start / saved in admin-key.txt)
//
// What it does
//   - receives orders from the website, re-prices them from config.js (so customers can't change prices)
//   - gives every order an ID and a live status: confirmed -> preparing -> out -> delivered (or cancelled)
//   - lets staff change the status; the customer's tracking screen updates automatically
//   - customer accounts (email + password): sign up / sign in, saved details, order history
//   - saves everything in orders.json, users.json, sessions.json
const http = require('http'), fs = require('fs'), path = require('path'), crypto = require('crypto'), vm = require('vm');
const PORT = process.env.PORT || 3000, ROOT = __dirname;
const DB = path.join(ROOT, 'orders.json'), KEYFILE = path.join(ROOT, 'admin-key.txt'), UF = path.join(ROOT, 'users.json'), SF = path.join(ROOT, 'sessions.json');
const STATUSES = ['awaiting_payment', 'confirmed', 'preparing', 'out', 'delivered', 'cancelled'];

// --- online card payments via PayHere (https://www.payhere.lk) ---
// Needs: PAYHERE_MERCHANT_ID, PAYHERE_SECRET, PUBLIC_URL (public https address of this site, e.g. your ngrok URL).
// PAYHERE_SANDBOX=0 switches from the test gateway to live. Without these, the option is hidden and nothing changes.
const PH = { id: process.env.PAYHERE_MERCHANT_ID || '', secret: process.env.PAYHERE_SECRET || '', sandbox: process.env.PAYHERE_SANDBOX !== '0', base: (process.env.PUBLIC_URL || '').replace(/\/+$/, '') };
const CARD_ONLINE = !!(PH.id && PH.secret && PH.base);
const md5u = t => crypto.createHash('md5').update(String(t)).digest('hex').toUpperCase();
function payParams(o) {
  const amt = o.total.toFixed(2), parts = o.customer.name.split(/\s+/);
  return { action: PH.sandbox ? 'https://sandbox.payhere.lk/pay/checkout' : 'https://www.payhere.lk/pay/checkout', fields: {
    merchant_id: PH.id, return_url: PH.base + '/#cart', cancel_url: PH.base + '/#cart', notify_url: PH.base + '/api/payhere/notify',
    order_id: o.id, items: 'The Victoria Grand order ' + o.id, currency: 'LKR', amount: amt,
    first_name: parts[0] || 'Customer', last_name: parts.slice(1).join(' ') || '-', email: o.customer.email || 'customer@example.com',
    phone: o.customer.phone, address: o.customer.address, city: o.customer.city || 'Wattala', country: 'Sri Lanka',
    hash: md5u(PH.id + o.id + amt + 'LKR' + md5u(PH.secret)) } };
}

// --- admin key: ADMIN_KEY env var, else admin-key.txt, else generate one ---
let ADMIN_KEY = process.env.ADMIN_KEY || (fs.existsSync(KEYFILE) ? fs.readFileSync(KEYFILE, 'utf8').trim() : '');
if (!ADMIN_KEY) { ADMIN_KEY = crypto.randomBytes(9).toString('base64url'); fs.writeFileSync(KEYFILE, ADMIN_KEY + '\n'); console.log('Created admin key (saved in admin-key.txt):', ADMIN_KEY); }
const okKey = k => { const a = Buffer.from(String(k || '')), b = Buffer.from(ADMIN_KEY); return a.length === b.length && crypto.timingSafeEqual(a, b); };

// --- menu + prices come from config.js (single source of truth) ---
function loadConfig() { return vm.runInNewContext(fs.readFileSync(path.join(ROOT, 'config.js'), 'utf8') + '\n({CONFIG, MENU})', {}); }

// --- storage ---
const readDB = () => { try { return JSON.parse(fs.readFileSync(DB, 'utf8')); } catch (_) { return []; } };
const writeDB = list => { const t = DB + '.tmp'; fs.writeFileSync(t, JSON.stringify(list, null, 2)); fs.renameSync(t, DB); };
const newId = () => 'VG-' + crypto.randomBytes(4).toString('hex').toUpperCase();
const clean = (v, n) => String(v == null ? '' : v).replace(/[\u0000-\u001f<>]/g, ' ').trim().slice(0, n);
const pub = o => ({ id: o.id, status: o.status, history: o.history, items: o.items, subtotal: o.subtotal, delivery: o.delivery, total: o.total, createdAt: o.createdAt, payment: o.customer.payment, paid: !!o.paid, refund: o.refund || '' });

// --- accounts: email + password (scrypt-hashed), cookie sessions ---
const rj = (f, d) => { try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch (_) { return d; } };
const wj = (f, v) => { const t = f + '.tmp'; fs.writeFileSync(t, JSON.stringify(v, null, 2), { mode: 0o600 }); fs.renameSync(t, f); };
const scrypt = (pw, salt) => new Promise((ok, no) => crypto.scrypt(pw, salt, 64, (e, k) => e ? no(e) : ok(k)));
const normEmail = e => String(e || '').trim().toLowerCase().slice(0, 254);
const EMAIL = /^[^\s@]{1,64}@[^\s@]+\.[^\s@]{2,}$/;
const sha = t => crypto.createHash('sha256').update(t).digest('hex');
const cookieOf = req => { const m = (req.headers.cookie || '').match(/(?:^|;\s*)vg_s=([\w-]+)/); return m ? m[1] : ''; };
function sessionUser(req) { const t = cookieOf(req); if (!t) return null; const s = rj(SF, {})[sha(t)]; if (!s || s.exp < Date.now()) return null; return rj(UF, []).find(u => u.id === s.uid) || null; }
function startSession(req, uid) {
  const t = crypto.randomBytes(32).toString('base64url'), S = rj(SF, {}), now = Date.now();
  for (const k in S) if (S[k].exp < now) delete S[k];
  S[sha(t)] = { uid, exp: now + 30 * 864e5 }; wj(SF, S);
  const secure = process.env.COOKIE_SECURE === '1' || req.headers['x-forwarded-proto'] === 'https';
  return 'vg_s=' + t + '; HttpOnly; SameSite=Lax; Path=/; Max-Age=' + 30 * 86400 + (secure ? '; Secure' : '');
}
const upub = u => ({ id: u.id, email: u.email, name: u.name, phone: u.phone || '', address: u.address || '', city: u.city || '', postal: u.postal || '' });
const rate = (m, k, max, win = 6e5) => { const now = Date.now(), a = (m.get(k) || []).filter(t => now - t < win); a.push(now); m.set(k, a); return a.length > max; };
const fails = new Map(), signups = new Map();
const recentFails = k => (fails.get(k) || []).filter(t => Date.now() - t < 6e5).length;

// Reset a forgotten password (no email service needed):  node server.js reset-password user@example.com NewPassword
if (process.argv[2] === 'reset-password') {
  (async () => {
    const em = normEmail(process.argv[3]), pw = process.argv[4] || '', L = rj(UF, []), u = L.find(x => x.email === em);
    if (!u || pw.length < 8) { console.log('Usage: node server.js reset-password user@example.com NewPassword   (8+ characters, account must exist)'); process.exit(1); }
    u.salt = crypto.randomBytes(16).toString('hex'); u.hash = (await scrypt(pw, u.salt)).toString('hex'); wj(UF, L); wj(SF, {});
    console.log('Password updated for', em); process.exit(0);
  })();
  return;
}

// --- PickMe hook ---
// PickMe has no public merchant API. Once PickMe's merchant team gives you an order URL + key, set:
//   PICKME_WEBHOOK_URL=https://...   PICKME_API_KEY=...   (then run: node server.js)
// Every new order is then POSTed there as JSON. If PickMe's format differs, adjust `payload` below.
// Nothing is sent while PICKME_WEBHOOK_URL is empty. A PickMe failure never blocks the customer's order.
async function forwardToPickMe(order) {
  const url = process.env.PICKME_WEBHOOK_URL;
  if (!url) return;
  const payload = { orderId: order.id, createdAt: order.createdAt, customer: order.customer, items: order.items, subtotal: order.subtotal, delivery: order.delivery, total: order.total, payment: order.customer.payment };
  const headers = { 'Content-Type': 'application/json' };
  if (process.env.PICKME_API_KEY) headers.Authorization = 'Bearer ' + process.env.PICKME_API_KEY;
  const r = await fetch(url, { method: 'POST', headers, body: JSON.stringify(payload), signal: AbortSignal.timeout(8000) });
  if (!r.ok) throw new Error('PickMe replied HTTP ' + r.status);
  console.log('Order', order.id, 'sent to PickMe');
}

// --- tiny rate limit: 10 orders / 10 min / IP ---
const hits = new Map();
const limited = ip => rate(hits, ip, 10);

const send = (res, code, obj, h = {}) => { res.writeHead(code, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...h }); res.end(JSON.stringify(obj)); };
const readBody = (req, cb) => { if (!/^application\/json/i.test(req.headers['content-type'] || '')) return cb(new Error('Content-Type must be application/json')); let b = ''; req.on('data', c => { b += c; if (b.length > 1e5) req.destroy(); }); req.on('end', () => { try { cb(null, JSON.parse(b || '{}')); } catch (e) { cb(e); } }); };

const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml' };
const PUBLIC = new Set(['index.html', 'admin.html', 'config.js']);

http.createServer((req, res) => {
  const url = new URL(req.url, 'http://x'), p = url.pathname;
  const ip = req.socket.remoteAddress;


  // ---- customer accounts ----
  if (p === '/api/auth/signup' && req.method === 'POST')
    return readBody(req, async (err, b) => {
      if (err) return send(res, 400, { error: 'Bad request' });
      if (rate(signups, ip, 10)) return send(res, 429, { error: 'Too many attempts. Please try again later.' });
      const name = clean(b.name, 80), email = normEmail(b.email), pw = String(b.password || '');
      if (!name) return send(res, 400, { error: 'Please enter your name' });
      if (!EMAIL.test(email)) return send(res, 400, { error: 'Please enter a valid email address' });
      if (pw.length < 8 || pw.length > 200) return send(res, 400, { error: 'Password must be at least 8 characters' });
      const ph = clean(b.phone, 20); if (ph && !/^[+\d][\d\s-]{6,18}$/.test(ph)) return send(res, 400, { error: 'Please enter a valid phone number' });
      const L = rj(UF, []);
      if (L.some(u => u.email === email)) return send(res, 409, { error: 'This email is already registered. Please sign in.' });
      const salt = crypto.randomBytes(16).toString('hex'), hash = (await scrypt(pw, salt)).toString('hex');
      const u = { id: 'U-' + crypto.randomBytes(6).toString('hex'), email, name, phone: ph, salt, hash, createdAt: Date.now() };
      L.push(u); wj(UF, L);
      send(res, 200, { user: upub(u) }, { 'Set-Cookie': startSession(req, u.id) });
    });
  if (p === '/api/auth/login' && req.method === 'POST')
    return readBody(req, async (err, b) => {
      if (err) return send(res, 400, { error: 'Bad request' });
      const email = normEmail(b.email), key = ip + '|' + email;
      if (recentFails(key) >= 8) return send(res, 429, { error: 'Too many failed attempts. Please try again in 10 minutes.' });
      const u = rj(UF, []).find(x => x.email === email), salt = u ? u.salt : '00'.repeat(16);
      const got = await scrypt(String(b.password || '').slice(0, 200), salt), want = Buffer.from(u ? u.hash : '00'.repeat(64), 'hex');
      if (!u || got.length !== want.length || !crypto.timingSafeEqual(got, want)) { rate(fails, key, 99); return send(res, 401, { error: 'Wrong email or password' }); }
      fails.delete(key);
      send(res, 200, { user: upub(u) }, { 'Set-Cookie': startSession(req, u.id) });
    });
  if (p === '/api/auth/logout' && req.method === 'POST') {
    const t = cookieOf(req); if (t) { const S = rj(SF, {}); delete S[sha(t)]; wj(SF, S); }
    return send(res, 200, { ok: true }, { 'Set-Cookie': 'vg_s=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0' });
  }
  if (p === '/api/me' && req.method === 'GET') { const u = sessionUser(req); return u ? send(res, 200, { user: upub(u) }) : send(res, 401, { error: 'Not signed in' }); }
  if (p === '/api/me' && req.method === 'PATCH') {
    const u = sessionUser(req); if (!u) return send(res, 401, { error: 'Not signed in' });
    return readBody(req, (err, b) => {
      if (err) return send(res, 400, { error: 'Bad request' });
      const name = clean(b.name, 80); if (!name) return send(res, 400, { error: 'Please enter your name' });
      const ph = clean(b.phone, 20); if (ph && !/^[+\d][\d\s-]{6,18}$/.test(ph)) return send(res, 400, { error: 'Please enter a valid phone number' });
      const L = rj(UF, []), me = L.find(x => x.id === u.id);
      Object.assign(me, { name, phone: ph, address: clean(b.address, 200), city: clean(b.city, 60), postal: clean(b.postal, 12) }); wj(UF, L);
      send(res, 200, { user: upub(me) });
    });
  }
  if (p === '/api/me/orders' && req.method === 'GET') {
    const u = sessionUser(req); if (!u) return send(res, 401, { error: 'Not signed in' });
    return send(res, 200, readDB().filter(o => o.userId === u.id).slice(-100).reverse().map(pub));
  }

  // ---- API ----
  if (p === '/api/orders' && req.method === 'POST') {
    if (limited(ip)) return send(res, 429, { error: 'Too many orders, please call us.' });
    return readBody(req, async (err, b) => {
      if (err) return send(res, 400, { error: 'Bad request' });
      let cfg; try { cfg = loadConfig(); } catch (_) { return send(res, 500, { error: 'Server config error' }); }
      const c = b.customer || {}, name = clean(c.n, 80), phone = clean(c.p, 20), addr = clean(c.a, 200);
      if (!name || !phone || !addr) return send(res, 400, { error: 'Name, phone and address are required' });
      if (!/^[+\d][\d\s-]{6,18}$/.test(phone)) return send(res, 400, { error: 'Please enter a valid phone number' });
      if (!Array.isArray(b.items) || !b.items.length || b.items.length > 30) return send(res, 400, { error: 'Your cart is empty' });
      const items = [];
      for (const it of b.items) {
        const m = cfg.MENU.find(x => x[0] === it.name), qty = Math.floor(Number(it.qty));
        if (!m || !(qty >= 1 && qty <= 50)) return send(res, 400, { error: 'Invalid item: ' + clean(it.name, 40) });
        items.push({ name: m[0], qty, price: m[5] });
      }
      const wantsOnline = c.pay === 'Pay online by card';
      if (wantsOnline && !CARD_ONLINE) return send(res, 400, { error: 'Online card payment is not available right now. Please choose another payment method.' });
      const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0), delivery = cfg.CONFIG.deliveryFee, now = Date.now();
      const user = sessionUser(req);
      const order = { id: newId(), userId: user ? user.id : null, status: wantsOnline ? 'awaiting_payment' : 'confirmed', history: [{ s: wantsOnline ? 'awaiting_payment' : 'confirmed', t: now }], paid: false, createdAt: now,
        customer: { name, phone, email: user ? user.email : '', address: addr, city: clean(c.c, 60), postal: clean(c.z, 12), payment: wantsOnline ? 'Pay online by card' : (['Cash on delivery', 'Card on delivery'].includes(c.pay) ? c.pay : 'Cash on delivery') },
        items, subtotal, delivery, total: subtotal + delivery };
      const list = readDB(); list.push(order); writeDB(list);
      console.log(new Date().toLocaleTimeString(), 'NEW ORDER', order.id, name, 'LKR', order.total);
      if (!wantsOnline) forwardToPickMe(order).catch(e => console.error('PickMe forward failed:', e.message));   // not awaited: never slows the customer
      send(res, 200, { ok: true, id: order.id, total: order.total, order: pub(order), pay: wantsOnline ? payParams(order) : undefined });
    });
  }
  let m;
  if (p === '/api/config' && req.method === 'GET') return send(res, 200, { cardOnline: CARD_ONLINE, sandbox: PH.sandbox });
  // PayHere calls this (server to server) after a card payment. The signature is checked, so it can't be faked.
  if (p === '/api/payhere/notify' && req.method === 'POST') {
    let body = ''; req.on('data', c => { body += c; if (body.length > 2e4) req.destroy(); });
    return req.on('end', () => {
      const f = Object.fromEntries(new URLSearchParams(body));
      if (!CARD_ONLINE || f.merchant_id !== PH.id) return send(res, 400, { error: 'bad request' });
      const want = md5u(PH.id + f.order_id + f.payhere_amount + f.payhere_currency + f.status_code + md5u(PH.secret)), got = String(f.md5sig || '').toUpperCase();
      if (got.length !== want.length || !crypto.timingSafeEqual(Buffer.from(got), Buffer.from(want))) return send(res, 400, { error: 'bad signature' });
      const list = readDB(), o = list.find(x => x.id === f.order_id);
      if (!o || f.payhere_currency !== 'LKR' || Number(f.payhere_amount).toFixed(2) !== o.total.toFixed(2)) return send(res, 400, { error: 'mismatch' });
      if (f.status_code === '2' && !o.paid) {
        o.paid = true; o.paymentId = clean(f.payment_id, 40);
        if (o.status === 'awaiting_payment') { o.status = 'confirmed'; o.history.push({ s: 'confirmed', t: Date.now() }); forwardToPickMe(o).catch(e => console.error('PickMe forward failed:', e.message)); }
        else if (o.status === 'cancelled') o.refund = 'due';
        writeDB(list); console.log(new Date().toLocaleTimeString(), 'PAID', o.id, 'LKR', o.total);
      }
      res.writeHead(200); res.end('OK');
    });
  }
  // Customer cancels / retries payment (the unguessable order ID is the key; signed-in customers' orders also need their session)
  if ((m = p.match(/^\/api\/orders\/(VG-[0-9A-F]{8})\/(cancel|pay)$/)) && req.method === 'POST') {
    const list = readDB(), o = list.find(x => x.id === m[1]);
    if (!o) return send(res, 404, { error: 'Order not found' });
    if (o.userId) { const u = sessionUser(req); if (!u || u.id !== o.userId) return send(res, 403, { error: 'Please sign in to manage this order' }); }
    if (m[2] === 'pay') {
      if (o.status !== 'awaiting_payment' || !CARD_ONLINE) return send(res, 409, { error: 'This order is not waiting for payment' });
      return send(res, 200, { pay: payParams(o) });
    }
    if (o.status !== 'confirmed' && o.status !== 'awaiting_payment')
      return send(res, 409, { error: o.status === 'cancelled' ? 'This order is already cancelled.' : 'Sorry, your order is already being prepared, so it can no longer be cancelled here. Please call +94 112 935 757.' });
    o.status = 'cancelled'; o.history.push({ s: 'cancelled', t: Date.now() }); if (o.paid) o.refund = 'due';
    writeDB(list); console.log(new Date().toLocaleTimeString(), 'CANCELLED by customer', o.id, o.refund === 'due' ? '(REFUND DUE)' : '');
    return send(res, 200, { ok: true, order: pub(o) });
  }
  if ((m = p.match(/^\/api\/orders\/(VG-[0-9A-F]{8})$/)) && req.method === 'GET') {          // customer status (needs the unguessable ID)
    const o = readDB().find(x => x.id === m[1]);
    return o ? send(res, 200, pub(o)) : send(res, 404, { error: 'Not found' });
  }
  if (p.startsWith('/api/admin/')) {                                                          // staff only
    if (!okKey(req.headers['x-admin-key'])) return send(res, 401, { error: 'Wrong admin key' });
    if (p === '/api/admin/orders' && req.method === 'GET') return send(res, 200, readDB().slice(-200).reverse());
    if ((m = p.match(/^\/api\/admin\/orders\/(VG-[0-9A-F]{8})$/)) && req.method === 'PATCH')
      return readBody(req, (err, b) => {
        if (err) return send(res, 400, { error: 'Bad request' });
        const list = readDB(), o = list.find(x => x.id === m[1]);
        if (!o) return send(res, 404, { error: 'Not found' });
        if (b.refunded === true) { if (o.refund === 'due') { o.refund = 'done'; writeDB(list); } return send(res, 200, o); }
        if (!STATUSES.includes(b.status)) return send(res, 400, { error: 'Bad status' });
        if (o.status === 'awaiting_payment' && b.status !== 'cancelled') return send(res, 400, { error: 'Still waiting for the card payment' });
        if (o.status !== b.status) { o.status = b.status; o.history.push({ s: b.status, t: Date.now() }); if (b.status === 'cancelled' && o.paid) o.refund = 'due'; writeDB(list); }
        send(res, 200, o);
      });
    return send(res, 404, { error: 'Not found' });
  }

  // ---- static files (whitelist only: never serves orders.json, server.js, admin-key.txt) ----
  let rel = p === '/' ? 'index.html' : decodeURIComponent(p).replace(/^\/+/, '');
  if (!(PUBLIC.has(rel) || /^images\/[\w\-. \/]+$/.test(rel)) || rel.includes('..')) { res.writeHead(404); return res.end('Not found'); }
  fs.readFile(path.join(ROOT, rel), (err, data) => {
    if (err) { res.writeHead(404); return res.end('Not found'); }
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(rel)] || 'application/octet-stream', 'Cache-Control': rel === 'config.js' || rel.endsWith('.html') ? 'no-cache' : 'public, max-age=3600' });
    res.end(data);
  });
}).listen(PORT, () => console.log('Victoria Grand running on http://localhost:' + PORT + '  (staff page: /admin.html)'));