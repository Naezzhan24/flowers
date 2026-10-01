const app = document.getElementById('app');
const rainEl = document.getElementById('rain');
const wipe = document.getElementById('wipe');
const root = document.documentElement;

const HOME_THEME = { bg1: '#25102e', bg2: '#7a2f5c', glow: '#ff9ec4', rain: ['#ffc2d9', '#ff9ec4', '#fff0f5', '#f7a8c0'] };
const rand = (a, b) => a + Math.random() * (b - a);

let busy = false;
let typeTimer = null;

/* ---------------- music ----------------
   Ilagay sa folder na  music/  ang mga file na pinangalanang
   a, b, c, d, e  (mp3 / m4a / ogg / wav) — optional: home  */
const MUSIC_EXT = ['mp3', 'm4a', 'ogg', 'wav'];
const music = { all: new Set(), id: null, muted: false, token: 0 };

// each audio has its own fade timer so one fade never cancels another
function fadeTo(audio, target, ms, done) {
  clearInterval(audio._fade);
  const from = audio.volume, t0 = performance.now();
  audio._fade = setInterval(() => {
    const p = Math.min(1, (performance.now() - t0) / ms);
    audio.volume = Math.max(0, Math.min(1, from + (target - from) * p));
    if (p === 1) { clearInterval(audio._fade); done && done(); }
  }, 40);
}

function killAudio(a) {
  clearInterval(a._fade);
  a.pause();
  music.all.delete(a);
}

function stopMusic() {
  music.token++;
  music.id = null;
  music.all.forEach((a) => {
    a._dead = true;
    fadeTo(a, 0, 450, () => killAudio(a));
  });
}

function playMusic(id) {
  if (music.id === id) return;
  stopMusic();
  music.id = id;
  const my = music.token;
  let n = 0;
  const tryNext = () => {
    if (my !== music.token || n >= MUSIC_EXT.length) return;
    const a = new Audio(`music/${id}.${MUSIC_EXT[n++]}`);
    a.loop = true; a.volume = 0; a.muted = music.muted;
    music.all.add(a);
    a.addEventListener('error', () => { music.all.delete(a); tryNext(); }, { once: true });
    a.play().then(() => {
      if (my !== music.token) { killAudio(a); return; }
      fadeTo(a, .7, 1500);
    }).catch(() => { /* file missing or autoplay blocked */ });
  };
  tryNext();
}

function toggleMute(btn) {
  music.muted = !music.muted;
  music.all.forEach((a) => { a.muted = music.muted; });
  btn.textContent = music.muted ? '🔇' : '🔊';
}

/* ---------------- theme + petals ---------------- */
function setTheme(t) {
  root.style.setProperty('--bg1', t.bg1);
  root.style.setProperty('--bg2', t.bg2);
  root.style.setProperty('--glow', t.glow);
}

function rain(colors, count) {
  rainEl.innerHTML = '';
  for (let i = 0; i < count; i++) {
    const p = document.createElement('div');
    const s = rand(9, 20);
    p.className = 'rp';
    p.style.cssText = `left:${rand(0, 100)}%;width:${s}px;height:${s * 1.3}px;background:${colors[i % colors.length]};` +
      `--sx:${rand(-90, 90)}px;animation-duration:${rand(9, 18)}s;animation-delay:${rand(-18, 0)}s`;
    rainEl.appendChild(p);
  }
}

/* ---------------- burst (click sparkles) ---------------- */
function burst(x, y, colors) {
  const chars = ['❤', '✿', '❀', '✦'];
  for (let i = 0; i < 16; i++) {
    const p = document.createElement('span');
    p.className = 'pt';
    p.textContent = chars[i % chars.length];
    p.style.cssText = `left:${x}px;top:${y}px;color:${colors[i % colors.length]};font-size:${rand(12, 26)}px`;
    document.body.appendChild(p);
    const a = rand(0, Math.PI * 2), d = rand(50, 150);
    p.animate([
      { transform: 'translate(-50%,-50%) scale(.3)', opacity: 1 },
      { transform: `translate(${Math.cos(a) * d - 12}px,${Math.sin(a) * d - 70}px) scale(1) rotate(${rand(-90, 90)}deg)`, opacity: 0 },
    ], { duration: rand(900, 1500), easing: 'cubic-bezier(.2,.8,.3,1)' }).finished.then(() => p.remove());
  }
}

/* ---------------- flower pictures (lightbox) ---------------- */
const PHOTO_EXT = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'JPG', 'PNG'];
const lb = {
  el: document.getElementById('lightbox'),
  card: document.getElementById('lbCard'),
  img: document.getElementById('lbImg'),
  miss: document.getElementById('lbMiss'),
  cap: document.getElementById('lbCap'),
  nav: document.getElementById('lbNav'),
  count: document.getElementById('lbCount'),
  slot: document.getElementById('lbFlower'),
  list: [], i: 0, token: 0, opener: null, closing: false,
};

