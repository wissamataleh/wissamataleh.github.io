export type ConstellationMenuSection = {
  id: string;
  label: string;
  href: string;
  x: number;
  y: number;
  anchor: "left" | "right";
};

export const NAV_SECTIONS: ConstellationMenuSection[] = [
  { id: "home", label: "01 HOME", href: "/", x: 0.5, y: 0.34, anchor: "right" },
  { id: "experience", label: "02 EXPERIENCE", href: "/experience", x: 0.55, y: 0.43, anchor: "left" },
  { id: "platform", label: "03 PLATFORM", href: "/platform", x: 0.45, y: 0.5, anchor: "right" },
  { id: "metrics", label: "04 METRICS", href: "/metrics", x: 0.55, y: 0.57, anchor: "left" },
  { id: "contact", label: "05 CONTACT", href: "/contact", x: 0.47, y: 0.64, anchor: "right" },
  { id: "projects", label: "06 PROJECTS", href: "/projects", x: 0.53, y: 0.71, anchor: "left" },
];

const RUNTIME = `(function (DATA) {
  if (!nodes || !DATA || !DATA.length) return;
  var canvas = document.getElementById('constellationCanvas');
  if (!canvas) return;
  function enableHits() {
    var el = canvas;
    el.style.setProperty('pointer-events', 'auto', 'important');
    var parent = el.parentElement;
    while (parent) {
      parent.style.setProperty('pointer-events', 'auto', 'important');
      parent = parent.parentElement;
    }
  }
  enableHits();
  var ctx = canvas.getContext('2d');
  window.__CF_HUB_COUNT = DATA.length;
  window.__CF_HUB_HREFS = [];
  var MENU_LINK = 300;
  var DOT = 3.5;
  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var palette = { dark: '#50A0F0', light: '#B8860B' };
  var mono = '"SF Mono", "Cascadia Mono", Menlo, Monaco, Consolas, monospace';
  function modeColor() {
    var mode = (window.__SF_CONTROLS && window.__SF_CONTROLS.mode) || 'dark';
    return palette[mode] || palette.dark;
  }
var hubs = [];
  var boundsMinX = Math.round(width * 0.42);
  window.addEventListener('message', function (e) {
    if (e.data && e.data.type === 'constellation-bounds' && typeof e.data.minX === 'number') {
      boundsMinX = e.data.minX;
    } else if (e.data && e.data.type === 'constellation-route' && typeof e.data.href === 'string') {
      for (var ri = 0; ri < DATA.length; ri++) {
        if (DATA[ri].href === e.data.href) {
          active = ri;
          window.__CF_ACTIVE = active;
          return;
        }
      }
      active = -1;
      window.__CF_ACTIVE = -1;
    }
  });
  window.parent.postMessage({ type: 'constellation-ready' }, '*');
  function boundX(x) {
    return x < boundsMinX ? boundsMinX : x;
  }
  for (var _i = 0; _i < DATA.length; _i++) {
    window.__CF_HUB_HREFS[_i] = DATA[_i].href;
    hubs.push({
      ax: DATA[_i].x * width,
      ay: DATA[_i].y * height,
      x: boundX(DATA[_i].x * width),
      y: DATA[_i].y * height,
      vx: (Math.random() - 0.5) * 0.35,
      vy: (Math.random() - 0.5) * 0.35,
    });
  }
  function hit(x, y) {
    ctx.font = '13px ' + mono;
    for (var i = 0; i < hubs.length; i++) {
      var h = hubs[i];
      var dx = h.x - x, dy = h.y - y;
      if (dx * dx + dy * dy < 32 * 32) return i;
      var s = DATA[i];
      var tw = ctx.measureText(s.label).width;
      var x0, x1;
      if (s.anchor === 'left') {
        x0 = h.x - 16 - tw;
        x1 = h.x - 16;
      } else {
        x0 = h.x + 16;
        x1 = h.x + 16 + tw;
      }
      if (x >= x0 && x <= x1 && y >= h.y - 10 && y <= h.y + 10) return i;
    }
    return -1;
  }
  var hover = -1;
  var active = -1;
  function setCursor() {
    canvas.style.cursor = hover < 0 ? 'default' : 'pointer';
  }
  canvas.addEventListener('mousemove', function (e) {
    hover = hit(e.clientX, e.clientY);
    window.__CF_HOVER = hover < 0 ? null : hover;
    setCursor();
  });
  canvas.addEventListener('mouseleave', function () {
    hover = -1;
    window.__CF_HOVER = null;
    setCursor();
  });
  canvas.addEventListener('click', function (e) {
    var i = hit(e.clientX, e.clientY);
    if (i < 0) return;
    window.parent.postMessage({ type: 'constellation-nav', href: DATA[i].href }, '*');
  });
  function drawLinks() {
    var c = modeColor();
    ctx.lineCap = 'butt';
    ctx.lineJoin = 'miter';
    ctx.strokeStyle = c;
    ctx.lineWidth = 1;
    for (var i = 0; i < hubs.length; i++) {
      for (var j = i + 1; j < hubs.length; j++) {
        var a = hubs[i], b = hubs[j];
        var dx = a.x - b.x, dy = a.y - b.y;
        var d = Math.sqrt(dx * dx + dy * dy);
        if (d < MENU_LINK) {
          ctx.globalAlpha = 0.22 + (1 - d / MENU_LINK) * 0.55;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
    }
    ctx.globalAlpha = 1;
  }
  function drawHubs() {
    drawLinks();
    var c = modeColor();
    for (var i = 0; i < hubs.length; i++) {
      var s = DATA[i];
      var x = hubs[i].x, y = hubs[i].y;
      var on = i === hover || i === active;
      ctx.save();
      ctx.translate(x, y);
      if (on) {
        var glow = ctx.createRadialGradient(0, 0, DOT, 0, 0, 30);
        glow.addColorStop(0, c);
        glow.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = glow;
        ctx.globalAlpha = 0.45;
        ctx.beginPath();
        ctx.arc(0, 0, 30, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = c;
      ctx.globalAlpha = on ? 0.5 : 0.28;
      ctx.beginPath();
      ctx.arc(0, 0, DOT * 2.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = on ? 1 : 0.85;
      ctx.beginPath();
      ctx.arc(0, 0, DOT, 0, Math.PI * 2);
      ctx.fill();
      ctx.font = '13px ' + mono;
      ctx.textBaseline = 'middle';
      ctx.globalAlpha = 0.8;
      if (s.anchor === 'left') {
        ctx.textAlign = 'right';
        ctx.fillText(s.label, -16, 0);
      } else {
        ctx.textAlign = 'left';
        ctx.fillText(s.label, 16, 0);
      }
      ctx.globalAlpha = 1;
      ctx.restore();
    }
    ctx.globalAlpha = 1;
  }
  function netDraw() {
    ctx.clearRect(0, 0, width, height);
    var c = modeColor();
    ctx.lineCap = 'butt';
    ctx.lineJoin = 'miter';
    ctx.strokeStyle = c;
    ctx.lineWidth = 1;
    for (var i = 0; i < nodes.length; i++) {
      for (var j = i + 1; j < nodes.length; j++) {
        var dx = nodes[i].x - nodes[j].x, dy = nodes[i].y - nodes[j].y;
        var d = Math.sqrt(dx * dx + dy * dy);
        if (d < LINK) {
          ctx.globalAlpha = 0.22 + (1 - d / LINK) * 0.55;
          ctx.beginPath();
          ctx.moveTo(nodes[i].x, nodes[i].y);
          ctx.lineTo(nodes[j].x, nodes[j].y);
          ctx.stroke();
        }
      }
    }
    for (var k = 0; k < nodes.length; k++) {
      var nd = nodes[k];
      var r = nd.radius || 2;
      ctx.fillStyle = c;
      ctx.globalAlpha = 0.22;
      ctx.beginPath();
      ctx.arc(nd.x, nd.y, r * 2.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 0.78;
      ctx.beginPath();
      ctx.arc(nd.x, nd.y, r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    drawHubs();
  }
  function publishPos() {
    var out = [];
    for (var i = 0; i < hubs.length; i++) out.push([hubs[i].x, hubs[i].y]);
    window.__CF_HUB_POS = out;
  }
  function tick() {
    for (var i = 0; i < hubs.length; i++) {
      var h = hubs[i];
      h.vx += (Math.random() - 0.5) * 0.02;
      h.vy += (Math.random() - 0.5) * 0.02;
      var spd = Math.sqrt(h.vx * h.vx + h.vy * h.vy);
      var vmax = 0.9;
      if (spd > vmax) {
        h.vx = (h.vx / spd) * vmax;
        h.vy = (h.vy / spd) * vmax;
      }
      h.x += h.vx;
      h.y += h.vy;
      h.x += (h.ax - h.x) * 0.002;
      h.y += (h.ay - h.y) * 0.002;
      if (h.x < boundsMinX) { h.x = boundsMinX; if (h.vx < 0) h.vx *= -1; }
      if (h.x > width - 8) h.vx *= -1;
      if (h.y < 8 || h.y > height - 8) h.vy *= -1;
    }
    drawHubs();
    publishPos();
    requestAnimationFrame(tick);
  }
  function reAnchor() {
    for (var i = 0; i < hubs.length; i++) {
      hubs[i].ax = boundX(DATA[i].x * width);
      hubs[i].ay = DATA[i].y * height;
    }
    if (reduced) netDraw();
  }
  window.addEventListener('resize', reAnchor);
  if (reduced) {
    netDraw();
    publishPos();
  } else {
    requestAnimationFrame(tick);
  }
})`;

export function buildMenuScript(sections: ConstellationMenuSection[]): string {
  if (!sections.length) return "";
  const json = JSON.stringify(sections).replace(/</g, "\\u003c");
  return `<script data-threeui-menu>${RUNTIME}(${json});</script>`;
}