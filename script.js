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

const openBouquet = (i, ev) => transition(() => { location.hash = `#/${BOUQUETS[i].id}`; }, ev, BOUQUETS[i].theme.glow);
const openHome = (ev, color) => transition(() => { location.hash = '#/'; }, ev, color || HOME_THEME.glow);

/* ---------------- router ---------------- */
function render() {
  clearTimeout(typeTimer);
  const id = location.hash.replace('#/', '');
  const i = BOUQUETS.findIndex((b) => b.id === id);
  app.scrollTop = 0;
  i >= 0 ? showBouquet(i) : showHome();
}
window.addEventListener('hashchange', render);

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
  document.getElementById('bwrap').onclick = (e) => burst(e.clientX, e.clientY, [b.theme.glow, '#fff', ...b.theme.rain]);

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
  const i = BOUQUETS.findIndex((b) => location.hash === `#/${b.id}`);
  if (i < 0) return;
  if (e.key === 'ArrowRight') document.getElementById('next')?.click();
  if (e.key === 'ArrowLeft') document.getElementById('prev')?.click();
  if (e.key === 'Escape') document.getElementById('back')?.click();
});

render();
