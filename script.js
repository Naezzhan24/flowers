const app = document.getElementById('app');
const rainEl = document.getElementById('rain');
const wipe = document.getElementById('wipe');
const root = document.documentElement;

const HOME_THEME = { bg1: '#140a14', bg2: '#33193a', glow: '#e8c98f', rain: ['#f3c7d4', '#e8c98f', '#fff3e0', '#d9a8c0'] };
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

// front-facing capybara (peeks out of the peony, and points at the photos in the book)
const capySVG = (point) => {
  const id = `cf${capyUid++}`;
  return `<svg viewBox="0 0 200 190" class="capy-svg" aria-hidden="true">
  <defs>
    <linearGradient id="${id}b" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6e4526"/><stop offset="1" stop-color="#a06c3c"/></linearGradient>
    <linearGradient id="${id}h" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7a4d2b"/><stop offset=".55" stop-color="#a06c3c"/><stop offset="1" stop-color="#b98555"/></linearGradient>
    <linearGradient id="${id}m" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#b98555"/><stop offset="1" stop-color="#d1a374"/></linearGradient>
  </defs>
  <ellipse cx="100" cy="166" rx="84" ry="44" fill="url(#${id}b)"/>
  <g stroke="#4d2f19" stroke-width="1.6" stroke-linecap="round" opacity=".3" fill="none">
    <path d="M44 150l6 6M62 138l5 7M138 138l-5 7M156 150l-6 6M80 162l5 6M120 162l-5 6"/>
  </g>
  <g fill="#573620"><path d="M44 168h34q6 0 6 8v8q0 6-6 6H50q-6 0-6-6z"/><path d="M122 168h34q6 0 6 8v8q0 6-6 6h-28q-6 0-6-6z"/></g>
  <path d="M54 190v-8M62 190v-8M70 190v-8M130 190v-8M138 190v-8M146 190v-8" stroke="#2e1a0c" stroke-width="1.4" opacity=".55"/>
  <path d="M38 88C36 54 62 34 100 34C138 34 164 54 162 88C162 116 140 134 100 136C60 134 38 116 38 88Z" fill="url(#${id}h)"/>
  <path d="M60 44C76 36 124 36 140 44C132 52 68 52 60 44Z" fill="#573620" opacity=".5"/>
  <path d="M60 96C60 82 78 77 100 77C122 77 140 82 140 96L142 114C142 128 124 138 100 138C76 138 58 128 58 114Z" fill="url(#${id}m)"/>
  <ellipse cx="100" cy="86" rx="30" ry="12" fill="#35200f"/>
  <ellipse cx="92" cy="82" rx="14" ry="3.4" fill="#fff" opacity=".13"/>
  <ellipse cx="88" cy="88" rx="5.5" ry="3.6" fill="#0c0603" transform="rotate(-14 88 88)"/>
  <ellipse cx="112" cy="88" rx="5.5" ry="3.6" fill="#0c0603" transform="rotate(14 112 88)"/>
  <path d="M100 98V111M84 115Q100 125 116 115" stroke="#4d2f19" stroke-width="2.2" fill="none" stroke-linecap="round"/>
  <g fill="#4d2f19" opacity=".6"><circle cx="76" cy="104" r="1.3"/><circle cx="70" cy="110" r="1.3"/><circle cx="78" cy="112" r="1.3"/><circle cx="124" cy="104" r="1.3"/><circle cx="130" cy="110" r="1.3"/><circle cx="122" cy="112" r="1.3"/></g>
  <ellipse cx="66" cy="68" rx="9" ry="6.5" fill="#4d2f19" opacity=".35"/><ellipse cx="134" cy="68" rx="9" ry="6.5" fill="#4d2f19" opacity=".35"/>
  <circle cx="66" cy="68" r="5" fill="#140a04"/><circle cx="134" cy="68" r="5" fill="#140a04"/>
  <circle cx="67.6" cy="66.2" r="1.7" fill="#fff"/><circle cx="135.6" cy="66.2" r="1.7" fill="#fff"/>
  <ellipse cx="50" cy="46" rx="12" ry="10" fill="#573620"/><ellipse cx="50" cy="47" rx="6" ry="5" fill="#c79a6c" opacity=".75"/>
  <ellipse cx="150" cy="46" rx="12" ry="10" fill="#573620"/><ellipse cx="150" cy="47" rx="6" ry="5" fill="#c79a6c" opacity=".75"/>
  ${point ? '<g class="cpaw"><path d="M18 128c-6-12-3-26 7-30c8-3 14 4 13 12c-1 8-6 18-10 26c-3 6-8 4-10-8z" fill="#7a4d2b"/><path d="M20 102v-6M26 99v-6M32 100v-6" stroke="#2e1a0c" stroke-width="3" stroke-linecap="round"/></g>' : ''}
</svg>`;
};

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
      sfxInit();
      finBook(ov, pages, together, cfg.letter, cfg.end, () => { c.onclick = openBook; });
    };
    c.onclick = openBook;
  }, 5200);
}

