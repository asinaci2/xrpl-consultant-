import { useEffect, useRef } from "react";

interface MatrixRainProps {
  className?: string;
}

function isDayMode() {
  return document.documentElement.getAttribute("data-theme") === "day";
}

interface Trail {
  x: number;
  y: number;
  char: string;
  alpha: number;
}

const PANEL_SELECTOR = "nav, footer, section, [data-testid^='card-']";
const EXCLUSION_PADDING = 8;
const RECT_REFRESH_INTERVAL = 90;

export function MatrixRain({ className = "" }: MatrixRainProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const characters = "$TXT$XRP$BWTCK$COPE";
    const letters = characters.split("");
    const fontSize = 18;

    let columns: number;
    let drops: number[];
    let trails: Trail[] = [];
    let animationId: number;
    let frameCount = 0;
    let exclusionRects: DOMRect[] = [];

    const refreshExclusionRects = () => {
      const panels = document.querySelectorAll(PANEL_SELECTOR);
      exclusionRects = Array.from(panels).map(el => el.getBoundingClientRect());
    };

    const isBlocked = (x: number, y: number): boolean => {
      for (const r of exclusionRects) {
        if (
          x >= r.left - EXCLUSION_PADDING &&
          x <= r.right + EXCLUSION_PADDING &&
          y >= r.top - EXCLUSION_PADDING &&
          y <= r.bottom + EXCLUSION_PADDING
        ) {
          return true;
        }
      }
      return false;
    };

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      columns = Math.floor(canvas.width / fontSize);
      drops = Array(columns).fill(1);
      trails = [];
      refreshExclusionRects();
    };

    const draw = () => {
      const day = isDayMode();
      frameCount++;

      if (frameCount % RECT_REFRESH_INTERVAL === 0) {
        refreshExclusionRects();
      }

      if (day) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Decay and draw existing trails — skip drawing if inside a panel
        trails = trails.filter(t => t.alpha > 0.03);
        ctx.font = `${fontSize}px monospace`;
        for (const t of trails) {
          t.alpha *= 0.75;
          if (!isBlocked(t.x, t.y)) {
            ctx.fillStyle = `rgba(234, 88, 12, ${t.alpha})`;
            ctx.fillText(t.char, t.x, t.y);
          }
        }

        // Draw new characters on active columns
        for (let i = 0; i < drops.length; i++) {
          if (Math.random() > 0.55) {
            drops[i]++;
            continue;
          }

          const char = letters[Math.floor(Math.random() * letters.length)];
          const x = i * fontSize;
          const y = drops[i] * fontSize;

          // Always push to trail (so it fades naturally if it drifts into a panel)
          trails.push({ x, y, char, alpha: 0.45 });

          // Only draw if outside all panel exclusion zones
          if (!isBlocked(x, y)) {
            ctx.fillStyle = `rgba(234, 88, 12, 0.45)`;
            ctx.fillText(char, x, y);
          }

          if (y > canvas.height && Math.random() > 0.975) {
            drops[i] = 0;
          }
          drops[i]++;
        }
      } else {
        // Dark mode — classic black fill trail, no exclusion needed
        ctx.fillStyle = "rgba(0, 0, 0, 0.05)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.font = `${fontSize}px monospace`;

        for (let i = 0; i < drops.length; i++) {
          if (Math.random() > 0.55) {
            drops[i]++;
            continue;
          }

          const char = letters[Math.floor(Math.random() * letters.length)];
          const x = i * fontSize;
          const y = drops[i] * fontSize;

          const progress = y / canvas.height;
          const alpha = Math.max(0.1, 0.7 - progress * 0.5);

          ctx.fillStyle = `rgba(147, 51, 234, ${alpha})`;
          ctx.fillText(char, x, y);

          if (y > canvas.height && Math.random() > 0.975) {
            drops[i] = 0;
          }
          drops[i]++;
        }
      }

      animationId = requestAnimationFrame(draw);
    };

    resize();
    draw();

    const resizeObserver = new ResizeObserver(() => {
      resize();
    });
    resizeObserver.observe(canvas);

    return () => {
      cancelAnimationFrame(animationId);
      resizeObserver.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      data-testid="canvas-matrix-rain"
    />
  );
}