function lbShow(animate = true) {
  const p = lb.list[lb.i], my = ++lb.token;
  const hasExt = /\.[a-z0-9]{2,4}$/i.test(p.src);
  const tries = hasExt ? [p.src] : PHOTO_EXT.map((e) => `${p.src}.${e}`);
  let n = 0;
  lb.img.style.display = 'none';
  lb.miss.style.display = 'none';
  lb.card.classList.remove('flip');
  if (animate) {
    void lb.card.offsetWidth;
    lb.card.classList.add('flip');
  }
  const next = () => {
    if (my !== lb.token) return;
    if (n >= tries.length) {
      lb.miss.textContent = `Ilagay ang picture sa  ${hasExt ? p.src : p.src + '.jpg'}`;
      lb.miss.style.display = 'block';
      return;
    }
    lb.img.src = tries[n++];
  };
  lb.img.onload = () => { if (my === lb.token) lb.img.style.display = 'block'; };
  lb.img.onerror = next;
  next();
  lb.cap.textContent = p.caption || '';
  lb.cap.style.display = p.caption ? 'block' : 'none';
  lb.count.textContent = `${lb.i + 1} / ${lb.list.length}`;
  lb.nav.style.display = lb.list.length > 1 ? 'flex' : 'none';
}

/* the tapped flower flies out of the bouquet and sticks to the polaroid corner */
function flyFlower(svgMarkup, from, to, fromDeg, toDeg, ms, done) {
  const el = document.createElement('div');
  el.className = 'fly';
  el.style.cssText = `left:${from.left}px;top:${from.top}px;width:${from.width}px;height:${from.height}px`;
  el.innerHTML = svgMarkup;
  document.body.appendChild(el);
  const dx = to.x - (from.left + from.width / 2), dy = to.y - (from.top + from.height / 2);
  const s = to.size / Math.max(from.width, from.height);
  el.animate([
    { transform: `translate(0,0) scale(1) rotate(${fromDeg}deg)` },
    { transform: `translate(${dx * .5}px,${dy * .5 - 80}px) scale(${(1 + s) / 2 * 1.2}) rotate(${180 + (fromDeg + toDeg) / 2}deg)`, offset: .5 },
    { transform: `translate(${dx}px,${dy}px) scale(${s}) rotate(${360 + toDeg}deg)` },
  ], { duration: ms, easing: 'cubic-bezier(.3,.7,.25,1)', fill: 'forwards' }).finished.then(() => { el.remove(); done && done(); });
}

const slotTarget = () => {
  const r = lb.slot.getBoundingClientRect(); // rotation keeps the centre
  return { x: r.left + r.width / 2, y: r.top + r.height / 2, size: lb.slot.offsetWidth };
};
const SLOT_DEG = 14;

function openPhotos(list, opener, start = 0) {
  if (lb.closing) return;
  lb.list = list; lb.i = start; lb.opener = opener;
  lb.el.hidden = false;
  lb.slot.innerHTML = '';
  requestAnimationFrame(() => lb.el.classList.add('open'));
  lbShow(false);

  // flower: bouquet -> polaroid
  const fl = opener && opener.matches && opener.matches('.fl') ? opener : null;
  if (!fl) return;
  const bb = fl.getBBox(), r = fl.getBoundingClientRect();
  const markup = `<svg viewBox="${bb.x} ${bb.y} ${bb.width} ${bb.height}" class="flw-clone" overflow="visible">${fl.innerHTML}</svg>`;
  lb.flower = { markup, from: r };
  fl.classList.add('picked');
  flyFlower(markup, r, slotTarget(), 0, SLOT_DEG, 950, () => { lb.slot.innerHTML = markup; });
}

function closePhotos(instant) {
  if (lb.el.hidden || lb.closing) return;
  lb.token++;
  const fl = lb.opener && lb.opener.matches && lb.opener.matches('.fl') ? lb.opener : null;
  const finish = () => {
    lb.el.hidden = true;
    lb.closing = false;
    if (fl) { fl.classList.remove('picked'); fl.classList.add('back'); setTimeout(() => fl.classList.remove('back'), 700); }
    lb.opener && lb.opener.focus && lb.opener.focus({ preventScroll: true });
  };
  lb.el.classList.remove('open');
  if (!fl || instant || !fl.isConnected) { lb.slot.innerHTML = ''; finish(); return; }

  // flower: polaroid -> back onto its stem
  lb.closing = true;
  const t = slotTarget(), size = t.size;
  const from = { left: t.x - size / 2, top: t.y - size / 2, width: size, height: size };
  const r = fl.getBoundingClientRect();
  const to = { x: r.left + r.width / 2, y: r.top + r.height / 2, size: Math.max(r.width, r.height) };
  const markup = lb.flower.markup;
  lb.slot.innerHTML = '';
  flyFlower(markup, from, to, SLOT_DEG, 0, 800, finish);
}

