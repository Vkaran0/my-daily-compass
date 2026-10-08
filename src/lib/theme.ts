export type Theme = "light" | "dark" | "system";
const KEY = "cadence-theme";

export function getTheme(): Theme {
  if (typeof window === "undefined") return "system";
  return (localStorage.getItem(KEY) as Theme) || "system";
}

export function applyTheme(t: Theme = getTheme()) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, t);
  const dark = t === "dark" || (t === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.classList.toggle("dark", dark);
}
