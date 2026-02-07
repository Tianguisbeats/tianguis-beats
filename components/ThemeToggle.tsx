"use client";

import { useTheme } from "@/context/ThemeContext";
import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

export default function ThemeToggle() {
    const { theme, toggleTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return <div className="w-12 h-12" />;

    return (
        <button
            onClick={toggleTheme}
            className="w-12 h-12 flex items-center justify-center rounded-xl bg-accent-soft text-foreground hover:bg-slate-200 dark:hover:bg-slate-800 transition-all active:scale-95"
            aria-label="Cambiar tema"
        >
            {theme === "light" ? (
                <Moon className="w-6 h-6" />
            ) : (
                <Sun className="w-6 h-6" />
            )}
        </button>
    );
}