const lbStep = (d) => { lb.i = (lb.i + d + lb.list.length) % lb.list.length; lbShow(); };
document.getElementById('lbClose').onclick = () => closePhotos();
document.getElementById('lbPrev').onclick = (e) => { e.stopPropagation(); lbStep(-1); };
document.getElementById('lbNext').onclick = (e) => { e.stopPropagation(); lbStep(1); };
lb.el.addEventListener('click', (e) => { if (e.target === lb.el) closePhotos(); });
// tap the picture itself = next picture (or close if only one)
lb.img.addEventListener('click', () => (lb.list.length > 1 ? lbStep(1) : closePhotos()));

/* ---------------- finale (peony): spinning bloom -> capybara -> memory book ---------------- */
const fin = { open: false, fl: null, el: null, timers: [] };
const finT = (fn, ms) => { const t = setTimeout(fn, ms); fin.timers.push(t); return t; };

function tapFlower(b, fl) {
  const f = b.flowers[+fl.dataset.f];
  if (f.finale) startFinale(b, fl);
  else openPhotos(f.photos, fl);
}

const finPhotos = (ids) => {
  const out = [];
  ids.forEach((id) => {
    const b = BOUQUETS.find((x) => x.id === id);
    if (b) b.flowers.forEach((f) => (f.photos || []).forEach((p) => out.push(p)));
  });
  return out;
};

// load an image, trying the usual extensions when none is given
function setImg(img, src, onfail) {
  const hasExt = /\.[a-z0-9]{2,4}$/i.test(src);
  const tries = hasExt ? [src] : PHOTO_EXT.map((e) => `${src}.${e}`);
  let n = 0;
  img.onerror = () => {
    if (n < tries.length) img.src = tries[n++];
    else { img.onerror = null; onfail && onfail(); }
  };
  img.src = tries[n++];
}
const loadImgs = (root, onfail) => root.querySelectorAll('img[data-src]').forEach((img) => setImg(img, img.dataset.src, () => onfail && onfail(img)));

const capySVG = (point) => `<svg viewBox="0 0 200 190" class="capy-svg" aria-hidden="true">
  <ellipse cx="100" cy="150" rx="72" ry="42" fill="#9a6640"/>
  <ellipse cx="62" cy="176" rx="17" ry="10" fill="#7d4f2e"/><ellipse cx="138" cy="176" rx="17" ry="10" fill="#7d4f2e"/>
  <ellipse cx="50" cy="52" rx="14" ry="11" fill="#8a5834"/><ellipse cx="50" cy="53" rx="7" ry="5" fill="#d9a07a"/>
  <ellipse cx="150" cy="52" rx="14" ry="11" fill="#8a5834"/><ellipse cx="150" cy="53" rx="7" ry="5" fill="#d9a07a"/>
  <ellipse cx="100" cy="92" rx="66" ry="52" fill="#b27a4c"/>
  <ellipse cx="100" cy="112" rx="44" ry="32" fill="#c78f5e"/>
  <ellipse cx="100" cy="94" rx="26" ry="14" fill="#6b3f24"/>
  <ellipse cx="91" cy="94" rx="4" ry="3" fill="#2d1608"/><ellipse cx="109" cy="94" rx="4" ry="3" fill="#2d1608"/>
  <circle cx="70" cy="76" r="6" fill="#2d1608"/><circle cx="130" cy="76" r="6" fill="#2d1608"/>
  <circle cx="72" cy="74" r="2" fill="#fff"/><circle cx="132" cy="74" r="2" fill="#fff"/>
  <circle cx="58" cy="100" r="9" fill="#ff9aa8" opacity=".45"/><circle cx="142" cy="100" r="9" fill="#ff9aa8" opacity=".45"/>
  <path d="M88 124Q100 134 112 124" stroke="#6b3f24" stroke-width="3" fill="none" stroke-linecap="round"/>
  ${point ? '<g class="cpaw"><ellipse cx="30" cy="124" rx="12" ry="21" fill="#9a6640" transform="rotate(32 30 124)"/><ellipse cx="22" cy="106" rx="7" ry="6" fill="#8a5834"/></g>' : ''}
</svg>`;

