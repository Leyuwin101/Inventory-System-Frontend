import { useState } from "react";
import { login } from "../../api/auth.js";
import { useAuth } from "../context/AuthContext";
import AuthInput from "./AuthInput";
import AuthButton from "./AuthButton";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

export default function AuthForm() {
    const navigate = useNavigate();
    const { completeLogin } = useAuth();

    const [loginId, setLoginId] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();

        setError("");
        setLoading(true);

        try {
            const authData = await login(loginId, password);

            await completeLogin(authData);

            navigate("/main", { replace: true });
        } catch (err) {
            const status = err.response?.status;
            const message = err.response?.data?.message || err.response?.data?.details || err.response?.data?.error;

            if (status >= 500) {
                setError("Login is temporarily unavailable. Please try again in a moment.");
            } else if (err.message === "Cannot store missing access token") {
                setError("Login response did not include a valid access token.");
            } else if (status === 0 || err.code === "ERR_NETWORK") {
                setError("Cannot reach the authentication server. Please check your connection.");
            } else {
                setError(message || "Invalid email or password");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="
                w-full max-w-md sm:max-w-lg
                min-h-auto sm:min-h-[68vh]

                bg-[var(--card-bg)]
                border border-[var(--border)]
                rounded-2xl

                p-6 sm:p-8 lg:p-10

                shadow-[0_24px_70px_-28px_rgba(16,185,129,0.45),var(--shadow)]

                flex flex-col justify-center
            "
        >
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                <div>
                    <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-[var(--accent)]">Inventory Management</p>
                    <h2 className="
                        text-2xl sm:text-3xl
                        font-bold text-[var(--text-h)]
                    ">
                        Welcome to SariStore IMS
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                        Use the account created by your administrator to access inventory, sales, reports, and stock movement.
                    </p>
                </div>

                <AuthInput
                    label="Username or Email"
                    type="text"
                    value={loginId}
                    onChange={(e) => setLoginId(e.target.value)}
                    placeholder="username or example@company.com"
                />

                <AuthInput
                    label="Password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                />

                {error && (
                    <div className="text-xs text-red-400 -mt-2">
                        {error}
                    </div>
                )}

                <div className="pt-3">
                    <AuthButton loading={loading} type="submit">
                        Login
                    </AuthButton>
                </div>
            </form>
        </motion.div>
    );
}
