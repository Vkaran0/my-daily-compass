import { useEffect, useState } from "react";

export type Theme = "light" | "dark" | "system";
const KEY = "cadence-theme";
const CHANGE_EVENT = "cadence-theme-change";

export function getTheme(): Theme {
  if (typeof window === "undefined") return "system";
  const saved = localStorage.getItem(KEY);
  return saved === "light" || saved === "dark" || saved === "system" ? saved : "system";
}

export function applyTheme(t: Theme = getTheme()) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, t);
  const dark = t === "dark" || (t === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.classList.toggle("dark", dark);
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function useAppTheme(): [Theme, (theme: Theme) => void] {
  const [theme, setTheme] = useState<Theme>("system");

  useEffect(() => {
    const syncTheme = () => setTheme(getTheme());
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    window.addEventListener(CHANGE_EVENT, syncTheme);
    window.addEventListener("storage", syncTheme);
    media.addEventListener("change", syncTheme);
    applyTheme(getTheme());
    syncTheme();

    return () => {
      window.removeEventListener(CHANGE_EVENT, syncTheme);
      window.removeEventListener("storage", syncTheme);
      media.removeEventListener("change", syncTheme);
    };
  }, []);

  return [theme, applyTheme];
}
