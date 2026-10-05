/* ============================================================
   EDIT ME: pangalan niya, pirma mo, at ang mga message kada bouquet
   ============================================================ */
const CONFIG = {
  to: 'Anne',
  from: '— Jiroom ❤',
  // IBIGAY MO ANG PETSA: lalabas sa plaque sa pader ng museum at sa huling page ng libro. Iwanang '' kung wala pa.
  since: '',
  // Nasa kisame ng museum (night sky + Aries). Palitan kung kailangan; iwanang '' para walang petsa.
  skyDate: '04-18-2006',
  // SURPRISE: ang secret bouquet (Thumbelina) ay TAGO hanggang (1) nabuksan na niya ang limang bouquet AT
  // (2) nasa tambayan na siya (place) AT (3) dumating ang oras (unlockAt, kung may nilagay).
  // Para i-test: buksan ang index.html?preview (lalaktaw sa lugar at oras).
  place: {
    name: 'CDC, Clark',
    // IMPORTANT: ilagay ang eksaktong pin ng tambayan. Google Maps: long-press sa lugar > lalabas ang "15.xxxxx, 120.xxxxx".
    // O buksan ang  index.html?where  habang nandoon ka mismo para makita ang lat/lng. Habang null, HINDI mag-a-unlock (ligtas).
    lat: 15.1784523,
    lng: 120.518364,
    radius: 200, // metro. "Malapit na" = 200 m. Palakihin kung gusto mong mas maaga (hal. 300), liitan kung gusto mong mas eksakto (hal. 100)
  },
  // Optional na oras: 'YYYY-MM-DDTHH:MM:00' (oras ng phone niya), hal. '2026-10-11T19:00:00'. Iwanang '' kung location lang.
  unlockAt: '',
  // REVEAL: pag nadetect na nasa tambayan na siya, lalabas ang mga tanong (Yes/No) isa-isa, tapos susulpot ang mga bulaklak ng Thumbelina.
  // I-edit/dagdagan/bawasan ang mga tanong. noReply = lalabas kung "No" ang pinindot niya. retry:true = uulitin ang tanong pagkatapos ng noReply.
  reveal: {
    questions: [
      { q: 'Are you at CDC Clark right now?', yes: 'Yes', no: 'No', noReply: 'Take your time ✿ I’ll wait for you.', retry: true },
      { q: 'Are you happy right now?', yes: 'Yes', no: 'No', noReply: 'That’s okay. Thank you for being honest ❤' },
      { q: 'Are you enjoying being with Jerome?', yes: 'Yes', no: 'No', noReply: 'Then I’ll keep trying to make it better ❤' },
    ],
    finale: 'Then this one is for you ✿', // lalabas pagkatapos ng huling sagot, bago sumulpot ang mga bulaklak
  },
}

const GREEN = { color: '#3f7d4e', dark: '#2e6440' }

