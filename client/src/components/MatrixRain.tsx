import { useEffect, useRef } from "react";

interface MatrixRainProps {
  className?: string;
}

function isDayMode() {
  return document.documentElement.getAttribute("data-theme") === "day";
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
    let animationId: number;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      columns = Math.floor(canvas.width / fontSize);
      drops = Array(columns).fill(1);
    };

    const draw = () => {
      const day = isDayMode();

      ctx.fillStyle = day
        ? "rgba(255, 255, 255, 0.15)" // Day: faster fade = shorter, sparser trails
        : "rgba(0, 0, 0, 0.05)";      // Dark: slow fade = classic long trail
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.font = `${fontSize}px monospace`;

      for (let i = 0; i < drops.length; i++) {
        // Skip ~half the columns each frame — thins out the effect
        if (Math.random() > 0.55) {
          drops[i]++;
          continue;
        }

        const text = letters[Math.floor(Math.random() * letters.length)];
        const x = i * fontSize;
        const y = drops[i] * fontSize;

        const progress = y / canvas.height;
        const alpha = day
          ? Math.max(0.15, 0.4 - progress * 0.25) // day: 0.15–0.4, light ghost
          : Math.max(0.1, 0.7 - progress * 0.5);  // dark: 0.1–0.7, subtle fade

        ctx.fillStyle = day
          ? `rgba(234, 88, 12, ${alpha})`   // orange-600, semi-transparent
          : `rgba(147, 51, 234, ${alpha})`; // purple-600, classic

        ctx.fillText(text, x, y);

        if (y > canvas.height && Math.random() > 0.975) {
          drops[i] = 0;
        }
        drops[i]++;
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
