export type ConstellationMenuSection = {
  id: string;
  label: string;
  href: string;
  x: number;
  y: number;
  anchor: "left" | "right";
};

export const NAV_SECTIONS: ConstellationMenuSection[] = [
  { id: "home", label: "01 HOME", href: "/", x: 0.12, y: 0.26, anchor: "right" },
  { id: "experience", label: "02 EXPERIENCE", href: "/experience", x: 0.12, y: 0.5, anchor: "right" },
  { id: "platform", label: "03 PLATFORM", href: "/platform", x: 0.12, y: 0.74, anchor: "right" },
  { id: "projects", label: "04 PROJECTS", href: "/projects", x: 0.88, y: 0.26, anchor: "left" },
  { id: "metrics", label: "05 METRICS", href: "/metrics", x: 0.88, y: 0.5, anchor: "left" },
  { id: "contact", label: "06 CONTACT", href: "/contact", x: 0.88, y: 0.74, anchor: "left" },
];

const RUNTIME = `(function (DATA) {
  if (!nodes || !DATA || !DATA.length) return;
  var canvas = document.getElementById('constellationCanvas');
  if (!canvas) return;
  var ctx = canvas.getContext('2d');
  window.__CF_HUB_COUNT = DATA.length;
  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var palette = { dark: '#50A0F0', light: '#B8860B' };
  var mono = '"SF Mono", "Cascadia Mono", Menlo, Monaco, Consolas, monospace';
  function modeColor() {
    var mode = (window.__SF_CONTROLS && window.__SF_CONTROLS.mode) || 'dark';
    return palette[mode] || palette.dark;
  }
  function hubPos(i) {
    return [DATA[i].x * width, DATA[i].y * height];
  }
  function pin() {
    for (var i = 0; i < DATA.length && i < nodes.length; i++) {
      nodes[i].vx = 0;
      nodes[i].vy = 0;
    }
  }
  function hit(x, y) {
    for (var i = 0; i < DATA.length; i++) {
      var p = hubPos(i);
      var dx = p[0] - x, dy = p[1] - y;
      if (dx * dx + dy * dy < 32 * 32) return i;
    }
    return -1;
  }
  var hover = -1;
  canvas.addEventListener('mousemove', function (e) { hover = hit(e.clientX, e.clientY); });
  canvas.addEventListener('mouseleave', function () { hover = -1; });
  canvas.addEventListener('click', function (e) {
    var i = hit(e.clientX, e.clientY);
    if (i < 0) return;
    window.parent.postMessage({ type: 'constellation-nav', href: DATA[i].href }, '*');
  });
  function drawHubs() {
    var c = modeColor();
    for (var i = 0; i < DATA.length; i++) {
      var s = DATA[i];
      var p = hubPos(i);
      var x = p[0], y = p[1];
      var on = i === hover;
      ctx.save();
      ctx.translate(x, y);
      ctx.fillStyle = c;
      ctx.globalAlpha = on ? 1 : 0.92;
      ctx.fillRect(-4, -4, 8, 8);
      ctx.globalAlpha = 1;
      ctx.strokeStyle = c;
      ctx.lineWidth = 1;
      ctx.strokeRect(-4.5, -4.5, 9, 9);
      if (on) {
        ctx.beginPath();
        ctx.arc(0, 0, 22, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.font = '11px ' + mono;
      ctx.textBaseline = 'middle';
      if (s.anchor === 'left') {
        ctx.textAlign = 'right';
        ctx.fillText(s.label, -16, 0);
      } else {
        ctx.textAlign = 'left';
        ctx.fillText(s.label, 16, 0);
      }
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
  function tick() {
    for (var i = 0; i < DATA.length && i < nodes.length; i++) {
      var p = hubPos(i);
      nodes[i].x = p[0];
      nodes[i].y = p[1];
    }
    drawHubs();
    requestAnimationFrame(tick);
  }
  function rePin() {
    pin();
    if (reduced) netDraw();
  }
  window.addEventListener('resize', rePin);
  pin();
  if (reduced) {
    netDraw();
  } else {
    requestAnimationFrame(tick);
  }
})`;

export function buildMenuScript(sections: ConstellationMenuSection[]): string {
  if (!sections.length) return "";
  const json = JSON.stringify(sections).replace(/</g, "\\u003c");
  return `<script data-threeui-menu>${RUNTIME}(${json});</script>`;
}