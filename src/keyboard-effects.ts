interface Particle { x: number; y: number; vx: number; vy: number; life: number; maxLife: number; size: number; color: string }
interface Wave { x: number; y: number; life: number; maxLife: number; radius: number; color: string }

// Canvas 只画真实击键产生的粒子；输入、分数和焦点始终由原生输入框处理。
export function createKeyboardEffects(canvas: HTMLCanvasElement) {
  const context = canvas.getContext('2d');
  let particles: Particle[] = [], waves: Wave[] = [];
  let frame = 0, previous = 0, width = 0, height = 0;
  let disposed = false;
  const resize = () => {
    const rect = canvas.getBoundingClientRect();
    width = rect.width; height = rect.height;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr);
    context?.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  const observer = new ResizeObserver(resize); observer.observe(canvas); resize();
  function draw(now: number) {
    if (!context || disposed) return;
    const dt = Math.min(32, previous ? now - previous : 16); previous = now;
    context.clearRect(0, 0, width, height);
    particles = particles.filter(p => p.life > 0);
    for (const p of particles) {
      p.life -= dt; p.x += p.vx * dt / 16; p.y += p.vy * dt / 16;
      p.vy += .055 * dt / 16; p.vx *= .985;
      context.globalAlpha = Math.max(0, p.life / p.maxLife);
      context.strokeStyle = p.color; context.lineWidth = p.size;
      context.beginPath(); context.moveTo(p.x, p.y); context.lineTo(p.x - p.vx * 2, p.y - p.vy * 2); context.stroke();
    }
    waves = waves.filter(w => w.life > 0);
    for (const w of waves) {
      w.life -= dt;
      const progress = 1 - w.life / w.maxLife;
      context.globalAlpha = Math.max(0, (1 - progress) * .65);
      context.strokeStyle = w.color; context.lineWidth = 1.5;
      context.shadowColor = w.color; context.shadowBlur = w.radius > 70 ? 7 : 0;
      context.beginPath(); context.ellipse(w.x, w.y, 8 + w.radius * progress, 5 + w.radius * progress * .55, 0, 0, Math.PI * 2); context.stroke();
      context.shadowBlur = 0;
    }
    context.globalAlpha = 1;
    if (particles.length || waves.length) frame = requestAnimationFrame(draw);
    else { frame = 0; previous = 0; context.clearRect(0, 0, width, height); }
  }
  function clear() {
    cancelAnimationFrame(frame); frame = 0; previous = 0; particles = []; waves = [];
    context?.clearRect(0, 0, width, height);
  }
  return {
    burst(x: number, y: number, energy: number, color: string, error = false) {
      if (!context || disposed) return;
      const count = error ? 7 : 5 + Math.round(energy * 22);
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = (1 + Math.random() * 2) * (1 + energy * 2.4);
        const life = 240 + Math.random() * 220 + energy * 200;
        particles.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed - 1, life, maxLife: life, size: 1 + Math.random() * energy, color });
      }
      waves.push({ x, y, life: 380, maxLife: 380, radius: 20 + energy * 90, color });
      // 连续高速输入也限制内存与每帧绘制量，不让视觉效果反过来拖慢打字。
      particles = particles.slice(-180); waves = waves.slice(-12);
      if (!frame) frame = requestAnimationFrame(draw);
    },
    clear,
    dispose() { disposed = true; clear(); observer.disconnect(); },
  };
}
