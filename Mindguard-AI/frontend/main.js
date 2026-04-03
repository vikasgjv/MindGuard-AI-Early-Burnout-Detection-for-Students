/* ══════════════════════════════════════════
   MindGuard AI — main.js
   (Navigation, Canvas, Auth, UI)
══════════════════════════════════════════ */

(function () {
  'use strict';

  const MIN_PASSWORD_LENGTH = 8;
  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const DEBOUNCE_MS = 150;
  const REDIRECT_DELAY_MS = 2000;

  function debounce(fn, ms) {
    let t;
    return function () {
      clearTimeout(t);
      t = setTimeout(fn, ms);
    };
  }

  function showFormError(containerId, message) {
    const el = document.getElementById(containerId);
    if (!el) return;
    el.textContent = message || '';
    el.hidden = !message;
  }

  function setFieldError(inputId, message) {
    const input = document.getElementById(inputId);
    const errorId = inputId + '-error';
    const errorEl = document.getElementById(errorId);
    if (input) {
      input.classList.toggle('error', !!message);
      input.setAttribute('aria-invalid', !!message);
    }
    if (errorEl) errorEl.textContent = message || '';
  }

  function clearAllFormErrors() {
    ['form-error', 'login-email-error', 'login-pass-error', 'signup-name-error', 'forgot-email-error'].forEach(id => {
      const el = document.getElementById(id);
      if (el) { el.textContent = ''; el.hidden = true; }
    });
    ['login-email', 'login-pass', 'signup-name', 'forgot-email'].forEach(id => {
      const input = document.getElementById(id);
      if (input) { input.classList.remove('error'); input.setAttribute('aria-invalid', 'false'); }
    });
  }

  const overlay = document.getElementById('transition-overlay');

  function goTo(page) {
    if (overlay) overlay.className = 'entering';
    setTimeout(function () {
      document.querySelectorAll('.page').forEach(function (p) { p.classList.remove('active'); });
      const target = document.getElementById(page + '-page');
      if (target) target.classList.add('active');
      window.scrollTo(0, 0);
      if (overlay) overlay.className = 'leaving';
      if (page === 'login') initLoginCanvas();
      if (page === 'about') initHeroCanvas();
      if (page === 'dashboard') {
        updateDashboardProfile();
        showDashboardView('profile');
      }
    }, overlay ? 450 : 0);
  }

  function bindNavigation() {
    function handleClick(e) {
      const scrollTrigger = e.target.closest('[data-scroll]');
      if (scrollTrigger) {
        const targetId = scrollTrigger.getAttribute('data-scroll');
        const scrollTarget = targetId ? document.getElementById(targetId) : null;
        if (scrollTarget) {
          e.preventDefault();
          e.stopPropagation();
          scrollTarget.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
        return;
      }

      const target = e.target.closest('[data-nav]');
      if (target) {
        const page = target.getAttribute('data-nav');
        if (page) {
          e.preventDefault();
          e.stopPropagation();
          goTo(page);
        }
        return;
      }
      const anchor = e.target.closest('a[href^="#"]');
      if (anchor) {
        const href = anchor.getAttribute('href');
        if (href === '#' || href === '') return;
        const scrollTarget = document.querySelector(href);
        if (scrollTarget) {
          e.preventDefault();
          scrollTarget.scrollIntoView({ behavior: 'smooth' });
        }
      }
    }
    document.body.addEventListener('click', handleClick, false);
  }

  let heroAnimId = null;

  function initHeroCanvas() {
    const canvas = document.getElementById('hero-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let W, H, particles = [];

    function resize() {
      W = canvas.width = canvas.offsetWidth;
      H = canvas.height = canvas.offsetHeight;
    }
    resize();
    window.addEventListener('resize', debounce(resize, DEBOUNCE_MS));

    class Particle {
      constructor() { this.reset(); }
      reset() {
        this.x = Math.random() * W;
        this.y = Math.random() * H;
        this.r = Math.random() * 2.5 + 0.5;
        this.vx = (Math.random() - 0.5) * 0.4;
        this.vy = (Math.random() - 0.5) * 0.4;
        this.alpha = Math.random() * 0.5 + 0.1;
        this.color = ['#7EC8C0', '#A8D5D1', '#E8A87C', '#5BA8A0', '#FFFFFF'][Math.floor(Math.random() * 5)];
      }
      update() {
        this.x += this.vx;
        this.y += this.vy;
        if (this.x < 0 || this.x > W || this.y < 0 || this.y > H) this.reset();
      }
      draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.globalAlpha = this.alpha;
        ctx.fill();
        ctx.globalAlpha = 1;
      }
    }

    function drawBG() {
      const t = Date.now() / 8000;
      const grd = ctx.createLinearGradient(W * (0.3 + 0.1 * Math.sin(t)), 0, W * (0.7 + 0.1 * Math.cos(t)), H);
      grd.addColorStop(0, '#1C3A38');
      grd.addColorStop(0.4, '#2E6B63');
      grd.addColorStop(0.7, '#3D7A74');
      grd.addColorStop(1, '#5BA8A0');
      ctx.fillStyle = grd;
      ctx.fillRect(0, 0, W, H);
    }

    function drawWaves() {
      const t = Date.now() / 3000;
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.moveTo(0, H);
        for (let x = 0; x <= W; x += 8) {
          const y = H * (0.6 + 0.05 * i) + Math.sin(x / 180 + t + i * 1.1) * 30 + Math.sin(x / 80 + t * 1.4 + i * 0.7) * 12;
          ctx.lineTo(x, y);
        }
        ctx.lineTo(W, H);
        ctx.closePath();
        ctx.fillStyle = 'rgba(61,122,116,' + (0.12 - i * 0.03) + ')';
        ctx.fill();
      }
    }

    function drawConnections() {
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < 100) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = 'rgba(168,213,209,' + (0.15 * (1 - d / 100)) + ')';
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }
    }

    for (let i = 0; i < 80; i++) particles.push(new Particle());

    function animate() {
      if (document.hidden) { heroAnimId = requestAnimationFrame(animate); return; }
      drawBG();
      drawWaves();
      drawConnections();
      particles.forEach(p => { p.update(); p.draw(); });
      heroAnimId = requestAnimationFrame(animate);
    }
    if (heroAnimId) cancelAnimationFrame(heroAnimId);
    animate();

    setTimeout(() => {
      const ring = document.getElementById('preview-ring');
      if (ring) ring.style.background = 'conic-gradient(#7EC8C0 0deg, #7EC8C0 259deg, rgba(255,255,255,0.12) 259deg)';
      document.querySelectorAll('.preview-bar-fill').forEach(b => {
        const w = b.dataset.w != null ? b.dataset.w : b.dataset.width;
        if (w !== undefined && w !== null) { b.style.width = w + '%'; b.style.transition = 'width 1.8s ease'; }
      });
    }, 1200);
  }

  let loginAnimId = null;

  function initLoginCanvas() {
    const canvas = document.getElementById('login-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let W, H;

    function resize() {
      W = canvas.width = canvas.offsetWidth;
      H = canvas.height = canvas.offsetHeight;
    }
    resize();
    window.addEventListener('resize', debounce(resize, DEBOUNCE_MS));

    const nodes = Array.from({ length: 40 }, () => ({
      x: Math.random() * W, y: Math.random() * H,
      vx: (Math.random() - 0.5) * 0.3, vy: (Math.random() - 0.5) * 0.3,
      r: Math.random() * 2 + 1
    }));

    function loop() {
      if (document.hidden) { loginAnimId = requestAnimationFrame(loop); return; }
      const t = Date.now() / 6000;
      const grd = ctx.createLinearGradient(0, 0, W, H);
      grd.addColorStop(0, '#0E1E1D');
      grd.addColorStop(0.5, '#1C3A38');
      grd.addColorStop(1, '#2E6B63');
      ctx.fillStyle = grd;
      ctx.fillRect(0, 0, W, H);
      for (let i = 0; i < 3; i++) {
        const bx = W * (0.2 + 0.3 * Math.sin(t + i * 2.1));
        const by = H * (0.3 + 0.2 * Math.cos(t * 1.3 + i * 1.5));
        const blob = ctx.createRadialGradient(bx, by, 0, bx, by, 250);
        blob.addColorStop(0, 'rgba(91,168,160,0.12)');
        blob.addColorStop(1, 'transparent');
        ctx.fillStyle = blob;
        ctx.fillRect(0, 0, W, H);
      }
      nodes.forEach(n => {
        n.x += n.vx; n.y += n.vy;
        if (n.x < 0 || n.x > W) n.vx *= -1;
        if (n.y < 0 || n.y > H) n.vy *= -1;
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(168,213,209,0.4)';
        ctx.fill();
      });
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < 120) {
            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.strokeStyle = 'rgba(91,168,160,' + (0.18 * (1 - d / 120)) + ')';
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        }
      }
      loginAnimId = requestAnimationFrame(loop);
    }
    loop();
  }

  const navbar = document.getElementById('navbar');
  if (navbar) window.addEventListener('scroll', () => navbar.classList.toggle('scrolled', window.scrollY > 60));

  const revealObs = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('visible');
      entry.target.querySelectorAll('.progress-bar-fill').forEach(b => {
        const w = b.dataset.width != null ? b.dataset.width : b.dataset.w;
        if (w !== undefined && w !== null) b.style.width = w + '%';
      });
    });
  }, { threshold: 0.12 });
  document.querySelectorAll('.reveal, .step, .goal-item').forEach(el => revealObs.observe(el));
  document.querySelectorAll('.step').forEach((s, i) => { s.style.transitionDelay = i * 0.15 + 's'; });
  document.querySelectorAll('.goal-item').forEach((it, i) => { it.style.transitionDelay = i * 0.1 + 's'; });

  let currentTab = 'login';

  function switchTab(tab) {
    currentTab = tab;
    const tabLogin = document.getElementById('tab-login');
    const tabSignup = document.getElementById('tab-signup');
    if (tabLogin) { tabLogin.classList.toggle('active', tab === 'login'); tabLogin.setAttribute('aria-selected', tab === 'login'); }
    if (tabSignup) { tabSignup.classList.toggle('active', tab === 'signup'); tabSignup.setAttribute('aria-selected', tab === 'signup'); }
    const formTitle = document.getElementById('form-title');
    const formSub = document.getElementById('form-sub');
    if (formTitle) formTitle.textContent = tab === 'login' ? 'Welcome back' : 'Create account';
    if (formSub) formSub.textContent = tab === 'login' ? 'Sign in to your MindGuard account' : 'Start your wellness journey today';
    const signupFields = document.getElementById('signup-fields');
    if (signupFields) signupFields.style.display = tab === 'signup' ? 'block' : 'none';
    const formOpts = document.getElementById('form-options');
    if (formOpts) formOpts.style.display = tab === 'login' ? 'flex' : 'none';
    const btnText = document.getElementById('btn-login-text');
    if (btnText) btnText.textContent = tab === 'login' ? 'Sign In →' : 'Create Account →';
    const success = document.getElementById('login-success');
    if (success) { success.hidden = true; success.style.display = 'none'; }
    const content = document.getElementById('login-form-content');
    if (content) content.style.display = 'block';
    clearAllFormErrors();
  }

  function validateForm() {
    clearAllFormErrors();
    const emailEl = document.getElementById('login-email');
    const passEl = document.getElementById('login-pass');
    const email = emailEl ? emailEl.value.trim() : '';
    const password = passEl ? passEl.value : '';
    let valid = true;

    if (!email) { setFieldError('login-email', 'Email is required.'); valid = false; }
    else if (!EMAIL_REGEX.test(email)) { setFieldError('login-email', 'Please enter a valid email address.'); valid = false; }
    if (!password) { setFieldError('login-pass', 'Password is required.'); valid = false; }
    else if (password.length < MIN_PASSWORD_LENGTH) { setFieldError('login-pass', 'Password must be at least ' + MIN_PASSWORD_LENGTH + ' characters.'); valid = false; }

    if (currentTab === 'signup') {
      const nameEl = document.getElementById('signup-name');
      const name = nameEl ? nameEl.value.trim() : '';
      if (!name) { setFieldError('signup-name', 'Full name is required.'); valid = false; }
    }
    return valid;
  }

  function setLoginButtonState(loading) {
    const btn = document.getElementById('btn-login');
    if (!btn) return;
    btn.disabled = loading;
    btn.setAttribute('aria-busy', loading);
    const text = document.getElementById('btn-login-text');
    if (text) text.textContent = loading ? 'Signing in…' : (currentTab === 'login' ? 'Sign In →' : 'Create Account →');
  }

  function handleLogin() {
    if (!validateForm()) return;
    const emailEl = document.getElementById('login-email');
    const passEl = document.getElementById('login-pass');
    const email = emailEl ? emailEl.value.trim() : '';
    const password = passEl ? passEl.value : '';
    setLoginButtonState(true);
    clearAllFormErrors();

    const isSignup = currentTab === 'signup';
    const nameEl = document.getElementById('signup-name');
    const fullName = nameEl ? nameEl.value.trim() : '';

    const endpoint = isSignup
      ? 'http://127.0.0.1:8000/api/auth/signup'
      : 'http://127.0.0.1:8000/api/auth/login';

    const body = isSignup
      ? JSON.stringify({ full_name: fullName, email, password })
      : JSON.stringify({ email, password });

    fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body
    })
      .then(async resp => {
        const data = await resp.json().catch(() => ({}));
        if (!resp.ok) {
          const msg = data.detail || (isSignup ? 'Sign up failed.' : 'Invalid email or password.');
          showFormError('form-error', msg);
          setLoginButtonState(false);
          return;
        }
        setLoginButtonState(false);
        window.__lastLoginEmail = email;
        window.__lastLoginName = isSignup ? fullName : (data.full_name || fullName || '');
        window.__userId = data.user_id || null;

        const content = document.getElementById('login-form-content');
        if (content) content.style.display = 'none';
        const success = document.getElementById('login-success');
        if (success) { success.style.display = 'block'; success.hidden = false; }
        setTimeout(() => goTo('dashboard'), REDIRECT_DELAY_MS);
      })
      .catch(() => {
        console.warn('Backend offline, proceeding with local session.');
        setLoginButtonState(false);
        window.__lastLoginEmail = email;
        window.__lastLoginName = isSignup ? fullName : '';
        const content = document.getElementById('login-form-content');
        if (content) content.style.display = 'none';
        const success = document.getElementById('login-success');
        if (success) { success.style.display = 'block'; success.hidden = false; }
        setTimeout(() => goTo('dashboard'), REDIRECT_DELAY_MS);
      });
  }

  function togglePassword() {
    const input = document.getElementById('login-pass');
    const btn = document.getElementById('password-toggle');
    if (!input || !btn) return;
    const isPass = input.type === 'password';
    input.type = isPass ? 'text' : 'password';
    btn.setAttribute('aria-label', isPass ? 'Hide password' : 'Show password');
    btn.setAttribute('aria-pressed', isPass);
    const span = btn.querySelector('span');
    if (span) span.textContent = isPass ? '🙈' : '👁';
  }

  function openForgotModal() {
    const modal = document.getElementById('forgot-modal');
    if (modal) { modal.hidden = false; modal.removeAttribute('hidden'); }
    const forgotEmail = document.getElementById('forgot-email');
    const loginEmail = document.getElementById('login-email');
    if (forgotEmail && loginEmail) forgotEmail.value = loginEmail.value.trim();
    if (forgotEmail) forgotEmail.focus();
    showFormError('forgot-email-error', '');
    document.addEventListener('keydown', onKeyDown);
  }

  function closeForgotModal() {
    const modal = document.getElementById('forgot-modal');
    if (modal) { modal.hidden = true; modal.setAttribute('hidden', ''); }
    document.removeEventListener('keydown', onKeyDown);
  }

  function onKeyDown(e) {
    if (e.key === 'Escape') closeForgotModal();
  }

  function handleForgotSubmit() {
    const emailInput = document.getElementById('forgot-email');
    const email = emailInput ? emailInput.value.trim() : '';
    showFormError('forgot-email-error', '');
    if (!email) { showFormError('forgot-email-error', 'Please enter your email.'); return; }
    if (!EMAIL_REGEX.test(email)) { showFormError('forgot-email-error', 'Please enter a valid email address.'); return; }
    closeForgotModal();
  }

  function showDashboardView(viewName) {
    document.querySelectorAll('.dashboard-view').forEach(function (el) {
      el.classList.remove('active');
      el.setAttribute('hidden', '');
    });
    document.querySelectorAll('.dashboard-nav-link').forEach(function (link) {
      link.classList.toggle('active', link.getAttribute('data-dashboard-view') === viewName);
    });
    const panel = document.getElementById('dashboard-view-' + viewName);
    if (panel) {
      panel.classList.add('active');
      panel.removeAttribute('hidden');
    }
    if (viewName === 'home') updateDashboardHome();
  }

  function updateDashboardProfile() {
    const email = window.__lastLoginEmail || '—';
    const name = window.__lastLoginName || email.split('@')[0] || 'User';
    const initial = name.charAt(0).toUpperCase();
    const memberSince = 'February 2026';
    document.querySelectorAll('#profile-email, #profile-email-value').forEach(function (el) {
      if (el) el.textContent = email;
    });
    const nameEl = document.getElementById('profile-name');
    if (nameEl) nameEl.textContent = name;
    const avatarEl = document.getElementById('profile-avatar');
    if (avatarEl) avatarEl.textContent = initial;
    const memberEl = document.getElementById('profile-member-since');
    if (memberEl) memberEl.textContent = memberSince;
  }

  const CHECKINS_KEY = 'mindguard_checkins_v1';

  function getCheckins() {
    try {
      const raw = localStorage.getItem(CHECKINS_KEY);
      const arr = raw ? JSON.parse(raw) : [];
      return Array.isArray(arr) ? arr : [];
    } catch (_) {
      return [];
    }
  }

  function setCheckins(arr) {
    try { localStorage.setItem(CHECKINS_KEY, JSON.stringify(arr)); } catch (_) {}
  }

  function clamp(n, min, max) {
    return Math.max(min, Math.min(max, n));
  }

  function buildFallbackRecommendations(inputs, topDriver, band) {
    const recos = [];
    const moodLabel = String(inputs.mood || 'average').toLowerCase();
    const sleep = Number(inputs.sleepHours || 0);
    const screen = Number(inputs.screenHours || 0);
    const study = Number(inputs.studyHours || 0);
    const extra = Number(inputs.extracurricularHours || 0);
    const physical = Number(inputs.physicalHours || 0);

    if (sleep < 6.5) recos.push('Aim for 7.5-8h sleep tonight and stop screen use 60 minutes before bed.');
    if (screen > 7) recos.push('Keep non-essential screen time below 2h today and use focus blocks for study.');
    if (moodLabel === 'bad' || moodLabel === 'average') recos.push('Take two short mood resets today: a walk and a brief social check-in.');
    if (study > 7) recos.push('Limit today to your top 2 academic tasks and avoid context switching.');
    if (extra > 4) recos.push('Consider reducing one optional commitment this week for better recovery time.');
    if (physical < 0.75) recos.push('Add 20-30 minutes of light activity to support energy and stress recovery.');

    if (recos.length === 0) {
      recos.push('Your routine is stable. Keep your current sleep, activity, and study balance.');
    }

    if (band === 'High' || band === 'Moderate') {
      recos.unshift(`Primary driver is ${topDriver.toLowerCase()}. Start with one high-impact adjustment today.`);
    }

    return recos.slice(0, 5);
  }

  function recommendationToText(item) {
    if (typeof item === 'string') return item;
    if (!item || typeof item !== 'object') return '';
    const title = item.title ? String(item.title) : '';
    const firstAction = Array.isArray(item.action_plan) && item.action_plan.length > 0 ? String(item.action_plan[0]) : '';
    if (title && firstAction) return `${title}: ${firstAction}`;
    if (title) return title;
    if (firstAction) return firstAction;
    return item.expected_outcome ? String(item.expected_outcome) : '';
  }

  async function computeRisk(inputs) {
    const moodLabel = String(inputs.mood || 'average').toLowerCase();
    const moodRiskMap = { excellent: 0.1, good: 0.25, average: 0.5, bad: 0.85 };
    try {
      const resp = await fetch('http://127.0.0.1:8000/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(inputs)
      });
      if (!resp.ok) throw new Error('API returned ' + resp.status);
      const data = await resp.json();
      
      const score = Math.round(data.risk_score);
      let band = 'Low';
      if (data.risk_category === 'moderate') band = 'Moderate';
      if (data.risk_category === 'high' || data.risk_category === 'critical') band = 'High';

      const topDriver = data.top_driver || 'General';
      const summary = band === 'Low'
        ? 'You’re trending stable. Keep a consistent routine.'
        : band === 'Moderate'
          ? 'Some signals suggest rising strain. Small adjustments can help.'
          : 'High strain detected. Prioritize recovery and reach out for support if needed.';
      const recos = Array.isArray(data.recommendations) ? data.recommendations.slice(0, 5) : [];

      return {
        score,
        band,
        topDriver,
        summary,
        recos: recos.length ? recos : buildFallbackRecommendations(inputs, topDriver, band)
      };
    } catch (e) {
      console.error('API call failed, using local fallback:', e);
      // Normalize: higher = more risk (0..1)
      const study = clamp(Number(inputs.studyHours || 0) / 12, 0, 1);
      const extra = clamp(Number(inputs.extracurricularHours || 0) / 6, 0, 1);
      const screen = clamp(Number(inputs.screenHours || 0) / 12, 0, 1);
      const physicalLow = 1 - clamp(Number(inputs.physicalHours || 0) / 3, 0, 1);
      const sleepLow = 1 - clamp(Number(inputs.sleepHours || 0) / 8, 0, 1);
      const moodRisk = moodRiskMap[moodLabel] != null ? moodRiskMap[moodLabel] : moodRiskMap.average;

      // Weighted risk score (0..100)
      const score01 =
        0.20 * screen +
        0.18 * study +
        0.17 * moodRisk +
        0.15 * sleepLow +
        0.14 * physicalLow +
        0.16 * extra;

      const score = Math.round(clamp(score01, 0, 1) * 100);
      const band = score < 35 ? 'Low' : score < 70 ? 'Moderate' : 'High';

      const drivers = [
        { key: 'Screen time', v: screen },
        { key: 'Study load', v: study },
        { key: 'Sleep deficit', v: sleepLow },
        { key: 'Mood state', v: moodRisk },
        { key: 'Low physical activity', v: physicalLow },
        { key: 'Extracurricular load', v: extra }
      ].sort((a, b) => b.v - a.v);

      const topDriver = drivers[0].key;

      const summary =
        band === 'Low'
          ? 'You’re trending stable. Keep a consistent routine.'
          : band === 'Moderate'
            ? 'Some signals suggest rising strain. Small adjustments can help.'
            : 'High strain detected. Prioritize recovery and reach out for support if needed.';

      return {
        score,
        band,
        topDriver,
        summary,
        recos: buildFallbackRecommendations(inputs, topDriver, band)
      };
    }
  }

  function setChip(el, band) {
    if (!el) return;
    el.textContent = band;
    el.classList.remove('low', 'moderate', 'high');
    if (band === 'Low') el.classList.add('low');
    if (band === 'Moderate') el.classList.add('moderate');
    if (band === 'High') el.classList.add('high');
  }

  function setRangeFill(input) {
    const min = Number(input.min || 0);
    const max = Number(input.max || 100);
    const val = Number(input.value || 0);
    const pct = ((val - min) / (max - min)) * 100;
    input.style.background = `linear-gradient(90deg, var(--teal) 0%, var(--teal) ${pct}%, rgba(91,168,160,0.2) ${pct}%)`;
  }

  function initAnalysisSliders() {
    const map = [
      { id: 'study-hours', out: 'val-study-hours', fmt: v => Number(v).toFixed(1) },
      { id: 'extracurricular-hours', out: 'val-extracurricular-hours', fmt: v => Number(v).toFixed(1) },
      { id: 'screen-hours', out: 'val-screen-hours', fmt: v => Number(v).toFixed(1) },
      { id: 'physical-hours', out: 'val-physical-hours', fmt: v => Number(v).toFixed(2).replace(/0$/, '').replace(/\\.0$/, '') },
      { id: 'sleep-hours', out: 'val-sleep-hours', fmt: v => Number(v).toFixed(1) }
    ];

    map.forEach(item => {
      const input = document.getElementById(item.id);
      const out = document.getElementById(item.out);
      if (!input || !out) return;
      const update = function () {
        out.textContent = item.fmt(input.value);
        setRangeFill(input);
      };
      input.addEventListener('input', update);
      update();
    });
  }

  function readAnalysisInputs() {
    return {
      studyHours: Number((document.getElementById('study-hours') || {}).value || 0),
      extracurricularHours: Number((document.getElementById('extracurricular-hours') || {}).value || 0),
      screenHours: Number((document.getElementById('screen-hours') || {}).value || 0),
      physicalHours: Number((document.getElementById('physical-hours') || {}).value || 0),
      sleepHours: Number((document.getElementById('sleep-hours') || {}).value || 0),
      mood: String((document.getElementById('mood') || {}).value || 'average').toLowerCase()
    };
  }

  function renderAnalysisResult(result) {
    const empty = document.getElementById('analysis-empty');
    const panel = document.getElementById('analysis-result');
    if (empty) empty.hidden = true;
    if (panel) panel.hidden = false;

    const scoreEl = document.getElementById('analysis-score-val');
    if (scoreEl) scoreEl.textContent = String(result.score);
    setChip(document.getElementById('analysis-band'), result.band);
    const summaryEl = document.getElementById('analysis-summary');
    if (summaryEl) summaryEl.textContent = result.summary;

    const ring = document.getElementById('analysis-score-ring');
    if (ring) {
      const deg = Math.round((result.score / 100) * 360);
      ring.style.background = `conic-gradient(var(--teal-light) 0deg, var(--teal-light) ${deg}deg, rgba(91,168,160,0.2) ${deg}deg)`;
    }

    const list = document.getElementById('analysis-recos');
    if (list) {
      list.innerHTML = '';
      (result.recos || []).slice(0, 5).forEach(item => {
        const li = document.createElement('li');
        li.textContent = recommendationToText(item);
        list.appendChild(li);
      });
    }

  }

  function saveCheckin(inputs, result) {
    const checkins = getCheckins();
    checkins.push({
      ts: Date.now(),
      inputs,
      score: result.score,
      band: result.band,
      topDriver: result.topDriver
    });
    // keep last 30
    while (checkins.length > 30) checkins.shift();
    setCheckins(checkins);
  }

  function formatWhen(ts) {
    try {
      return new Date(ts).toLocaleString(undefined, { month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' });
    } catch (_) {
      return '—';
    }
  }

  async function updateDashboardHome() {
    const checkins = getCheckins();
    const last = checkins[checkins.length - 1];

    const welcome = document.getElementById('dashboard-welcome-sub');
    const scoreEl = document.getElementById('dash-score');
    const bandEl = document.getElementById('dash-band');
    const updatedEl = document.getElementById('dash-updated');
    const driverEl = document.getElementById('dash-driver');
    const actionEl = document.getElementById('dash-action');
    const synopsisList = document.getElementById('dash-synopsis-list');

    if (!last) {
      if (welcome) welcome.textContent = 'Complete a check-in in Analysis to generate your first insights.';
      if (scoreEl) scoreEl.textContent = '—';
      if (bandEl) bandEl.textContent = '—';
      if (updatedEl) updatedEl.textContent = 'No check-ins yet';
      if (driverEl) driverEl.textContent = '—';
      if (actionEl) actionEl.textContent = 'Start with an Analysis check-in';
      if (synopsisList) synopsisList.innerHTML = '<li>Fill out today’s signals in <strong>Analysis</strong> to generate insights.</li>';
      renderTrendChart(checkins);
      const checkinsEl = document.getElementById('profile-checkins');
      if (checkinsEl) checkinsEl.textContent = String(checkins.length);
      return;
    }

    const inputs = last.inputs || {};
    const computed = await computeRisk(inputs);
    if (welcome) welcome.textContent = `Latest check-in: ${formatWhen(last.ts)} · Top driver: ${computed.topDriver}`;
    if (scoreEl) scoreEl.textContent = String(computed.score);
    setChip(bandEl, computed.band);
    if (updatedEl) updatedEl.textContent = 'Updated ' + formatWhen(last.ts);
    if (driverEl) driverEl.textContent = computed.topDriver;
    if (actionEl) actionEl.textContent = (computed.recos && computed.recos[0]) ? computed.recos[0] : computed.summary;
    if (synopsisList) {
      synopsisList.innerHTML = '';
      const moodText = inputs.mood ? String(inputs.mood).charAt(0).toUpperCase() + String(inputs.mood).slice(1) : 'Average';
      const items = [
        `Mood: ${moodText} · Sleep: ${inputs.sleepHours}h`,
        `Study: ${inputs.studyHours}h · Physical: ${inputs.physicalHours}h · Screen: ${inputs.screenHours}h`,
        `Extracurricular: ${inputs.extracurricularHours}h`
      ];
      items.forEach(t => {
        const li = document.createElement('li');
        li.textContent = t;
        synopsisList.appendChild(li);
      });
    }
    renderTrendChart(checkins);
    const checkinsEl = document.getElementById('profile-checkins');
    if (checkinsEl) checkinsEl.textContent = String(checkins.length);
  }

  function renderTrendChart(checkins) {
    const empty = document.getElementById('dash-chart-empty');
    const svg = document.getElementById('dash-risk-chart');
    const line = document.getElementById('dash-risk-line');
    const area = document.getElementById('dash-risk-area');
    if (!empty || !svg || !line || !area) return;

    if (!checkins || checkins.length < 2) {
      empty.hidden = false;
      svg.setAttribute('hidden', '');
      return;
    }

    const lastN = checkins.slice(-7);
    const W = 640, H = 200;
    const padX = 20, padY = 20;
    const innerW = W - padX * 2;
    const innerH = H - padY * 2;

    const pts = lastN.map(function (c, i) {
      const x = padX + (i / (lastN.length - 1)) * innerW;
      const y = padY + (1 - clamp(c.score / 100, 0, 1)) * innerH;
      return { x, y };
    });

    const d = 'M ' + pts.map(function (p) { return `${p.x.toFixed(1)} ${p.y.toFixed(1)}`; }).join(' L ');
    line.setAttribute('d', d);
    const areaD =
      d +
      ` L ${pts[pts.length - 1].x.toFixed(1)} ${(H - padY).toFixed(1)} L ${pts[0].x.toFixed(1)} ${(H - padY).toFixed(1)} Z`;
    area.setAttribute('d', areaD);
    empty.hidden = true;
    svg.removeAttribute('hidden');
  }

  function bindAuth() {
    const tabLogin = document.getElementById('tab-login');
    const tabSignup = document.getElementById('tab-signup');
    if (tabLogin) tabLogin.addEventListener('click', () => switchTab('login'));
    if (tabSignup) tabSignup.addEventListener('click', () => switchTab('signup'));
    const btnLogin = document.getElementById('btn-login');
    if (btnLogin) btnLogin.addEventListener('click', handleLogin);
    const passwordToggle = document.getElementById('password-toggle');
    if (passwordToggle) passwordToggle.addEventListener('click', togglePassword);
    const forgotBtn = document.getElementById('forgot-password-btn');
    if (forgotBtn) forgotBtn.addEventListener('click', openForgotModal);
    document.querySelectorAll('[data-close="forgot"]').forEach(el => el.addEventListener('click', closeForgotModal));
    const forgotSubmit = document.getElementById('forgot-submit');
    if (forgotSubmit) forgotSubmit.addEventListener('click', handleForgotSubmit);
    const googleBtn = document.getElementById('google-btn');
    if (googleBtn) googleBtn.addEventListener('click', function () {
      const formError = document.getElementById('form-error');
      if (formError) { formError.textContent = 'Google sign-in is coming soon.'; formError.hidden = false; }
    });
    const dashboardLogout = document.getElementById('dashboard-logout');
    if (dashboardLogout) dashboardLogout.addEventListener('click', function () { goTo('about'); });
    document.querySelectorAll('.dashboard-nav-link').forEach(function (link) {
      link.addEventListener('click', function (e) {
        e.preventDefault();
        const view = this.getAttribute('data-dashboard-view');
        if (view) showDashboardView(view);
      });
    });

    const submit = document.getElementById('analysis-submit');
    if (submit) {
      submit.addEventListener('click', async function () {
        const btn = this;
        const originalText = btn.textContent;
        btn.textContent = 'Analyzing...';
        btn.disabled = true;
        try {
          const inputs = readAnalysisInputs();
          const result = await computeRisk(inputs);
          renderAnalysisResult(result);
          saveCheckin(inputs, result);
          updateDashboardProfile();
          await updateDashboardHome();
        } finally {
          btn.textContent = originalText;
          btn.disabled = false;
        }
      });
    }
  }

  window.goTo = goTo;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      bindNavigation();
      bindAuth();
      initAnalysisSliders();
      initHeroCanvas();
    });
  } else {
    bindNavigation();
    bindAuth();
    initAnalysisSliders();
    initHeroCanvas();
  }
})();