const BOUQUETS = [
  {
    id: 'a',
    letter: 'A',
    name: 'Carnations',
    sub: 'White & Purple',
    kind: 'carnation',
    seed: 11,
    theme: {
      bg1: '#1d1030',
      bg2: '#4b2a6b',
      glow: '#c9a7f0',
      rain: ['#ffffff', '#e4d8f4', '#b98ae0', '#a77ad8'],
      paper: ['#f1e7fb', '#cdb0ea', '#8e6bb8'],
      ribbon: '#8a56c4',
      ribbonDark: '#5e3390',
    },
    stem: '#4c8a54',
    leaves: { n: 9, min: 170, max: 250, w: 0.13, ...GREEN },
    filler: { n: 14, color: '#ffffff' },
    preview: { k: 'carnation', p: 'carnPurple', s: 72, vb: '-85 -85 170 170' },
    flowers: [
      { p: 'carnWhite', x: 128, y: 152, s: 44 },
      { p: 'carnWhite', x: 272, y: 152, s: 44 },
      { p: 'carnPurple', x: 200, y: 112, s: 46 },
      { p: 'carnPurple', x: 80, y: 234, s: 44 },
      { p: 'carnPurple', x: 320, y: 234, s: 44 },
      { p: 'carnWhite', x: 150, y: 222, s: 48 },
      { p: 'carnPurple', x: 250, y: 222, s: 48 },
      { p: 'carnWhite', x: 200, y: 276, s: 48 },
    ],
    // short message kada picture: captions[0] = a1, captions[1] = a2, ... (i-edit mo!)
    captions: [
      'Ang mga ngiti mong ito ay isa sa nagpapalakas sa araw-araw ko.',
      'Pagod ka man, ikaw pa rin ang pinakamagandang tanawin ko.',
      'Photobooth day! Ang cute mo sa kahit anong pose.',
      'Kahit simpleng lakad lang, ang saya basta kasama ka.',
      'Pahinga muna tayo, basta ikaw ang kasama ko.',
      'Ang ganda ng view, pero mas maganda ka pa rin.',
      'Kahit anong ngiti ang gawin mo, hulog na hulog padin ako.',
      'Ang ngiting ito ang isa sa dahilan kung bakit ako ginagahan sa araw.',
    ],
    message: [
      'The white is for my honest, pure love for you.',
      'The purple is for all the unique and special parts of you that I adore.',
      'I chose these because they’re just like you: simple at first glance, but the longer I look, the harder I fall.',
      'Thank you for being my safe place. ❤',
    ],
  },
  {
    id: 'b',
    letter: 'B',
    name: 'Gerberas',
    sub: 'Three Reds',
    kind: 'gerbera',
    seed: 23,
    theme: {
      bg1: '#2a0f0a',
      bg2: '#7a2212',
      glow: '#ff7a55',
      rain: ['#ff4152', '#ff6a55', '#ffd1c4', '#e8203b'],
      paper: ['#fff0e6', '#ffc7ad', '#c4472c'],
      ribbon: '#e8203b',
      ribbonDark: '#a3122a',
    },
    stem: '#4c8a54',
    leaves: { n: 8, min: 150, max: 230, w: 0.18, ...GREEN },
    filler: { n: 10, color: '#fff3e6' },
    preview: { k: 'gerbera', p: 'gerbera', s: 74, vb: '-85 -85 170 170' },
    flowers: [
      { p: 'gerbera', x: 200, y: 140, s: 84 },
      { p: 'gerbera', x: 112, y: 234, s: 78 },
      { p: 'gerbera', x: 288, y: 234, s: 78 },
    ],
    // short message kada picture: captions[0] = b1, captions[1] = b2, captions[2] = b3
    captions: [
      'Ikaw lang ang pipiliin at ikaw din ang panalangin. ',
      'Pangakong aayusin ang lahat para sayo.',
      'Mas pipillin ko ang sarili ko pero ikaw padin ang uunahin at mamahalin ko.',
    ],
    message: [
      'Gerberas stand for joy, and that’s exactly what you are to me.',
      'Three red ones, for three things I want to say:',
      'One, “I love you.” Two, “I still love you.”',
      'And three, “I’ll love you tomorrow, and every tomorrow after that.” ❤',
    ],
  },
  {
    id: 'c',
    letter: 'C',
    name: 'Roses',
    sub: 'Classic Red',
    kind: 'rose',
    seed: 37,
    theme: {
      bg1: '#14061a',
      bg2: '#48102e',
      glow: '#ff5f8d',
      rain: ['#dd2c48', '#ff5f8d', '#ffc2d1', '#b01634'],
      paper: ['#fbe4ea', '#f3b3c5', '#a63958'],
      ribbon: '#c81e3d',
      ribbonDark: '#8a1029',
    },
    stem: '#3f7a4a',
    leaves: { n: 9, min: 170, max: 245, w: 0.13, ...GREEN },
    filler: { n: 12, color: '#fff2f5' },
    preview: { k: 'rose', p: 'roseRed', s: 74, vb: '-85 -85 170 170' },
    flowers: [
      { p: 'roseRed', x: 138, y: 138, s: 46 },
      { p: 'roseRed', x: 200, y: 108, s: 46 },
      { p: 'roseRed', x: 262, y: 138, s: 46 },
      { p: 'roseRed', x: 92, y: 206, s: 46 },
      { p: 'roseRed', x: 160, y: 190, s: 48 },
      { p: 'roseRed', x: 240, y: 190, s: 48 },
      { p: 'roseRed', x: 308, y: 206, s: 46 },
      { p: 'roseRed', x: 130, y: 262, s: 48 },
      { p: 'roseRed', x: 200, y: 250, s: 50 },
      { p: 'roseRed', x: 270, y: 262, s: 48 },
    ],
    message: [
      'It’s a cliché, but it’s true: no other flower says “only you” as clearly as a rose.',
      'Every petal is a reason why I fell for you.',
      'And I still haven’t finished counting. ❤',
    ],
  },
  {
    id: 'd',
    letter: 'D',
    name: 'Tulips',
    sub: 'Spring Mix',
    kind: 'tulip',
    seed: 53,
    theme: {
      bg1: '#2b1a2f',
      bg2: '#7a3a4f',
      glow: '#ffb48a',
      rain: ['#ff9dbd', '#ff9d80', '#ffe98a', '#ffffff'],
      paper: ['#fff6e8', '#ffd9b8', '#c9805a'],
      ribbon: '#f0715c',
      ribbonDark: '#b04030',
    },
    stem: '#4f9058',
    leaves: { n: 7, min: 190, max: 270, w: 0.1, color: '#3f8a52', dark: '#2f7043' },
    filler: null,
    preview: { k: 'tulip', p: 'tulipPink', s: 46, vb: '-62 -104 124 124' },
    flowers: [
      { p: 'tulipYellow', x: 200, y: 168, s: 40 },
      { p: 'tulipCoral', x: 138, y: 190, s: 40 },
      { p: 'tulipCoral', x: 262, y: 190, s: 40 },
      { p: 'tulipPink', x: 88, y: 226, s: 40 },
      { p: 'tulipPink', x: 312, y: 226, s: 40 },
      { p: 'tulipYellow', x: 165, y: 244, s: 42 },
      { p: 'tulipPink', x: 235, y: 244, s: 42 },
    ],
    message: [
      'Tulips, they say, mean perfect love.',
      'No one is perfect, but you’re perfect for me, and I’m happy to keep learning how to love you a little more every day. ❤',
    ],
  },
  {
    id: 'e',
    letter: 'E',
    name: 'Peonies',
    sub: 'Soft Pink',
    kind: 'peony',
    seed: 41,
    theme: {
      bg1: '#3a1230',
      bg2: '#a4406f',
      glow: '#ffb3cf',
      rain: ['#fee3ec', '#fccbda', '#f592b5', '#ffffff'],
      paper: ['#fff1f5', '#fbcfdc', '#c56b8b'],
      ribbon: '#f07aa3',
      ribbonDark: '#b8456f',
    },
    stem: '#4c8a54',
    leaves: { n: 10, min: 160, max: 240, w: 0.2, color: '#4a8a58', dark: '#347044' },
    filler: { n: 12, color: '#ffe4ee' },
    preview: { k: 'peony', p: 'peony', s: 76, vb: '-90 -90 180 180' },
    // isang malaking peony lang: pag tinap, lalabas ang finale (spin + bloom -> capybara -> libro)
    // pages = bouquets na ang pictures ay nasa libro, together = pictures na magkasama (last page)
    finale: {
      pages: ['a', 'c', 'd'],
      together: ['b'],
      // ISULAT MO DITO ANG LETTER: bawat linya sa paragraphs ay isang paragraph. (placeholder pa ito)
      letter: {
        title: 'Dear Anne,',
        paragraphs: [
          'pano ko nga ba sisimulan ito? andami na naming pinag awayan, pinagtalunan to the point na nagtataasan na tayo ng boses na hindi naman dapat natin ginagawa eh.',
          'First of all I hope na kahit na naging ganto yung sitwasyon natin eh napapasaya padin kita alam kong hindi pera ang labanan or kung ano man wala akong gusto ipamukha ha. Gusto ko lang na maging masaya ka kahit na magkalayo na tayo, I dont want na masakal ka nanaman sakin hehe pero mahal padin kita anne its not about comfort, its not about your body, its not about kase masaya ako, mahal kita kase ikaw yung babaeng gusto kong maglakad sa alter papunta sakin at ikaw yung babaeng gusto ko na kasabay magsabi ng sari sarili nilang vows sa harap ng panginoon at sa harap ng sari sarili nating pamilya.',
          'Focus ako sa sarili ko para maging better ako, nagkaroon na ko ng pangarap para sa sarili ko hindi nalang para sating dalawa. Madami kang naturo sakin lahat ng nangyare satin eh nagbunga namulat ako sa lahat lahat. Kaya eto ngayon ginagawa ko yung best ko hindi na dahil para sating dalawa kundi para sa future at para sa sarili ko nadin pero sa pag angat ko sa buhay habang nag iimprove ako gusto ko andyan ka at kasama ka.',
          'Sorry pala kase alam ko hindi ka na masaya ha. Yun lang Thank you ulit for everything na ginawa mo para sakin.',
        ],
        sign: 'I LOVE YOU LOVEE from Tally, From ni(GGA) :)',
      },
      // huling page ng libro (pagkatapos ng letter). note = optional na maikling sulat sa gitna.
      end: { title: 'The End ❤', note: '' },
    },
    flowers: [{ p: 'peony', x: 200, y: 168, s: 108, finale: true }],
    message: [
      'Peonies, because they say these are the flowers of romance, good fortune, and a happy life.',
      'You are my good fortune. You are my romance. And you are the happy life I’ve always dreamed of.',
      'No matter what happens, I’ll always come home to your arms. ❤',
      'This is the last bouquet, but it’s not the end. There are more flowers and more stories ahead, as long as we’re together.',
      'I love you so much! 💐',
    ],
  },
  {
    // SECRET BOUQUET: naka-lock hanggang mabuksan na niya ang lahat ng bouquet sa taas (a hanggang e).
    // assemble = may animation na isa-isang inilalagay ang mga bulaklak sa bouquet. I-edit mo ang message sa baba!
    id: 'f',
    letter: 'F',
    tag: 'The Secret Bouquet',
    name: 'Thumbelina',
    sub: 'The Last Flower',
    lock: true,
    assemble: true,
    music: 'e',
    kind: 'peony',
    seed: 67,
    theme: {
      bg1: '#1a0f26',
      bg2: '#6a2b57',
      glow: '#ffd9a0',
      rain: ['#fee3ec', '#dd2c48', '#ffe98a', '#cfaef0', '#ff4152', '#ffffff'],
      paper: ['#fff7ec', '#f6dbe6', '#b1709a'],
      ribbon: '#e3b04b',
      ribbonDark: '#a8771d',
    },
    stem: '#4c8a54',
    leaves: { n: 11, min: 170, max: 262, w: 0.14, ...GREEN },
    filler: { n: 16, color: '#ffffff' },
    preview: { k: 'peony', p: 'peony', s: 72, vb: '-90 -90 180 180' },
    // ang pagkakasunod-sunod dito ang pagkakasunod ng paglalagay sa bouquet (huli ang Thumbelina flower)
    flowers: [
      { k: 'carnation', p: 'carnPurple', x: 86, y: 262, s: 38 },
      { k: 'rose', p: 'roseRed', x: 314, y: 262, s: 40 },
      { k: 'tulip', p: 'tulipYellow', x: 152, y: 318, s: 28 },
      { k: 'peony', p: 'peony', x: 112, y: 168, s: 46 },
      { k: 'gerbera', p: 'gerbera', x: 290, y: 168, s: 46 },
      { k: 'thumbelina', p: 'thumbPink', x: 200, y: 232, s: 64, photos: [] },
    ],
    // ang Thumbelina flower ay walang picture; message lang ang lalabas
    message: [
      'The flowers will be delivered for you. 💐',
    ],
  },
]

