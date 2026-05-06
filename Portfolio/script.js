/* ============================================
   Ofulue Joshua Portfolio — script.js
   Three.js 3D scenes + interactions
   ============================================ */

/* ---- CURSOR ---- */
const cursor    = document.getElementById('cursor');
const cursorDot = document.getElementById('cursor-dot');
let mx = 0, my = 0, cx = 0, cy = 0;

document.addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; });

(function animCursor() {
  cx += (mx - cx) * 0.12;
  cy += (my - cy) * 0.12;
  cursor.style.left    = cx + 'px';
  cursor.style.top     = cy + 'px';
  cursorDot.style.left = mx + 'px';
  cursorDot.style.top  = my + 'px';
  requestAnimationFrame(animCursor);
})();

document.querySelectorAll('a, button').forEach(el => {
  el.addEventListener('mouseenter', () => cursor.classList.add('hovered'));
  el.addEventListener('mouseleave', () => cursor.classList.remove('hovered'));
});

/* ---- NAV SCROLL ---- */
const nav = document.getElementById('nav');
window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 40);
});

/* ---- MOBILE MENU ---- */
const hamburger   = document.getElementById('hamburger');
const mobileMenu  = document.getElementById('mobile-menu');
const mobileClose = document.getElementById('mobile-close');

hamburger.addEventListener('click', () => mobileMenu.classList.add('open'));
mobileClose.addEventListener('click', () => mobileMenu.classList.remove('open'));
document.querySelectorAll('.mobile-link').forEach(l => {
  l.addEventListener('click', () => mobileMenu.classList.remove('open'));
});

/* ---- THEME TOGGLE ---- */
const themeToggle = document.getElementById('theme-toggle');
const html = document.documentElement;

// Restore saved theme
const savedTheme = localStorage.getItem('portfolio-theme') || 'light';
html.setAttribute('data-theme', savedTheme);

themeToggle.addEventListener('click', () => {
  const isDark = html.getAttribute('data-theme') === 'dark';
  const next = isDark ? 'light' : 'dark';
  html.setAttribute('data-theme', next);
  localStorage.setItem('portfolio-theme', next);
});

/* ---- REVEAL ON SCROLL ---- */
const revealObs = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('visible'); revealObs.unobserve(e.target); }
  });
}, { threshold: 0.12 });
document.querySelectorAll('.reveal').forEach(el => revealObs.observe(el));

/* ---- THREE.JS HELPER ---- */
function makeScene(canvas, width, height) {
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(width, height);

  const scene  = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 100);
  camera.position.z = 4;

  return { renderer, scene, camera };
}

/* ============================================================
   HERO CANVAS — floating warm particle field
   ============================================================ */
