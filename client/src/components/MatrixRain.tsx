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
    const fontSize = 14;

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

      // Trail fill: fades old characters so rain columns persist visibly
      ctx.fillStyle = day
        ? "rgba(255, 255, 255, 0.25)" // Day: white fade — canvas stays white, chars stay bold
        : "rgba(0, 0, 0, 0.05)";      // Dark: black fade — classic rain trail
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.font = `${fontSize}px monospace`;

      for (let i = 0; i < drops.length; i++) {
        const text = letters[Math.floor(Math.random() * letters.length)];
        const x = i * fontSize;
        const y = drops[i] * fontSize;

        const progress = y / canvas.height;
        const alpha = day
          ? Math.max(0.6, 1 - progress * 0.3)   // day: 0.7–1.0, always bold
          : Math.max(0.2, 1 - progress * 0.5);   // dark: 0.2–1.0, classic fade

        ctx.fillStyle = day
          ? `rgba(234, 88, 12, ${alpha})`          // orange-600 — high contrast on white
          : `rgba(147, 51, 234, ${alpha})`;         // purple-600 — bright on black

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
      className={`absolute inset-0 w-full h-full ${className}`}
      data-testid="canvas-matrix-rain"
    />
  );
}
