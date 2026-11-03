import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const [dark, setDark] = useState(true);
  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, []);
  const toggle = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
  };
  return (
    <button
      onClick={toggle}
      aria-label="Mudar tema"
      className="glass fixed right-4 top-4 z-50 grid h-10 w-10 place-items-center rounded-full text-primary"
    >
      {dark ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}