// whole-body capybara that wanders along the bottom of the finale (side view, facing right)
const CAPY_COL = {
  brown: { back: '#744b2b', mid: '#a5703f', belly: '#cb9d6b', snout: '#b98655', nose: '#3f2514', dark: '#573620', ear: '#6e4627' },
  pink: { back: '#d4829b', mid: '#f0a8bc', belly: '#f9cfda', snout: '#f5bccb', nose: '#9e3f63', dark: '#bf6481', ear: '#cf7893' },
};
let capyUid = 0;
const capyBody = (kind) => {
  const c = CAPY_COL[kind], id = `cg${capyUid++}`;
  const leg = (x, cls) => `<g class="lg ${cls}"><path d="M${x} 96h15v28q0 6-7.5 6t-7.5-6z" fill="${c.dark}"/><path d="M${x + 1} 126h13v4h-13z" fill="${c.nose}"/></g>`;
  return `<svg viewBox="0 0 270 140" class="capy-body" aria-hidden="true">
    <defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${c.back}"/><stop offset=".55" stop-color="${c.mid}"/><stop offset="1" stop-color="${c.belly}"/>
    </linearGradient></defs>
    <ellipse cx="128" cy="133" rx="104" ry="5" fill="#000" opacity=".22"/>
    ${leg(52, 'lg1')}${leg(76, 'lg2')}${leg(158, 'lg2')}${leg(182, 'lg1')}
    <path d="M26 92C20 58 62 36 122 36C176 36 212 48 224 74C232 94 218 114 194 118L62 118C42 118 29 108 26 92Z" fill="url(#${id})"/>
    <g stroke="${c.dark}" stroke-width="1.6" stroke-linecap="round" opacity=".28" fill="none">
      <path d="M52 56l7 6M74 46l6 7M100 42l5 7M128 40l4 7M156 42l4 7M184 50l5 6M62 76l7 5M92 66l6 6M122 64l5 6M152 66l5 6M182 72l6 5"/>
    </g>
    <path d="M206 54C220 40 244 42 254 54C262 66 262 84 254 94C246 104 226 106 214 100C200 92 196 70 206 54Z" fill="${c.mid}"/>
    <path d="M232 66C246 62 260 70 261 84C261 96 250 104 238 102C226 100 224 76 232 66Z" fill="${c.snout}"/>
    <ellipse cx="252" cy="62" rx="9" ry="6.5" fill="${c.nose}"/>
    <ellipse cx="249" cy="62" rx="2" ry="1.6" fill="#000" opacity=".5"/><ellipse cx="256" cy="62" rx="2" ry="1.6" fill="#000" opacity=".5"/>
    <path d="M241 93Q250 98 258 93" stroke="${c.nose}" stroke-width="2" fill="none" stroke-linecap="round"/>
    <ellipse cx="215" cy="46" rx="7" ry="6" fill="${c.ear}"/><ellipse cx="215" cy="47" rx="3.4" ry="3" fill="${c.belly}" opacity=".7"/>
    <circle cx="228" cy="60" r="3.6" fill="#1d0f06"/><circle cx="229.2" cy="58.8" r="1.2" fill="#fff"/>
  </svg>`;
};
// a few of them, each walking back and forth at its own pace
const walkersHTML = () => {
  const crew = [
    { k: 'brown', sz: 176, dur: 30, dly: -4, bot: 4 },
    { k: 'pink', sz: 148, dur: 40, dly: -24, bot: 14 },
    { k: 'brown', sz: 100, dur: 34, dly: -13, bot: 0 },
  ];
  return `<div class="walkers" aria-hidden="true">${crew.map((w, i) =>
    `<div class="wk" style="--sz:${w.sz}px;--dur:${w.dur}s;--dly:${w.dly}s;--b:${w.bot}px;--in:${(1.6 + i * .5).toFixed(1)}s">${capyBody(w.k)}</div>`).join('')}</div>`;
};

