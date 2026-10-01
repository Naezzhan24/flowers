/* Procedural SVG flowers + bouquet builder (no dependencies) */
(function (global) {
  const rnd = (seed) => {
    let s = (Math.imul(seed || 1, 2654435761) >>> 0) || 1;
    return () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296);
  };
  const n2 = (v) => Math.round(v * 100) / 100;

  /* ---------- petal shapes (pointing up, base at origin) ---------- */
  const shape = {
    round: (l, w) =>
      `M0 0C${n2(-w)} ${n2(-l * .15)} ${n2(-w * 1.15)} ${n2(-l * .95)} 0 ${n2(-l)}C${n2(w * 1.15)} ${n2(-l * .95)} ${n2(w)} ${n2(-l * .15)} 0 0Z`,
    ruff: (l, w) =>
      `M0 0C${n2(-w * 1.1)} ${n2(-l * .1)} ${n2(-w * 1.2)} ${n2(-l * .7)} ${n2(-w * .7)} ${n2(-l * .92)}Q${n2(-w * .35)} ${n2(-l * 1.08)} 0 ${n2(-l * .94)}Q${n2(w * .35)} ${n2(-l * 1.08)} ${n2(w * .7)} ${n2(-l * .92)}C${n2(w * 1.2)} ${n2(-l * .7)} ${n2(w * 1.1)} ${n2(-l * .1)} 0 0Z`,
    carn: (l, w) => {
      const t = 8;
      let d = `M0 0Q${n2(-w * .9)} ${n2(-l * .35)} ${n2(-w)} ${n2(-l * .85)}`;
      for (let i = 1; i <= t; i++) {
        d += `L${n2(-w + (2 * w * i) / t)} ${n2(i % 2 ? -l * .99 : -l * .84)}`;
      }
      return d + `Q${n2(w * .9)} ${n2(-l * .35)} 0 0Z`;
    },
    thin: (l, w) =>
      `M0 0C${n2(-w)} ${n2(-l * .3)} ${n2(-w)} ${n2(-l * .85)} 0 ${n2(-l)}C${n2(w)} ${n2(-l * .85)} ${n2(w)} ${n2(-l * .3)} 0 0Z`,
    tulip: (l, w) =>
      `M0 0C${n2(-w)} ${n2(-l * .08)} ${n2(-w * .9)} ${n2(-l * .75)} 0 ${n2(-l)}C${n2(w * .9)} ${n2(-l * .75)} ${n2(w)} ${n2(-l * .08)} 0 0Z`,
  };

  /* ---------- palettes ---------- */
  const PAL = {
    carnWhite: ['#ffffff', '#f8f4fd', '#efe7f9', '#e4d8f4', '#d7c7ee', '#c8b3e5'],
    carnPurple: ['#cfaef0', '#bf93e6', '#ae7ada', '#9b64cb', '#8851b8', '#733ea2'],
    roseRed: ['#dd2c48', '#c81e3d', '#b01634', '#95102d', '#7b0b26'],
    peony: ['#fee3ec', '#fccbda', '#f9adc6', '#f592b5', '#ef74a0', '#e75a8b'],
    gerbera: ['#ff4152', '#e8203b', '#c8112d'],
    tulipPink: ['#ff9dbd', '#e8709a', '#b73e70'],
    tulipCoral: ['#ff9d80', '#f0715c', '#bd4331'],
    tulipYellow: ['#ffe98a', '#f7c944', '#c1922a'],
  };

  /* ---------- petal rings ---------- */
  function ring(o, rng, d0) {
    let out = '';
    for (let i = 0; i < o.n; i++) {
      const a = n2(o.off + (i * 360) / o.n + (o.jit ? (rng() - .5) * o.jit : 0));
      const len = o.len * (1 + (o.vary ? (rng() - .5) * o.vary : 0));
      const wid = len * o.w;
      let inner = `<path d="${o.shape(len, wid)}" fill="${o.fill}" stroke="rgba(60,0,20,.16)" stroke-width=".8"/>`;
      if (o.hl) inner += `<path d="${o.shape(len * .6, wid * .6)}" transform="translate(0 ${n2(-len * .3)})" fill="#fff" opacity=".17"/>`;
      if (o.lip) inner += `<path d="M${n2(-wid * .85)} ${n2(-len * .72)}Q0 ${n2(-len * 1.12)} ${n2(wid * .85)} ${n2(-len * .72)}" stroke="rgba(255,255,255,.4)" stroke-width="1.6" fill="none" stroke-linecap="round"/><path d="M${n2(-wid * .7)} ${n2(-len * .35)}Q0 ${n2(-len * .55)} ${n2(wid * .7)} ${n2(-len * .35)}" stroke="rgba(40,0,10,.3)" stroke-width="1.4" fill="none"/>`;
      if (o.sh) inner +=`<path d="${o.shape(len * .55, wid * .6)}" fill="${o.sh}" opacity=".24"/>`;
      if (o.crease) inner += `<path d="M0 ${n2(-len * .12)}L0 ${n2(-len * .86)}" stroke="rgba(0,0,0,.22)" stroke-width=".9" fill="none"/>`;
      out += `<g transform="rotate(${a})"><g class="petal" style="--pd:${n2(d0 + i * (o.step || .02))}s">${inner}</g></g>`;
    }
    return out;
  }

  /* ---------- flower builders (return inner markup, centred on 0,0) ---------- */
  const build = {
    rose(s, pal, rng) {
      const L = [[5, 0, 1, .66], [5, 36, .84, .6], [4, 14, .66, .52], [3, 60, .48, .44], [3, 20, .32, .36]];
      let out = '';
      L.forEach((l, i) => {
        out += ring({ n: l[0], off: l[1], len: s * l[2], w: l[3], shape: shape.round, fill: pal[i], hl: true, lip: true, jit: 10, vary: .06, step: .03 }, rng, (L.length - 1 - i) * .14);
      });
      const k = s * .16;
      out += `<g class="core"><circle r="${n2(k)}" fill="${pal[4]}" stroke="rgba(0,0,0,.35)" stroke-width="1"/>` +
        `<path d="M${n2(-k * .8)} ${n2(k * .1)}Q${n2(-k * .6)} ${n2(-k * .9)} ${n2(k * .3)} ${n2(-k * .8)}" stroke="${pal[0]}" stroke-width="1.6" fill="none" stroke-linecap="round" opacity=".7"/>` +
        `<path d="M${n2(k * .7)} ${n2(-k * .1)}Q${n2(k * .5)} ${n2(k * .8)} ${n2(-k * .3)} ${n2(k * .6)}" stroke="rgba(0,0,0,.45)" stroke-width="1.4" fill="none" stroke-linecap="round"/>` +
        `<path d="M${n2(-k * .3)} ${n2(k * .1)}Q0 ${n2(-k * .5)} ${n2(k * .3)} 0Q${n2(k * .1)} ${n2(k * .35)} ${n2(-k * .15)} ${n2(k * .2)}" stroke="rgba(0,0,0,.5)" stroke-width="1.2" fill="none"/></g>`;
      return out;
    },
    peony(s, pal, rng) {
      const N = [8, 8, 7, 6, 5, 4], O = [0, 22, 10, 30, 5, 40], Ls = [1, .88, .74, .6, .45, .3];
      let out = '';
      N.forEach((n, i) => {
        out += ring({ n, off: O[i], len: s * Ls[i], w: .7, shape: shape.ruff, fill: pal[i], hl: true, sh: pal[Math.min(i + 2, 5)], jit: 12, vary: .08, step: .022 }, rng, (N.length - 1 - i) * .13);
      });
      out += `<g class="core"><circle r="${n2(s * .08)}" fill="${pal[5]}"/>`;
      for (let i = 0; i < 18; i++) {
        const a = (i * 137.5 * Math.PI) / 180, r = s * .03 + s * .07 * Math.sqrt(i / 18);
        out += `<circle cx="${n2(Math.cos(a) * r)}" cy="${n2(Math.sin(a) * r)}" r="${n2(s * .022)}" fill="#f7c948"/>`;
      }
      return out + '</g>';
    },
    carnation(s, pal, rng) {
      const N = [10, 9, 8, 7, 6, 5], Ls = [1, .88, .74, .6, .46, .32];
      let out = '';
      N.forEach((n, i) => {
        out += ring({ n, off: i * 17, len: s * Ls[i], w: .5, shape: shape.carn, fill: pal[i], sh: pal[5], crease: true, jit: 10, vary: .07, step: .018 }, rng, (N.length - 1 - i) * .12);
      });
      return out + `<g class="core"><circle r="${n2(s * .07)}" fill="${pal[5]}"/></g>`;
    },
    gerbera(s, pal, rng) {
      const R = [[20, 0, 1], [20, 9, .9], [16, 4, .78]];
      let out = '';
      R.forEach((r, i) => {
        out += ring({ n: r[0], off: r[1], len: s * r[2], w: .13, shape: shape.thin, fill: pal[i], crease: true, jit: 5, vary: .06, step: .012 }, rng, (R.length - 1 - i) * .1);
      });
      out += `<g class="core"><circle r="${n2(s * .25)}" fill="#2a170f" stroke="#f5b83d" stroke-width="${n2(s * .02)}"/>`;
      for (let i = 0; i < 44; i++) {
        const a = (i * 137.5 * Math.PI) / 180, r = s * .22 * Math.sqrt((i + .5) / 44);
        out += `<circle cx="${n2(Math.cos(a) * r)}" cy="${n2(Math.sin(a) * r)}" r="${n2(s * .019)}" fill="${i % 3 ? '#f5b83d' : '#a86a1c'}"/>`;
      }
      return out + '</g>';
    },
    tulip(s, pal) {
      const h = s * 1.7, w = s * .85;
      const part = (a, fill, hh, ww, d, extra = '') =>
        `<g transform="rotate(${a})"><g class="petal" style="--pd:${d}s"><path d="${shape.tulip(hh, ww)}" fill="${fill}" stroke="rgba(60,0,20,.2)" stroke-width=".8"/>${extra}</g></g>`;
      const gloss = `<path d="${shape.tulip(h * .78, w * .32)}" transform="translate(${n2(-w * .3)} ${n2(-h * .08)})" fill="#fff" opacity=".2"/><path d="M0 ${n2(-h * .1)}L0 ${n2(-h * .8)}" stroke="${pal[2]}" stroke-width="1" opacity=".35" fill="none"/>`;
      return part(-19, pal[1], h * .98, w * .9, .16) + part(19, pal[1], h * .98, w * .9, .16) + part(0, pal[0], h, w * .92, 0, gloss);
    },
  };

  function bloom(kind, s, pal, seed, base) {
    const inner = build[kind](s, pal, rnd(seed));
    return `<g class="sway" style="--base:${n2(base)}s"><g class="spin">${inner}</g></g>`;
  }

  /* ---------- leaves ---------- */
  function leafShape(x0, y0, x1, y1, w) {
    const dx = x1 - x0, dy = y1 - y0, len = Math.hypot(dx, dy);
    const nx = -dy / len, ny = dx / len;
    const bx = (x0 + x1) / 2 + nx * len * .08, by = (y0 + y1) / 2 + ny * len * .08;
    return {
      d: `M${n2(x0)} ${n2(y0)}Q${n2(bx + nx * w)} ${n2(by + ny * w)} ${n2(x1)} ${n2(y1)}Q${n2(bx - nx * w)} ${n2(by - ny * w)} ${n2(x0)} ${n2(y0)}Z`,
      rib: `M${n2(x0)} ${n2(y0)}Q${n2(bx)} ${n2(by)} ${n2(x1)} ${n2(y1)}`,
    };
  }

  /* ---------- whole bouquet ---------- */
  function buildBouquet(b) {
    const H = { x: 200, y: 440 };
    const rng = rnd(b.seed);
    const th = b.theme;
    let leaves = '', filler = '', stems = '', flowers = '', sparkles = '';

    // greenery
    const L = b.leaves;
    for (let i = 0; i < L.n; i++) {
      const t = L.n === 1 ? .5 : i / (L.n - 1);
      const ang = ((-72 + 144 * t) + (rng() - .5) * 12) * Math.PI / 180;
      let len = L.min + (L.max - L.min) * rng();
      let tx = H.x + Math.sin(ang) * len, ty = H.y - Math.cos(ang) * len * .95;
      tx = Math.max(14, Math.min(386, tx));
      const sh = leafShape(H.x, H.y, tx, ty, len * L.w);
      leaves += `<g class="leaf" style="--ld:${n2(.5 + i * .06)}s;transform-origin:${H.x}px ${H.y}px"><path d="${sh.d}" fill="${i % 2 ? L.color : L.dark}"/><path d="${sh.rib}" stroke="rgba(0,0,0,.25)" stroke-width="1" fill="none"/></g>`;
    }

    // filler sprigs
    const F = b.filler;
    if (F) {
      for (let i = 0; i < F.n; i++) {
        const t = F.n === 1 ? .5 : i / (F.n - 1);
        const ang = ((-82 + 164 * t) + (rng() - .5) * 8) * Math.PI / 180;
        const r = 215 + rng() * 85;
        const tx = Math.max(16, Math.min(384, H.x + Math.sin(ang) * r)), ty = H.y - Math.cos(ang) * r * .92;
        const cx = H.x + (tx - H.x) * .7, cy = H.y + (ty - H.y) * .55;
        const sd = n2(.6 + i * .05);
        filler += `<path class="stem" pathLength="1" style="--sd:${sd}s" d="M${H.x} ${H.y}Q${n2(cx)} ${n2(cy)} ${n2(tx)} ${n2(ty)}" stroke="${b.stem}" stroke-width="1.6" fill="none" stroke-linecap="round"/>`;
        for (let k = 0; k < 6; k++) {
          const bx = tx + (rng() - .5) * 30, by = ty + (rng() - .5) * 26;
          filler += `<circle class="bl" style="--bd:${n2(1.4 + i * .05 + k * .04)}s;transform-origin:${n2(bx)}px ${n2(by)}px" cx="${n2(bx)}" cy="${n2(by)}" r="${n2(3 + rng() * 3)}" fill="${F.color}"/>`;
        }
      }
    }

    // flowers + their stems
    const N = b.flowers.length;
    const step = Math.min(.28, 2.6 / N);
    let last = 0;
    b.flowers.forEach((f, i) => {
      const kind = f.k || b.kind;
      const dx = f.x - H.x, dy = f.y - H.y;
      const cx = H.x + dx * .75, cy = H.y + dy * .6;
      const sd = n2(.5 + i * .07);
      stems += `<path class="stem" pathLength="1" style="--sd:${sd}s" d="M${H.x} ${H.y}Q${n2(cx)} ${n2(cy)} ${f.x} ${f.y}" stroke="${b.stem}" stroke-width="${kind === 'gerbera' ? 5 : 4}" fill="none" stroke-linecap="round"/>`;
      const tang = (Math.atan2(f.x - cx, -(f.y - cy)) * 180) / Math.PI;
      const rot = n2(kind === 'tulip' ? tang : tang * .25);
      const base = 1.3 + i * step;
      last = base;
      const hit = n2(f.s * (kind === 'tulip' ? 1.1 : .95));
      const hy = kind === 'tulip' ? n2(-f.s * .6) : 0;
      flowers += `<g class="fl" data-f="${i}" role="button" tabindex="0" aria-label="Open pictures of flower ${i + 1}" transform="translate(${f.x} ${f.y})"><circle cx="0" cy="${hy}" r="${hit}" fill="transparent"/><g transform="rotate(${rot})">${bloom(kind, f.s, PAL[f.p], b.seed + i * 7 + 3, base)}</g></g>`;
    });

    // sparkles
    for (let i = 0; i < 18; i++) {
      const x = 20 + rng() * 360, y = 20 + rng() * 400, sz = 3 + rng() * 6;
      sparkles += `<g transform="translate(${n2(x)} ${n2(y)}) scale(${n2(sz)})"><path class="tw" style="--td:${n2(2 + rng() * 2.5)}s;--tl:${n2(2 + rng() * 4)}s" d="M0-1Q.12-.12 1 0Q.12.12 0 1Q-.12.12-1 0Q-.12-.12 0-1Z" fill="${th.glow}"/></g>`;
    }

    const bowDelay = n2(last + 1.2);
    const rib = th.ribbon, ribD = th.ribbonDark;
    const paper = `
      <g class="paper" style="--pd:.1s">
        <path d="M200 548L60 370Q200 336 340 370Z" fill="${th.paper[2]}"/>
      </g>`;
    const front = `
      <g class="paper" style="--pd:.25s">
        <path d="M200 552L66 374Q150 404 238 420Z" fill="${th.paper[0]}"/>
        <path d="M200 552L334 374Q250 404 162 420Z" fill="${th.paper[1]}"/>
        <path d="M200 552L238 420" stroke="rgba(0,0,0,.12)" stroke-width="1.5" fill="none"/>
        <path d="M66 374Q150 404 238 420" stroke="rgba(255,255,255,.55)" stroke-width="2" fill="none"/>
        <path d="M334 374Q250 404 162 420" stroke="rgba(255,255,255,.4)" stroke-width="2" fill="none"/>
        <path d="M200 552L66 374L120 392Z" fill="url(#shade)" opacity=".35"/>
      </g>`;
    const bow = `
      <g class="bow" style="--bd:${bowDelay}s;transform-origin:200px 470px">
        <path d="M198 476C190 510 176 528 152 548L170 552C188 540 198 512 202 484Z" fill="${ribD}"/>
        <path d="M202 476C210 510 224 528 248 548L230 552C212 540 202 512 198 484Z" fill="${ribD}"/>
        <path d="M200 470C150 424 108 462 150 490C176 500 196 484 200 470Z" fill="${rib}"/>
        <path d="M200 470C250 424 292 462 250 490C224 500 204 484 200 470Z" fill="${rib}"/>
        <path d="M200 470C160 448 132 470 156 484" stroke="rgba(255,255,255,.35)" stroke-width="2" fill="none"/>
        <ellipse cx="200" cy="474" rx="13" ry="11" fill="${ribD}"/>
        <ellipse cx="198" cy="471" rx="7" ry="5" fill="${rib}"/>
      </g>`;

    const svg = `<svg class="bq-svg" viewBox="0 0 400 560" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${b.name} bouquet">
      <defs><linearGradient id="shade" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#000"/></linearGradient></defs>
      ${paper}${leaves}${filler}${stems}${flowers}${front}${bow}
      <g class="spark">${sparkles}</g>
    </svg>`;
    return { svg, duration: last + 2.4 };
  }

  global.Flowers = { PAL, bloom, buildBouquet };
})(window);
