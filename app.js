/* ═══════════════════════════════════════════
   PACO — PRO EDITION  |  app.js
═══════════════════════════════════════════ */
'use strict';

/* ── CONFIG ── */
const CFG = {
  TICK_MS:     5000,
  STAT_MAX:    100,
  STAT_MIN:    0,

  DECAY: {
    egg:   { hunger:.5,  happiness:.3,  energy:.4,  health:0   },
    baby:  { hunger:2,   happiness:1.5, energy:1.5, health:.3  },
    child: { hunger:3,   happiness:2,   energy:2,   health:.5  },
    teen:  { hunger:4,   happiness:2.5, energy:2.5, health:.7  },
    adult: { hunger:5,   happiness:3.5, energy:3,   health:1   },
  },

  EVO: {
    egg:   { secs:0,   label:'🥚 Huevo',  face:'🥚'  },
    baby:  { secs:30,  label:'🐣 Bebé',   face:'🐣'  },
    child: { secs:120, label:'🐥 Niño',   face:'🐥'  },
    teen:  { secs:300, label:'🐦 Joven',  face:'🐦'  },
    adult: { secs:600, label:'🦅 Adulto', face:'🦅'  },
  },

  COOLDOWNS: { feed:3000, play:4000, sleep:8000, heal:5000 },

  MOODS: {
    dead:    { face:'💀', text:'...hasta siempre',  thought:'😵',  bg:['#333','#222','#444'] },
    sick:    { face:'🤒', text:'Me siento fatal...',thought:'🤢',  bg:['#a8534c','#7b3f3a','#8d4a45'] },
    sad:     { face:'😢', text:'Estoy muy triste...',thought:'💔', bg:['#3a4f7a','#2c3e60','#445580'] },
    tired:   { face:'😪', text:'Tengo muuucho sueño',thought:'💤', bg:['#4a3f6b','#362d52','#503f70'] },
    hungry:  { face:'😩', text:'¡Me muero de hambre!',thought:'🍖',bg:['#7a4f2a','#5c3a1e','#8a5a32'] },
    neutral: { face:'😐', text:'Todo bien por aquí~',thought:'😌', bg:['#2a3f5f','#1e3050','#2e456a'] },
    happy:   { face:'😊', text:'¡Qué buen día!',    thought:'✨',  bg:['#5a2a6a','#6b4080','#ff9f4320'] },
    ecstatic:{ face:'🤩', text:'¡ESTOY FELICÍSIMO!',thought:'🎉',  bg:['#7a3f20','#ff9f4330','#ff6b9d20'] },
    sleeping:{ face:'😴', text:'Zzz... Zzz...',     thought:'💤',  bg:['#1a2040','#151830','#1e2448'] },
  },

  THOUGHTS: {
    feed:  ['¡Delicioso! 😋', '¡Gracias! 🍖', '¡Qué rico! 🤤'],
    play:  ['¡Weee! 🎮', '¡Más! ¡Más! 🤸', '¡Súper divertido! 🎊'],
    sleep: ['Mmm... 😴', 'Buenas noches... 🌙', 'Zzz... 💤'],
    heal:  ['¡Ahh, mucho mejor! 💊', '¡Me curo! 🌟', '¡Gracias! ❤️'],
  },

  SPARKS: {
    feed:  ['🍖','✨','⭐','💫'],
    play:  ['🎮','⭐','✨','🎉','💥'],
    sleep: ['💤','🌙','⭐','✨'],
    heal:  ['💊','❤️','✨','💚','⭐'],
  },
};

/* ── STATE ── */
let S = {
  petName:      'Paco',
  hunger:       80,
  happiness:    80,
  energy:       80,
  health:       100,
  alive:        true,
  sleeping:     false,
  evoStage:     'egg',
  birthTime:    Date.now(),
  totalSeconds: 0,
};

let _tickInterval   = null;
let _timerInterval  = null;
let _cooldowns      = { feed:0, play:0, sleep:0, heal:0 };