function startFinale(b, fl) {
  if (fin.open || lb.closing) return;
  fin.open = true; fin.fl = fl;
  const cfg = b.finale, f = b.flowers[+fl.dataset.f];
  const pages = finPhotos(cfg.pages), together = finPhotos(cfg.together);
  const all = pages.concat(together);
  const S = Math.round(Math.min(innerWidth * .98, innerHeight * .62, 520));
  const F = Math.round(S * .44);
  const bb = fl.getBBox(), r = fl.getBoundingClientRect();
  const vb = `${bb.x} ${bb.y} ${bb.width} ${bb.height}`;
  const clone = `<svg viewBox="${vb}" class="flw-clone" overflow="visible">${fl.innerHTML}</svg>`;
  const bloom = `<svg viewBox="${vb}" class="flw-clone" overflow="visible">${Flowers.bloom(f.k || b.kind, f.s, Flowers.PAL[f.p], b.seed + 3, .05)}</svg>`;

  // 3 layers of pictures; they repeat so there are always plenty. Alternate layers spin the other way.
  const RINGS = [
    { R: .30, n: 7, w: .11, dur: 52, rev: false },
    { R: .375, n: 10, w: .105, dur: 64, rev: true },
    { R: .445, n: 13, w: .095, dur: 80, rev: false },
  ];
  let ring = '';
  RINGS.forEach((rg, k) => {
    const isz = Math.round(S * rg.w);
    let items = '';
    for (let i = 0; i < rg.n; i++) {
      const p = all[(Math.floor((i * all.length) / rg.n) + k * 4) % all.length];
      items += `<div class="it" style="--a:${Math.round((i * 360) / rg.n)}deg;--d:${(1.4 + k * .5 + i * .12).toFixed(2)}s"><div class="p"><img alt="" data-src="${p.src}"></div></div>`;
    }
    ring += `<div class="orbit" style="--R:${Math.round(S * rg.R)}px;--isz:${isz}px;--dur:${rg.dur}s;--dir:${rg.rev ? 'reverse' : 'normal'};--cdir:${rg.rev ? 'normal' : 'reverse'}">${items}</div>`;
  });

  const ov = document.createElement('div');
  ov.className = 'fin';
  ov.innerHTML = `<button class="ghost round fin-x" aria-label="Close">✕</button>
    <div class="fin-stage" style="--S:${S}px;--F:${F}px">
      ${ring}
      <div class="fin-flower"><div class="fin-clone">${clone}</div><div class="fin-spin"></div></div>
      <button class="capy" aria-label="Tap the capybara" hidden>
        <span class="bubble">Psst, tap me! ❤</span>${capySVG(false)}
      </button>
    </div>${walkersHTML()}`;
  document.body.appendChild(ov);
  fin.el = ov;
  requestAnimationFrame(() => ov.classList.add('on'));
  loadImgs(ov, (img) => { const it = img.closest('.it'); it && it.remove(); });
  ov.querySelector('.fin-x').onclick = () => closeFinale();

  // 1) the peony flies from the bouquet to the middle of the screen, spinning
  const fe = ov.querySelector('.fin-flower');
  const t = fe.getBoundingClientRect();
  const dx = r.left + r.width / 2 - (t.left + t.width / 2), dy = r.top + r.height / 2 - (t.top + t.height / 2);
  const s0 = Math.max(r.width, r.height) / F;
  fl.classList.add('picked');
  fe.animate([
    { transform: `translate(${dx}px,${dy}px) scale(${s0}) rotate(0deg)` },
    { transform: 'none' },
  ], { duration: 1000, easing: 'cubic-bezier(.3,.7,.25,1)' });

  // 2) it blooms while spinning, pictures orbit around it
  finT(() => {
    const sp = ov.querySelector('.fin-spin');
    sp.innerHTML = bloom;
    sp.classList.add('go');
    ov.querySelector('.fin-clone').classList.add('fade');
  }, 1000);

  // 3) the capybara pops out of the middle of the flower
  finT(() => {
    const c = ov.querySelector('.capy');
    c.hidden = false;
    requestAnimationFrame(() => c.classList.add('on'));
    const openBook = () => {
      c.onclick = null;
      finBook(ov, pages, together, cfg.letter, () => { c.onclick = openBook; });
    };
    c.onclick = openBook;
  }, 5200);
}

