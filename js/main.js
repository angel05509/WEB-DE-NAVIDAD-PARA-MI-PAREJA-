/* ==========================================================
   NAVIDAD CON MI PRINCESA - NUESTRO LIBRO DE AVENTURAS
   Archivo Principal de Lógica, Animaciones e Interactividad
   (js/main.js)
   ========================================================== */

/* ----------------------------------------------------------
   1. MOTOR DE FUEGOS ARTIFICIALES & CORAZONES (CANVAS)
   ---------------------------------------------------------- */
class FireworksEngine {
  constructor() {
    this.canvas = document.getElementById('fireworks-canvas');
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.particles = [];
    this.rockets = [];
    this.isRunning = false;
    this.timer = null;
    this.stopTimeout = null;
    this.clearTimeout = null;
    this.animFrameId = null;
    this.audioCtx = null;
    
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  resize() {
    if (!this.canvas) return;
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  initAudio() {
    if (!this.audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.audioCtx = new AudioContext();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  playPopSound() {
    if (!this.audioCtx) return;
    try {
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(150 + Math.random() * 200, this.audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(40, this.audioCtx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.12, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + 0.15);
      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.start();
      osc.stop(this.audioCtx.currentTime + 0.16);
    } catch (e) {}
  }

  start(durationSeconds = 12) {
    this.initAudio();
    this.isRunning = true;

    if (this.timer) clearInterval(this.timer);
    if (this.stopTimeout) clearTimeout(this.stopTimeout);
    if (this.clearTimeout) clearTimeout(this.clearTimeout);

    this.timer = setInterval(() => {
      if (!this.isRunning) return;
      this.launchRocket();
    }, 400);

    for (let i = 0; i < 4; i++) {
      setTimeout(() => {
        if (this.isRunning) this.launchRocket();
      }, i * 200);
    }

    if (!this.animFrameId) {
      this.animate();
    }

    if (durationSeconds > 0) {
      this.stopTimeout = setTimeout(() => {
        this.stop();
      }, durationSeconds * 1000);
    }
  }

  stop() {
    this.isRunning = false;
    if (this.timer) clearInterval(this.timer);
    this.clearTimeout = setTimeout(() => {
      if (this.isRunning) return;
      this.particles = [];
      this.rockets = [];
      if (this.ctx) this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }, 1500);
  }

  launchRocket() {
    const margin = Math.min(80, this.canvas.width * 0.15);
    const x = margin + Math.random() * Math.max(40, this.canvas.width - margin * 2);
    const targetY = Math.random() * (this.canvas.height * 0.45) + 80;
    const colors = ['#ff4d6d', '#ffd166', '#06d6a0', '#118ab2', '#ff758f', '#ffffff'];
    const color = colors[Math.floor(Math.random() * colors.length)];
    const isHeart = Math.random() > 0.4; // Fuegos artificiales con forma de corazón

    this.rockets.push({
      x: x,
      y: this.canvas.height,
      targetY: targetY,
      speed: 12 + Math.random() * 4,
      color: color,
      isHeart: isHeart
    });
  }

  explode(x, y, color, isHeart) {
    this.playPopSound();
    const count = isHeart ? 50 : 65;

    if (isHeart) {
      for (let i = 0; i < count; i++) {
        const t = (Math.PI * 2 * i) / count;
        const hx = 16 * Math.pow(Math.sin(t), 3);
        const hy = -(13 * Math.cos(t) - 5 * Math.cos(2*t) - 2 * Math.cos(3*t) - Math.cos(4*t));
        const speed = 0.22 + Math.random() * 0.05;

        this.particles.push({
          x: x,
          y: y,
          vx: hx * speed,
          vy: hy * speed,
          color: color,
          alpha: 1,
          decay: 0.012 + Math.random() * 0.008,
          size: 3.5 + Math.random() * 2
        });
      }
    } else {
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 6 + 1.5;
        this.particles.push({
          x: x,
          y: y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          color: color,
          alpha: 1,
          decay: 0.015 + Math.random() * 0.01,
          size: 3 + Math.random() * 2.5
        });
      }
    }
  }

  animate() {
    if (!this.isRunning && this.particles.length === 0 && this.rockets.length === 0) {
      if (this.ctx) this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      this.animFrameId = null;
      return;
    }

    this.ctx.save();
    this.ctx.globalCompositeOperation = 'destination-out';
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.18)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.restore();

    for (let i = this.rockets.length - 1; i >= 0; i--) {
      const r = this.rockets[i];
      r.y -= r.speed;

      this.ctx.fillStyle = r.color;
      this.ctx.beginPath();
      this.ctx.arc(r.x, r.y, 3.5, 0, Math.PI * 2);
      this.ctx.fill();

      if (r.y <= r.targetY) {
        this.explode(r.x, r.y, r.color, r.isHeart);
        this.rockets.splice(i, 1);
      }
    }

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.06;
      p.alpha -= p.decay;

      if (p.alpha <= 0) {
        this.particles.splice(i, 1);
        continue;
      }

      this.ctx.save();
      this.ctx.globalAlpha = p.alpha;
      this.ctx.fillStyle = p.color;
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.restore();
    }

    this.animFrameId = requestAnimationFrame(() => this.animate());
  }
}

window.fireworks = new FireworksEngine();

/* ----------------------------------------------------------
   2. REPRODUCTOR DE MÚSICA ROMÁNTICA
   ---------------------------------------------------------- */
class RomanticMusicPlayer {
  constructor() {
    this.audio = document.getElementById('bg-music-audio');
    this.playBtn = document.getElementById('music-toggle-btn');
    this.vinyl = document.getElementById('vinyl-disc');
    this.songTitle = document.getElementById('player-song-title');
    this.songSubtitle = document.querySelector('.player-subtitle');
    
    this.isPlaying = false;
    this.isSynthesized = false;
    this.audioUnavailable = false;
    this.synthCtx = null;
    this.synthTimer = null;

    this.init();
  }

  init() {
    if (this.playBtn) {
      this.playBtn.addEventListener('click', () => this.togglePlay());
    }

    if (this.audio) {
      this.audio.addEventListener('play', () => this.setPlayingState(true, false));
      this.audio.addEventListener('pause', () => {
        if (!this.isSynthesized) this.setPlayingState(false);
      });
      this.audio.addEventListener('ended', () => this.setPlayingState(false));
      this.audio.addEventListener('error', () => {
        this.audioUnavailable = true;
      });
      if (this.audio.error) {
        this.audioUnavailable = true;
      }
    }
  }

  togglePlay() {
    if (this.isPlaying) {
      this.pause();
    } else {
      this.play();
    }
  }

  play() {
    const canTryAudio = this.audio &&
      !this.audioUnavailable &&
      this.audio.src &&
      !this.audio.src.endsWith('#') &&
      this.audio.networkState !== HTMLMediaElement.NETWORK_NO_SOURCE;

    if (canTryAudio) {
      const playPromise = this.audio.play();
      if (playPromise !== undefined) {
        playPromise.then(() => {
          this.setPlayingState(true, false);
        }).catch(() => {
          this.audioUnavailable = true;
          this.startSynthesizerMelody();
        });
      }
    } else {
      this.startSynthesizerMelody();
    }
  }

  pause() {
    if (this.audio && !this.audio.paused) {
      this.audio.pause();
    }
    this.stopSynthesizerMelody();
    this.setPlayingState(false);
  }

  setPlayingState(playing, synthesized = this.isSynthesized) {
    this.isPlaying = playing;
    if (this.playBtn) {
      this.playBtn.innerHTML = playing ? '❚❚' : '▶';
      this.playBtn.setAttribute('aria-label', playing ? 'Pausar música' : 'Reproducir música');
      this.playBtn.setAttribute('aria-pressed', String(playing));
    }
    if (this.songSubtitle) {
      if (!playing) {
        this.songSubtitle.textContent = 'Toca para escuchar 🎵';
      } else if (synthesized) {
        this.songSubtitle.textContent = 'Melodía de piano activa 🎹';
      } else {
        this.songSubtitle.textContent = 'Reproduciendo... 🎶';
      }
    }
    if (this.vinyl) {
      if (playing) {
        this.vinyl.classList.add('playing');
      } else {
        this.vinyl.classList.remove('playing');
      }
    }
  }

  startSynthesizerMelody() {
    this.isSynthesized = true;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) {
      this.setPlayingState(false);
      return;
    }
    if (!this.synthCtx) {
      this.synthCtx = new AudioContext();
    }
    if (this.synthCtx.state === 'suspended') {
      this.synthCtx.resume();
    }

    this.setPlayingState(true, true);

    const chords = [
      [261.63, 329.63, 392.00, 523.25], // Do mayor
      [220.00, 261.63, 329.63, 440.00], // La menor
      [174.61, 220.00, 261.63, 349.23], // Fa mayor
      [196.00, 246.94, 293.66, 392.00]  // Sol mayor
    ];

    let chordIdx = 0;
    let noteIdx = 0;

    const playTone = (freq) => {
      if (!this.synthCtx || !this.isSynthesized) return;
      try {
        const osc = this.synthCtx.createOscillator();
        const gain = this.synthCtx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, this.synthCtx.currentTime);

        gain.gain.setValueAtTime(0.001, this.synthCtx.currentTime);
        gain.gain.linearRampToValueAtTime(0.12, this.synthCtx.currentTime + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.0001, this.synthCtx.currentTime + 1.2);

        osc.connect(gain);
        gain.connect(this.synthCtx.destination);
        osc.start();
        osc.stop(this.synthCtx.currentTime + 1.25);
      } catch (err) {}
    };

    if (this.synthTimer) clearInterval(this.synthTimer);
    this.synthTimer = setInterval(() => {
      if (!this.isSynthesized) return;
      const currentChord = chords[chordIdx];
      const freq = currentChord[noteIdx];
      playTone(freq);

      noteIdx++;
      if (noteIdx >= currentChord.length) {
        noteIdx = 0;
        chordIdx = (chordIdx + 1) % chords.length;
      }
    }, 450);
  }

