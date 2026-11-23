const width = 78;
const height = 48;

let isPurpleTheme = true;
let time = 0;

// Background twinkling stars
const stars = [];
for (let i = 0; i < 42; i++) {
  stars.push({
    r: Math.floor(Math.random() * height),
    c: Math.floor(Math.random() * width),
    char: Math.random() > 0.35 ? '.' : '*',
    phase: Math.random() * Math.PI * 2
  });
}

// Cute cat ASCII anchored at the bottom
const catArt = [
  "          .+ (|):           ",
  "         .---'''---.        ",
  "        (  /\\___/\\  )       ",
  "       (  (  owo  )  )      ",
  "        (  \\_____/  )       ",
  "         '-.     .-'        ",
  "          (@( <3 )--        ",
  "           (_) (_)          "
];

// 5 well-spaced 3D Tulip flowers (x, y, z, scale, tiltX, tiltZ)
const tulips = [
  { x:  0.00, y: -1.48, z:  0.00, s: 1.08, tx:  0.05, tz:  0.00 }, // Center tall tulip
  { x: -0.78, y: -1.25, z:  0.22, s: 1.00, tx:  0.15, tz: -0.28 }, // Mid-left tulip
  { x:  0.78, y: -1.25, z:  0.22, s: 1.00, tx:  0.15, tz:  0.28 }, // Mid-right tulip
  { x: -1.38, y: -0.92, z: -0.08, s: 0.94, tx:  0.05, tz: -0.52 }, // Far-left tulip
  { x:  1.38, y: -0.92, z: -0.08, s: 0.94, tx:  0.05, tz:  0.52 }  // Far-right tulip
];

function rotatePoint(x, y, z, rx, ry, rz) {
  let x1 = x * Math.cos(rz) - y * Math.sin(rz);
  let y1 = x * Math.sin(rz) + y * Math.cos(rz);
  let z1 = z;

  let y2 = y1 * Math.cos(rx) - z1 * Math.sin(rx);
  let z2 = y1 * Math.sin(rx) + z1 * Math.cos(rx);
  let x2 = x1;

  let x3 = x2 * Math.cos(ry) + z2 * Math.sin(ry);
  let z3 = -x2 * Math.sin(ry) + z2 * Math.cos(ry);
  let y3 = y2;

  return { x: x3, y: y3, z: z3 };
}

