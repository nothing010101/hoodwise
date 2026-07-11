(function () {
  const messagesEl = document.getElementById('messages');
  const inputEl = document.getElementById('input');
  const form = document.getElementById('inputForm');
  const sendBtn = document.getElementById('sendBtn');
  const chipsEl = document.getElementById('chips');
  const historyList = document.getElementById('historyList');
  const newChatBtn = document.getElementById('newChatBtn');
  const conversationTitleEl = document.getElementById('conversationTitle');
  const sidebar = document.getElementById('sidebar');
  const collapseBtn = document.getElementById('collapseBtn');
  const expandBtn = document.getElementById('expandBtn');
  const themeToggle = document.getElementById('themeToggle');
  const themeIconMoon = document.getElementById('themeIconMoon');
  const themeIconSun = document.getElementById('themeIconSun');
  const themeLabel = document.getElementById('themeLabel');
  const motionReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const composerMeta = document.getElementById('composerMeta');
  const charCountEl = document.getElementById('charCount');
  const interactionStatus = document.getElementById('interactionStatus');
  let isSending = false;

  function setInteractionStatus(message) {
    if (!interactionStatus) return;
    interactionStatus.textContent = message;
    interactionStatus.classList.add('is-visible');
    window.clearTimeout(setInteractionStatus.timer);
    setInteractionStatus.timer = window.setTimeout(() => interactionStatus.classList.remove('is-visible'), 1800);
  }

  function updateComposerState() {
    const count = inputEl.value.length;
    if (charCountEl) charCountEl.textContent = count + ' / 4,000';
    sendBtn.disabled = isSending || !inputEl.value.trim();
    sendBtn.classList.toggle('is-ready', !sendBtn.disabled);
  }

  // Subtle background parallax makes the chat feel like a product surface,
  // while remaining inert for users who prefer reduced motion.
  if (!motionReduced) {
    document.getElementById('app').addEventListener('pointermove', (event) => {
      document.documentElement.style.setProperty('--app-pointer-x', `${(event.clientX / window.innerWidth) * 100}%`);
      document.documentElement.style.setProperty('--app-pointer-y', `${(event.clientY / window.innerHeight) * 100}%`);
    });
  }

  // ---- Ambient command-field canvas ----
  // Kept deliberately sparse so the chat remains readable while the surface
  // feels responsive and alive behind the conversation.
  const ambientField = document.getElementById('ambientField');
  if (ambientField) {
    const fieldContext = ambientField.getContext('2d');
    const fieldParticles = [];
    let fieldWidth = 0;
    let fieldHeight = 0;
    let fieldFrame = 0;
    const particleCount = window.innerWidth < 780 ? 18 : 34;

    function resizeAmbientField() {
      const ratio = Math.min(window.devicePixelRatio || 1, 1.5);
      fieldWidth = ambientField.width = Math.floor(ambientField.clientWidth * ratio);
      fieldHeight = ambientField.height = Math.floor(ambientField.clientHeight * ratio);
      fieldParticles.length = 0;
      for (let index = 0; index < particleCount; index += 1) {
        fieldParticles.push({
          x: Math.random() * fieldWidth,
          y: Math.random() * fieldHeight,
          radius: (Math.random() * 1.25 + .45) * ratio,
          velocityX: (Math.random() - .5) * .13 * ratio,
          velocityY: (Math.random() - .5) * .13 * ratio,
          phase: Math.random() * Math.PI * 2
        });
      }
    }

    function drawAmbientField() {
      if (document.hidden) { if (!motionReduced) requestAnimationFrame(drawAmbientField); return; }
      fieldContext.clearRect(0, 0, fieldWidth, fieldHeight);
      const ratio = Math.min(window.devicePixelRatio || 1, 1.5);
      const glowX = fieldWidth * .56 + Math.sin(fieldFrame * .002) * fieldWidth * .12;
      const glowY = fieldHeight * .35;
      const aura = fieldContext.createRadialGradient(glowX, glowY, 0, glowX, glowY, Math.max(fieldWidth, fieldHeight) * .48);
      aura.addColorStop(0, 'rgba(0,230,118,.075)');
      aura.addColorStop(.48, 'rgba(0,230,118,.018)');
      aura.addColorStop(1, 'rgba(0,230,118,0)');
      fieldContext.fillStyle = aura;
      fieldContext.fillRect(0, 0, fieldWidth, fieldHeight);

      fieldParticles.forEach((particle, index) => {
        particle.x += particle.velocityX;
        particle.y += particle.velocityY;
        if (particle.x < -20 * ratio) particle.x = fieldWidth + 20 * ratio;
        if (particle.x > fieldWidth + 20 * ratio) particle.x = -20 * ratio;
        if (particle.y < -20 * ratio) particle.y = fieldHeight + 20 * ratio;
        if (particle.y > fieldHeight + 20 * ratio) particle.y = -20 * ratio;

        for (let next = index + 1; next < fieldParticles.length; next += 1) {
          const peer = fieldParticles[next];
          const distanceX = particle.x - peer.x;
          const distanceY = particle.y - peer.y;
          const distance = Math.hypot(distanceX, distanceY);
          const maxDistance = 156 * ratio;
          if (distance < maxDistance) {
            fieldContext.strokeStyle = 'rgba(78,255,154,' + ((1 - distance / maxDistance) * .075) + ')';
            fieldContext.lineWidth = .65 * ratio;
            fieldContext.beginPath();
            fieldContext.moveTo(particle.x, particle.y);
            fieldContext.lineTo(peer.x, peer.y);
            fieldContext.stroke();
          }
        }

        const pulse = .45 + Math.sin(fieldFrame * .025 + particle.phase) * .25;
        fieldContext.fillStyle = 'rgba(103,255,169,' + pulse + ')';
        fieldContext.beginPath();
        fieldContext.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        fieldContext.fill();
      });

      fieldFrame += 1;
      if (!motionReduced) requestAnimationFrame(drawAmbientField);
    }

    resizeAmbientField();
    drawAmbientField();
    window.addEventListener('resize', resizeAmbientField);
  }
  // ---- Session (anonymous, persisted locally so history survives refresh) ----
  function uuid() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }
  let sessionId = localStorage.getItem('hoodwise_session_id');
  if (!sessionId) {
    sessionId = uuid();
    localStorage.setItem('hoodwise_session_id', sessionId);
  }

  let currentConversationId = null;
  const conversationPathMatch = window.location.pathname.match(/^\/app\/c\/([a-f0-9-]{36})$/i);
  const initialConversationId = conversationPathMatch?.[1] || new URLSearchParams(window.location.search).get('c');

  // Keep conversations shareable with a clean, semantic route.
  // A legacy ?c= link is still restored, then immediately normalized.
  function syncConversationRoute(conversationId) {
    const url = conversationId ? '/app/c/' + encodeURIComponent(conversationId) : '/app';
    window.history.replaceState({}, '', url);
  }

  // ---- Theme ----
  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('hoodwise_theme', theme);
    const isDark = theme === 'dark';
    themeIconMoon.style.display = isDark ? 'block' : 'none';
    themeIconSun.style.display = isDark ? 'none' : 'block';
    themeLabel.textContent = isDark ? 'Dark mode' : 'Light mode';
  }
  applyTheme(localStorage.getItem('hoodwise_theme') || 'dark');
  themeToggle.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    setInteractionStatus(next === 'dark' ? 'Dark mode active.' : 'Light mode active.');
  });

  // ---- Sidebar collapse (mobile + manual) ----
  collapseBtn.addEventListener('click', () => {
    sidebar.classList.add('collapsed');
    setInteractionStatus('History panel collapsed.');
  });
  expandBtn.addEventListener('click', () => {
    sidebar.classList.remove('collapsed');
    setInteractionStatus('History panel expanded.');
  });
  if (window.innerWidth <= 780) sidebar.classList.add('collapsed');

  // ---- Rendering helpers ----
  function botAvatarSVG() {
    return `<svg viewBox="0 0 24 24"><path d="M4 17 L9 8 L13 13 L20 4" stroke="#00e676" stroke-width="2.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  }

  // Minimal, DOM-based Markdown renderer. It never injects model text as HTML:
  // only bold emphasis and list structure are interpreted, so replies remain safe.
  function appendInlineText(target, value) {
    const cleanValue = value
      .replace(/\[([^\]\n]+)\]\(https?:\/\/[^\s)]+\)/g, '$' + '1')
      .replace(/https?:\/\/[^\s)\]]+/g, 'the linked source');
    const parts = cleanValue.split(/(\*\*[^*]+\*\*)/g);
    parts.forEach(part => {
      const bold = part.match(/^\*\*(.+)\*\*$/);
      if (bold) {
        const strong = document.createElement('strong');
        strong.textContent = bold[1];
        target.appendChild(strong);
      } else {
        target.appendChild(document.createTextNode(part));
      }
    });
  }

  function renderMessageContent(target, text) {
    target.replaceChildren();
    const fragment = document.createDocumentFragment();
    let list = null;
    const flushList = () => {
      if (list) fragment.appendChild(list);
      list = null;
    };

    text.split('\n').forEach(line => {
      const item = line.match(/^\s*[-*]\s+(.+)$/);
      if (item) {
        if (!list) list = document.createElement('ul');
        const li = document.createElement('li');
        appendInlineText(li, item[1]);
        list.appendChild(li);
        return;
      }
      flushList();
      if (!line.trim()) {
        fragment.appendChild(document.createElement('div')).className = 'message-spacer';
        return;
      }
      const paragraph = document.createElement('p');
      appendInlineText(paragraph, line);
      fragment.appendChild(paragraph);
    });
    flushList();
    target.appendChild(fragment);
  }

  function appendBriefingMeta(bubble, brief) {
    if (!brief || !brief.evidence) return;
    const panel = document.createElement('section');
    panel.className = 'briefing-meta';
    panel.innerHTML = `<div class="briefing-meta-head"><span>BRIEFING SIGNAL</span><b>${brief.evidence}</b></div>`;
    if (brief.onchainScan) {
      const scan = brief.onchainScan;
      const card = document.createElement('section');
      card.className = 'token-intelligence-card';
      const title = document.createElement('div'); title.className = 'token-intelligence-head'; title.textContent = 'LIVE TOKEN INTELLIGENCE'; card.appendChild(title);
      const grid = document.createElement('div'); grid.className = 'token-intelligence-grid';
      const facts = [
        ['Status', scan.canonical ? 'Canonical asset' : scan.classification || 'Unknown'],
        ['Source code', scan.sourceCodeVerificationAvailable ? (scan.sourceCodeVerified ? 'Verified' : 'Not verified') : 'Unavailable'],
        ['Proxy', scan.proxyType || 'None detected'],
        ['Holders', scan.tokenActivity?.holders || 'Unavailable'],
        ['24h volume', scan.tokenActivity?.volume24h || 'Unavailable'],
        ['Market cap', scan.tokenActivity?.circulatingMarketCap || 'Unavailable']
      ];
      facts.forEach(([label, value]) => { const item = document.createElement('div'); const key = document.createElement('span'); key.textContent = label; const val = document.createElement('b'); val.textContent = value; item.append(key, val); grid.appendChild(item); });
      card.appendChild(grid);
      const poolTitle = document.createElement('div'); poolTitle.className = 'token-pool-title'; poolTitle.textContent = 'DEX POOLS'; card.appendChild(poolTitle);
      const pools = scan.dexPools || [];
      if (!pools.length) { const empty = document.createElement('p'); empty.className = 'token-pool-empty'; empty.textContent = 'No indexed Robinhood Chain pool found on DexScreener.'; card.appendChild(empty); }
      else { const poolList = document.createElement('div'); poolList.className = 'token-pool-list'; pools.forEach(pool => { const row = document.createElement('a'); row.href = pool.url; row.target = '_blank'; row.rel = 'noopener noreferrer'; row.textContent = `${pool.dex} · ${pool.baseSymbol || '?'} / ${pool.quoteSymbol || '?'} · Liquidity $${pool.liquidityUsd ?? '—'} · 24h vol $${pool.volume24h ?? '—'} ↗`; poolList.appendChild(row); }); card.appendChild(poolList); }
      const link = document.createElement('a'); link.href = scan.explorerUrl; link.target = '_blank'; link.rel = 'noopener noreferrer'; link.textContent = 'Open live explorer record ↗'; card.appendChild(link);
      panel.appendChild(card);
    }    if (brief.contracts && brief.contracts.length) {
      const contract = document.createElement('button');
      contract.className = 'briefing-contract';
      contract.type = 'button';
      contract.textContent = 'Canonical contract: ' + brief.contracts[0];
      contract.title = 'Copy canonical contract address';
      contract.addEventListener('click', () => navigator.clipboard?.writeText(brief.contracts[0]));
      panel.appendChild(contract);
    }
    if (brief.risks && brief.risks.length) {
      const risks = document.createElement('div');
      risks.className = 'briefing-risks';
      brief.risks.forEach(risk => { const tag = document.createElement('span'); tag.textContent = risk; risks.appendChild(tag); });
      panel.appendChild(risks);
    }
    const verify = document.createElement('p');
    verify.textContent = brief.verification;
    panel.appendChild(verify);
    bubble.appendChild(panel);
  }
  function addMessage(role, text, sources, brief) {
    const row = document.createElement('div');
    row.className = 'row ' + (role === 'user' ? 'user' : 'bot');
    if (role !== 'user') {
      const av = document.createElement('div');
      av.className = 'avatar';
      av.innerHTML = botAvatarSVG();
      row.appendChild(av);
    }
    const bubble = document.createElement('div');
    bubble.className = 'bubble';
    const messageContent = document.createElement('div');
    messageContent.className = 'message-content';
    renderMessageContent(messageContent, text);
    bubble.appendChild(messageContent);

    if (sources && sources.length) {
      const srcWrap = document.createElement('div');
      srcWrap.className = 'sources';
      sources.forEach(s => {
        const a = document.createElement('a');
        a.className = 'source-chip';
        a.href = s.url;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        a.innerHTML = `<svg width="10" height="10" viewBox="0 0 24 24"><path d="M7 17L17 7M17 7H8M17 7V16" stroke="currentColor" stroke-width="2.2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg> ${s.title}`;
        srcWrap.appendChild(a);
      });
      bubble.appendChild(document.createElement('br'));
      bubble.appendChild(srcWrap);
    }

    if (role !== 'user') appendBriefingMeta(bubble, brief);
    row.appendChild(bubble);
    if (role !== 'user' && text) {
      const copyBtn = document.createElement('button');
      copyBtn.className = 'copy-btn';
      copyBtn.title = 'Copy answer';
      copyBtn.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24"><rect x="9" y="9" width="12" height="12" rx="2" stroke="currentColor" stroke-width="2" fill="none"/><path d="M5 15V5a2 2 0 0 1 2-2h10" stroke="currentColor" stroke-width="2" fill="none"/></svg>`;
      copyBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(text).then(() => {
          copyBtn.classList.add('copied');
          setTimeout(() => copyBtn.classList.remove('copied'), 1400);
        });
      });
      bubble.appendChild(copyBtn);
    }
    messagesEl.appendChild(row);
    messagesEl.scrollTop = messagesEl.scrollHeight;
    return bubble;
  }

  function addThinking(label = 'Preparing a clear answer...') {
    const row = document.createElement('div');
    row.className = 'row bot';
    row.id = 'thinkingRow';
    const av = document.createElement('div');
    av.className = 'avatar';
    av.innerHTML = botAvatarSVG();
    row.appendChild(av);
    const wrap = document.createElement('div');
    wrap.className = 'bubble thinking';
    wrap.innerHTML = `
      <svg viewBox="0 0 48 18"><path d="M0,9 L11,9 L15,3 L20,15 L25,3 L30,9 L48,9"/></svg>
      <span class="thinking-label">${label}</span>
    `;
    row.appendChild(wrap);
    messagesEl.appendChild(row);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }
  function updateThinking(label) {
    const labelEl = document.querySelector('#thinkingRow .thinking-label');
    if (labelEl) labelEl.textContent = label;
  }
  function removeThinking() {
    const el = document.getElementById('thinkingRow');
    if (el) el.remove();
  }

  function addRetryMessage(message, retryText) {
    const bubble = addMessage('bot', message);
    const retry = document.createElement('button');
    retry.className = 'retry-btn';
    retry.type = 'button';
    retry.textContent = 'Try again';
    retry.addEventListener('click', () => sendMessage(retryText));
    bubble.appendChild(retry);
  }

  function getFollowUpPrompts(question) {
    const value = question.toLowerCase();
    if (/meme|noxa|launchpad|token/.test(value)) return [
      ['Research launchpads', 'Research Robinhood Chain launchpads and explain what is confirmed versus community-operated.'],
      ['Verify a contract', 'How do I verify a token contract on Robinhood Chain?'],
      ['Explain red flags', 'What token and liquidity red flags should I check first?']
    ];
    if (/stock|nvda|aapl|amd|tsla|qqq|spy/.test(value)) return [
      ['Check an official contract', 'Show me how to verify a canonical Robinhood Stock Token contract.'],
      ['Explain legal structure', 'What rights do Robinhood Stock Tokens provide and not provide?'],
      ['Compare to shares', 'How are Robinhood Stock Tokens different from holding the underlying stock?']
    ];
    if (/bridge|deposit|withdraw/.test(value)) return [
      ['Compare routes', 'Compare the canonical bridge, LayerZero, and CCIP by trust model and timing.'],
      ['Bridge safety', 'What should I verify before bridging assets to Robinhood Chain?'],
      ['Developer setup', 'How do I add Robinhood Chain to a developer wallet or project?']
    ];
    return [
      ['Latest official update', 'What is the latest official Robinhood Chain update?'],
      ['Explore the ecosystem', 'What are the main products and ecosystem categories on Robinhood Chain?'],
      ['Verify a contract', 'How do I verify a contract on Robinhood Chain?']
    ];
  }

  function showFollowUps(question) {
    const prompts = getFollowUpPrompts(question);
    chipsEl.replaceChildren();
    const label = document.createElement('span');
    label.className = 'followup-label';
    label.textContent = 'EXPLORE NEXT';
    chipsEl.appendChild(label);
    prompts.forEach(([labelText, prompt]) => {
      const chip = document.createElement('button');
      chip.className = 'chip';
      chip.type = 'button';
      chip.dataset.q = prompt;
      chip.textContent = labelText;
      chipsEl.appendChild(chip);
    });
    chipsEl.style.display = 'flex';
  }

  function showWelcome() {
    messagesEl.innerHTML = `
      <section class="welcome-brief" aria-label="Hoodwise starter briefing">
        <div class="welcome-eyebrow"><span></span> YOUR PRIVATE CHAIN BRIEFING</div>
        <h1>Start with the signal,<br><em>not the noise.</em></h1>
        <p>Ask a direct question, or use one of the briefing lanes below. Hoodwise stays focused on Robinhood Chain and always keeps risk in view.</p>
        <div class="welcome-lanes"><button type="button" data-welcome-question="What are Stock Tokens and Robinhood Earn, in simple terms?"><b>01</b><span>Products<br><small>Stock Tokens · Earn</small></span><i>↗</i></button><button type="button" data-welcome-question="Explain the Robinhood Chain infrastructure: Orbit, Chainlink, and DeFi."><b>02</b><span>Infrastructure<br><small>Orbit · Chainlink · DeFi</small></span><i>↗</i></button><button type="button" data-welcome-question="What should I know about the Robinhood Chain ecosystem, memecoins, and risk?"><b>03</b><span>Ecosystem<br><small>Agents · memecoins · risk</small></span><i>↗</i></button></div>
      <div class="contract-verifier"><label for="contractAddress">VERIFY A CONTRACT</label><div><input id="contractAddress" placeholder="Paste a 0x address" maxlength="42"><button id="verifyContractBtn" type="button">Verify</button></div><p id="contractResult">Read-only onchain check · Chain ID 4663</p></div></section>`;
    const welcomeBubble = addMessage('bot', "I’m Hoodwise. Ask anything about Robinhood Chain — I’ll separate the structural facts, the current context, and the risks that matter.");
    welcomeBubble.closest('.row').dataset.welcomeMessage = 'true';
    chipsEl.style.display = 'flex';
    document.querySelectorAll('[data-welcome-question]').forEach(button => {
      button.addEventListener('click', () => sendMessage(button.dataset.welcomeQuestion));
    });
    const verifyButton = document.getElementById('verifyContractBtn');
    const verifyInput = document.getElementById('contractAddress');
    const verifyResult = document.getElementById('contractResult');
    verifyButton?.addEventListener('click', async () => {
      verifyResult.textContent = 'Checking Robinhood Chain...';
      try {
        const response = await fetch('/api/contracts/verify', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sessionId, address: verifyInput.value.trim() }) });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error);
        const status = data.canonical ? '<b>Canonical ' + data.canonical.symbol + '</b> · ' + data.canonical.type : (data.isContract ? '<b>Contract found</b> · community or unverified' : '<b>Not a contract</b>');
        const meta = data.metadata || {};
        const fields = [meta.name && 'Name: ' + meta.name, meta.symbol && 'Symbol: ' + meta.symbol, Number.isInteger(meta.decimals) && 'Decimals: ' + meta.decimals, data.isContract && 'Bytecode: ' + data.bytecodeBytes + ' bytes', meta.owner && 'Owner: ' + meta.owner.slice(0, 8) + '…' + meta.owner.slice(-6)].filter(Boolean);
        verifyResult.innerHTML = status + (fields.length ? '<br><span>' + fields.join(' · ') + '</span>' : '') + '<br><a href=\'' + data.explorerUrl + '\' target=\'_blank\' rel=\'noopener noreferrer\'>View in explorer ↗</a>';
      } catch (error) { verifyResult.textContent = error.message || 'Could not verify this address.'; }
    });
  }

  // ---- History sidebar ----
  async function loadHistoryList() {
    try {
      const res = await fetch(`/api/conversations?sessionId=${sessionId}`);
      const data = await res.json();
      historyList.innerHTML = '';
      if (!data.conversations || !data.conversations.length) {
        historyList.innerHTML = '<div class="history-empty">No chats yet</div>';
        return;
      }
      data.conversations.forEach(c => {
        const item = document.createElement('div');
        item.className = 'history-item' + (c.id === currentConversationId ? ' active' : '');
        item.innerHTML = `<span class="title">${escapeHTML(c.title)}</span><button class="delete-btn" title="Delete">✕</button>`;
        const historyTitle = item.querySelector('.title');
        historyTitle.setAttribute('role', 'button');
        historyTitle.setAttribute('tabindex', '0');
        historyTitle.setAttribute('aria-label', 'Open conversation: ' + c.title);
        historyTitle.addEventListener('click', () => openConversation(c.id));
        historyTitle.addEventListener('keydown', event => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            openConversation(c.id);
          }
        });
        item.querySelector('.delete-btn').addEventListener('click', async (e) => {
          e.stopPropagation();
          await fetch(`/api/conversations/${c.id}?sessionId=${sessionId}`, { method: 'DELETE' });
          if (c.id === currentConversationId) startNewChat();
          loadHistoryList();
        });
        historyList.appendChild(item);
      });
    } catch (e) {
      console.error('Failed to load history', e);
    }
  }

  function escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  async function openConversation(id) {
    try {
      const res = await fetch(`/api/conversations/${id}/messages?sessionId=${sessionId}`);
      if (!res.ok) {
        if (new URLSearchParams(window.location.search).get('c') === id) syncConversationRoute(null);
        return;
      }
      const data = await res.json();
      currentConversationId = id;
      syncConversationRoute(id);
      conversationTitleEl.textContent = data.conversation.title;
      messagesEl.innerHTML = '';
      chipsEl.style.display = 'none';
      data.messages.forEach(m => addMessage(m.role, m.content, m.sources, m.brief));
      loadHistoryList();
      if (window.innerWidth <= 780) sidebar.classList.add('collapsed');
    } catch (e) {
      console.error('Failed to open conversation', e);
    }
  }

  function startNewChat() {
    currentConversationId = null;
    syncConversationRoute(null);
    conversationTitleEl.textContent = 'New chat';
    inputEl.value = '';
    inputEl.style.height = 'auto';
    updateComposerState();
    showWelcome();
    loadHistoryList();
  }
  newChatBtn.addEventListener('click', startNewChat);

  // ---- Sending messages ----
  function addStreamingBotRow() {
    const row = document.createElement('div');
    row.className = 'row bot';
    const av = document.createElement('div');
    av.className = 'avatar';
    av.innerHTML = botAvatarSVG();
    row.appendChild(av);
    const bubble = document.createElement('div');
    bubble.className = 'bubble streaming-bubble';
    const messageContent = document.createElement('div');
    messageContent.className = 'message-content';
    bubble.appendChild(messageContent);
    row.appendChild(bubble);
    messagesEl.appendChild(row);
    messagesEl.scrollTop = messagesEl.scrollHeight;

    let fullText = '';
    return {
      appendText(chunk) {
        fullText += chunk;
        renderMessageContent(messageContent, fullText);
        messagesEl.scrollTop = messagesEl.scrollHeight;
      },
      finalize(sources, brief, partial = false) {
        bubble.classList.remove('streaming-bubble');
        if (sources && sources.length) {
          const srcWrap = document.createElement('div');
          srcWrap.className = 'sources';
          sources.forEach(s => {
            const a = document.createElement('a');
            a.className = 'source-chip';
            a.href = s.url;
            a.target = '_blank';
            a.rel = 'noopener noreferrer';
            a.innerHTML = `<svg width="10" height="10" viewBox="0 0 24 24"><path d="M7 17L17 7M17 7H8M17 7V16" stroke="currentColor" stroke-width="2.2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg> ${s.title}`;
            srcWrap.appendChild(a);
          });
          bubble.appendChild(document.createElement('br'));
          bubble.appendChild(srcWrap);
        }
        appendBriefingMeta(bubble, brief);
        if (partial) {
          const note = document.createElement('p');
          note.className = 'completion-note';
          note.textContent = 'This briefing ended early. You can rerun the question for a fresh complete pass.';
          bubble.appendChild(note);
        }
        if (fullText) {
          const copyBtn = document.createElement('button');
          copyBtn.className = 'copy-btn';
          copyBtn.title = 'Copy answer';
          copyBtn.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24"><rect x="9" y="9" width="12" height="12" rx="2" stroke="currentColor" stroke-width="2" fill="none"/><path d="M5 15V5a2 2 0 0 1 2-2h10" stroke="currentColor" stroke-width="2" fill="none"/></svg>`;
          copyBtn.addEventListener('click', () => {
            navigator.clipboard.writeText(fullText).then(() => {
              copyBtn.classList.add('copied');
              setTimeout(() => copyBtn.classList.remove('copied'), 1400);
            });
          });
          bubble.appendChild(copyBtn);
        }
        return fullText;
      },
      row
    };
  }

  /** Parses Server-Sent Events out of a fetch ReadableStream. Calls
   *  onEvent({event, data}) for each complete "event: X\ndata: Y" block as
   *  it arrives — events can span multiple chunks, so this buffers text
   *  across reads and only processes complete blocks (split on the blank
   *  line that terminates each SSE event). */
  async function readSSE(response, onEvent) {
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const blocks = buffer.split('\n\n');
      buffer = blocks.pop();
      for (const block of blocks) {
        const lines = block.split('\n');
        let eventName = 'message';
        let dataStr = '';
        for (const line of lines) {
          if (line.startsWith('event:')) eventName = line.slice(6).trim();
          else if (line.startsWith('data:')) dataStr += line.slice(5).trim();
        }
        if (!dataStr) continue;
        try {
          onEvent({ event: eventName, data: JSON.parse(dataStr) });
        } catch {
          // ignore a malformed/partial event rather than breaking the stream
        }
      }
    }
  }

  async function sendMessage(text) {
    if (!text.trim() || isSending) return;
    if (!currentConversationId) {
      messagesEl.querySelector('.welcome-brief')?.remove();
      messagesEl.querySelector('[data-welcome-message]')?.remove();
    }
    chipsEl.style.display = 'none';
    addMessage('user', text);
    inputEl.value = '';
    inputEl.style.height = 'auto';
    isSending = true;
    sendBtn.classList.add('is-loading');
    sendBtn.setAttribute('aria-busy', 'true');
    updateComposerState();
    const researchLikely = /\b(latest|today|current|trending|meme|token|launchpad|liquidity|contract|price|volume|holders)\b/i.test(text);
    setInteractionStatus(researchLikely ? 'Hoodwise is checking current evidence.' : 'Hoodwise is preparing a clear answer.');
    addThinking(researchLikely ? 'Checking current evidence...' : 'Mapping the answer...');
    const thinkingTimers = [
      window.setTimeout(() => updateThinking(researchLikely ? 'Weighting sources and live signals...' : 'Turning the mechanics into a clear answer...'), 1600),
      window.setTimeout(() => updateThinking('Finalizing the briefing...'), 4800)
    ];

    try {
      const payload = { sessionId, message: text };
      if (currentConversationId) payload.conversationId = currentConversationId;

      const res = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const contentType = res.headers.get('content-type') || '';
      if (!res.ok || !contentType.includes('text/event-stream')) {
        removeThinking();
        let errMsg = 'Something went wrong. Please try again.';
        try { errMsg = (await res.json()).error || errMsg; } catch { /* keep default */ }
        addRetryMessage(errMsg, text);
        return;
      }

      let streamBot = null;
      let sawError = false;

      await readSSE(res, ({ event, data }) => {
        if (event === 'start') {
          currentConversationId = data.conversationId;
          syncConversationRoute(currentConversationId);
        } else if (event === 'token') {
          if (!streamBot) {
            removeThinking();
            setInteractionStatus('Briefing is streaming.');
            streamBot = addStreamingBotRow();
          }
          streamBot.appendText(data.text);
        } else if (event === 'done') {
          currentConversationId = data.conversationId;
          syncConversationRoute(currentConversationId);
          if (streamBot) streamBot.finalize(data.sources, data.brief, Boolean(data.partial));
          if (conversationTitleEl.textContent === 'New chat') {
            conversationTitleEl.textContent = text.length > 48 ? text.slice(0, 48) + '…' : text;
          }
          showFollowUps(text);
          setInteractionStatus('Briefing ready. Sources and next steps attached.');
          loadHistoryList();
        } else if (event === 'error') {
          sawError = true;
          removeThinking();
          if (streamBot) streamBot.finalize([]);
          addRetryMessage(data.error || 'Something went wrong. Please try again.', text);
        }
      });

      if (!streamBot && !sawError) {
        // Stream ended with no tokens and no explicit error — fail safe.
        removeThinking();
        addRetryMessage("Sorry, I couldn't generate a response — try asking again.", text);
      }
    } catch (err) {
      removeThinking();
      addRetryMessage('Could not reach the server. Please check your connection and try again.', text);
      console.error(err);
    } finally {
      thinkingTimers.forEach(timer => window.clearTimeout(timer));
      isSending = false;
      sendBtn.classList.remove('is-loading');
      sendBtn.removeAttribute('aria-busy');
      updateComposerState();
      inputEl.focus();
    }
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    sendMessage(inputEl.value);
  });
  inputEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(inputEl.value);
    }
  });
  inputEl.addEventListener('input', () => {
    inputEl.style.height = 'auto';
    inputEl.style.height = Math.min(inputEl.scrollHeight, 140) + 'px';
    updateComposerState();
  });
  chipsEl.addEventListener('click', event => {
    const chip = event.target.closest('.chip');
    if (chip) sendMessage(chip.dataset.q);
  });

  document.addEventListener('keydown', event => {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      inputEl.focus();
      setInteractionStatus('Composer focused.');
    }
    if (event.key === 'Escape' && window.innerWidth <= 780) sidebar.classList.add('collapsed');
  });

  // ---- Smooth page transition back to landing ----
  const pageTransition = document.getElementById('pageTransition');
  if (pageTransition) {
    document.querySelectorAll('[data-transition]').forEach(link => {
      link.addEventListener('click', (e) => {
        const href = link.getAttribute('href');
        if (!href) return;
        e.preventDefault();
        pageTransition.classList.add('hw-transition-active');
        setTimeout(() => { window.location.href = href; }, 380);
      });
    });
  }

  // ---- Init ----
  const landingQuestion = new URLSearchParams(window.location.search).get('q');
  if (landingQuestion && !initialConversationId) {
    inputEl.value = landingQuestion;
    window.history.replaceState({}, '', '/app');
  }
  updateComposerState();
  showWelcome();
  loadHistoryList().then(() => {
    if (initialConversationId) openConversation(initialConversationId);
  });
})();
