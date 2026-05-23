export default function AuthButton({ children, loading, ...props }) {
    return (
        <button
            disabled={loading}
            className="
                w-full
                py-3 sm:py-3.5

                rounded-xl

                bg-[var(--accent)]
                text-[var(--accent-text)]

                font-semibold

                shadow-[var(--shadow)]

                hover:scale-[1.01]
                hover:shadow-[0_16px_36px_-18px_rgba(16,185,129,0.75)]
                focus:outline-none
                focus:ring-2
                focus:ring-emerald-500/40
                focus:ring-offset-2
                focus:ring-offset-[var(--card-bg)]
                active:scale-[0.98]

                transition-all duration-200

                text-sm sm:text-base

                disabled:opacity-60
                disabled:cursor-not-allowed
            "
            {...props}

        >
            {loading ? "Logging In..." : children}
        </button>
    );
}