function finBook(ov, pages, together, letter, end, onClosed) {
  const stage = ov.querySelector('.fin-stage');
  stage.classList.add('away');
  const H = Math.round(Math.min(innerHeight * .74, 680, (innerWidth * .96) / .75)), W = Math.round(H * .75);
  const esc = (t) => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;');
  const L = letter || { title: 'Dear you,', paragraphs: [], sign: '' };
  const E = end || {};
  const leaves = [`<div class="bleaf cover"><div class="cv"><span>Our</span><b>Memories</b><i>❀</i></div></div>`]
    .concat(pages.map((p) => `<div class="bleaf"><div class="pg"><div class="pimg"><img alt="" data-src="${p.src}"></div></div></div>`))
    .concat([`<div class="bleaf"><div class="pg tog"><h3>Tayong dalawa ❤</h3><div class="tgrid">${
      together.map((p, i) => `<button class="tg" data-i="${i}" style="--r:${[-4, 3, -2][i % 3]}deg" aria-label="Open picture ${i + 1}"><img alt="" data-src="${p.src}"></button>`).join('')
    }</div><button class="ghost to-letter">Read my letter ✉</button></div></div>`])
    .concat([`<div class="bleaf"><div class="pg lt"><h3>${esc(L.title)}</h3><div class="ltxt">${
      L.paragraphs.map((t) => `<p>${esc(t)}</p>`).join('')
    }${L.sign ? `<p class="lsign">${esc(L.sign)}</p>` : ''}</div><p class="lt-scroll">scroll ↓</p><div class="lact"><button class="ghost lt-back">‹ Photos</button><button class="ghost lt-next">Next ›</button></div></div></div>`])
    .concat([`<div class="bleaf last"><div class="pg endp"><div class="endmid"><h3>${esc(E.title || 'The End ❤')}</h3>${
      E.note ? `<p class="enote">${esc(E.note)}</p>` : ''
    }${CONFIG.since ? `<p class="edate">${esc(CONFIG.since)}</p>` : ''}<p class="lsign">${esc(CONFIG.from)}</p></div><div class="lact"><button class="ghost end-back">‹ Letter</button><button class="ghost lt-close">Close the book ❤</button></div></div></div>`]);
  const wrap = document.createElement('div');
  wrap.className = 'book-wrap';
  wrap.innerHTML = `<div class="book" style="width:${W}px;height:${H}px">${leaves.join('')}</div>
    <div class="capy2" hidden><span class="bubble">Look, it’s us! Tap a photo ❤</span>${capySVG(true)}</div>
    <button class="ghost fin-skip">Skip ›</button>`;
  ov.appendChild(wrap);
  const book = wrap.querySelector('.book');
  const els = [...book.querySelectorAll('.bleaf')];
  const n = els.length;
  els.forEach((el, i) => { el.style.zIndex = n - i; });
  loadImgs(wrap, (img) => { const x = img.closest('.tg, .pimg'); if (x) x.style.display = 'none'; });
  requestAnimationFrame(() => wrap.classList.add('on'));
  book.querySelectorAll('.tg').forEach((btn) => { btn.onclick = () => openPhotos(together, null, +btn.dataset.i); });

  const togLeaf = els[n - 3], letterLeaf = els[n - 2];
  const capy2 = wrap.querySelector('.capy2');
  const flips = els.slice(0, n - 3); // cover + photo pages turn by themselves; the rest wait for a tap
  const turn = (el) => { flipSound(); el.classList.add('flipped'); };
  let k = 0, onLetter = false;
  const done = () => {
    wrap.querySelector('.fin-skip').hidden = true;
    if (onLetter) return;
    capy2.hidden = false;
    requestAnimationFrame(() => { if (!onLetter) capy2.classList.add('on'); });
  };
  const next = () => {
    if (k >= flips.length) { finT(done, 500); return; }
    turn(flips[k++]);
    finT(next, k === 1 ? 900 : 340);
  };
  finT(next, 1300);
  wrap.querySelector('.fin-skip').onclick = () => {
    fin.timers.forEach(clearTimeout); fin.timers = [];
    flipSound();
    book.classList.add('fast');
    flips.forEach((el) => el.classList.add('flipped'));
    finT(() => { book.classList.remove('fast'); done(); }, 400);
  };

  // "scroll" hint only when the letter is longer than the page
  const ltxt = wrap.querySelector('.ltxt'), ltHint = wrap.querySelector('.lt-scroll');
  requestAnimationFrame(() => { if (ltxt.scrollHeight <= ltxt.clientHeight + 4) ltHint.classList.add('gone'); });
  ltxt.addEventListener('scroll', () => ltHint.classList.add('gone'), { once: true });

  // photos page -> letter -> the end
  wrap.querySelector('.to-letter').onclick = () => { onLetter = true; turn(togLeaf); capy2.classList.remove('on'); };
  wrap.querySelector('.lt-back').onclick = () => { onLetter = false; flipSound(); togLeaf.classList.remove('flipped'); capy2.hidden = false; capy2.classList.add('on'); };
  wrap.querySelector('.lt-next').onclick = () => turn(letterLeaf);
  wrap.querySelector('.end-back').onclick = () => { flipSound(); letterLeaf.classList.remove('flipped'); };

  // close the book: pages turn back to the cover, then the bloom scene returns
  wrap.querySelector('.lt-close').onclick = () => {
    onLetter = true;
    capy2.classList.remove('on');
    const back = els.slice(0, -1).filter((el) => el.classList.contains('flipped')).reverse();
    back.forEach((el, i) => finT(() => { if (i % 3 === 0) flipSound(); el.classList.remove('flipped'); }, 120 + i * 70));
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
let route = 'intro'; // 'intro' (door) | 'museum' | 'home' (bouquet list) | a bouquet id
const openBouquet = (i, ev) => transition(() => { route = BOUQUETS[i].id; render(); }, ev, BOUQUETS[i].theme.glow);
const openHome = (ev, color) => transition(() => { route = 'home'; render(); }, ev, color || HOME_THEME.glow);
const openMuseum = (ev) => transition(() => { route = 'museum'; render(); }, ev, MUSEUM_THEME.glow);

/* ---------------- router ---------------- */
function render() {
  clearTimeout(typeTimer);
  closePhotos(true);
  closeFinale(true);
  museumStop();
  const id = route;
  const i = BOUQUETS.findIndex((b) => b.id === id);
  app.scrollTop = 0;
  if (i >= 0) showBouquet(i);
  else if (route === 'home') showHome();
  else if (route === 'museum') showMuseum();
  else showIntro();
}

/* ---------------- intro door, flashlight, falling petals, page-flip sound ---------------- */
const sfx = { ctx: null };
function sfxInit() {
  try {
    if (!sfx.ctx) sfx.ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (sfx.ctx.state === 'suspended') sfx.ctx.resume();
  } catch (e) { /* no audio available */ }
}
// a soft paper "fwip", made in code so no audio file is needed
function flipSound() {
  if (music.muted) return;
  sfxInit();
  const c = sfx.ctx;
  if (!c) return;
  const len = .24, n = Math.floor(c.sampleRate * len), buf = c.createBuffer(1, n, c.sampleRate), d = buf.getChannelData(0);
  for (let i = 0; i < n; i++) {
    const t = i / n;
    d[i] = (Math.random() * 2 - 1) * Math.pow(1 - t, 2.4) * (t < .05 ? t / .05 : 1);
  }
  const src = c.createBufferSource();
  src.buffer = buf;
  const f = c.createBiquadFilter();
  f.type = 'bandpass'; f.Q.value = .8;
  f.frequency.setValueAtTime(800, c.currentTime);
  f.frequency.exponentialRampToValueAtTime(3800, c.currentTime + len);
  const g = c.createGain();
  g.gain.value = .26;
  src.connect(f); f.connect(g); g.connect(c.destination);
  src.start();
}

const mus = { timers: [], torchOn: false };
function museumStop() {
  mus.timers.forEach((t) => { clearTimeout(t); clearInterval(t); });
  mus.timers = [];
  mus.torchOn = false;
}

function showIntro() {
  setTheme(MUSEUM_THEME);
  rain([], 0);
  stopMusic();
  app.innerHTML = `<section class="intro" id="intro" tabindex="0" role="button" aria-label="Tap to enter">
    <div class="door"><span class="dglow"></span><i class="dl"></i><i class="dr"></i></div>
    <p class="itap">Tap to enter</p>
  </section>`;
  const el = document.getElementById('intro');
  const enter = () => {
    if (el.classList.contains('open')) return;
    el.classList.add('open');
    playMusic('museum'); // this tap is what lets the browser start the sound
    sfxInit();
    mus.timers.push(setTimeout(() => {
      const flood = document.createElement('div');
      flood.className = 'flood';
      document.body.appendChild(flood);
      route = 'museum';
      render();
      requestAnimationFrame(() => flood.classList.add('go'));
      setTimeout(() => flood.remove(), 2400);
    }, 1500));
  };
  el.onclick = enter;
  el.onkeydown = (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); enter(); } };
  el.focus({ preventScroll: true });
}

