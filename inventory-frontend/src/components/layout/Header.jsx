import { memo } from "react";
import { useAuth } from "../context/AuthContext";
import { User, Mail, Shield, Menu } from "lucide-react";

const isEmailLike = (value = "") => String(value).includes("@");
const isRoleLike = (value = "") => {
    const normalized = String(value || "").replace("ROLE_", "").toUpperCase();
    return ["ADMIN", "MANAGER", "CASHIER", "INVENTORY_CLERK", "STANDARD_USER", "MEMBER"].includes(normalized);
};
const getMemberName = (user = {}) => {
    const value = String(user.username || user.name || "").trim();
    return value && !isEmailLike(value) && !isRoleLike(value) ? value : "";
};

function Header({ onMenuClick }) {
    const { user, loading } = useAuth();
    const memberName = getMemberName(user);

    if (loading || (user && !memberName)) return (
        <div className="w-full mb-4 sm:mb-6 p-4 sm:p-5 rounded-xl bg-[var(--card-bg)] border border-[var(--border)] animate-pulse">
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-[var(--border)] rounded-xl"></div>
                <div className="flex-1 space-y-2">
                    <div className="h-4 w-32 bg-[var(--border)] rounded"></div>
                    <div className="h-3 w-48 bg-[var(--border)] rounded"></div>
                </div>
            </div>
        </div>
    );

    if (!user) return null;

    const initials = memberName
        ? memberName.split(" ").map((n) => n[0]).join("")
        : user.email?.[0]?.toUpperCase() || "?";

    return (
        <div
            className="
                w-full mb-4 sm:mb-6
                p-3 sm:p-4 md:p-5
                rounded-lg
                bg-[var(--card-bg)]
                border border-[var(--border)]
                shadow-[var(--shadow)]
                flex flex-col items-stretch justify-between sm:flex-row sm:items-center
                gap-3 sm:gap-4
            "
        >
            {/* LEFT SIDE - USER INFO */}
            <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                {/* HAMBURGER TRIGGER FOR MOBILE */}
                <button
                    onClick={onMenuClick}
                    className="lg:hidden min-h-11 min-w-11 rounded-md hover:bg-[var(--input-bg)] text-[var(--muted)] hover:text-[var(--text-h)] border border-[var(--border)] transition flex-shrink-0 inline-flex items-center justify-center"
                    aria-label="Open navigation"
                >
                    <Menu size={20} />
                </button>

                {/* AVATAR */}
                <div
                    className="
                        w-10 h-10 sm:w-12 sm:h-12
                        rounded-lg
                        bg-[var(--accent)]
                        flex items-center justify-center
                        text-[var(--accent-text)]
                        font-bold text-base sm:text-lg
                        uppercase
                        flex-shrink-0
                    "
                >
                    {initials}
                </div>

                {/* USER DETAILS */}
                <div className="leading-tight min-w-0">
                    <div className="flex items-center gap-2">
                        <User size={14} className="text-[var(--muted)] hidden sm:block" />
                        <p className="text-base sm:text-lg md:text-xl font-semibold text-[var(--text-h)] truncate">
                            {memberName ? `Welcome, ${memberName}` : "Welcome"}
                        </p>
                    </div>

                    <div className="flex items-center gap-2 mt-1">
                        <Mail size={12} className="text-[var(--muted)] flex-shrink-0" />
                        <p className="text-xs sm:text-sm text-[var(--muted)] truncate">
                            {user.email}
                        </p>
                    </div>
                </div>
            </div>

            {/* RIGHT SIDE - ROLE BADGE */}
            <div className="flex items-center gap-2 sm:gap-3 sm:justify-end">
                <div className="flex items-center gap-2 px-2.5 py-2 sm:px-3 rounded-lg bg-[var(--input-bg)] border border-[var(--border)]">
                    <Shield size={14} className="text-[var(--accent)]" />
                    <span
                        className="
                            text-xs sm:text-sm
                            font-medium
                            text-[var(--text-h)]
                            whitespace-nowrap
                            capitalize
                        "
                    >
                        {user.role}
                    </span>
                </div>
            </div>
        </div>
    );
}

export default memo(Header);
