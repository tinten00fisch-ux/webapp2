import { useState, useEffect } from "react";

const DEFAULT_THEME = {
  primaryColor: "#4A90E2",
  bgColor: "#F9FAFB",
  headerBgColor: "#FFFFFF",
};

function useTheme() {
  const [theme, setThemeState] = useState(DEFAULT_THEME);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("app-theme");
      if (saved) {
        setThemeState({ ...DEFAULT_THEME, ...JSON.parse(saved) });
      }
    } catch {}
  }, []);

  const setTheme = (updates) => {
    const newTheme = { ...theme, ...updates };
    setThemeState(newTheme);
    try {
      localStorage.setItem("app-theme", JSON.stringify(newTheme));
    } catch {}
  };

  const resetTheme = () => {
    setThemeState(DEFAULT_THEME);
    try {
      localStorage.removeItem("app-theme");
    } catch {}
  };

  return { theme, setTheme, resetTheme };
}

export default useTheme;