// a pool of light that follows your finger or mouse; the rest of the room stays dim
function startTorch(torch) {
  mus.torchOn = true;
  let tx = innerWidth / 2, ty = innerHeight * .45, cx = tx, cy = ty;
  const move = (e) => {
    const p = e.touches && e.touches[0] ? e.touches[0] : e;
    if (p && p.clientX != null) { tx = p.clientX; ty = p.clientY; }
  };
  ['pointermove', 'touchstart', 'touchmove'].forEach((t) => window.addEventListener(t, move, { passive: true }));
  const loop = () => {
    if (!mus.torchOn || !torch.isConnected) {
      ['pointermove', 'touchstart', 'touchmove'].forEach((t) => window.removeEventListener(t, move));
      return;
    }
    cx += (tx - cx) * .12; cy += (ty - cy) * .12;
    torch.style.setProperty('--tx', cx.toFixed(1) + 'px');
    torch.style.setProperty('--ty', cy.toFixed(1) + 'px');
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
}

// every now and then a petal slips from the vase and lands on the table
function startPetals() {
  const colors = ['#f9adc6', '#ff6a80', '#cfaef0', '#ffe98a', '#fee3ec'];
  const drop = () => {
    const room = document.getElementById('room'), v = document.getElementById('vaseBtn');
    if (!room || !v) return;
    const rr = room.getBoundingClientRect(), vr = v.getBoundingClientRect();
    const x = vr.left - rr.left + vr.width * (.3 + Math.random() * .4);
    const y0 = vr.top - rr.top + vr.height * (.2 + Math.random() * .1);
    const y1 = vr.top - rr.top + vr.height * .815;
    const d = y1 - y0, s = 12 + Math.random() * 8, sw = 22 + Math.random() * 22;
    const p = document.createElement('i');
    p.className = 'petal-fall';
    p.style.cssText = `left:${x}px;top:${y0}px;width:${s}px;height:${s * 1.3}px;background:${colors[Math.floor(Math.random() * colors.length)]}`;
    room.appendChild(p);
    const a = p.animate([
      { transform: 'translate(0,0) rotate(0deg)', opacity: 0 },
      { opacity: .95, offset: .08 },
      { transform: `translate(${sw}px,${d * .34}px) rotate(70deg)`, offset: .34 },
      { transform: `translate(${-sw * .7}px,${d * .68}px) rotate(170deg)`, offset: .68 },
      { transform: `translate(${sw * .3}px,${d}px) rotate(250deg)`, opacity: .95 },
    ], { duration: 6500, easing: 'ease-in-out', fill: 'forwards' });
    a.finished.then(() => {
      mus.timers.push(setTimeout(() => {
        p.animate([{ opacity: .95 }, { opacity: 0 }], { duration: 2500, fill: 'forwards' }).finished.then(() => p.remove());
      }, 7000));
    });
  };
  const loop = () => {
    drop();
    mus.timers.push(setTimeout(loop, 9000 + Math.random() * 6000));
  };
  mus.timers.push(setTimeout(loop, 3500));
}

/* ---------------- MUSEUM (first page): dim gallery, framed pictures, a table with a vase of the 5 flowers ---------------- */
const MUSEUM_THEME = { bg1: '#0f0810', bg2: '#2a1a28', glow: '#e8c98f', rain: [] };

function vaseSVG() {
  const P = Flowers.PAL;
  const spec = [
    { k: 'peony', p: 'peony', s: 46, x: 180, y: 112, d: .2 },
    { k: 'rose', p: 'roseRed', s: 32, x: 116, y: 152, d: .5 },
    { k: 'gerbera', p: 'gerbera', s: 34, x: 246, y: 150, d: .8 },
    { k: 'carnation', p: 'carnPurple', s: 28, x: 78, y: 210, d: 1.1 },
    { k: 'tulip', p: 'tulipYellow', s: 22, x: 286, y: 252, d: 1.4 },
  ];
  const stems = spec.map((f, i) =>
    `<path class="stem" pathLength="1" style="--sd:${(.1 + i * .12).toFixed(2)}s" d="M180 350Q${(180 + f.x) / 2} ${(350 + f.y) / 2 + 20} ${f.x} ${f.y}" stroke="#3f7547" stroke-width="3.4" fill="none" stroke-linecap="round"/>`).join('');
  const leaves = [[-1, 296, 130], [1, 290, 120], [-1, 270, 96], [1, 262, 92]].map((l, i) => {
    const x1 = 180 + l[0] * 52, y1 = l[1] - 70;
    return `<path d="M180 ${l[1] + 40}Q${180 + l[0] * 40} ${l[1] - 6} ${x1} ${y1}Q${180 + l[0] * 16} ${l[1] - 12} 180 ${l[1] + 40}Z" fill="${i % 2 ? '#34723f' : '#295e37'}" opacity=".95"/>`;
  }).join('');
  const blooms = spec.map((f, i) =>
    `<g transform="translate(${f.x} ${f.y}) rotate(${(i - 2) * 6})">${Flowers.bloom(f.k, f.s, P[f.p], 90 + i * 11, f.d + .5)}</g>`).join('');
  return `<svg viewBox="0 0 360 470" class="vase-svg" role="img" aria-label="Vase with the five flowers">
    <defs>
      <linearGradient id="vglass" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#cfe0f0" stop-opacity=".42"/><stop offset=".45" stop-color="#e6f0fa" stop-opacity=".1"/><stop offset="1" stop-color="#cfe0f0" stop-opacity=".34"/></linearGradient>
      <linearGradient id="vwood" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6d4a2c"/><stop offset="1" stop-color="#432a17"/></linearGradient>
      <linearGradient id="vtop" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8a6238"/><stop offset="1" stop-color="#5a3b1f"/></linearGradient>
    </defs>
    <ellipse cx="180" cy="463" rx="150" ry="7" fill="#000" opacity=".5"/>
    <path d="M52 420h14l-3 42h-8z" fill="#3c2514"/><path d="M294 420h14l-3 42h-8z" fill="#3c2514"/>
    <rect x="40" y="404" width="280" height="17" rx="2" fill="url(#vwood)"/>
    <rect x="150" y="408" width="60" height="9" rx="2" fill="#2d1b0d" opacity=".8"/><circle cx="180" cy="412.5" r="2.4" fill="#c9a064"/>
    <rect x="22" y="388" width="316" height="17" rx="4" fill="url(#vtop)"/>
    <rect x="22" y="388" width="316" height="3" rx="1.5" fill="#fff" opacity=".16"/>
    <ellipse cx="180" cy="391" rx="70" ry="3" fill="#fff" opacity=".1"/>
    <g>${leaves}${stems}${blooms}</g>
    <path d="M142 300C124 328 118 366 134 388H226C242 366 236 328 218 300Z" fill="url(#vglass)" stroke="#fff" stroke-opacity=".4" stroke-width="1.4"/>
    <path d="M132 350C150 344 170 356 190 350C206 346 222 352 232 348C234 362 232 376 226 388H134C130 376 130 362 132 350Z" fill="#8fb8d4" opacity=".24"/>
    <path d="M148 312C140 332 138 356 144 378" stroke="#fff" stroke-width="3" opacity=".3" fill="none" stroke-linecap="round"/>
    <ellipse cx="180" cy="300" rx="38" ry="8" fill="#e6f0fa" fill-opacity=".25" stroke="#fff" stroke-opacity=".5" stroke-width="1.4"/>
    <ellipse cx="180" cy="388" rx="46" ry="5" fill="#000" opacity=".35"/>
  </svg>`;
}

// the boy: a silhouette standing alone, seen from behind, looking up at the frames
function viewersSVG() {
  const shapes = `
    <path d="M22 196L60 196L58 350L34 350Z"/><path d="M64 196L102 196L88 350L66 350Z"/>
    <ellipse cx="45" cy="352" rx="17" ry="6"/><ellipse cx="78" cy="352" rx="17" ry="6"/>
    <path d="M24 98Q62 72 100 98L106 200L18 200Z"/>
    <path d="M25 100Q8 146 14 204L28 204Q30 154 38 112Z"/><path d="M99 100Q116 146 108 204L96 204Q94 154 86 112Z"/>
    <rect x="54" y="62" width="16" height="16"/><ellipse cx="62" cy="42" rx="20" ry="24"/>`;
  return `<svg viewBox="0 0 124 520" class="viewers-svg" aria-hidden="true">
    <defs>
      <linearGradient id="sil" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#241621"/><stop offset=".6" stop-color="#0e0710"/><stop offset="1" stop-color="#050206"/></linearGradient>
      <linearGradient id="rfade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".5"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
      <mask id="rmask"><rect x="0" y="360" width="124" height="160" fill="url(#rfade)"/></mask>
    </defs>
    <ellipse cx="62" cy="355" rx="56" ry="9" fill="#000" opacity=".55"/>
    <g mask="url(#rmask)" opacity=".5"><g transform="translate(0 720) scale(1 -1)" fill="#1a0f18">${shapes}</g></g>
    <g class="fig" fill="url(#sil)">${shapes}</g>
    <g fill="none" stroke="#ffe2aa" stroke-opacity=".28" stroke-width="1.4"><path d="M44 46Q62 18 80 46"/><path d="M26 98Q62 74 98 98"/></g>
  </svg>`;
}

// the girl: sitting on the bench, turned toward the vase, gently greeting it (small nod, hand reaching toward the flowers).
// long straight dark hair + round glasses, wide-leg jeans and a black cardigan, like in the photos. Dim colours for the dim room.
function sitterSVG() {
  return `<svg viewBox="0 0 300 400" class="sitter-svg" aria-hidden="true">
    <defs>
      <linearGradient id="gskin" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#150b14"/><stop offset=".6" stop-color="#1d111b"/><stop offset="1" stop-color="#2c1a28"/></linearGradient>
      <linearGradient id="ghair2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2a1b25"/><stop offset="1" stop-color="#0b060c"/></linearGradient>
      <linearGradient id="gcard" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#0a050a"/><stop offset="1" stop-color="#1d121c"/></linearGradient>
      <linearGradient id="gjean" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#120b12"/><stop offset="1" stop-color="#21151f"/></linearGradient>
    </defs>
    <ellipse cx="170" cy="394" rx="120" ry="9" fill="#000" opacity=".5"/>
    <g class="sit2">
      <!-- far leg (behind) -->
      <path d="M120 266L226 262L236 300L226 392L192 392L190 312L118 300Z" fill="#0d070d"/>
      <ellipse cx="214" cy="394" rx="26" ry="7" fill="#08050a"/>
      <!-- near leg: thigh, then wide-leg jeans falling to the floor -->
      <path d="M104 262L214 258Q236 262 240 292L248 392L204 392L196 318L160 306L100 300Z" fill="url(#gjean)"/>
      <path d="M204 300L248 392M214 300L252 360" stroke="#000" stroke-width="2" opacity=".35" fill="none"/>
      <ellipse cx="232" cy="394" rx="28" ry="7" fill="#08050a"/>
      <!-- hair behind the back -->
      <path d="M118 74C92 70 84 150 98 232L136 238L152 126Z" fill="url(#ghair2)"/>
      <!-- torso: black cardigan over a light camisole -->
      <path d="M108 164Q146 128 190 152L204 266L98 272Z" fill="url(#gcard)"/>
            <path d="M148 150L160 262M176 158L180 262" stroke="#050205" stroke-width="2" opacity=".6" fill="none"/>
      <!-- resting arm on the lap -->
      <path d="M142 170Q128 220 160 246" stroke="#0f080f" stroke-width="17" stroke-linecap="round" fill="none"/>
      <ellipse cx="180" cy="252" rx="13" ry="8" fill="#1c111a" transform="rotate(-8 180 252)"/>
      <!-- neck, head and hair (nodding) -->
      <g class="nod">
        <path d="M146 130L172 128L170 160L142 164Z" fill="#171019"/>
        <path d="M128 54C150 40 178 48 184 72L186 82Q198 90 190 98Q187 101 184 100L186 108Q191 113 185 116L183 124Q183 138 169 142L148 146Q132 138 132 112Z" fill="url(#gskin)"/>
        <ellipse cx="146" cy="102" rx="6" ry="9" fill="#171019"/>
        <path d="M128 90C116 40 160 30 184 62C170 54 152 58 142 70C136 78 134 88 134 100Z" fill="#150c13"/>
        <path d="M170 66Q176 62 184 70" stroke="#150c13" stroke-width="5" stroke-linecap="round" fill="none"/>
        <path d="M130 86C112 100 112 140 104 200" stroke="#150c13" stroke-width="16" stroke-linecap="round" fill="none"/>
        <path d="M136 96C128 124 130 154 120 192" stroke="#1a1019" stroke-width="12" stroke-linecap="round" fill="none"/>
        <!-- face details -->
        <g fill="none" stroke="#f1dfb8" stroke-opacity=".3" stroke-width="1.7"><circle cx="171" cy="86" r="10"/><path d="M161 84L146 92"/></g>
      </g>
      <!-- the arm reaching toward the vase -->
      <g class="reach">
        <path d="M176 164L210 214L252 192" stroke="#0d070d" stroke-width="19" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
        <path d="M252 192L266 184" stroke="#1c111a" stroke-width="13" stroke-linecap="round" fill="none"/>
        <g stroke="#1c111a" stroke-width="3.2" stroke-linecap="round"><path d="M266 180L278 174"/><path d="M267 185L280 183"/><path d="M265 189L277 192"/></g>
      </g>
      <!-- warm rim light from the vase side -->
      <g fill="none" stroke="#ffe0a8" stroke-opacity=".5" stroke-width="1.6" stroke-linecap="round"><path d="M184 62Q190 80 190 96"/><path d="M190 100L186 116"/><path d="M176 160L210 214"/><path d="M214 258L240 292"/></g>
    </g>
    <g class="ack" fill="#ff8fa8"><path class="h1" d="M286 150c-5-6 3-12 6-5c3-7 11-1 6 5l-6 7z"/><path class="h2" d="M292 120c-4-5 2-9 5-4c2-5 8-1 4 4l-4.5 5z"/></g>
  </svg>`;
}

// "Museo" plays only while you are in the museum. Browsers block sound until the first tap, so wait for one if needed.
function museumMusic() {
  playMusic('museum');
  const kick = () => {
    ['pointerdown', 'keydown', 'touchstart'].forEach((t) => window.removeEventListener(t, kick));
    if (route !== 'museum') return;
    const playing = [...music.all].some((a) => !a.paused);
    if (!playing) { music.id = null; playMusic('museum'); }
  };
  ['pointerdown', 'keydown', 'touchstart'].forEach((t) => window.addEventListener(t, kick, { passive: true }));
}

function showMuseum() {
  setTheme(MUSEUM_THEME);
  rain([], 0);
  museumMusic();

  const fx = (f) => (f.x / 100 + f.w / 2).toFixed(4); // frame centre as a fraction of the room width
  const frames = MUSEUM.frames.map((f, i) => `<button class="mframe" data-i="${i}" style="left:${f.x}%;top:${f.y}%;--fw:${f.w};--ratio:${f.ratio};--tilt:${f.tilt || 0}deg;--i:${i}" aria-label="Open picture ${i + 1}">
      <span class="mwood"><span class="mfil"><span class="mmat"><img alt="" data-src="${f.src}"></span></span></span>
      ${f.plaque ? `<span class="mplaque">${f.plaque}</span>` : ''}
    </button>`).join('');
  const lights = MUSEUM.frames.map((f) =>
    `<i class="fix" style="left:calc(var(--rw) * ${fx(f)})"></i><i class="mcone" style="left:calc(var(--rw) * ${fx(f)});width:calc(var(--rw) * ${(f.w * 2.6).toFixed(3)})"></i>`).join('');
  let dust = '';
  for (let i = 0; i < 44; i++) {
    dust += `<b style="left:${rand(4, 96).toFixed(1)}%;top:${rand(10, 72).toFixed(1)}%;--s:${rand(1.5, 3.2).toFixed(1)}px;--dx:${rand(-30, 30).toFixed(0)}px;--dur:${rand(14, 30).toFixed(0)}s;--dl:${rand(-30, 0).toFixed(0)}s"></b>`;
  }

  app.innerHTML = `<section class="mus">
    <div class="mus-scroll" id="musScroll"><div class="room" id="room">
      ${CONFIG.since ? `<div class="mdate"><span>Since</span><b>${CONFIG.since}</b></div>` : ''}
      <div class="ceil"></div><div class="wall"></div><div class="floor"></div><div class="rail"></div>
      ${lights}<i class="fix" id="vFix"></i><i class="mcone" id="vCone"></i><i class="pool" id="vPool"></i>
      ${frames}
      <div class="viewers" aria-hidden="true">${viewersSVG()}</div>
      <div class="sitter" aria-hidden="true">${sitterSVG()}</div>
      <div class="bench" aria-hidden="true"><span class="seat"></span><span class="lg l1"></span><span class="lg l2"></span></div>
      <button class="vase-btn" id="vaseBtn" aria-label="Open the flowers"><span class="vase-hint">Tap the flowers ❀</span>${vaseSVG()}</button>
      <div class="dust" aria-hidden="true">${dust}</div>
    </div></div>
    <div class="torch" id="torch"></div>
    <p class="mus-hint" id="musHint">Swipe to look around →</p>
    <button class="ghost to-vase" id="toVase">Flowers ›</button>
    <button class="ghost round mus-mute" id="musMute" aria-label="Toggle music">${music.muted ? '🔇' : '🔊'}</button>
  </section>`;

  const sc = document.getElementById('musScroll');
  const hint = document.getElementById('musHint');
  sc.addEventListener('scroll', () => hint.classList.add('gone'), { once: true });
  app.querySelectorAll('.mframe img').forEach((img) => setImg(img, img.dataset.src, () => img.closest('.mframe').remove()));
  app.querySelectorAll('.mframe').forEach((b) => {
    b.onclick = () => { const f = MUSEUM.frames[+b.dataset.i]; openPhotos([{ src: f.src, caption: f.caption || '' }], null); };
  });
  const toFlowers = (e) => transition(() => { route = 'home'; render(); }, e, HOME_THEME.glow);
  document.getElementById('vaseBtn').onclick = toFlowers;
  startTorch(document.getElementById('torch'));
  startPetals();
  document.getElementById('musMute').onclick = (e) => toggleMute(e.currentTarget);
  document.getElementById('toVase').onclick = () => sc.scrollTo({ left: sc.scrollWidth, behavior: 'smooth' });

  // aim a spotlight at the vase (its size depends on the screen)
  requestAnimationFrame(() => {
    const room = document.getElementById('room'), v = document.getElementById('vaseBtn');
    if (!room || !v) return;
    const rr = room.getBoundingClientRect(), vr = v.getBoundingClientRect();
    const cx = vr.left - rr.left + vr.width / 2;
    document.getElementById('vFix').style.left = cx + 'px';
    const cone = document.getElementById('vCone');
    cone.style.left = cx + 'px'; cone.style.width = Math.max(vr.width * 1.9, 300) + 'px';
    const pool = document.getElementById('vPool');
    pool.style.left = cx + 'px'; pool.style.width = vr.width * 1.7 + 'px';
  });
}

/* ---------------- HOME ---------------- */
function showHome() {
  setTheme(HOME_THEME);
  rain(HOME_THEME.rain, 9);
  stopMusic();

  const cards = BOUQUETS.map((b, i) => {
    const pv = b.preview;
    const flower = Flowers.bloom(pv.k, pv.s, Flowers.PAL[pv.p], b.seed + 5, .6 + i * .15);
    return `<button class="hm-card" data-i="${i}" style="--i:${i};--c:${b.theme.glow}" aria-label="Open bouquet ${b.letter}: ${b.name}">
      <svg viewBox="${pv.vb}"><g class="flw">${flower}</g></svg>
      <span class="hm-name">${b.name}</span>
      <span class="hm-sub2">${b.sub}</span>
      <span class="hm-open">Open</span>
    </button>`;
  }).join('');

  app.innerHTML = `<section class="hm">
    <button class="ghost hm-back" id="backGal">← Gallery</button>
    <header class="hm-top">
      <p class="hm-eyebrow">for ${CONFIG.to}</p>
      <h1 class="hm-title">Hello, Flower</h1>
      <p class="hm-sub">Five bouquets, five messages.</p>
    </header>
    <div class="hm-wrap">
      <button class="ghost round arrow l" aria-label="Previous">‹</button>
      <div class="hm-carousel" id="carousel">${cards}</div>
      <button class="ghost round arrow r" aria-label="Next">›</button>
    </div>
    <nav class="hm-dots">${BOUQUETS.map((b, i) => `<button class="hm-dot" data-i="${i}" aria-label="Bouquet ${b.letter}"></button>`).join('')}</nav>
    <p class="hm-hint">Tap a bouquet to open it</p>
  </section>`;

  document.getElementById('backGal').onclick = (e) => openMuseum(e);
  const car = document.getElementById('carousel');
  const cardEls = [...car.querySelectorAll('.hm-card')];
  const dots = [...app.querySelectorAll('.hm-dot')];
  let dragged = false;

  const updateActive = () => {
    const mid = car.scrollLeft + car.clientWidth / 2;
    let best = 0, bd = Infinity;
    cardEls.forEach((c, i) => {
      const d = Math.abs(c.offsetLeft + c.offsetWidth / 2 - mid);
      if (d < bd) { bd = d; best = i; }
    });
    cardEls.forEach((c, i) => c.classList.toggle('active', i === best));
    dots.forEach((c, i) => c.classList.toggle('active', i === best));
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
  dots.forEach((d, i) => d.addEventListener('click', () => scrollToCard(i)));
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