/* ── DOM REFS ── */
const $ = id => document.getElementById(id);
const DOM = {
  screenWelcome: $('screen-welcome'),
  screenGame:    $('screen-game'),
  nameInput:     $('name-input'),
  btnHatch:      $('btn-hatch'),
  welcomeEgg:    $('welcome-egg'),
  evoPill:       $('evo-pill'),
  pacoName:      $('paco-name'),
  timerVal:      $('timer-val'),
  moodBg:        $('mood-bg'),
  moodAura:      $('mood-aura'),
  thoughtBubble: $('thought-bubble'),
  thoughtText:   $('thought-text'),
  petBody:       $('pet-body'),
  petFace:       $('pet-face'),
  actionSparks:  $('action-sparks'),
  moodStrip:     $('mood-strip'),
  moodLabel:     $('mood-label'),
  progHunger:    $('prog-hunger'),
  progHappiness: $('prog-happiness'),
  progEnergy:    $('prog-energy'),
  progHealth:    $('prog-health'),
  numHunger:     $('num-hunger'),
  numHappiness:  $('num-happiness'),
  numEnergy:     $('num-energy'),
  numHealth:     $('num-health'),
  scHunger:      $('sc-hunger'),
  scHappiness:   $('sc-happiness'),
  scEnergy:      $('sc-energy'),
  scHealth:      $('sc-health'),
  btnFeed:       $('btn-feed'),
  btnPlay:       $('btn-play'),
  btnSleep:      $('btn-sleep'),
  btnHeal:       $('btn-heal'),
  deadOverlay:   $('dead-overlay'),
  deadAge:       $('dead-age'),
  notifStack:    $('notif-stack'),
  canvas:        $('particles-canvas'),
};

/* ══════════════════════════════════════
   PARTICLES
══════════════════════════════════════ */
const Particles = (() => {
  const canvas = DOM.canvas;
  const ctx    = canvas.getContext('2d');
  let   W, H;
  const particles = [];

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }

  function spawnParticles(n = 60) {
    for (let i = 0; i < n; i++) {
      particles.push({
        x:  Math.random() * W,
        y:  Math.random() * H,
        r:  Math.random() * 1.5 + .3,
        vx: (Math.random() - .5) * .3,
        vy: (Math.random() - .5) * .3,
        a:  Math.random(),
        da: (Math.random() * .005 + .002) * (Math.random() < .5 ? 1 : -1),
        hue: Math.random() * 60 + 20, // warm orange-pink
      });
    }
  }

  function loop() {
    ctx.clearRect(0, 0, W, H);
    for (const p of particles) {
      p.x += p.vx;
      p.y += p.vy;
      p.a += p.da;
      if (p.a <= 0 || p.a >= 1) p.da *= -1;
      if (p.x < 0) p.x = W; if (p.x > W) p.x = 0;
      if (p.y < 0) p.y = H; if (p.y > H) p.y = 0;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `hsla(${p.hue}, 80%, 70%, ${p.a * .6})`;
      ctx.fill();
    }
    requestAnimationFrame(loop);
  }

  function init() {
    resize();
    window.addEventListener('resize', resize);
    spawnParticles(80);
    loop();
  }

  return { init };
})();

/* ══════════════════════════════════════
   STORAGE
══════════════════════════════════════ */
const Store = {
  KEY: 'paco_v2',
  save() { localStorage.setItem(this.KEY, JSON.stringify(S)); },
  load() {
    const raw = localStorage.getItem(this.KEY);
    if (!raw) return false;
    try {
      const saved = JSON.parse(raw);
      // Simulate offline decay (cap at 10 minutes)
      const now     = Date.now();
      const offMs   = now - (saved.birthTime + saved.totalSeconds * 1000);
      const offSecs = Math.min(Math.max(0, Math.floor(offMs / 1000)), 600);
      saved.totalSeconds += offSecs;
      const ticks = offSecs / (CFG.TICK_MS / 1000);
      const d     = CFG.DECAY[saved.evoStage] || CFG.DECAY.adult;
      saved.hunger    = clamp(saved.hunger    - d.hunger    * ticks);
      saved.happiness = clamp(saved.happiness - d.happiness * ticks);
      saved.energy    = clamp(saved.energy    - d.energy    * ticks);
      saved.health    = clamp(saved.health    - d.health    * ticks);
      Object.assign(S, saved);
      return true;
    } catch(e) { return false; }
  },
};

