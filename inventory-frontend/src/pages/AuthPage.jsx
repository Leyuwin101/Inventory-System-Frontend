import AuthForm from "../components/auth/AuthForm";
import AuthVisualPanel from "../components/auth/AuthVisualPanel";
import { motion } from "framer-motion";
import { useAuth } from "../components/context/AuthContext";

export default function AuthPage() {
    const { authLoading, authHydrated } = useAuth();

    if (!authHydrated || authLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[var(--bg)] text-[var(--text)]">
                <div className="w-10 h-10 border-4 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="auth-theme">
            <div
                className="
                    min-h-screen w-full
                    bg-[var(--bg)] text-[var(--text)]
                    font-[var(--sans)]
                    flex items-center justify-center
                    px-3 sm:px-6 lg:px-10
                    py-3 sm:py-8
                "
            >
                <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4 }}
                    className="
                        w-full max-w-6xl
                        min-h-[auto] md:min-h-[88vh]
                        flex flex-col md:flex-row
                        border border-[var(--border)]
                        shadow-[0_30px_90px_-35px_rgba(0,0,0,0.75)]
                        rounded-xl sm:rounded-2xl
                        overflow-hidden
                        bg-[var(--card-bg)]
                    "
                >
                    <div className="w-full md:w-1/2 flex items-center justify-center px-3 py-5 sm:px-8 sm:py-8">
                        <AuthForm />
                    </div>

                    <div className="hidden w-full md:w-1/2 md:flex min-h-[50vh] md:min-h-full">
                        <AuthVisualPanel />
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