/* ============================================================
   PICTURES KADA BULAKLAK
   Pag tinap ang isang bulaklak sa bouquet, lalabas ang picture niya.
   Default: bawat bulaklak 1 picture sa folder  photos/
     Bouquet A -> photos/a1, a2, a3 ... (ayon sa bilang ng bulaklak, kahit anong extension)
     Bouquet B -> photos/b1, b2, b3
   Kung ibang pangalan ang ginamit mo, o gusto mo ng MARAMING picture sa isang
   bulaklak, lagyan ng  photos  ang flower sa taas, halimbawa:
     { p: 'gerbera', x: 200, y: 140, s: 84,
       photos: [ { src: 'photos/first-date.jpg', caption: 'Una nating date' },
                 { src: 'photos/beach', caption: 'Sa beach' } ] }
   ============================================================ */
BOUQUETS.forEach((b) =>
  b.flowers.forEach((f, i) => {
    // walang extension = hahanapin ko mismo (jpg, jpeg, png, webp, gif)
    if (!f.photos && !f.finale)
      f.photos = [{ src: `photos/${b.id}${i + 1}`, caption: (b.captions && b.captions[i]) || '' }]
  }),
)

// ang secret bouquet (f): bawat bulaklak ay may pictures galing sa orihinal na bouquet niya
// (carnation = a, gerbera = b, rose = c, tulip = d, peony = isang picture mula sa bawat isa; Thumbelina = wala)
;(() => {
  const F = BOUQUETS.find((b) => b.id === 'f')
  if (!F) return
  const pics = (id) => BOUQUETS.find((b) => b.id === id).flowers.flatMap((f) => f.photos || [])
  const from = { carnation: 'a', gerbera: 'b', rose: 'c', tulip: 'd' }
  F.flowers.forEach((f) => {
    if (f.k === 'thumbelina') return
    f.photos = from[f.k] ? pics(from[f.k]) : ['a', 'b', 'c', 'd'].map((id) => pics(id)[0]).filter(Boolean)
  })
})()