function render() {
  const zBuffer = Array.from({ length: height }, () => Array(width).fill(-Infinity));
  const charBuffer = Array.from({ length: height }, () => Array(width).fill(' '));
  const typeBuffer = Array.from({ length: height }, () => Array(width).fill('empty'));

  const swayY = Math.sin(time * 0.035) * 0.16;
  const bloomProgress = Math.min(1, time / 24);

  function plot(x, y, z, ch, type) {
    const fov = 26;
    const dist = 4.4;
    const scale = fov / (dist - z);
    const sx = Math.round(width / 2 + x * scale * 1.92);
    const sy = Math.round(21 + y * scale);

    if (sx >= 0 && sx < width && sy >= 0 && sy < height - 7) {
      if (z > zBuffer[sy][sx]) {
        zBuffer[sy][sx] = z;
        charBuffer[sy][sx] = ch;
        typeBuffer[sy][sx] = type;
      }
    }
  }

  // 1. Render Bouquet Paper Wrapper (taller, wider collar, pleated folds)
  const maxH = 1.85 * bloomProgress;
  for (let h = 0; h <= maxH; h += 0.025) {
    const y = -0.58 + h * 0.92;
    const progress = h / 1.85;
    // Wide top opening tapering down to pinched waist
    const radius = Math.max(0.11, (1 - progress * 0.91) * 1.62);

    for (let a = 0; a < Math.PI * 2; a += 0.05) {
      // High back sheet framing the tulips, lower V-cut in front
      const isBack = Math.sin(a) < 0;
      const collarCurve = isBack
        ? Math.sin(a) * 0.58 * (1 - progress)
        : Math.sin(a) * 0.18 * (1 - progress);

      const py = y + collarCurve;
      // Pleated folds along the paper
      const pleat = Math.sin(a * 7) * 0.05 * (1 - progress);
      const px = Math.cos(a) * (radius + pleat);
      const pz = Math.sin(a) * (radius + pleat) * 0.68;

      const p = rotatePoint(px, py, pz, 0.14, swayY, 0);

      let ch = 'X';
      let type = 'wrap_body';

      if (h < 0.06) {
        ch = '#';
        type = 'wrap_rim';
      } else if (Math.abs(Math.sin(a * 7)) > 0.82) {
        ch = '=';
        type = 'wrap_fold';
      } else if (h > 1.62) {
        ch = ':';
        type = 'wrap_bottom';
      }

      plot(p.x, p.y, p.z, ch, type);
    }
  }

  // 2. Render Ribbon & Lower Stems below the pinched wrapper
  if (bloomProgress > 0.6) {
    // Ribbon knot & tails
    for (let r = -0.35; r <= 0.35; r += 0.04) {
      const bowY = 1.05 + Math.abs(r) * 0.25;
      const bowZ = 0.22;
      const p1 = rotatePoint(r, bowY, bowZ, 0.14, swayY, 0);
      plot(p1.x, p1.y, p1.z, '*', 'ribbon');

      // Hanging ribbon tails
      if (Math.abs(r) < 0.22) {
        const tailP = rotatePoint(r * 1.3, bowY + 0.28, bowZ - 0.02, 0.14, swayY, 0);
        plot(tailP.x, tailP.y, tailP.z, '+', 'ribbon');
      }
    }

    // Stems poking out at the bottom
    for (let st = 0; st <= 0.42; st += 0.03) {
      [-0.08, 0, 0.08].forEach((offsetX, i) => {
        const p = rotatePoint(offsetX * (1 + st), 1.12 + st, (i - 1) * 0.03, 0.14, swayY, 0);
        plot(p.x, p.y, p.z, '|', 'stem');
      });
    }
  }

  // 3. Render Separated 3D Tulips, Stems & Leaves
  if (bloomProgress > 0.3) {
    tulips.forEach((t, idx) => {
      // Green Stem going from flower base down into wrapper
      for (let s = 0; s <= 0.85; s += 0.025) {
        const sx = t.x * (1 - s * 0.55);
        const sy = t.y + 0.22 + s * 0.95;
        const sz = t.z * (1 - s * 0.55);
        const sp = rotatePoint(sx, sy, sz, 0.14, swayY, 0);
        plot(sp.x, sp.y, sp.z, '|', 'stem');

        // Small tulip leaf curving off the stem
        if (s > 0.25 && s < 0.55) {
          const leafDir = idx % 2 === 0 ? 1 : -1;
          const leafSpan = Math.sin((s - 0.25) / 0.3 * Math.PI) * 0.26 * leafDir;
          const lp = rotatePoint(sx + leafSpan, sy - 0.04, sz + 0.04, 0.14, swayY, 0);
          plot(lp.x, lp.y, lp.z, leafDir > 0 ? '/' : '\\', 'stem');
        }
      }

      // Distinct 3D Tulip Cup
      const cupHeight = 0.58 * t.s;
      for (let v = 0; v <= 1; v += 0.04) {
        // Classic tulip bulb curve: wide rounded bottom, gentle taper at top
        const rProfile = Math.sin(v * Math.PI * 0.78 + 0.2) * 0.33 * t.s;
        const localY = (0.5 - v) * cupHeight;

        for (let u = 0; u < Math.PI * 2; u += 0.08) {
          // 3 pointed tulip petal tips at the top
          const petalPoint = Math.cos(u * 3 + idx) * 0.09;
          if (v > 0.86 + petalPoint) continue;

          const lx = Math.cos(u) * rProfile;
          const lz = Math.sin(u) * rProfile;

          const tilted = rotatePoint(lx, localY, lz, t.tx, 0, t.tz);
          const wx = tilted.x + t.x;
          const wy = tilted.y + t.y;
          const wz = tilted.z + t.z;

          const p = rotatePoint(wx, wy, wz, 0.14, swayY, 0);

          const ridge = Math.cos(u * 3 + idx);
          let ch = '#';
          let type = 'petal_mid';

          if (v > 0.78) {
            ch = '@';
            type = 'petal_tip';
          } else if (ridge > 0.42) {
            ch = 'o';
            type = 'petal_light';
          } else if (ridge < -0.42) {
            ch = '%';
            type = 'petal_dark';
          } else {
            ch = '*';
            type = 'petal_mid';
          }

          plot(p.x, p.y, p.z, ch, type);
        }
      }
    });
  }

  // 4. Render to HTML
  const canvas = document.getElementById('canvas');
  let html = '';

  for (let r = 0; r < height; r++) {
    let rowHtml = '';
    const catRowIdx = r - (height - catArt.length);

    if (catRowIdx >= 0) {
      const catLine = catArt[catRowIdx]
        .padStart(Math.floor((width + catArt[catRowIdx].length) / 2), ' ')
        .padEnd(width, ' ');
      for (let c = 0; c < width; c++) {
        const ch = catLine[c];
        if (ch !== ' ') {
          let color = '#e2e8f0';
          if (ch === '<' || ch === '3') color = '#ff5c8a';
          else if (ch === 'o' || ch === 'w') color = '#ffd166';
          rowHtml += `<span style="color:${color}">${ch}</span>`;
        } else {
          rowHtml += renderStar(r, c);
        }
      }
    } else {
      for (let c = 0; c < width; c++) {
        const ch = charBuffer[r][c];
        const type = typeBuffer[r][c];

        if (ch !== ' ') {
          const color = getThemeColor(type, isPurpleTheme);
          const glow = (type === 'petal_tip' && (time + r + c) % 14 < 4)
            ? 'text-shadow: 0 0 6px #fff;'
            : '';
          rowHtml += `<span style="color:${color};${glow}">${ch}</span>`;
        } else {
          rowHtml += renderStar(r, c);
        }
      }
    }
    html += rowHtml + '\n';
  }

  canvas.innerHTML = html;
  time++;
}

