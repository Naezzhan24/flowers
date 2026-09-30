/* ============================================================
   EDIT ME: pangalan niya, pirma mo, at ang mga message kada bouquet
   ============================================================ */
const CONFIG = {
  to: 'Anne',
  from: '— Jiroom ❤',
};

const GREEN = { color: '#3f7d4e', dark: '#2e6440' };

const BOUQUETS = [
  {
    id: 'a', letter: 'A', name: 'Carnations', sub: 'White & Purple', kind: 'carnation', seed: 11,
    theme: {
      bg1: '#1d1030', bg2: '#4b2a6b', glow: '#c9a7f0',
      rain: ['#ffffff', '#e4d8f4', '#b98ae0', '#a77ad8'],
      paper: ['#f1e7fb', '#cdb0ea', '#8e6bb8'], ribbon: '#8a56c4', ribbonDark: '#5e3390',
    },
    stem: '#4c8a54',
    leaves: { n: 9, min: 170, max: 250, w: .13, ...GREEN },
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
    message: [
      'The white is for my honest, pure love for you.',
      'The purple is for all the unique and special parts of you that I adore.',
      'I chose these because they’re just like you: simple at first glance, but the longer I look, the harder I fall.',
      'Thank you for being my safe place. ❤',
    ],
  },
  {
    id: 'b', letter: 'B', name: 'Gerberas', sub: 'Three Reds', kind: 'gerbera', seed: 23,
    theme: {
      bg1: '#2a0f0a', bg2: '#7a2212', glow: '#ff7a55',
      rain: ['#ff4152', '#ff6a55', '#ffd1c4', '#e8203b'],
      paper: ['#fff0e6', '#ffc7ad', '#c4472c'], ribbon: '#e8203b', ribbonDark: '#a3122a',
    },
    stem: '#4c8a54',
    leaves: { n: 8, min: 150, max: 230, w: .18, ...GREEN },
    filler: { n: 10, color: '#fff3e6' },
    preview: { k: 'gerbera', p: 'gerbera', s: 74, vb: '-85 -85 170 170' },
    flowers: [
      { p: 'gerbera', x: 200, y: 140, s: 84 },
      { p: 'gerbera', x: 112, y: 234, s: 78 },
      { p: 'gerbera', x: 288, y: 234, s: 78 },
    ],
    message: [
      'Gerberas stand for joy, and that’s exactly what you are to me.',
      'Three red ones, for three things I want to say:',
      'One, “I love you.” Two, “I still love you.”',
      'And three, “I’ll love you tomorrow, and every tomorrow after that.” ❤',
    ],
  },
  {
    id: 'c', letter: 'C', name: 'Roses', sub: 'Classic Red', kind: 'rose', seed: 37,
    theme: {
      bg1: '#14061a', bg2: '#48102e', glow: '#ff5f8d',
      rain: ['#dd2c48', '#ff5f8d', '#ffc2d1', '#b01634'],
      paper: ['#fbe4ea', '#f3b3c5', '#a63958'], ribbon: '#c81e3d', ribbonDark: '#8a1029',
    },
    stem: '#3f7a4a',
    leaves: { n: 9, min: 170, max: 245, w: .13, ...GREEN },
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
    id: 'd', letter: 'D', name: 'Peonies', sub: 'Soft Pink', kind: 'peony', seed: 41,
    theme: {
      bg1: '#3a1230', bg2: '#a4406f', glow: '#ffb3cf',
      rain: ['#fee3ec', '#fccbda', '#f592b5', '#ffffff'],
      paper: ['#fff1f5', '#fbcfdc', '#c56b8b'], ribbon: '#f07aa3', ribbonDark: '#b8456f',
    },
    stem: '#4c8a54',
    leaves: { n: 10, min: 160, max: 240, w: .2, color: '#4a8a58', dark: '#347044' },
    filler: { n: 12, color: '#ffe4ee' },
    preview: { k: 'peony', p: 'peony', s: 76, vb: '-90 -90 180 180' },
    flowers: [
      { p: 'peony', x: 200, y: 108, s: 58 },
      { p: 'peony', x: 118, y: 176, s: 64 },
      { p: 'peony', x: 282, y: 176, s: 64 },
      { p: 'peony', x: 156, y: 256, s: 66 },
      { p: 'peony', x: 246, y: 256, s: 66 },
    ],
    message: [
      'Peonies, because they say these are the flowers of romance, good fortune, and a happy life.',
      'You are my good fortune. You are my romance. And you are the happy life I’ve always dreamed of.',
      'No matter what happens, I’ll always come home to your arms. ❤',
    ],
  },
  {
    id: 'e', letter: 'E', name: 'Tulips', sub: 'Spring Mix', kind: 'tulip', seed: 53,
    theme: {
      bg1: '#2b1a2f', bg2: '#7a3a4f', glow: '#ffb48a',
      rain: ['#ff9dbd', '#ff9d80', '#ffe98a', '#ffffff'],
      paper: ['#fff6e8', '#ffd9b8', '#c9805a'], ribbon: '#f0715c', ribbonDark: '#b04030',
    },
    stem: '#4f9058',
    leaves: { n: 7, min: 190, max: 270, w: .1, color: '#3f8a52', dark: '#2f7043' },
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
      'No one is perfect, but you’re perfect for me, and I’m happy to keep learning how to love you a little more every day.',
      'This is the last bouquet, but it’s not the end. There are more flowers and more stories ahead, as long as we’re together.',
      'I love you so much! 💐',
    ],
  },
];