function finBook(ov, pages, together, letter, onClosed) {
  const stage = ov.querySelector('.fin-stage');
  stage.classList.add('away');
  const H = Math.round(Math.min(innerHeight * .54, 460, (innerWidth * .84) / .75)), W = Math.round(H * .75);
  const total = pages.length;
  const esc = (t) => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;');
  const L = letter || { title: 'Dear you,', paragraphs: [], sign: '' };
  const leaves = [`<div class="bleaf cover"><div class="cv"><span>Our</span><b>Memories</b><i>❀</i></div></div>`]
    .concat(pages.map((p, i) => `<div class="bleaf"><div class="pg"><div class="pimg"><img alt="" data-src="${p.src}"></div><p>${p.caption || ''}</p><small>${i + 1} / ${total}</small></div></div>`))
    .concat([`<div class="bleaf"><div class="pg tog"><h3>Tayong dalawa ❤</h3><div class="tgrid">${
      together.map((p, i) => `<button class="tg" data-i="${i}" style="--r:${[-4, 3, -2][i % 3]}deg" aria-label="Open picture ${i + 1}"><img alt="" data-src="${p.src}"></button>`).join('')
    }</div><button class="ghost to-letter">Read my letter ✉</button></div></div>`])
    .concat([`<div class="bleaf last"><div class="pg lt"><h3>${esc(L.title)}</h3><div class="ltxt">${
      L.paragraphs.map((t) => `<p>${esc(t)}</p>`).join('')
    }${L.sign ? `<p class="lsign">${esc(L.sign)}</p>` : ''}</div><div class="lact"><button class="ghost lt-back">‹ Photos</button><button class="ghost lt-close">Close the book ❤</button></div></div></div>`]);
  const wrap = document.createElement('div');
  wrap.className = 'book-wrap';
  wrap.innerHTML = `<div class="book" style="width:${W}px;height:${H}px">${leaves.join('')}</div>
    <div class="capy2" hidden><span class="bubble">Look, it’s us! Tap a photo ❤</span>${capySVG(true)}</div>
    <button class="ghost fin-skip">Skip ›</button>`;
  ov.appendChild(wrap);
  const book = wrap.querySelector('.book');
  const els = [...book.querySelectorAll('.bleaf')];
  els.forEach((el, i) => { el.style.zIndex = els.length - i; });
  loadImgs(wrap, (img) => { const x = img.closest('.tg, .pimg'); if (x) x.style.display = 'none'; });
  requestAnimationFrame(() => wrap.classList.add('on'));
  book.querySelectorAll('.tg').forEach((btn) => { btn.onclick = () => openPhotos(together, null, +btn.dataset.i); });

  const togLeaf = els[els.length - 2];
  const capy2 = wrap.querySelector('.capy2');
  const flips = els.slice(0, -2); // cover + photo pages flip by themselves; the "together" page waits for a tap
  let k = 0, onLetter = false;
  const done = () => {
    wrap.querySelector('.fin-skip').hidden = true;
    if (onLetter) return;
    capy2.hidden = false;
    requestAnimationFrame(() => capy2.classList.add('on'));
  };
  const next = () => {
    if (k >= flips.length) { finT(done, 500); return; }
    flips[k++].classList.add('flipped');
    finT(next, k === 1 ? 900 : 340);
  };
  finT(next, 1300);
  wrap.querySelector('.fin-skip').onclick = () => {
    fin.timers.forEach(clearTimeout); fin.timers = [];
    book.classList.add('fast');
    flips.forEach((el) => el.classList.add('flipped'));
    finT(() => { book.classList.remove('fast'); done(); }, 400);
  };

  // photos page <-> letter page
  wrap.querySelector('.to-letter').onclick = () => { onLetter = true; togLeaf.classList.add('flipped'); capy2.classList.remove('on'); };
  wrap.querySelector('.lt-back').onclick = () => { onLetter = false; togLeaf.classList.remove('flipped'); capy2.hidden = false; capy2.classList.add('on'); };

  // close the book: pages turn back to the cover, then the bloom scene returns
  wrap.querySelector('.lt-close').onclick = () => {
    onLetter = true;
    capy2.classList.remove('on');
    const back = els.slice(0, -1).filter((el) => el.classList.contains('flipped')).reverse();
    back.forEach((el, i) => finT(() => el.classList.remove('flipped'), 120 + i * 70));
    const t = 120 + back.length * 70 + 900;
    finT(() => { wrap.classList.remove('on'); stage.classList.remove('away'); }, t);
    finT(() => { wrap.remove(); onClosed && onClosed(); }, t + 700);
  };
}

function closeFinale(instant) {
  if (!fin.open) return;
  fin.open = false;
  fin.timers.forEach(clearTimeout); fin.timers = [];
  const ov = fin.el, fl = fin.fl;
  fin.el = null; fin.fl = null;
  if (fl) {
    fl.classList.remove('picked');
    if (!instant) { fl.classList.add('back'); setTimeout(() => fl.classList.remove('back'), 700); }
  }
  if (!ov) return;
  if (instant) { ov.remove(); return; }
  ov.classList.remove('on');
  setTimeout(() => ov.remove(), 400);
}

/* ---------------- page transition ---------------- */
async function transition(fn, ev, color) {
  if (busy) return;
  busy = true;
  const x = ev && ev.clientX != null ? ev.clientX : innerWidth / 2;
  const y = ev && ev.clientY != null ? ev.clientY : innerHeight / 2;
  const r = Math.hypot(innerWidth, innerHeight);
  wipe.getAnimations().forEach((a) => a.cancel());
  wipe.style.background = `radial-gradient(circle at ${x}px ${y}px, ${color}, #1a0616)`;
  wipe.style.visibility = 'visible';
  const c = (rad) => `circle(${rad}px at ${x}px ${y}px)`;
  await wipe.animate([{ clipPath: c(0) }, { clipPath: c(r) }], { duration: 650, easing: 'cubic-bezier(.6,0,.3,1)', fill: 'forwards' }).finished;
  fn();
  await new Promise((res) => setTimeout(res, 150));
  await wipe.animate([{ clipPath: c(r) }, { clipPath: c(0) }], { duration: 750, easing: 'cubic-bezier(.6,0,.3,1)', fill: 'forwards' }).finished;
  wipe.style.visibility = 'hidden';
  busy = false;
}

