"use client";

import { useEffect, useRef } from "react";
import { useTheme } from "@/lib/theme";

export default function BgCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const labelRef = useRef<HTMLDivElement>(null);
  const nameRef = useRef<HTMLSpanElement>(null);
  const { theme } = useTheme();

  useEffect(() => {
    // Homepage-only: hide the global body::before grid dot pattern
    document.body.classList.add("no-page-dots");
    return () => { document.body.classList.remove("no-page-dots"); };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
    const label = labelRef.current;
    const nameEl = nameRef.current;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const col = theme === "dark" ? "#D9B88A" : "#321318";
    const alpha = theme === "dark" ? 0.28 : 0.32;

    function rgba(a: number) {
      const hx = col.replace("#", "").padStart(6, "0");
      const n = parseInt(hx, 16);
      return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
    }

    let mx = -9999, my = -9999, tx = -9999, ty = -9999;
    const onMove = (e: MouseEvent) => { tx = e.clientX; ty = e.clientY; };
    const onLeave = () => { tx = -9999; ty = -9999; };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseleave", onLeave);

    let w = 0, h = 0, dpr = 1;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let scene = "drape", S: Record<string, any> = {};

    function setupScene(name: string) {
      S = {};
      if (name === "drape") { S.lines = 34; S.amp = 30; }
      else if (name === "starfield") {
        const n = Math.min(170, Math.floor(w * h / 9000));
        S.stars = Array.from({ length: n }, () => ({ x: Math.random() * w, y: Math.random() * h, r: 0.6 + Math.random() * 1.6, p: Math.random() * 6.28, sp: 0.0008 + Math.random() * 0.0016, vx: (Math.random() - .5) * 0.04, vy: (Math.random() - .5) * 0.04 }));
      } else if (name === "moon") {
        S.moon = { x: w * 0.76, y: h * 0.30, r: Math.min(w, h) * 0.13 };
        const n = Math.min(56, Math.floor(w * h / 26000));
        S.orbs = Array.from({ length: n }, () => ({ x: Math.random() * w, y: Math.random() * h, vx: 0, vy: 0, r: 0.8 + Math.random() * 1.7 }));
      } else if (name === "clouds") {
        const n = Math.max(4, Math.floor(w / 360));
        S.clouds = Array.from({ length: n }, () => {
          const cx = Math.random() * w, cy = Math.random() * h * 0.9, sc = 0.7 + Math.random() * 0.9;
          const vx = (0.1 + Math.random() * 0.16) * (Math.random() < .5 ? -1 : 1);
          const np = 4 + Math.floor(Math.random() * 3);
          const puffs = Array.from({ length: np }, (_, i) => ({ dx: (i - np / 2) * 38 * sc + (Math.random() * 20 - 10), dy: (Math.random() * 26 - 13) * sc, r: (34 + Math.random() * 30) * sc }));
          return { cx, cy, vx, puffs, ox: 0, oy: 0 };
        });
      } else if (name === "storm") {
        const n = Math.min(280, Math.floor(w * h / 4200));
        S.drops = Array.from({ length: n }, () => ({ x: Math.random() * w, y: Math.random() * h, len: 10 + Math.random() * 16, sp: 6 + Math.random() * 6 }));
        S.flash = 0; S.tick = 0; S.next = 150 + Math.random() * 260;
      } else if (name === "petals") {
        const n = Math.min(80, Math.floor(w * h / 14000));
        S.petals = Array.from({ length: n }, () => ({ x: Math.random() * w, y: Math.random() * h, fall: 0.3 + Math.random() * 0.5, vx: 0, vy: 0, r: 5 + Math.random() * 7, rot: Math.random() * 6.28, vr: (Math.random() - .5) * 0.03, sw: Math.random() * 6.28 }));
      }
    }

    function drawDrape(t: number, has: boolean, inf: number) {
      const gap = h / (S.lines - 1); ctx.strokeStyle = col; ctx.lineWidth = 1;
      for (let i = 0; i < S.lines; i++) {
        const baseY = i * gap, a = S.amp * (0.4 + 0.6 * Math.sin(i / S.lines * Math.PI));
        ctx.beginPath();
        for (let x = -20; x <= w + 20; x += 8) {
          const ph = reduce ? 0 : t * 0.00020;
          let y = baseY + a * Math.sin(x * 0.0048 + i * 0.28 + ph) + a * 0.4 * Math.sin(x * 0.0102 - i * 0.16 - ph * 1.25);
          if (has) { const dx = x - mx, dy = baseY - my, d2 = dx * dx + dy * dy; y += (2200 / (d2 + 2200)) * 30 * (baseY < my ? -1 : 1); }
          x === -20 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.globalAlpha = alpha * (0.3 + 0.7 * Math.sin(i / S.lines * Math.PI)); ctx.stroke();
      }
    }

    function drawStars(t: number, has: boolean, inf: number) {
      const px = has ? (mx - w / 2) * 0.012 : 0, py = has ? (my - h / 2) * 0.012 : 0;
      ctx.fillStyle = col; ctx.strokeStyle = col; ctx.lineWidth = 1;
      for (const s of S.stars) {
        s.x += s.vx; s.y += s.vy;
        if (s.x < 0) s.x += w; if (s.x > w) s.x -= w; if (s.y < 0) s.y += h; if (s.y > h) s.y -= h;
        const sx = s.x + px, sy = s.y + py, tw = 0.4 + 0.6 * Math.sin((reduce ? 0 : t) * s.sp + s.p);
        let near = 0;
        if (has) { const dx = sx - mx, dy = sy - my, d = Math.hypot(dx, dy); if (d < 150) { near = 1 - d / 150; ctx.globalAlpha = alpha * near * 0.5; ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(mx, my); ctx.stroke(); } }
        ctx.globalAlpha = Math.min(1, alpha * (0.5 + 1.5 * tw) + near * 0.6);
        ctx.beginPath(); ctx.arc(sx, sy, s.r * (1 + near * 0.9), 0, 6.28); ctx.fill();
      }
    }

    function drawMoon(t: number, has: boolean, inf: number) {
      const m = S.moon, fx = Math.sin((reduce ? 0 : t) * 0.0003) * 8, fy = Math.cos((reduce ? 0 : t) * 0.00025) * 6;
      // Anchor cursor parallax to the moon's resting position (m.x, m.y), not the
      // shifted cx2/cy2 — otherwise the halo center jumps when mouse first enters.
      // Scale by inf (eased cursorInfluence) so the parallax eases in instead of snapping.
      const px = (mx - m.x) * 0.01 * inf, py = (my - m.y) * 0.01 * inf;
      const cx2 = m.x + fx + px, cy2 = m.y + fy + py, r = m.r;
      // Halo gradient: keep the gradient CENTER anchored to the moon's resting
      // position so it doesn't snap when parallax kicks in.
      const haloCx = m.x + fx, haloCy = m.y + fy;
      const g = ctx.createRadialGradient(haloCx, haloCy, r * 0.3, haloCx, haloCy, r * 2.5);
      g.addColorStop(0, rgba(alpha * 0.55)); g.addColorStop(1, rgba(0));
      ctx.globalAlpha = 1; ctx.fillStyle = g; ctx.beginPath(); ctx.arc(haloCx, haloCy, r * 2.5, 0, 6.28); ctx.fill();
      ctx.fillStyle = col; ctx.globalAlpha = alpha * 0.85; ctx.beginPath(); ctx.arc(cx2, cy2, r, 0, 6.28); ctx.fill();
      ctx.globalAlpha = alpha * 0.45;
      [[cx2 - r * 0.4, cy2 + r * 0.22, r * 0.13], [cx2 - r * 0.1, cy2 - r * 0.36, r * 0.08], [cx2 + r * 0.32, cy2 + r * 0.05, r * 0.1]].forEach(([x, y, rr]) => { ctx.beginPath(); ctx.arc(x, y, rr, 0, 6.28); ctx.fill(); });
      for (const o of S.orbs) {
        if (has) { const dx = mx - o.x, dy = my - o.y, d2 = dx * dx + dy * dy, f = Math.min(0.3, 700 / (d2 + 700)); o.vx += dx * f * 0.005 * inf; o.vy += dy * f * 0.005 * inf; }
        o.vx *= 0.95; o.vy *= 0.95; o.x += o.vx; o.y += o.vy;
        if (o.x < 0) o.x += w; if (o.x > w) o.x -= w; if (o.y < 0) o.y += h; if (o.y > h) o.y -= h;
        ctx.globalAlpha = alpha * 0.7; ctx.beginPath(); ctx.arc(o.x, o.y, o.r, 0, 6.28); ctx.fill();
      }
    }

    function drawClouds(_t: number, has: boolean, _inf: number) {
      for (const c of S.clouds) {
        c.cx += c.vx;
        if (c.cx > w + 160) c.cx = -160; if (c.cx < -160) c.cx = w + 160;
        let ox = 0, oy = 0;
        if (has) { const dx = c.cx - mx, dy = c.cy - my, d = Math.hypot(dx, dy); if (d > 0.001 && d < 260) { const f = 1 - d / 260; ox = dx / d * f * 60; oy = dy / d * f * 40; } }
        c.ox += (ox - c.ox) * 0.08; c.oy += (oy - c.oy) * 0.08;
        for (const p of c.puffs) {
          const x = c.cx + p.dx + c.ox, y = c.cy + p.dy + c.oy;
          const g = ctx.createRadialGradient(x, y, 0, x, y, p.r);
          g.addColorStop(0, rgba(alpha * 0.5)); g.addColorStop(1, rgba(0));
          ctx.globalAlpha = 1; ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, p.r, 0, 6.28); ctx.fill();
        }
      }
    }

    function drawStorm(t: number, has: boolean, inf: number) {
      ctx.strokeStyle = col; ctx.lineWidth = 1; const wind = 2.2;
      for (const d of S.drops) {
        d.y += d.sp; d.x += wind * 0.4;
        if (d.y > h) { d.y = -d.len; d.x = Math.random() * w; }
        if (d.x > w) d.x -= w;
        let push = 0;
        if (has) { const ddx = d.x - mx, ddy = d.y - my, dd = Math.hypot(ddx, ddy); if (dd > 0.001 && dd < 90) { push = ddx / dd * (1 - dd / 90) * 42; } }
        ctx.globalAlpha = alpha * 0.7; ctx.beginPath(); ctx.moveTo(d.x + push, d.y); ctx.lineTo(d.x + push - wind * 2, d.y + d.len); ctx.stroke();
      }
      if (S.flash > 0) { ctx.globalAlpha = S.flash * alpha * 0.45; ctx.fillStyle = col; ctx.fillRect(0, 0, w, h); S.flash *= 0.86; if (S.flash < 0.02) S.flash = 0; }
      if (!reduce) {
        S.tick++;
        if (S.tick > S.next) {
          S.tick = 0; S.next = 160 + Math.random() * 300; S.flash = 1;
          ctx.globalAlpha = alpha * 1.6; ctx.strokeStyle = col; ctx.lineWidth = 2;
          let bx = Math.random() * w, by = 0; ctx.beginPath(); ctx.moveTo(bx, by);
          while (by < h * 0.72) { by += 30 + Math.random() * 40; bx += (Math.random() - 0.5) * 64; ctx.lineTo(bx, by); }
          ctx.stroke(); ctx.lineWidth = 1;
        }
      }
    }

    function drawPetals(_t: number, has: boolean, inf: number) {
      ctx.fillStyle = col;
      for (const p of S.petals) {
        if (has) { const dx = p.x - mx, dy = p.y - my, d2 = dx * dx + dy * dy; if (d2 < 28000) { const inv = 1 / (Math.sqrt(d2) + 1); p.vx += (-dy) * inv * 0.5 + dx * inv * 0.18; p.vy += (dx) * inv * 0.5 + dy * inv * 0.18; } }
        p.sw += 0.02; p.x += p.vx + Math.sin(p.sw) * 0.5; p.y += p.fall + p.vy;
        p.vx *= 0.92; p.vy *= 0.92; p.rot += p.vr + p.vx * 0.02;
        if (p.y > h + 12) { p.y = -12; p.x = Math.random() * w; p.vx = 0; p.vy = 0; }
        if (p.x < -12) p.x = w + 12; if (p.x > w + 12) p.x = -12;
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot);
        ctx.globalAlpha = alpha * 0.8; ctx.beginPath(); ctx.ellipse(0, 0, p.r, p.r * 0.45, 0, 0, 6.28); ctx.fill();
        ctx.restore();
      }
    }

    function drawScene(t: number, inf: number) {
      ctx.clearRect(0, 0, w, h);
      const has = inf > 0.01;
      if (scene === "drape") drawDrape(t, has, inf);
      else if (scene === "starfield") drawStars(t, has, inf);
      else if (scene === "moon") drawMoon(t, has, inf);
      else if (scene === "clouds") drawClouds(t, has, inf);
      else if (scene === "storm") drawStorm(t, has, inf);
      else if (scene === "petals") drawPetals(t, has, inf);
      ctx.globalAlpha = 1;
    }

    const sceneList = ["drape", "starfield", "moon", "clouds", "storm", "petals"];
    const sceneNames: Record<string, string> = { drape: "woven lines", starfield: "starfield", moon: "moonrise", clouds: "drifting clouds", storm: "storm", petals: "falling threads" };

    let labelTimeout: ReturnType<typeof setTimeout>;
    function showLabel(txt: string) {
      if (!nameEl || !label) return;
      nameEl.textContent = "✦ " + txt;
      label.style.opacity = "1"; label.style.transform = "none";
      clearTimeout(labelTimeout);
      labelTimeout = setTimeout(() => { if (label) { label.style.opacity = "0"; label.style.transform = "translateY(6px)"; } }, 2600);
    }

    function rollScene() {
      const others = sceneList.filter(s => s !== scene);
      scene = others[Math.floor(Math.random() * others.length)];
      document.body.dataset.scene = scene;
      setupScene(scene); showLabel(sceneNames[scene]);
      if (reduce) drawScene(0, 0);
    }

    function size() {
      dpr = Math.min(window.devicePixelRatio || 1, 2); w = window.innerWidth; h = window.innerHeight;
      (canvas as HTMLCanvasElement).width = w * dpr; (canvas as HTMLCanvasElement).height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      setupScene(scene); if (reduce) drawScene(0, 0);
    }

    let rafId: number;
    let cursorInfluence = 0; // 0 = no cursor parallax, 1 = full parallax (eased)
    function loop(t: number) {
      // Hold mx/my at center until the user has actually moved the mouse,
      // so the first frame after a real mousemove doesn't snap from -9999 → 0.
      if (tx === -9999) {
        mx = w / 2; my = h / 2;
        cursorInfluence += (0 - cursorInfluence) * 0.05;
      } else {
        mx += (tx - mx) * 0.08; my += (ty - my) * 0.08;
        cursorInfluence += (1 - cursorInfluence) * 0.05;
      }
      drawScene(t, cursorInfluence); rafId = requestAnimationFrame(loop);
    }

    window.addEventListener("resize", size);
    size(); rollScene();
    if (!reduce) rafId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(rafId); clearTimeout(labelTimeout);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseleave", onLeave);
      window.removeEventListener("resize", size);
      delete document.body.dataset.scene;
    };
  }, [theme]);

  return (
    <>
      <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none" style={{ width: "100vw", height: "100vh", zIndex: 0 }} />
      <div ref={labelRef} aria-hidden style={{ position: "fixed", left: 40, bottom: 28, zIndex: 40, pointerEvents: "none", fontFamily: "var(--font-space-mono, monospace)", fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--color-muted)", display: "flex", alignItems: "center", gap: 9, opacity: 0, transform: "translateY(6px)", transition: "opacity .5s ease, transform .5s ease" }}>
        <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--color-accent-strong)", flexShrink: 0 }} />
        <span ref={nameRef} />
      </div>
    </>
  );
}
