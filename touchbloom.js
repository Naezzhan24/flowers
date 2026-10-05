/* ============================================================
   TOUCH BLOOM: kung saan hinahawakan ng daliri (o mouse) ay umiilaw,
   tapos may mga petals na nahuhulog mula sa lugar na iyon.
   Walang dependency. Ang kulay ng glow ay sumusunod sa theme ng kasalukuyang page (--glow).
   Pwedeng baguhin ang mga numero sa CFG sa baba.
   ============================================================ */
(() => {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const CFG = {
    petalsOnTap: 9,     // ilang petals kada tap
    petalsOnDrag: 3,    // ilang petals kada "hakbang" ng pag-drag
    dragStep: 38,       // layo (px) bago maglabas ulit habang nag-drag
    maxPetals: 200,     // limit para hindi bumagal sa phone
    gravity: 90,        // bilis ng pagbagsak
    petalColors: ['#ffc2d1', '#ff9ec4', '#fff3e0', '#f7a8c4', '#ffffff'],
  }

  const canvas = document.createElement('canvas')
  canvas.setAttribute('aria-hidden', 'true')
  canvas.style.cssText =
    'position:fixed;inset:0;width:100%;height:100dvh;pointer-events:none;z-index:100'
  document.body.appendChild(canvas)
  const ctx = canvas.getContext('2d')

  const glows = []
  const petals = []
  let dpr = 1, W = 0, H = 0, raf = 0, last = 0
  let pressed = false
  let lastSpawn = { x: -999, y: -999 }

  const rand = (a, b) => a + Math.random() * (b - a)

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2)
    W = window.innerWidth
    H = window.innerHeight
    canvas.width = W * dpr
    canvas.height = H * dpr
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  }

  // "#rrggbb" -> [r,g,b] para magamit sa gradient
  function rgb(hex) {
    const h = (hex || '').trim().replace('#', '')
    if (h.length !== 6) return [255, 158, 196]
    return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16))
  }
  const themeGlow = () => rgb(getComputedStyle(document.documentElement).getPropertyValue('--glow'))

  function burst(x, y, count) {
    glows.push({ x, y, age: 0, life: 1.1, size: rand(70, 105), c: themeGlow() })
    for (let i = 0; i < count && petals.length < CFG.maxPetals; i++) {
      petals.push(makePetal(x + rand(-14, 14), y + rand(-14, 14), rand(-45, 45), rand(-70, -10), rand(2.6, 4.2)))
      // vy negatibo: konting talon pataas, tapos hihilahin ng gravity
    }
    wake()
  }

  function makePetal(x, y, vx, vy, life) {
    return {
      x, y, vx, vy,
      size: rand(7, 13),
      rot: rand(0, Math.PI * 2),
      vrot: rand(-3, 3),
      sway: rand(0, Math.PI * 2),
      swaySpeed: rand(2, 4),
      age: 0,
      life,
      color: CFG.petalColors[Math.floor(Math.random() * CFG.petalColors.length)],
    }
  }

  function wake() {
    if (!raf) {
      last = performance.now()
      raf = requestAnimationFrame(frame)
    }
  }

  // ulan ng petals sa buong screen (para sa cinematic reveal). ms = gaano katagal, perSec = dami kada segundo
  let showerTimer = 0
  function shower(ms = 6000, perSec = 38) {
    clearInterval(showerTimer)
    const t0 = performance.now()
    showerTimer = setInterval(() => {
      if (performance.now() - t0 > ms) { clearInterval(showerTimer); return }
      const n = Math.max(1, Math.round(perSec / 12))
      for (let i = 0; i < n && petals.length < CFG.maxPetals + 120; i++)
        petals.push(makePetal(rand(-20, W + 20), rand(-40, -10), rand(-25, 25), rand(60, 120), rand(9, 13)))
      wake()
    }, 80)
  }
  window.TouchBloom = { shower, burst }

  function drawPetal(p, alpha) {
    const s = p.size
    ctx.save()
    ctx.translate(p.x, p.y)
    ctx.rotate(p.rot)
    ctx.scale(1, 0.55 + 0.45 * Math.abs(Math.sin(p.sway))) // parang umiikot sa hangin
    ctx.globalAlpha = alpha
    ctx.fillStyle = p.color
    ctx.shadowColor = 'rgba(0,0,0,.25)'
    ctx.shadowBlur = 3
    ctx.beginPath()
    ctx.moveTo(0, -s)
    ctx.bezierCurveTo(s * 0.9, -s * 0.5, s * 0.7, s * 0.7, 0, s)
    ctx.bezierCurveTo(-s * 0.7, s * 0.7, -s * 0.9, -s * 0.5, 0, -s)
    ctx.fill()
    ctx.restore()
  }

  function frame(t) {
    const dt = Math.min((t - last) / 1000 || 0.016, 0.05)
    last = t
    ctx.clearRect(0, 0, W, H)

    ctx.globalCompositeOperation = 'lighter'
    for (let i = glows.length - 1; i >= 0; i--) {
      const g = glows[i]
      g.age += dt
      const k = g.age / g.life
      if (k >= 1) { glows.splice(i, 1); continue }
      const r = g.size * (0.6 + k * 0.7)
      const a = (1 - k) * 0.55
      const [R, G, B] = g.c
      const grad = ctx.createRadialGradient(g.x, g.y, 0, g.x, g.y, r)
      grad.addColorStop(0, `rgba(255,245,240,${a})`)
      grad.addColorStop(0.35, `rgba(${R},${G},${B},${a * 0.55})`)
      grad.addColorStop(1, `rgba(${R},${G},${B},0)`)
      ctx.fillStyle = grad
      ctx.fillRect(g.x - r, g.y - r, r * 2, r * 2)
    }

    ctx.globalCompositeOperation = 'source-over'
    for (let i = petals.length - 1; i >= 0; i--) {
      const p = petals[i]
      p.age += dt
      if (p.age >= p.life || p.y > H + 30) { petals.splice(i, 1); continue }
      p.vy += CFG.gravity * dt
      p.vy *= 1 - 1.4 * dt // hangin: mabagal at lutang ang bagsak
      p.vx *= 1 - 1.2 * dt
      p.sway += p.swaySpeed * dt
      p.x += (p.vx + Math.sin(p.sway) * 28) * dt
      p.y += p.vy * dt
      p.rot += p.vrot * dt
      drawPetal(p, Math.min(1, (p.life - p.age) / 0.8))
    }

    raf = glows.length || petals.length ? requestAnimationFrame(frame) : 0
  }

  window.addEventListener('pointerdown', (e) => {
    pressed = true
    lastSpawn = { x: e.clientX, y: e.clientY }
    burst(e.clientX, e.clientY, CFG.petalsOnTap)
  }, { passive: true })

  window.addEventListener('pointermove', (e) => {
    if (!pressed) return // trail lang habang nakadiin ang daliri / mouse button
    const dx = e.clientX - lastSpawn.x
    const dy = e.clientY - lastSpawn.y
    if (dx * dx + dy * dy < CFG.dragStep * CFG.dragStep) return
    lastSpawn = { x: e.clientX, y: e.clientY }
    burst(e.clientX, e.clientY, CFG.petalsOnDrag)
  }, { passive: true })

  const release = () => { pressed = false }
  window.addEventListener('pointerup', release, { passive: true })
  window.addEventListener('pointercancel', release, { passive: true })
  window.addEventListener('resize', resize)
  resize()
})()
