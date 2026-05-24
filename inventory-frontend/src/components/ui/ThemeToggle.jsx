import { useTheme } from "../context/ThemeContext";

export default function ThemeToggle() {
    const { theme, setTheme } = useTheme();

    const isDark = theme === "dark";

    return (
        <label className="relative inline-block h-[1.8em] w-[3.7em] text-[11px]" aria-label="Toggle theme">
            <input
                type="checkbox"
                checked={isDark}
                onChange={() => setTheme((prev) => (prev === "dark" ? "light" : "dark"))}
                className="peer h-0 w-0 opacity-0"
            />
            <span
                className="
                    absolute inset-0 cursor-pointer rounded-[30px] border border-[var(--sidebar-border)]
                    bg-[var(--sidebar-hover)] transition-colors duration-200
                    peer-checked:bg-[var(--sidebar-active)]
                    peer-focus-visible:ring-1 peer-focus-visible:ring-[var(--accent)]
                "
            />
            <span
                className="
                    pointer-events-none absolute bottom-[0.2em] left-[0.2em]
                    h-[1.4em] w-[1.4em] rounded-[20px] bg-[var(--sidebar-muted)]
                    shadow-[0_2px_6px_rgba(0,0,0,0.22)] transition duration-300
                    peer-checked:translate-x-[1.9em] peer-checked:bg-[var(--accent)]
                "
            />
        </label>
    );
}
