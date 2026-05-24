export default function NavItem({ label, icon, onClick, active }) {
    return (
        <button
        onClick={onClick}
        className={`
            w-full min-h-11 flex items-center gap-3 px-3.5 py-2.5 rounded-lg
            transition-all duration-200 relative overflow-hidden group
            hover:bg-[var(--sidebar-hover)] hover:text-[var(--text-h)]
            ${
            active
                ? "bg-[var(--sidebar-active)] text-[var(--text-h)] font-semibold"
                : "text-[var(--sidebar-text)]"
            }
        `}
        >
        <span className={`transition-transform duration-200 group-hover:scale-110 ${active ? "text-[var(--accent)]" : "text-inherit"}`}>
            {icon}
        </span>
        <span className="truncate text-sm">{label}</span>
        </button>
    );
}
