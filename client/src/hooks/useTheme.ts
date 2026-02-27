import { useState, useEffect } from "react";

type Theme = "matrix" | "day";

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem("site-theme");
    return (saved === "day" || saved === "matrix") ? saved : "matrix";
  });

  useEffect(() => {
    if (theme === "day") {
      document.documentElement.setAttribute("data-theme", "day");
    } else {
      document.documentElement.removeAttribute("data-theme");
    }
    localStorage.setItem("site-theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === "matrix" ? "day" : "matrix");
  };

  return { theme, toggleTheme };
}
