import { useNavigate, useLocation } from "react-router-dom";
import NavItem from "../ui/NavItem";
import ThemeToggle from "../ui/ThemeToggle";
import MainLogo from "../../assets/MainLogo.png";
import { useAuth } from "../context/AuthContext";
import {
    LayoutDashboard,
    Package,
    Boxes,
    ShoppingCart,
    Truck,
    Handshake,
    BarChart3,
    Settings,
    LogOut,
    X,
    ClipboardList,
    UserCog
} from "lucide-react";

export default function Sidebar({ isOpen, onClose }) {
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuth();
    const role = user?.role?.replace("ROLE_", "").toUpperCase() || "";

    const navSections = [
        {
            title: null,
            items: [
                { label: "Dashboard", icon: <LayoutDashboard size={18} />, path: "/main" }
            ]
        },
        {
            title: "OPERATIONS",
            items: [
                { label: "Products", icon: <Package size={18} />, path: "/products" },
                { label: "Categories", icon: <Boxes size={18} />, path: "/inventory" },
                { label: "Sales", icon: <ShoppingCart size={18} />, path: "/sales", roles: ["ADMIN", "MANAGER", "CASHIER"] },
                { label: "Suppliers", icon: <Truck size={18} />, path: "/suppliers", roles: ["ADMIN", "MANAGER", "INVENTORY_CLERK"] },
                { label: "Product Suppliers", icon: <Handshake size={18} />, path: "/product-suppliers", roles: ["ADMIN", "MANAGER"] }
            ]
        },
        {
            title: "REPORTS",
            items: [
                { label: "Reports", icon: <BarChart3 size={18} />, path: "/reports", roles: ["ADMIN", "MANAGER"] },
                { label: "Inventory Logs", icon: <ClipboardList size={18} />, path: "/inventory-logs", roles: ["ADMIN", "MANAGER", "INVENTORY_CLERK"] }
            ]
        },
        {
            title: "SYSTEM",
            items: [
                { label: "Members", icon: <UserCog size={18} />, path: "/members", roles: ["ADMIN", "MANAGER"] },
                { label: "Settings", icon: <Settings size={18} />, path: "/settings" }
            ]
        }
    ];

    const parsedSections = navSections.map(section => {
        const filtered = section.items.filter(item => !item.roles || item.roles.includes(role));
        return {
            ...section,
            items: filtered
        };
    }).filter(section => section.items.length > 0);

    const { logout } = useAuth();

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    return (
        <>
            {/* BACKDROP FOR MOBILE */}
            {isOpen && (
                <div 
                    onClick={onClose}
                    className="fixed inset-0 bg-black/70 z-40 lg:hidden animate-fade-in"
                />
            )}

            {/* SIDEBAR */}
            <aside className={`
                fixed top-0 left-0 z-50
                w-[min(20rem,88vw)] h-dvh lg:w-72
                lg:top-4 lg:left-4 lg:h-[calc(100vh-2rem)]
                bg-[var(--sidebar-bg)]
                lg:rounded-[28px] border-r lg:border border-[var(--sidebar-border)]
                shadow-[var(--shadow)]
                flex flex-col
                transition-transform duration-300 ease-out will-change-transform
                ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
            `}>

                {/* BRAND */}
                <div className="flex items-center justify-between gap-3 px-4 py-4 sm:px-5 sm:py-5">
                    <div className="flex items-center gap-3">
                        <img
                            src={MainLogo}
                            alt="SariStore Logo"
                            className="w-10 h-10 object-contain rounded-md"
                        />

                        <div className="leading-tight">
                            <h1 className="text-[var(--text-h)] font-semibold">
                                SariStore IMS
                            </h1>
                            <p className="text-xs text-[var(--muted)]">
                                Inventory System
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <ThemeToggle />
                        {/* CLOSE BUTTON FOR MOBILE */}
                        <button 
                            onClick={onClose}
                            className="min-h-11 min-w-11 rounded-lg hover:bg-[var(--input-bg)] text-[var(--muted)] lg:hidden transition inline-flex items-center justify-center"
                            aria-label="Close navigation"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* NAV */}
                <nav className="scrollbar-hidden flex-1 overscroll-contain scroll-smooth px-3 py-3 sm:py-4 space-y-5 overflow-y-auto">
                    {parsedSections.map((section, idx) => (
                        <div key={idx} className="space-y-1.5">
                            {section.title && (
                                <h3 className="px-3 text-[10px] font-bold tracking-wider text-[var(--sidebar-muted)] uppercase">
                                    {section.title}
                                </h3>
                            )}
                            <div className="space-y-1">
                                {section.items.map((item) => (
                                    <NavItem
                                        key={item.label}
                                        label={item.label}
                                        icon={item.icon}
                                        active={location.pathname === item.path}
                                        onClick={() => {
                                            navigate(item.path);
                                            if (onClose) onClose();
                                        }}
                                    />
                                ))}
                            </div>
                        </div>
                    ))}
                </nav>

                {/* BOTTOM SECTION */}
                <div className="p-3 space-y-2">
                    {/* LOGOUT */}
                    <button
                        onClick={handleLogout}
                        className="
                            w-full flex items-center gap-3
                            min-h-11 px-3 py-2 rounded-lg
                            text-red-400
                            hover:bg-red-500/10
                            transition
                        "
                    >
                        <LogOut size={18} />
                        <span className="text-sm">Logout</span>
                    </button>
                </div>

            </aside>
        </>
    );
}