/* ══════════════════════════════════════
   UTILITIES
══════════════════════════════════════ */
function clamp(v, lo = 0, hi = 100) { return Math.max(lo, Math.min(hi, v)); }
function rand(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function fmt(secs) {
  const m = String(Math.floor(secs / 60)).padStart(2,'0');
  const s = String(secs % 60).padStart(2,'0');
  return `${m}:${s}`;
}

function getMoodKey() {
  if (!S.alive)              return 'dead';
  if (S.sleeping)            return 'sleeping';
  if (S.health < 25)         return 'sick';
  if (S.energy < 20)         return 'tired';
  if (S.hunger < 20)         return 'hungry';
  const avg = (S.hunger + S.happiness + S.energy) / 3;
  if (avg < 35)              return 'sad';
  if (avg >= 80)             return 'ecstatic';
  if (avg >= 55)             return 'happy';
  return 'neutral';
}

function getEvoStage() {
  const t = S.totalSeconds;
  const stages = Object.entries(CFG.EVO).reverse();
  for (const [key, val] of stages) {
    if (t >= val.secs) return key;
  }
  return 'egg';
}

/* ══════════════════════════════════════
   NOTIFICATIONS
══════════════════════════════════════ */
let _lastNotifMsg = '';
let _notifCooldown = false;

const Notif = {
  show(msg, type = '', icon = '') {
    if (msg === _lastNotifMsg && _notifCooldown) return;
    _lastNotifMsg = msg;
    _notifCooldown = true;
    setTimeout(() => { _notifCooldown = false; }, 3000);

    const el = document.createElement('div');
    el.className = `notif ${type}`;
    el.innerHTML = icon
      ? `<span style="font-size:18px">${icon}</span><span>${msg}</span>`
      : `<span>${msg}</span>`;
    DOM.notifStack.prepend(el);

    // Keep max 3
    while (DOM.notifStack.children.length > 3) {
      DOM.notifStack.removeChild(DOM.notifStack.lastChild);
    }

    setTimeout(() => {
      el.classList.add('notif-out');
      setTimeout(() => el.remove(), 350);
    }, 2500);
  },

  warn(msg, icon) { this.show(msg, 'warn', icon); },
  info(msg, icon) { this.show(msg, 'info', icon); },
  evo(msg)        { this.show(msg, 'evo', '✨'); },
};

/* ══════════════════════════════════════
   SPARKS
══════════════════════════════════════ */
function spawnSparks(action) {
  const emojis = CFG.SPARKS[action] || ['✨'];
  const n = 6 + Math.floor(Math.random() * 4);
  for (let i = 0; i < n; i++) {
    setTimeout(() => {
      const el   = document.createElement('div');
      el.className = 'spark';
      el.textContent = rand(emojis);
      const ang  = (Math.random() * 360) * Math.PI / 180;
      const dist = 60 + Math.random() * 60;
      el.style.setProperty('--sx', `${Math.cos(ang) * dist}px`);
      el.style.setProperty('--sy', `${Math.sin(ang) * dist - 30}px`);
      el.style.left = `calc(50% - 10px)`;
      el.style.top  = `calc(50% - 10px)`;
      DOM.actionSparks.appendChild(el);
      setTimeout(() => el.remove(), 850);
    }, i * 60);
  }
}

/* ══════════════════════════════════════
   RENDER
══════════════════════════════════════ */
function render() {
  const mood  = getMoodKey();
  const moodD = CFG.MOODS[mood] || CFG.MOODS.neutral;
  const stage = S.evoStage;
  const evoD  = CFG.EVO[stage];

  // Face (use stage face or mood override)
  const face = (mood === 'dead' || mood === 'sick' || mood === 'sleeping' || mood === 'sad' || mood === 'tired' || mood === 'hungry' || mood === 'ecstatic')
    ? moodD.face
    : (mood === 'happy' || mood === 'neutral' ? (stage === 'egg' ? '🥚' : moodD.face) : evoD.face);

  DOM.petFace.textContent = face !== '🥚' || stage === 'egg'
    ? (stage === 'egg' ? '🥚' : moodD.face)
    : moodD.face;

  // Pet animation class
  DOM.petBody.classList.remove('anim-sleep','anim-dead');
  if (!S.alive)    DOM.petBody.classList.add('anim-dead');
  else if (S.sleeping) DOM.petBody.classList.add('anim-sleep');

  // Mood background
  const [a, b, c] = moodD.bg;
  document.documentElement.style.setProperty('--mood-a', a);
  document.documentElement.style.setProperty('--mood-b', b);
  document.documentElement.style.setProperty('--mood-c', c);
  DOM.moodAura.style.background = `radial-gradient(circle, ${a}50 0%, transparent 70%)`;

  // Mood label
  DOM.moodLabel.textContent = moodD.text;

  // Thought bubble
  DOM.thoughtText.textContent = moodD.thought;

  // Evo pill
  DOM.evoPill.textContent = evoD.label;

  // Stats bars
  renderStat(DOM.progHunger, DOM.numHunger, DOM.scHunger, S.hunger);
  renderStat(DOM.progHappiness, DOM.numHappiness, DOM.scHappiness, S.happiness);
  renderStat(DOM.progEnergy, DOM.numEnergy, DOM.scEnergy, S.energy);
  renderStat(DOM.progHealth, DOM.numHealth, DOM.scHealth, S.health);

  // Button states
  const dead = !S.alive;
  const sleep = S.sleeping;
  DOM.btnFeed.disabled  = dead || sleep;
  DOM.btnPlay.disabled  = dead || sleep || S.energy < 10;
  DOM.btnSleep.disabled = dead || sleep;
  DOM.btnHeal.disabled  = dead || sleep;

  DOM.deadOverlay.style.display = dead ? 'flex' : 'none';
}

function renderStat(progEl, numEl, cardEl, value) {
  const pct = clamp(Math.round(value));
  progEl.style.width = pct + '%';
  numEl.textContent  = pct;
  cardEl.classList.toggle('critical', pct < 25);
}

/* ══════════════════════════════════════
   PET ANIMATION HELPERS
══════════════════════════════════════ */
function animatePet(cls) {
  DOM.petBody.classList.remove('anim-bounce','anim-shake','anim-sleep');
  void DOM.petBody.offsetWidth;
  DOM.petBody.classList.add(cls);
  setTimeout(() => DOM.petBody.classList.remove(cls), 600);
}

function showThought(text) {
  DOM.thoughtText.textContent = text;
  DOM.thoughtBubble.style.transform = 'scale(1.15)';
  DOM.thoughtBubble.style.borderColor = 'rgba(255,255,255,.4)';
  setTimeout(() => {
    DOM.thoughtBubble.style.transform = '';
    DOM.thoughtBubble.style.borderColor = '';
  }, 500);
}

/* ══════════════════════════════════════
   GAME TICK
══════════════════════════════════════ */
function tick() {
  if (!S.alive) return;

  if (S.sleeping) {
    S.energy    = clamp(S.energy    + 6);
    S.hunger    = clamp(S.hunger    - 1);
    S.happiness = clamp(S.happiness - .5);
    if (S.energy >= 92) {
      S.sleeping = false;
      Notif.info(`¡${S.petName} se despertó! 🌅`, '☀️');
    }
  } else {
    const d = CFG.DECAY[S.evoStage] || CFG.DECAY.adult;
    S.hunger    = clamp(S.hunger    - d.hunger);
    S.happiness = clamp(S.happiness - d.happiness);
    S.energy    = clamp(S.energy    - d.energy);

    const crit = [S.hunger, S.happiness, S.energy].filter(v => v < 10).length;
    if (crit > 0) {
      S.health = clamp(S.health - d.health * (1 + crit));
    }
  }

  // Health death
  if (S.health <= 0) { die(); return; }

  // Warnings (only one per tick)
  if      (S.health    < 20) Notif.warn(`¡${S.petName} está muy enfermo!`, '🚨');
  else if (S.hunger    < 20) Notif.warn(`¡${S.petName} tiene mucha hambre!`, '🍖');
  else if (S.happiness < 20) Notif.warn(`¡${S.petName} está muy triste!`, '💔');
  else if (S.energy    < 15) Notif.warn(`¡${S.petName} está agotado!`, '⚡');

  Store.save();
  render();
}

function die() {
  S.alive = false;
  clearInterval(_tickInterval);
  clearInterval(_timerInterval);
  DOM.deadAge.textContent = fmt(S.totalSeconds);
  Store.save();
  render();
}

/* ══════════════════════════════════════
   TIMER
══════════════════════════════════════ */
function startTimer() {
  _timerInterval = setInterval(() => {
    S.totalSeconds++;
    DOM.timerVal.textContent = fmt(S.totalSeconds);
    const newStage = getEvoStage();
    if (newStage !== S.evoStage) {
      S.evoStage = newStage;
      const label = CFG.EVO[newStage].label;
      Notif.evo(`¡${S.petName} evolucionó a ${label}!`);
      spawnSparks('play');
      animatePet('anim-bounce');
    }
  }, 1000);
}

/* ══════════════════════════════════════
   COOLDOWN HELPER
══════════════════════════════════════ */
function cooldownOk(action) {
  const now = Date.now();
  if (now - _cooldowns[action] < CFG.COOLDOWNS[action]) {
    const rem = Math.ceil((CFG.COOLDOWNS[action] - (now - _cooldowns[action])) / 1000);
    Notif.warn(`Espera ${rem}s...`, '⏳');
    return false;
  }
  _cooldowns[action] = now;
  return true;
}

/* ══════════════════════════════════════
   ACTIONS
══════════════════════════════════════ */
const Actions = {
  feed() {
    if (!S.alive || S.sleeping || !cooldownOk('feed')) return;
    S.hunger = clamp(S.hunger + 25);
    spawnSparks('feed');
    animatePet('anim-bounce');
    showThought(rand(CFG.THOUGHTS.feed));
    Notif.info(`¡${S.petName} comió! +25 🍖`);
    Store.save(); render();
  },

  play() {
    if (!S.alive || S.sleeping) return;
    if (S.energy < 10) { Notif.warn('¡Sin energía para jugar!', '⚡'); return; }
    if (!cooldownOk('play')) return;
    S.happiness = clamp(S.happiness + 22);
    S.energy    = clamp(S.energy    - 15);
    S.hunger    = clamp(S.hunger    - 8);
    spawnSparks('play');
    animatePet('anim-bounce');
    showThought(rand(CFG.THOUGHTS.play));
    Notif.info(`¡${S.petName} jugó! +22 😄`);
    Store.save(); render();
  },

  sleep() {
    if (!S.alive || S.sleeping || !cooldownOk('sleep')) return;
    S.sleeping = true;
    spawnSparks('sleep');
    showThought(rand(CFG.THOUGHTS.sleep));
    Notif.info(`${S.petName} se fue a dormir... 💤`);
    Store.save(); render();
  },

  heal() {
    if (!S.alive || S.sleeping || !cooldownOk('heal')) return;
    S.health = clamp(S.health + 30);
    spawnSparks('heal');
    animatePet('anim-bounce');
    showThought(rand(CFG.THOUGHTS.heal));
    Notif.info(`¡${S.petName} se curó! +30 ❤️`);
    Store.save(); render();
  },
};

/* ══════════════════════════════════════
   GAME CONTROLLER
══════════════════════════════════════ */
const Game = {
  start(name) {
    S = {
      petName:      name || 'Paco',
      hunger:       80,
      happiness:    80,
      energy:       80,
      health:       100,
      alive:        true,
      sleeping:     false,
      evoStage:     'egg',
      birthTime:    Date.now(),
      totalSeconds: 0,
    };
    DOM.pacoName.textContent = S.petName;
    DOM.timerVal.textContent = '00:00';
    this._switchToGame();
    Store.save();
    render();
    Notif.info(`¡Hola, ${S.petName}! 🎉`, '✨');
    _tickInterval = setInterval(tick, CFG.TICK_MS);
    startTimer();
  },

  resume() {
    DOM.pacoName.textContent = S.petName;
    DOM.timerVal.textContent = fmt(S.totalSeconds);
    this._switchToGame();
    render();
    if (S.alive) {
      _tickInterval = setInterval(tick, CFG.TICK_MS);
      startTimer();
    } else {
      DOM.deadAge.textContent = fmt(S.totalSeconds);
    }
  },

  reset() {
    clearInterval(_tickInterval);
    clearInterval(_timerInterval);
    localStorage.removeItem(Store.KEY);
    DOM.screenGame.classList.remove('active');
    DOM.screenWelcome.classList.add('active');
    DOM.nameInput.value = '';
    setTimeout(() => DOM.nameInput.focus(), 300);
  },

  _switchToGame() {
    // Hatch animation on egg
    DOM.welcomeEgg.style.transform = 'scale(1.4) rotate(15deg)';
    DOM.welcomeEgg.style.transition = 'transform .3s ease';
    setTimeout(() => {
      DOM.screenWelcome.classList.remove('active');
      DOM.screenGame.classList.add('active');
    }, 300);
  },
};

/* ══════════════════════════════════════
   INIT
══════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  Particles.init();

  // Welcome events
  DOM.btnHatch.addEventListener('click', () => {
    const name = DOM.nameInput.value.trim() || 'Paco';
    Game.start(name);
  });

  DOM.nameInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') DOM.btnHatch.click();
  });

  // Egg tap easter egg on welcome
  DOM.welcomeEgg.addEventListener('click', () => {
    DOM.welcomeEgg.style.animation = 'none';
    void DOM.welcomeEgg.offsetWidth;
    DOM.welcomeEgg.style.animation = '';
  });

  // Restore saved session
  if (Store.load()) {
    Game.resume();
  } else {
    setTimeout(() => DOM.nameInput.focus(), 400);
  }
});