// in-page route (no URL hash, so it also works inside the artifact viewer)
let route = '';
const openBouquet = (i, ev) => transition(() => { route = BOUQUETS[i].id; render(); }, ev, BOUQUETS[i].theme.glow);
const openHome = (ev, color) => transition(() => { route = ''; render(); }, ev, color || HOME_THEME.glow);

/* ---------------- router ---------------- */
function render() {
  clearTimeout(typeTimer);
  closePhotos(true);
  closeFinale(true);
  const id = route;
  const i = BOUQUETS.findIndex((b) => b.id === id);
  app.scrollTop = 0;
  i >= 0 ? showBouquet(i) : showHome();
}

/* ---------------- HOME ---------------- */
function showHome() {
  setTheme(HOME_THEME);
  rain(HOME_THEME.rain, 26);
  stopMusic();

  const cards = BOUQUETS.map((b, i) => {
    const pv = b.preview;
    const flower = Flowers.bloom(pv.k, pv.s, Flowers.PAL[pv.p], b.seed + 5, .6 + i * .15);
    return `<button class="card" data-i="${i}" style="--i:${i};--c:${b.theme.glow}" aria-label="Open bouquet ${b.letter}: ${b.name}">
      <span class="letter">${b.letter}</span>
      <svg viewBox="${pv.vb}"><g class="flw">${flower}</g></svg>
      <span class="cname">${b.name}</span>
      <span class="csub">${b.sub}</span>
      <span class="copen">Open me ›</span>
    </button>`;
  }).join('');

  app.innerHTML = `<section class="home">
    <header>
      <p class="eyebrow">for ${CONFIG.to}</p>
      <h1 class="title">Hello, Flower</h1>
      <p class="sub">Five bouquets, five messages, just for you. Pick the one you want to open first ❀</p>
    </header>
    <div class="carousel-wrap">
      <button class="ghost round arrow l" aria-label="Previous">‹</button>
      <div class="carousel" id="carousel">${cards}</div>
      <button class="ghost round arrow r" aria-label="Next">›</button>
    </div>
    <nav class="chips">${BOUQUETS.map((b, i) => `<button class="chip" data-i="${i}" aria-label="Bouquet ${b.letter}">${b.letter}</button>`).join('')}</nav>
    <p class="hint">SWIPE / SCROLL →</p>
  </section>`;

  const car = document.getElementById('carousel');
  const cardEls = [...car.querySelectorAll('.card')];
  const chips = [...app.querySelectorAll('.chip')];
  let dragged = false;

  const updateActive = () => {
    const mid = car.scrollLeft + car.clientWidth / 2;
    let best = 0, bd = Infinity;
    cardEls.forEach((c, i) => {
      const d = Math.abs(c.offsetLeft + c.offsetWidth / 2 - mid);
      if (d < bd) { bd = d; best = i; }
    });
    cardEls.forEach((c, i) => c.classList.toggle('active', i === best));
    chips.forEach((c, i) => c.classList.toggle('active', i === best));
  };
  let raf;
  car.addEventListener('scroll', () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(updateActive); });
  const scrollToCard = (i) => cardEls[i].scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  const current = () => cardEls.findIndex((c) => c.classList.contains('active'));

  // wheel -> horizontal, mouse drag
  car.addEventListener('wheel', (e) => {
    if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) { e.preventDefault(); car.scrollLeft += e.deltaY; }
  }, { passive: false });
  let down = false, sx = 0, sl = 0;
  car.addEventListener('pointerdown', (e) => {
    if (e.pointerType !== 'mouse') return;
    down = true; dragged = false; sx = e.clientX; sl = car.scrollLeft;
  });
  window.addEventListener('pointermove', (e) => {
    if (!down) return;
    const dx = e.clientX - sx;
    if (Math.abs(dx) > 6) { dragged = true; car.classList.add('dragging'); }
    if (dragged) car.scrollLeft = sl - dx;
  });
  window.addEventListener('pointerup', () => {
    if (!down) return;
    down = false; car.classList.remove('dragging');
    if (dragged) scrollToCard(current());
  });

  cardEls.forEach((c, i) => c.addEventListener('click', (e) => {
    if (dragged) { dragged = false; return; }
    if (!c.classList.contains('active')) { scrollToCard(i); return; }
    openBouquet(i, e);
  }));
  chips.forEach((c, i) => c.addEventListener('click', (e) => openBouquet(i, e)));
  app.querySelector('.arrow.l').addEventListener('click', () => scrollToCard(Math.max(0, current() - 1)));
  app.querySelector('.arrow.r').addEventListener('click', () => scrollToCard(Math.min(cardEls.length - 1, current() + 1)));

  requestAnimationFrame(() => { cardEls[0].scrollIntoView({ inline: 'center', block: 'nearest' }); updateActive(); });
}