(function heroScene() {
  const canvas = document.getElementById('hero-canvas');
  const W = canvas.parentElement.offsetWidth;
  const H = canvas.parentElement.offsetHeight;

  const { renderer, scene, camera } = makeScene(canvas, W, H);
  renderer.setClearColor(0x000000, 0);

  // Ambient + directional warm light
  scene.add(new THREE.AmbientLight(0xfaf5ee, 0.6));
  const dLight = new THREE.DirectionalLight(0xc2652a, 1.4);
  dLight.position.set(3, 5, 5);
  scene.add(dLight);
  const dLight2 = new THREE.DirectionalLight(0x8c3c3c, 0.6);
  dLight2.position.set(-4, -2, 3);
  scene.add(dLight2);

  // Large hero geometry — torus knot
  const heroGeo = new THREE.TorusKnotGeometry(1.1, 0.35, 128, 32, 2, 3);
  const heroMat = new THREE.MeshPhongMaterial({
    color: 0xc2652a, shininess: 80,
    transparent: true, opacity: 0.18,
    wireframe: false
  });
  const heroMesh = new THREE.Mesh(heroGeo, heroMat);
  heroMesh.position.set(5, 0, -2);
  scene.add(heroMesh);

  // Wireframe overlay
  const wireMat = new THREE.MeshBasicMaterial({
    color: 0xc2652a, wireframe: true, transparent: true, opacity: 0.12
  });
  const wireMesh = new THREE.Mesh(heroGeo, wireMat);
  wireMesh.position.copy(heroMesh.position);
  scene.add(wireMesh);

  // Floating particles
  const particleCount = 120;
  const positions = new Float32Array(particleCount * 3);
  for (let i = 0; i < particleCount; i++) {
    positions[i * 3]     = (Math.random() - 0.5) * 20;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 12;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 8 - 2;
  }
  const pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const pMat = new THREE.PointsMaterial({ color: 0xc2652a, size: 0.04, transparent: true, opacity: 0.5 });
  scene.add(new THREE.Points(pGeo, pMat));

  // Small orbiting spheres
  const orbs = [];
  const orbData = [
    { r: 0.12, pos: [3.5, 1.5, 0], col: 0x8c3c3c },
    { r: 0.07, pos: [6.5, -1, 1],  col: 0xc2652a },
    { r: 0.09, pos: [4.5, -2, -1], col: 0x78706a },
  ];
  orbData.forEach(d => {
    const m = new THREE.Mesh(
      new THREE.SphereGeometry(d.r, 16, 16),
      new THREE.MeshPhongMaterial({ color: d.col, transparent: true, opacity: 0.7 })
    );
    m.position.set(...d.pos);
    m._ox = d.pos[0]; m._oy = d.pos[1]; m._phase = Math.random() * Math.PI * 2;
    scene.add(m); orbs.push(m);
  });

  // Mouse parallax
  let mouseX = 0, mouseY = 0;
  window.addEventListener('mousemove', e => {
    mouseX = (e.clientX / window.innerWidth  - 0.5) * 2;
    mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
  });

  let t = 0;
  (function animate() {
    requestAnimationFrame(animate);
    t += 0.008;
    heroMesh.rotation.x = t * 0.3;
    heroMesh.rotation.y = t * 0.5;
    wireMesh.rotation.copy(heroMesh.rotation);

    orbs.forEach((o, i) => {
      o.position.x = o._ox + Math.sin(t + o._phase) * 0.4;
      o.position.y = o._oy + Math.cos(t * 0.7 + o._phase) * 0.3;
    });

    camera.position.x += (mouseX * 0.6 - camera.position.x) * 0.04;
    camera.position.y += (-mouseY * 0.4 - camera.position.y) * 0.04;
    camera.lookAt(scene.position);

    renderer.render(scene, camera);
  })();

  window.addEventListener('resize', () => {
    const W2 = canvas.parentElement.offsetWidth;
    const H2 = canvas.parentElement.offsetHeight;
    renderer.setSize(W2, H2);
    camera.aspect = W2 / H2;
    camera.updateProjectionMatrix();
  });
})();

/* ============================================================
   PROJECT CARD CANVASES — each card gets a mini 3D scene
   ============================================================ */
function makeCardScene(canvasId, geometry, color, wireColor) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const parent = canvas.parentElement;
  const W = parent.offsetWidth || 400;
  const H = parent.offsetHeight || 320;

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(W, H);

  const scene  = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(55, W / H, 0.1, 100);
  camera.position.z = 3.5;

  scene.add(new THREE.AmbientLight(0xfaf5ee, 0.5));
  const dl = new THREE.DirectionalLight(color, 1.8);
  dl.position.set(3, 4, 5); scene.add(dl);
  const dl2 = new THREE.DirectionalLight(0x8c3c3c, 0.5);
  dl2.position.set(-3, -2, 2); scene.add(dl2);

  const mat  = new THREE.MeshPhongMaterial({ color, shininess: 60, transparent: true, opacity: 0.25 });
  const wmat = new THREE.MeshBasicMaterial({ color: wireColor || color, wireframe: true, transparent: true, opacity: 0.15 });
  const mesh  = new THREE.Mesh(geometry, mat);
  const wire  = new THREE.Mesh(geometry, wmat);
  scene.add(mesh); scene.add(wire);

  // Particles
  const pPos = new Float32Array(60 * 3);
  for (let i = 0; i < 60; i++) {
    pPos[i*3]   = (Math.random()-0.5)*8;
    pPos[i*3+1] = (Math.random()-0.5)*6;
    pPos[i*3+2] = (Math.random()-0.5)*4 - 1;
  }
  const pg = new THREE.BufferGeometry();
  pg.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
  scene.add(new THREE.Points(pg, new THREE.PointsMaterial({ color, size: 0.035, transparent: true, opacity: 0.4 })));

  // Hover tilt
  let hoverX = 0, hoverY = 0;
  parent.addEventListener('mousemove', e => {
    const rect = parent.getBoundingClientRect();
    hoverX = ((e.clientX - rect.left) / rect.width  - 0.5) * 2;
    hoverY = ((e.clientY - rect.top)  / rect.height - 0.5) * 2;
  });
  parent.addEventListener('mouseleave', () => { hoverX = 0; hoverY = 0; });

  let ti = 0;
  (function anim() {
    requestAnimationFrame(anim);
    ti += 0.01;
    mesh.rotation.y = ti * 0.4 + hoverX * 0.3;
    mesh.rotation.x = ti * 0.2 - hoverY * 0.2;
    wire.rotation.copy(mesh.rotation);
    renderer.render(scene, camera);
  })();

  const ro = new ResizeObserver(() => {
    const W2 = parent.offsetWidth; const H2 = parent.offsetHeight;
    if (W2 && H2) { renderer.setSize(W2, H2); camera.aspect = W2/H2; camera.updateProjectionMatrix(); }
  });
  ro.observe(parent);
}

