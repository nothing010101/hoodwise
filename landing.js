(function () {
  // ---------- Launch sequence ----------
  const bootSequence = document.getElementById('bootSequence');
  if (bootSequence) {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.setTimeout(() => bootSequence.classList.add('boot-complete'), reduced ? 0 : 780);
    window.setTimeout(() => bootSequence.remove(), reduced ? 80 : 1280);
  }
// ---------- Living ledger canvas (Hoodwise signature hero material) ----------
  const canvas = document.getElementById('heroCanvas');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let width, height, tick = 0, rails = [];

    function resize() {
      const pixelRatio = Math.min(devicePixelRatio, 1.5);
      width = canvas.width = canvas.offsetWidth * pixelRatio;
      height = canvas.height = canvas.offsetHeight * pixelRatio;
      const railCount = Math.max(5, Math.floor(canvas.offsetHeight / 130));
      rails = Array.from({ length: railCount }, (_, index) => ({
        y: height * (.2 + index / (railCount + 1) * .68),
        phase: Math.random() * Math.PI * 2,
        speed: .003 + Math.random() * .0035,
        amplitude: (18 + Math.random() * 38) * devicePixelRatio
      }));
    }

    function drawGrid() {
      const step = 58 * devicePixelRatio;
      ctx.lineWidth = 1;
      ctx.strokeStyle = 'rgba(86, 180, 116, .055)';
      for (let x = 0; x < width; x += step) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke();
      }
      for (let y = 0; y < height; y += step) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
      }
    }

    function drawRail(rail, index) {
      const base = rail.y;
      const segment = 46 * devicePixelRatio;
      ctx.beginPath();
      for (let x = -segment; x <= width + segment; x += segment) {
        const wave = Math.sin(x / (170 * devicePixelRatio) + tick * rail.speed + rail.phase) * rail.amplitude;
        const harmonic = Math.sin(x / (61 * devicePixelRatio) + tick * rail.speed * 1.7 + index) * rail.amplitude * .2;
        const y = base + wave + harmonic;
        if (x < 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = index % 2 ? 'rgba(0, 230, 118, .22)' : 'rgba(158, 255, 203, .14)';
      ctx.lineWidth = 1.15 * devicePixelRatio;
      ctx.stroke();

      const beaconX = ((tick * (rail.speed * 78) + index * width / rails.length) % (width + 120 * devicePixelRatio)) - 60 * devicePixelRatio;
      const beaconY = base + Math.sin(beaconX / (170 * devicePixelRatio) + tick * rail.speed + rail.phase) * rail.amplitude + Math.sin(beaconX / (61 * devicePixelRatio) + tick * rail.speed * 1.7 + index) * rail.amplitude * .2;
      const glow = ctx.createRadialGradient(beaconX, beaconY, 0, beaconX, beaconY, 24 * devicePixelRatio);
      glow.addColorStop(0, 'rgba(162, 255, 203, .95)'); glow.addColorStop(.18, 'rgba(0, 230, 118, .38)'); glow.addColorStop(1, 'rgba(0, 230, 118, 0)');
      ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(beaconX, beaconY, 24 * devicePixelRatio, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#00e676'; ctx.beginPath(); ctx.arc(beaconX, beaconY, 2.2 * devicePixelRatio, 0, Math.PI * 2); ctx.fill();
    }

    function frame() {
      ctx.clearRect(0, 0, width, height);
      drawGrid();
      rails.forEach(drawRail);
      const scan = (tick * .26) % (height + 150 * devicePixelRatio) - 75 * devicePixelRatio;
      const gradient = ctx.createLinearGradient(0, scan - 25 * devicePixelRatio, 0, scan + 25 * devicePixelRatio);
      gradient.addColorStop(0, 'rgba(0,230,118,0)'); gradient.addColorStop(.5, 'rgba(0,230,118,.09)'); gradient.addColorStop(1, 'rgba(0,230,118,0)');
      ctx.fillStyle = gradient; ctx.fillRect(0, scan - 25 * devicePixelRatio, width, 50 * devicePixelRatio);
      if (!reduceMotion) {
        if (!document.hidden) tick += 1;
        requestAnimationFrame(frame);
      }
    }

    resize();
    frame();
    window.addEventListener('resize', resize);
  }

  // ---------- Full-page atmosphere: slow constellation ribbons ----------
  const landingAtmosphere = document.getElementById('landingAtmosphere');
  if (landingAtmosphere) {
    const atmosphereContext = landingAtmosphere.getContext('2d');
    const reduceAtmosphereMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const particles = [];
    let atmosphereWidth = 0;
    let atmosphereHeight = 0;
    let atmosphereTick = 0;

    function resizeLandingAtmosphere() {
      const ratio = Math.min(window.devicePixelRatio || 1, 1.5);
      atmosphereWidth = landingAtmosphere.width = Math.floor(window.innerWidth * ratio);
      atmosphereHeight = landingAtmosphere.height = Math.floor(window.innerHeight * ratio);
      particles.length = 0;
      const amount = window.innerWidth < 760 ? 13 : 25;
      for (let index = 0; index < amount; index += 1) {
        particles.push({
          x: Math.random() * atmosphereWidth,
          y: Math.random() * atmosphereHeight,
          radius: (.6 + Math.random() * 1.2) * ratio,
          drift: (.08 + Math.random() * .16) * ratio,
          phase: Math.random() * Math.PI * 2
        });
      }
    }

    function drawLandingAtmosphere() {
      if (document.hidden) { requestAnimationFrame(drawLandingAtmosphere); return; }
      atmosphereContext.clearRect(0, 0, atmosphereWidth, atmosphereHeight);
      const ratio = Math.min(window.devicePixelRatio || 1, 1.5);
      const scrollShift = window.scrollY * .035 * ratio;

      particles.forEach((particle, index) => {
        const y = (particle.y + scrollShift + Math.sin(atmosphereTick * .012 + particle.phase) * 18 * ratio) % atmosphereHeight;
        const x = particle.x + Math.cos(atmosphereTick * .007 + particle.phase) * 18 * ratio;
        const glow = atmosphereContext.createRadialGradient(x, y, 0, x, y, 16 * ratio);
        glow.addColorStop(0, 'rgba(106,255,170,.72)');
        glow.addColorStop(.2, 'rgba(0,230,118,.18)');
        glow.addColorStop(1, 'rgba(0,230,118,0)');
        atmosphereContext.fillStyle = glow;
        atmosphereContext.beginPath();
        atmosphereContext.arc(x, y, 16 * ratio, 0, Math.PI * 2);
        atmosphereContext.fill();

        for (let next = index + 1; next < particles.length; next += 1) {
          const peer = particles[next];
          const peerY = (peer.y + scrollShift + Math.sin(atmosphereTick * .012 + peer.phase) * 18 * ratio) % atmosphereHeight;
          const peerX = peer.x + Math.cos(atmosphereTick * .007 + peer.phase) * 18 * ratio;
          const distance = Math.hypot(x - peerX, y - peerY);
          const threshold = 190 * ratio;
          if (distance < threshold) {
            atmosphereContext.strokeStyle = 'rgba(79,255,151,' + ((1 - distance / threshold) * .055) + ')';
            atmosphereContext.lineWidth = .55 * ratio;
            atmosphereContext.beginPath();
            atmosphereContext.moveTo(x, y);
            atmosphereContext.lineTo(peerX, peerY);
            atmosphereContext.stroke();
          }
        }
      });

      const ribbonY = (Math.sin(atmosphereTick * .006) * .18 + .56) * atmosphereHeight;
      const ribbon = atmosphereContext.createLinearGradient(0, ribbonY - 55 * ratio, 0, ribbonY + 55 * ratio);
      ribbon.addColorStop(0, 'rgba(0,230,118,0)');
      ribbon.addColorStop(.5, 'rgba(0,230,118,.045)');
      ribbon.addColorStop(1, 'rgba(0,230,118,0)');
      atmosphereContext.fillStyle = ribbon;
      atmosphereContext.fillRect(0, ribbonY - 55 * ratio, atmosphereWidth, 110 * ratio);

      atmosphereTick += 1;
      if (!reduceAtmosphereMotion) requestAnimationFrame(drawLandingAtmosphere);
    }

    resizeLandingAtmosphere();
    drawLandingAtmosphere();
    window.addEventListener('resize', resizeLandingAtmosphere);
  }
  // ---------- Scroll reveal ----------
  const revealEls = document.querySelectorAll('.hw-reveal');
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry, i) => {
        if (entry.isIntersecting) {
          setTimeout(() => entry.target.classList.add('hw-visible'), i * 40);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });
    revealEls.forEach(el => observer.observe(el));
  } else {
    revealEls.forEach(el => el.classList.add('hw-visible'));
  }

  // ---------- Card spotlight (cursor-following highlight) ----------
  document.querySelectorAll('.card').forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      card.style.setProperty('--mx', `${e.clientX - rect.left}px`);
      card.style.setProperty('--my', `${e.clientY - rect.top}px`);
    });
  });

  // ---------- Hero entrance stagger ----------
  const heroItems = document.querySelectorAll('.hw-hero-item');
  heroItems.forEach((el, i) => {
    setTimeout(() => el.classList.add('hw-hero-in'), 150 + i * 130);
  });

  // ---------- Mobile menu ----------
  const burger = document.getElementById('navBurger');
  const mobileMenu = document.getElementById('mobileMenu');
  if (burger && mobileMenu) {
    burger.addEventListener('click', () => {
      burger.classList.toggle('open');
      mobileMenu.classList.toggle('open');
    });
    mobileMenu.querySelectorAll('a, button').forEach(a => a.addEventListener('click', () => {
      burger.classList.remove('open');
      mobileMenu.classList.remove('open');
    }));
  }

  // ---------- Scroll-spy nav active state ----------
  const navLinkEls = document.querySelectorAll('.nav-links [data-section]');
  const sections = ['knows', 'preview', 'faq'].map(id => document.getElementById(id)).filter(Boolean);
  if (sections.length && navLinkEls.length && 'IntersectionObserver' in window) {
    const spy = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          navLinkEls.forEach(a => a.classList.toggle('active', a.dataset.section === entry.target.id));
        }
      });
    }, { rootMargin: '-40% 0px -50% 0px' });
    sections.forEach(s => spy.observe(s));
  }

  // ---------- Clean section navigation (scroll without hash URLs) ----------
  const sectionLinks = document.querySelectorAll('[data-scroll-target]');
  sectionLinks.forEach(link => {
    link.addEventListener('click', () => {
      const target = document.getElementById(link.dataset.scrollTarget);
      if (!target) return;
      target.scrollIntoView({ behavior: motionAllowed ? 'smooth' : 'auto', block: 'start' });
    });
  });
  // Old shared links with a hash still land correctly once, then resolve to
  // the canonical clean URL.
  if (window.location.hash) {
    const legacyTarget = document.getElementById(window.location.hash.slice(1));
    window.requestAnimationFrame(() => {
      legacyTarget?.scrollIntoView({ behavior: 'auto', block: 'start' });
      window.history.replaceState({}, '', window.location.pathname + window.location.search);
    });
  }
  // ---------- Smooth page transition on internal navigation ----------
  const pageTransition = document.getElementById('pageTransition');
  if (pageTransition) {
    document.querySelectorAll('[data-transition]').forEach(link => {
      link.addEventListener('click', (e) => {
        const href = link.getAttribute('href');
        if (!href || href.startsWith('#')) return;
        e.preventDefault();
        pageTransition.classList.add('hw-transition-active');
        setTimeout(() => { window.location.href = href; }, 380);
      });
    });
  }

  // ---------- Scripted live-typing demo in the preview window ----------
  const previewBody = document.getElementById('previewBody');
  if (previewBody) {
    const script = [
      { role: 'user', text: 'what even is a stock token, is it a real share?' },
      { role: 'bot', text: "Not exactly — it's a tokenized debt instrument redeemable for cash through an authorized participant, not the share itself (yet). You can trade it 24/7, unlike the actual stock market, and use it as collateral in DeFi." },
      { role: 'user', text: 'is robinhood earn fdic insured?' },
      { role: 'bot', text: "No — it's not bank-insured. Losses from smart-contract exploits are covered separately through Lloyd's of London and RELM, which is different protection than a bank deposit." }
    ];
    let started = false;

    function typeLine(row, text, cb) {
      let i = 0;
      const speed = 14;
      function step() {
        row.textContent = text.slice(0, i);
        i++;
        if (i <= text.length) {
          setTimeout(step, speed);
        } else if (cb) {
          cb();
        }
      }
      step();
    }

    function playScript(index) {
      if (index >= script.length) {
        setTimeout(() => { previewBody.innerHTML = ''; playScript(0); }, 2200);
        return;
      }
      const item = script[index];
      const row = document.createElement('div');
      row.className = 'pv-row ' + (item.role === 'user' ? 'pv-user' : 'pv-bot');
      previewBody.appendChild(row);
      previewBody.scrollTop = previewBody.scrollHeight;
      if (item.role === 'user') {
        row.textContent = item.text;
        setTimeout(() => playScript(index + 1), 600);
      } else {
        row.classList.add('pv-typing');
        setTimeout(() => {
          row.classList.remove('pv-typing');
          typeLine(row, item.text, () => setTimeout(() => playScript(index + 1), 900));
        }, 700);
      }
    }

    if ('IntersectionObserver' in window) {
      const demoObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting && !started) {
            started = true;
            playScript(0);
          }
        });
      }, { threshold: 0.4 });
      demoObserver.observe(previewBody);
    } else {
      playScript(0);
    }
  }

  // ---------- Product-surface motion ----------
  const motionAllowed = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const consoleSurface = document.querySelector('.signal-console');
  if (motionAllowed && consoleSurface) {
    consoleSurface.addEventListener('pointermove', (event) => {
      const rect = consoleSurface.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;
      consoleSurface.style.setProperty('--console-ry', `${x * 5}deg`);
      consoleSurface.style.setProperty('--console-rx', `${y * -4}deg`);
      consoleSurface.style.setProperty('--console-glow-x', `${(x + .5) * 100}%`);
      consoleSurface.style.setProperty('--console-glow-y', `${(y + .5) * 100}%`);
    });
    consoleSurface.addEventListener('pointerleave', () => {
      consoleSurface.style.setProperty('--console-ry', '0deg');
      consoleSurface.style.setProperty('--console-rx', '0deg');
    });
  }

  const nav = document.querySelector('.nav');
  if (nav) {
    const progress = document.createElement('div');
    progress.className = 'nav-progress';
    progress.setAttribute('aria-hidden', 'true');
    nav.appendChild(progress);
    const updateProgress = () => {
      const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      progress.style.transform = `scaleX(${Math.min(1, Math.max(0, window.scrollY / max))})`;
      nav.classList.toggle('nav-scrolled', window.scrollY > 22);
    };
    updateProgress();
    window.addEventListener('scroll', updateProgress, { passive: true });
  }

  // ---------- Hero command sequence ----------
  const commandText = document.getElementById('heroCommandText');
  if (commandText && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const commands = [
      'DECODING CAPITAL MARKETS ONCHAIN',
      'READING THE SIGNAL, NOT THE HYPE',
      'MAPPING PRODUCTS, RISK, AND ACCESS',
      'ONE CHAIN. ZERO GUESSWORK.'
    ];
    let commandIndex = 0;
    window.setInterval(() => {
      commandText.classList.add('is-switching');
      window.setTimeout(() => {
        commandIndex = (commandIndex + 1) % commands.length;
        commandText.textContent = commands[commandIndex];
        commandText.classList.remove('is-switching');
      }, 180);
    }, 3100);
  }
  // ---------- Tactile controls and depth cues ----------
  if (motionAllowed) {
    document.querySelectorAll('.btn-primary, .btn-secondary, .nav-cta').forEach(control => {
      control.addEventListener('pointermove', (event) => {
        const rect = control.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width - .5;
        const y = (event.clientY - rect.top) / rect.height - .5;
        control.style.setProperty('--tilt-x', `${x * 3}px`);
        control.style.setProperty('--tilt-y', `${y * 3}px`);
      });
      control.addEventListener('pointerleave', () => {
        control.style.setProperty('--tilt-x', '0px');
        control.style.setProperty('--tilt-y', '0px');
      });
    });

    const hero = document.querySelector('.hero');
    if (hero) {
      hero.addEventListener('pointermove', (event) => {
        const rect = hero.getBoundingClientRect();
        hero.style.setProperty('--hero-x', `${((event.clientX - rect.left) / rect.width) * 100}%`);
        hero.style.setProperty('--hero-y', `${((event.clientY - rect.top) / rect.height) * 100}%`);
      });
    }
  }
  const mapReadout = document.getElementById('mapReadout');
  const mapData = {
    network: { kicker: '01 / NETWORK', title: 'Ethereum-compatible, built for financial rails.', body: 'Arbitrum L2, ETH gas, EVM tooling, and predictable sequencing make the base layer familiar to builders.', fact: 'Chain ID 4663 · public RPC is rate-limited' },
    products: { kicker: '02 / PRODUCTS', title: 'Onchain products have structure, access, and limits.', body: 'Stock Tokens, Earn, and perpetual venues are separate products with different issuer, availability, and risk boundaries.', fact: 'Permissionless chain ≠ universal product access' },
    ecosystem: { kicker: '03 / ECOSYSTEM', title: 'Infrastructure and community activity are not the same thing.', body: 'Oracles, bridges, DEXs, lending, and wallets form the documented stack; community tokens remain independent deployments.', fact: 'Verify the exact contract and venue' },
    risk: { kicker: '04 / RISK LAYER', title: 'The best answer says what needs checking next.', body: 'Availability, contract authority, liquidity, bridge route, and jurisdiction can materially change a practical decision.', fact: 'Direct answer first · verification second' }
  };
  document.querySelectorAll('.map-node').forEach(node => node.addEventListener('click', () => {
    const detail = mapData[node.dataset.map];
    if (!detail || !mapReadout) return;
    document.querySelectorAll('.map-node').forEach(item => { item.classList.toggle('active', item === node); item.setAttribute('aria-selected', item === node ? 'true' : 'false'); });
    mapReadout.classList.add('is-switching');
    window.setTimeout(() => {
      mapReadout.innerHTML = `<span class="map-readout-kicker">${detail.kicker}</span><h3>${detail.title}</h3><p>${detail.body}</p><div><span>CONFIRMED</span><b>${detail.fact}</b></div>`;
      mapReadout.classList.remove('is-switching');
    }, 120);
  }));
})();
