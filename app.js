const observer = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('visible');
      observer.unobserve(e.target);
    }
  });
}, { threshold: 0.1 });

document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

// ── LIGHTBOX ──
(function () {
  const lb = document.getElementById('lightbox');
  const lbImg = document.getElementById('lightbox-img');
  const lbClose = document.getElementById('lightbox-close');
  const lbZoomIn = document.getElementById('lb-zoom-in');
  const lbZoomOut = document.getElementById('lb-zoom-out');
  const lbReset = document.getElementById('lb-reset');
  const lbLabel = document.getElementById('lb-zoom-label');

  let scale = 1;
  let panX = 0, panY = 0;
  let dragging = false;
  let startX, startY, startPanX, startPanY;

  const STEP = 0.25;
  const MIN = 0.5;
  const MAX = 5;

  function applyTransform() {
    lbImg.style.transform = `translate(${panX}px, ${panY}px) scale(${scale})`;
    lbLabel.textContent = Math.round(scale * 100) + '%';
  }

  function resetView() {
    scale = 1; panX = 0; panY = 0;
    applyTransform();
  }

  function open(src, alt) {
    lbImg.src = src;
    lbImg.alt = alt;
    resetView();
    lb.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function close() {
    lb.classList.remove('open');
    document.body.style.overflow = '';
  }

  // Trigger on any .lightbox-trigger img
  document.querySelectorAll('img.lightbox-trigger').forEach(img => {
    img.addEventListener('click', () => open(img.src, img.alt));
  });

  lbClose.addEventListener('click', close);
  lb.addEventListener('click', e => { if (e.target === lb) close(); });

  document.addEventListener('keydown', e => {
    if (!lb.classList.contains('open')) return;
    if (e.key === 'Escape') close();
    if (e.key === '+' || e.key === '=') { scale = Math.min(MAX, scale + STEP); applyTransform(); }
    if (e.key === '-') { scale = Math.max(MIN, scale - STEP); applyTransform(); }
    if (e.key === '0') resetView();
  });

  lbZoomIn.addEventListener('click', () => { scale = Math.min(MAX, scale + STEP); applyTransform(); });
  lbZoomOut.addEventListener('click', () => { scale = Math.max(MIN, scale - STEP); applyTransform(); });
  lbReset.addEventListener('click', resetView);

  // Mouse wheel zoom
  lbImg.addEventListener('wheel', e => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? STEP : -STEP;
    scale = Math.min(MAX, Math.max(MIN, scale + delta));
    applyTransform();
  }, { passive: false });

  // Drag to pan
  lbImg.addEventListener('mousedown', e => {
    if (scale <= 1) return;
    dragging = true;
    startX = e.clientX; startY = e.clientY;
    startPanX = panX; startPanY = panY;
    lbImg.classList.add('grabbing');
  });

  document.addEventListener('mousemove', e => {
    if (!dragging) return;
    panX = startPanX + (e.clientX - startX);
    panY = startPanY + (e.clientY - startY);
    applyTransform();
  });

  document.addEventListener('mouseup', () => {
    dragging = false;
    lbImg.classList.remove('grabbing');
  });

  // Touch pinch-to-zoom + pan
  let lastDist = null;
  let touchStartPanX, touchStartPanY, touchStartMidX, touchStartMidY;

  lbImg.addEventListener('touchstart', e => {
    if (e.touches.length === 2) {
      lastDist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
    } else if (e.touches.length === 1) {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      startPanX = panX; startPanY = panY;
    }
  }, { passive: true });

  lbImg.addEventListener('touchmove', e => {
    e.preventDefault();
    if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      if (lastDist) {
        const ratio = dist / lastDist;
        scale = Math.min(MAX, Math.max(MIN, scale * ratio));
        applyTransform();
      }
      lastDist = dist;
    } else if (e.touches.length === 1 && scale > 1) {
      panX = startPanX + (e.touches[0].clientX - startX);
      panY = startPanY + (e.touches[0].clientY - startY);
      applyTransform();
    }
  }, { passive: false });

  lbImg.addEventListener('touchend', () => { lastDist = null; });
})();