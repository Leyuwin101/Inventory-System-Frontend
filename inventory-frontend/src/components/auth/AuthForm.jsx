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
            const message = err.response?.data?.message || err.response?.data?.error;

            if (status >= 500) {
                setError(message || "Login server error. Please check the backend logs.");
            } else if (err.message === "Cannot store missing auth tokens") {
                setError("Login response did not include valid tokens.");
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
                min-h-auto sm:min-h-[70vh]

                bg-[var(--card-bg)]
                border border-[var(--border)]
                rounded-2xl

                p-6 sm:p-8 lg:p-10

                shadow-[var(--shadow)]

                flex flex-col justify-center
            "
        >
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                <h2 className="
                    text-xl sm:text-2xl lg:text-3xl
                    font-bold text-[var(--text-h)]
                ">
                    Welcome To SariStore IMS
                </h2>

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