  stopSynthesizerMelody() {
    this.isSynthesized = false;
    if (this.synthTimer) {
      clearInterval(this.synthTimer);
      this.synthTimer = null;
    }
  }
}

/* ----------------------------------------------------------
   3. INICIALIZACIÓN GENERAL, CONTADOR, SOBRES Y DIARIO
   ---------------------------------------------------------- */
document.addEventListener('DOMContentLoaded', () => {
  window.romanticPlayer = new RomanticMusicPlayer();

  // A. Nieve Suave de Fondo
  const snowCanvas = document.getElementById('snow-canvas');
  if (snowCanvas) {
    const ctx = snowCanvas.getContext('2d');
    let width = snowCanvas.width = window.innerWidth;
    let height = snowCanvas.height = window.innerHeight;

    window.addEventListener('resize', () => {
      width = snowCanvas.width = window.innerWidth;
      height = snowCanvas.height = window.innerHeight;
    });

    const snowflakes = [];
    const count = 45;

    for (let i = 0; i < count; i++) {
      snowflakes.push({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: Math.random() * 2.8 + 1,
        speed: Math.random() * 0.9 + 0.4,
        drift: (Math.random() - 0.5) * 0.5,
        opacity: Math.random() * 0.6 + 0.2
      });
    }

    function animateSnow() {
      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < count; i++) {
        const sf = snowflakes[i];
        sf.y += sf.speed;
        sf.x += sf.drift;

        if (sf.y > height) {
          sf.y = -5;
          sf.x = Math.random() * width;
        }
        if (sf.x > width) sf.x = 0;
        if (sf.x < 0) sf.x = width;

        ctx.fillStyle = `rgba(255, 255, 255, ${sf.opacity})`;
        ctx.beginPath();
        ctx.arc(sf.x, sf.y, sf.radius, 0, Math.PI * 2);
        ctx.fill();
      }

      requestAnimationFrame(animateSnow);
    }

    animateSnow();
  }

  // B. Cuenta Regresiva para Nochebuena
  const daysEl = document.getElementById('count-days');
  const hoursEl = document.getElementById('count-hours');
  const minsEl = document.getElementById('count-mins');
  const secsEl = document.getElementById('count-secs');
  const fireworksBtn = document.getElementById('btn-test-fireworks');

  const now = new Date();
  let targetYear = now.getFullYear();
  let targetDate = new Date(targetYear, 11, 24, 0, 0, 0);

  if (now.getTime() > new Date(targetYear, 11, 25, 0, 0, 0).getTime()) {
    targetYear++;
    targetDate = new Date(targetYear, 11, 24, 0, 0, 0);
  }

  let triggeredMidnight = false;

  function updateCountdown() {
    const current = new Date().getTime();
    const distance = targetDate.getTime() - current;

    if (distance <= 0) {
      if (daysEl) daysEl.innerText = "00";
      if (hoursEl) hoursEl.innerText = "00";
      if (minsEl) minsEl.innerText = "00";
      if (secsEl) secsEl.innerText = "00";

      if (!triggeredMidnight) {
        triggeredMidnight = true;
        if (window.fireworks) {
          window.fireworks.start(25);
        }
      }
      return;
    }

    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);

    if (daysEl) daysEl.innerText = String(days).padStart(2, '0');
    if (hoursEl) hoursEl.innerText = String(hours).padStart(2, '0');
    if (minsEl) minsEl.innerText = String(minutes).padStart(2, '0');
    if (secsEl) secsEl.innerText = String(seconds).padStart(2, '0');
  }

  setInterval(updateCountdown, 1000);
  updateCountdown();

  if (fireworksBtn) {
    fireworksBtn.addEventListener('click', () => {
      if (window.fireworks) {
        window.fireworks.start(14);
      }
    });
  }

  // C. Sobres Interactivos de la Sección Inicial
  const envelopeCards = document.querySelectorAll('.envelope-card');
  envelopeCards.forEach(card => {
    card.addEventListener('click', () => {
      card.classList.toggle('is-open');
    });
  });

  // D. Giro 3D de las Fotos Polaroid
  const flipCards = document.querySelectorAll('.polaroid-flip-card');
  flipCards.forEach(card => {
    card.addEventListener('click', (e) => {
      if (e.target.closest('.tool-zoom')) return;
      card.classList.toggle('is-flipped');
    });
  });

  // E. Lupa de Ampliación (Modal Lightbox)
  const lightboxModal = document.getElementById('lightbox-modal');
  const lightboxImg = document.getElementById('lightbox-img');
  const lightboxCaption = document.getElementById('lightbox-caption');
  const lightboxClose = document.getElementById('lightbox-close');

  const zoomBtns = document.querySelectorAll('.tool-zoom');
  zoomBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const card = btn.closest('.polaroid-flip-card');
      if (!card) return;
      const img = card.querySelector('.polaroid-img');
      const caption = card.querySelector('.polaroid-caption');

      if (lightboxModal && img && lightboxImg) {
        lightboxImg.src = img.src;
        if (lightboxCaption && caption) {
          lightboxCaption.innerText = caption.innerText;
        }
        lightboxModal.classList.add('active');
      }
    });
  });

  if (lightboxClose && lightboxModal) {
    lightboxClose.addEventListener('click', () => {
      lightboxModal.classList.remove('active');
    });
    lightboxModal.addEventListener('click', (e) => {
      if (e.target === lightboxModal) {
        lightboxModal.classList.remove('active');
      }
    });
  }

  // F. Gran Final: Carta Animada con Sello de Cera
  const sealedEnvelopeBox = document.getElementById('sealed-envelope-trigger');
  const letterModal = document.getElementById('letter-modal-overlay');
  const letterCloseBtn = document.getElementById('letter-close-btn');
  const promiseBtn = document.getElementById('letter-promise-btn');

  if (sealedEnvelopeBox && letterModal) {
    sealedEnvelopeBox.addEventListener('click', () => {
      burstHearts(sealedEnvelopeBox);
      setTimeout(() => {
        letterModal.classList.add('active');
      }, 400);
    });
  }

  if (letterCloseBtn && letterModal) {
    letterCloseBtn.addEventListener('click', () => {
      letterModal.classList.remove('active');
    });
    letterModal.addEventListener('click', (e) => {
      if (e.target === letterModal) {
        letterModal.classList.remove('active');
      }
    });
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (lightboxModal && lightboxModal.classList.contains('active')) {
        lightboxModal.classList.remove('active');
      }
      if (letterModal && letterModal.classList.contains('active')) {
        letterModal.classList.remove('active');
      }
    }
  });

  if (promiseBtn) {
    promiseBtn.addEventListener('click', () => {
      promiseBtn.innerHTML = '¡Por Siempre Juntos! ❤️✨💍';
      promiseBtn.style.background = '#2d6a4f';
      if (window.fireworks) {
        window.fireworks.start(10);
      }
      burstHearts(promiseBtn);
    });
  }

  function burstHearts(originEl) {
    const rect = originEl.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;

    for (let i = 0; i < 20; i++) {
      const heart = document.createElement('div');
      heart.innerText = ['❤️', '💖', '✨', '💕', '🌹'][Math.floor(Math.random() * 5)];
      heart.style.position = 'fixed';
      heart.style.left = `${x}px`;
      heart.style.top = `${y}px`;
      heart.style.fontSize = `${18 + Math.random() * 18}px`;
      heart.style.zIndex = '10005';
      heart.style.pointerEvents = 'none';
      heart.style.transition = 'all 1s cubic-bezier(0.25, 1, 0.5, 1)';
      document.body.appendChild(heart);

      const angle = Math.random() * Math.PI * 2;
      const dist = 60 + Math.random() * 120;
      setTimeout(() => {
        heart.style.transform = `translate(${Math.cos(angle) * dist}px, ${Math.sin(angle) * dist - 80}px) scale(0)`;
        heart.style.opacity = '0';
      }, 20);

      setTimeout(() => {
        heart.remove();
      }, 1100);
    }
  }
});