/* ============================================================
   MUSEUM (unang page): mga naka-frame na pictures sa pader
   x, y = pwesto sa pader (% ng lapad/taas ng kwarto), w = lapad ng frame (% ng lapad ng kwarto)
   ratio = hugis ng picture ('3 / 4' portrait, '4 / 3' landscape). caption = lalabas sa popup; plaque = (optional) maliit na nakasulat sa ilalim ng frame.
   Ang mga pictures dito ay yung kayong dalawa (b1, b2, b3). Dagdagan pa kapag may bago.
   ============================================================ */
const MUSEUM = {
  eyebrow: 'for ' + CONFIG.to,
  title: 'Hello, Flower',
  sub: 'A little gallery of us. Turn all the way around, then find the flowers on the table.',
  // 360° na kwarto: iikot ang tingin sa lahat ng pader. Ang mga frame ay kusang nilalagay sa pader (3 kada pader).
  // plaque = (optional) maliit na nakasulat sa ilalim ng frame, caption = lalabas sa popup.
  // landscape = mga picture na pahiga (4:3), para mailagay sa malapad na frame.
  landscape: ['photos/a4', 'photos/d3'],
  frames: [
    { src: 'photos/b2', plaque: 'May 14', caption: 'Two: “I still love you.”' },
    { src: 'photos/b3', plaque: 'May 8', caption: 'Three: “I’ll love you tomorrow, and every tomorrow after that.” ❤' },
    { src: 'photos/b1', plaque: 'July 5', caption: 'One: “I love you.”' },
  ],
}

// lahat ng pictures sa bouquets (a, c, d) ay idinadagdag din sa pader, salitan para halo-halo.
// Kung may gusto kang idagdag/alisin, i-edit lang ang MUSEUM.frames sa taas o ang pictures ng bulaklak.
;(() => {
  const seen = new Set(MUSEUM.frames.map((f) => f.src))
  const lists = ['a', 'c', 'd'].map((id) => {
    const b = BOUQUETS.find((x) => x.id === id)
    return b ? b.flowers.flatMap((f) => f.photos || []) : []
  })
  for (let i = 0; lists.some((l) => i < l.length); i++)
    lists.forEach((l) => {
      if (l[i] && !seen.has(l[i].src)) {
        seen.add(l[i].src)
        MUSEUM.frames.push({ src: l[i].src, caption: l[i].caption || '' })
      }
    })
})()
