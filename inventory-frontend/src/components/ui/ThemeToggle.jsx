import { useTheme } from "../context/ThemeContext";

export default function ThemeToggle() {
    const { theme, setTheme } = useTheme();

    const isDark = theme === "dark";

    return (
        <button
            onClick={() =>
                setTheme(prev => (prev === "dark" ? "light" : "dark"))
            }
            className={`
                relative w-14 h-7 flex items-center rounded-full transition-colors duration-300
                ${isDark ? "bg-[#1f1f23]" : "bg-gray-200"}
            `}
        >
            <div
                className={`
                    absolute w-6 h-6 rounded-full shadow-md transform transition-transform duration-300
                    ${isDark
                        ? "translate-x-1 bg-[#34C759]"
                        : "translate-x-7 bg-white"
                    }
                `}
            />
        </button>
    );
}