/* ---------------- BOUQUET ---------------- */
function showBouquet(i) {
  const b = BOUQUETS[i];
  setTheme(b.theme);
  rain(b.theme.rain, 24);
  playMusic(b.id);

  const { svg, duration } = Flowers.buildBouquet(b);
  const words = (l) => l.split(' ').map((w) => `<span class="w">${[...w].map((c) => `<span class="c">${c}</span>`).join('')}</span>`).join(' ');
  const last = i === BOUQUETS.length - 1;

  app.innerHTML = `<section class="bq">
    <nav class="topbar">
      <button class="ghost" id="back">← Bouquets</button>
      <span class="tag">Bouquet ${b.letter}</span>
      <div class="pn">
        <button class="ghost round" id="mute" aria-label="Toggle music">${music.muted ? '🔇' : '🔊'}</button>
        <button class="ghost round" id="prev" aria-label="Previous">‹</button>
        <button class="ghost round" id="next" aria-label="Next">›</button>
      </div>
    </nav>
    <div class="stage">
      <div class="bouquet-wrap" id="bwrap"><div class="halo"></div><div class="bob">${svg}</div></div>
      <article class="msg">
        <p class="kicker">${b.name} · ${b.sub}</p>
        <p class="tap-hint">✿ Tap a flower to see a memory</p>
        <h2>For you, ${CONFIG.to}</h2>
        <div class="text" id="text">${b.message.map((l) => `<p>${words(l)}</p>`).join('')}</div>
        <p class="sig" id="sig">${CONFIG.from}</p>
        <div class="actions">
          <button class="ghost" id="replay">↻ Replay</button>
          <button class="ghost" id="next2">${last ? 'Back to the start ✿' : 'Next bouquet →'}</button>
        </div>
      </article>
    </div>
  </section>`;

  const go = (j, e) => (j < 0 || j >= BOUQUETS.length ? openHome(e, b.theme.glow) : openBouquet(j, e));
  document.getElementById('back').onclick = (e) => openHome(e, b.theme.glow);
  document.getElementById('prev').onclick = (e) => go(i - 1, e);
  document.getElementById('next').onclick = (e) => go(i + 1, e);
  document.getElementById('next2').onclick = (e) => go(i + 1, e);
  document.getElementById('mute').onclick = (e) => toggleMute(e.currentTarget);
  document.getElementById('replay').onclick = () => { music.id = null; render(); };
  const colors = [b.theme.glow, '#fff', ...b.theme.rain];
  document.getElementById('bwrap').onclick = (e) => {
    const fl = e.target.closest('.fl');
    if (fl) { burst(e.clientX, e.clientY, colors); tapFlower(b, fl); return; }
    burst(e.clientX, e.clientY, colors);
  };
  document.getElementById('bwrap').onkeydown = (e) => {
    const fl = e.target.closest && e.target.closest('.fl');
    if (fl && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); tapFlower(b, fl); }
  };

  // typewriter reveal
  const chars = [...app.querySelectorAll('.c')];
  const sig = document.getElementById('sig');
  let k = 0;
  const tick = () => {
    if (k >= chars.length) { sig.classList.add('on'); return; }
    const c = chars[k++];
    c.classList.add('on');
    const t = c.textContent;
    typeTimer = setTimeout(tick, /[.,?!:]/.test(t) ? 260 : 36);
  };
  typeTimer = setTimeout(tick, Math.max(2500, duration * 800));
  document.getElementById('text').onclick = () => { clearTimeout(typeTimer); chars.forEach((c) => c.classList.add('on')); sig.classList.add('on'); };
}

/* keyboard */
window.addEventListener('keydown', (e) => {
  if (!lb.el.hidden) {
    if (e.key === 'Escape') closePhotos();
    if (e.key === 'ArrowRight' && lb.list.length > 1) lbStep(1);
    if (e.key === 'ArrowLeft' && lb.list.length > 1) lbStep(-1);
    return;
  }
  if (fin.open) { if (e.key === 'Escape') closeFinale(); return; }
  const i = BOUQUETS.findIndex((b) => route === b.id);
  if (i < 0) return;
  if (e.key === 'ArrowRight') document.getElementById('next')?.click();
  if (e.key === 'ArrowLeft') document.getElementById('prev')?.click();
  if (e.key === 'Escape') document.getElementById('back')?.click();
});

render();
