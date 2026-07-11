(function () {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isTouch = window.matchMedia('(pointer: coarse)').matches;
  if (reduceMotion || isTouch) return; // never fight touch input or reduced-motion preference

  document.documentElement.classList.add('hw-custom-cursor');

  const dot = document.createElement('div');
  const ring = document.createElement('div');
  dot.className = 'hw-cursor-dot';
  ring.className = 'hw-cursor-ring';
  document.body.appendChild(dot);
  document.body.appendChild(ring);

  let mouseX = -100, mouseY = -100;
  let ringX = -100, ringY = -100;

  window.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    dot.style.transform = `translate(${mouseX}px, ${mouseY}px)`;
  });

  function loop() {
    ringX += (mouseX - ringX) * 0.18;
    ringY += (mouseY - ringY) * 0.18;
    ring.style.transform = `translate(${ringX}px, ${ringY}px)`;
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

  const interactiveSelector = 'a, button, .chip, .history-item, input, textarea, [role="button"]';
  document.addEventListener('mouseover', (e) => {
    if (e.target.closest(interactiveSelector)) {
      ring.classList.add('hw-cursor-hover');
    }
  });
  document.addEventListener('mouseout', (e) => {
    if (e.target.closest(interactiveSelector)) {
      ring.classList.remove('hw-cursor-hover');
    }
  });
  document.addEventListener('mousedown', () => ring.classList.add('hw-cursor-down'));
  document.addEventListener('mouseup', () => ring.classList.remove('hw-cursor-down'));
})();