// Desert Pavilion — octahedron (geometric/architectural feel)
makeCardScene(
  'canvas-desert',
  new THREE.OctahedronGeometry(1.1, 1),
  0xc2652a, 0xe08850
);

// Ceramic Forms — lathe / sphere (organic form)
makeCardScene(
  'canvas-ceramic',
  new THREE.SphereGeometry(1.0, 32, 32),
  0x8c3c3c, 0xd47070
);

// Aura Smart Speaker — torus (circular elegance)
makeCardScene(
  'canvas-aura',
  new THREE.TorusGeometry(0.9, 0.38, 24, 60),
  0x78706a, 0x9a9088
);

/* ============================================================
   ABOUT CANVAS — rotating icosahedron
   ============================================================ */
(function aboutScene() {
  const canvas = document.getElementById('about-canvas');
  if (!canvas) return;
  const parent = canvas.parentElement;
  const W = parent.offsetWidth || 300;
  const H = parent.offsetHeight || 300;

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(W, H);

  const scene  = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(50, W / H, 0.1, 100);
  camera.position.z = 3;

  scene.add(new THREE.AmbientLight(0xfaf5ee, 0.4));
  const dl = new THREE.DirectionalLight(0xc2652a, 1.6);
  dl.position.set(4, 5, 5); scene.add(dl);
  const dl2 = new THREE.DirectionalLight(0x8c3c3c, 0.7);
  dl2.position.set(-3, -3, 3); scene.add(dl2);

  const geo  = new THREE.IcosahedronGeometry(1.0, 1);
  const mat  = new THREE.MeshPhongMaterial({ color: 0xc2652a, shininess: 90, transparent: true, opacity: 0.3 });
  const wmat = new THREE.MeshBasicMaterial({ color: 0xc2652a, wireframe: true, transparent: true, opacity: 0.18 });
  const mesh = new THREE.Mesh(geo, mat);
  const wire = new THREE.Mesh(geo, wmat);
  scene.add(mesh); scene.add(wire);

  let ta = 0;
  (function anim() {
    requestAnimationFrame(anim);
    ta += 0.008;
    mesh.rotation.x = ta * 0.4;
    mesh.rotation.y = ta * 0.6;
    wire.rotation.copy(mesh.rotation);
    renderer.render(scene, camera);
  })();

  const ro = new ResizeObserver(() => {
    const W2 = parent.offsetWidth; const H2 = parent.offsetHeight;
    if (W2 && H2) { renderer.setSize(W2, H2); camera.aspect = W2/H2; camera.updateProjectionMatrix(); }
  });
  ro.observe(parent);
})();

/* ---- CONTACT FORM ---- */
document.getElementById('contact-form').addEventListener('submit', function(e) {
  e.preventDefault();
  const btn = document.getElementById('btn-send');
  btn.textContent = 'Message Sent ✓';
  btn.style.background = '#5a8a4a';
  setTimeout(() => {
    btn.textContent = 'Send Message';
    btn.style.background = '';
    this.reset();
  }, 3000);
});

/* ---- STAGGER REVEALS ---- */
window.addEventListener('load', () => {
  document.querySelectorAll('.reveal').forEach((el, i) => {
    el.style.transitionDelay = (i % 4) * 0.08 + 's';
  });
});
