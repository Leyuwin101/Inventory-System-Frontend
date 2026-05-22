import { Navigate } from "react-router-dom";
import { useAuth } from "../components/context/AuthContext";

export default function ProtectedRoute({ children, allowedRoles }) {
    const { user, authLoading, authHydrated } = useAuth();

    if (!authHydrated || authLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[var(--bg)] text-[var(--text)]">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-10 h-10 border-4 border-[var(--accent)] border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-sm text-[var(--muted)]">Verifying session...</p>
                </div>
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    const role = user?.role?.replace("ROLE_", "").toUpperCase() || "";
    if (allowedRoles && !allowedRoles.includes(role)) {
        return <Navigate to="/main" replace />;
    }

    return children;
}