function renderStar(r, c) {
  const star = stars.find(s => s.r === r && s.c === c);
  if (star) {
    const twinkle = Math.sin(time * 0.1 + star.phase);
    if (twinkle > -0.2) {
      const starColor = twinkle > 0.6 ? '#ffffff' : '#475569';
      return `<span style="color:${starColor}">${star.char}</span>`;
    }
  }
  return ' ';
}

function getThemeColor(type, purple) {
  if (type === 'stem') return '#52b788';
  if (type === 'wrap_body') return '#94a3b8';
  if (type === 'wrap_rim') return '#e2e8f0';
  if (type === 'wrap_fold') return purple ? '#9d4edd' : '#fb5607';
  if (type === 'wrap_bottom') return '#64748b';
  if (type === 'ribbon') return purple ? '#e0aaff' : '#ffbe0b';

  if (purple) {
    if (type === 'petal_tip') return '#ffbe0b';   // Golden rim shimmer
    if (type === 'petal_light') return '#e0aaff'; // Bright lavender highlight
    if (type === 'petal_mid') return '#c77dff';   // Vibrant purple
    if (type === 'petal_dark') return '#7b2cbf';  // Deep royal violet shadow
  } else {
    if (type === 'petal_tip') return '#ffbe0b';
    if (type === 'petal_light') return '#ff758f';
    if (type === 'petal_mid') return '#ff0055';
    if (type === 'petal_dark') return '#a4133c';
  }
  return '#ffffff';
}

document.getElementById('frame').addEventListener('click', () => {
  isPurpleTheme = !isPurpleTheme;
  document.getElementById('theme-label').textContent = isPurpleTheme ? 'Purple' : 'Red/Gold';
});

// --- MP3 MUSIC PLAYER ---
const bgMusic = document.getElementById('bg-music');
const musicBtn = document.getElementById('music-btn');
let isPlaying = false;

function playAudio() {
  bgMusic.volume = 0.7; // 70% volume para hindi nakakagulat
  bgMusic.play().then(() => {
    isPlaying = true;
    musicBtn.textContent = '⏸ Pause Music';
  }).catch(() => {
    // Kapag na-block ng browser ang auto-play, hihintayin ang unang click
    isPlaying = false;
    musicBtn.textContent = '🎵 Click anywhere for Music';
  });
}

function toggleMusic() {
  if (bgMusic.paused) {
    playAudio();
  } else {
    bgMusic.pause();
    isPlaying = false;
    musicBtn.textContent = '🎵 Play Music';
  }
}

musicBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  toggleMusic();
});

document.getElementById('frame').addEventListener('click', () => {
  if (!isPlaying) playAudio();
  isPurpleTheme = !isPurpleTheme;
  document.getElementById('theme-label').textContent = isPurpleTheme ? 'Purple' : 'Red/Gold';
});

// Auto-play agad pagka-open ng page
window.addEventListener('load', playAudio);

// Backup: tutugtog agad sa unang click kahit saan sa screen kung na-block ng browser
document.body.addEventListener('click', () => {
  if (!isPlaying) playAudio();
}, { once: true });

setInterval(render, 50);
render();