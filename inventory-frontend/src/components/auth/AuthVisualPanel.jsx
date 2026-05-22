import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import MainLogo from "../../assets/MainLogo.png";

const messages = [
    "Track sari-sari store stocks instantly",
    "Never run out of best-selling items",
    "Smart inventory for small neighborhood stores",
    "Fast and accurate tindahan monitoring",
];
export default function AuthVisualPanel() {
    const [index, setIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setIndex((prev) => (prev + 1) % messages.length);
        }, 2500);

        return () => clearInterval(interval);
    }, []);

    return (
        <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="
                w-full h-full
                flex flex-col
                relative overflow-hidden
                px-6 sm:px-10 py-8

                bg-gradient-to-br
                from-[var(--bg)]
                via-[color-mix(in_srgb,var(--bg)_85%,white)]
                to-[var(--bg)]
                text-[var(--text)]
            "
        >
            <div className="absolute inset-0 bg-white/5" />
            <div className="absolute top-[-140px] h-[420px] w-[420px] rounded-full bg-[var(--accent)] opacity-8" />
            <div className="absolute bottom-[-160px] right-[-100px] h-[340px] w-[340px] rounded-full bg-emerald-400 opacity-5" />

            {/* HEADER */}
            <div className="z-10 flex items-center gap-3">
                <img
                    src={MainLogo}
                    alt="Logo"
                    className="w-8 h-8 object-contain"
                />
                <h2 className="text-lg font-semibold text-[var(--text-h)]">
                    Sari Sari Store Inventory Management System
                </h2>
            </div>

            {/* MAIN CONTENT */}
            <div className="z-10 flex flex-col justify-center flex-1 max-w-md">

                <div className="w-full max-w-[520px] min-h-[180px] flex items-center">
                    <div className="w-full max-w-[520px] min-h-[180px] flex items-center">
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4 }}
                            className="
                                w-full
                                break-words

                                text-3xl sm:text-4xl lg:text-4xl
                                font-bold
                                text-[var(--text-h)]
                                leading-tight
                            "
                        >
                            {messages[index]}
                        </motion.div>
                    </div>
                </div>

                {/* description */}
                <p className="
                    mt-3
                    text-sm sm:text-lg lg:text-xl
                    text-[var(--text)]
                    opacity-60
                    leading-relaxed
                ">
                    Designed for retail, warehouse, and logistics teams that need speed and accuracy in every operation.
                </p>

            </div>
        </motion.div>
    );
}
