export default function Card({ title, value, icon, children }) {
    return (
        <div
        className="
            p-4 sm:p-5 rounded-lg
            border border-[var(--border)]
            bg-[var(--card-bg)]
            shadow-[var(--shadow)]
            transition-all duration-200
        "
        >
        {/* HEADER */}
        <div className="flex items-center justify-between">
            {title && (
            <h3 className="text-sm text-[var(--muted)]">{title}</h3>
            )}

            {icon && (
            <span className="text-[var(--accent)]">
                {icon}
            </span>
            )}
        </div>

        {/* VALUE */}
        {value && (
            <p className="text-xl md:text-2xl font-semibold text-[var(--text-h)] mt-2">
            {value}
            </p>
        )}

        {children}
        </div>
    );
}
