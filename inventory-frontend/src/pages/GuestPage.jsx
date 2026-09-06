import { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { login } from "../api/auth";
import { useAuth } from "../components/context/AuthContext";

export default function GuestPage() {
    const navigate = useNavigate();
    const { completeLogin, user, authHydrated } = useAuth();
    const [error, setError] = useState("");

    useEffect(() => {
        if (!authHydrated) return;

        if (user) {
            navigate("/main", { replace: true });
            return;
        }

        let active = true;

        const enterAsGuest = async () => {
            try {
                const authData = await login("Guest", "Guest");
                if (!active) return;

                await completeLogin(authData);
                navigate("/main", { replace: true });
            } catch (err) {
                if (!active) return;
                const message = err.response?.data?.message || err.response?.data?.details || err.response?.data?.error;
                setError(message || "Guest access is temporarily unavailable.");
            }
        };

        enterAsGuest();

        return () => {
            active = false;
        };
    }, [authHydrated, completeLogin, navigate, user]);

    if (authHydrated && user) {
        return <Navigate to="/main" replace />;
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-[var(--bg)] px-4 text-[var(--text)]">
            <div className="flex flex-col items-center gap-3 text-center">
                <div className="w-10 h-10 border-4 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-[var(--muted)]">
                    {error || "Opening Guest access..."}
                </p>
            </div>
        </div>
    );
}
