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

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      columns = Math.floor(canvas.width / fontSize);
      drops = Array(columns).fill(1);
      trails = [];
    };

    const draw = () => {
      const day = isDayMode();

      if (day) {
        // Transparent canvas — clear each frame, draw fading trails manually
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Decay and draw existing trails
        trails = trails.filter(t => t.alpha > 0.03);
        for (const t of trails) {
          ctx.font = `${fontSize}px monospace`;
          ctx.fillStyle = `rgba(234, 88, 12, ${t.alpha})`;
          ctx.fillText(t.char, t.x, t.y);
          t.alpha *= 0.75;
        }

        // Draw new characters on active columns
        ctx.font = `${fontSize}px monospace`;
        for (let i = 0; i < drops.length; i++) {
          if (Math.random() > 0.55) {
            drops[i]++;
            continue;
          }

          const char = letters[Math.floor(Math.random() * letters.length)];
          const x = i * fontSize;
          const y = drops[i] * fontSize;

          // Push to trail so it fades out over subsequent frames
          trails.push({ x, y, char, alpha: 0.45 });

          // Draw the fresh character at full alpha
          ctx.fillStyle = `rgba(234, 88, 12, 0.45)`;
          ctx.fillText(char, x, y);

          if (y > canvas.height && Math.random() > 0.975) {
            drops[i] = 0;
          }
          drops[i]++;
        }
      } else {
        // Dark mode — classic black fill trail
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
