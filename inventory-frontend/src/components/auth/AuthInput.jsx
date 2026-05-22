import React from "react";

export default function AuthInput({
    label,
    type = "text",
    value,
    onChange,
    placeholder
}) {
    return (
        <div className="flex flex-col gap-1">
            <label className="text-sm text-[var(--muted)]">
                {label}
            </label>

            <input
                type={type}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                className="
                    w-full
                    px-4 py-3 sm:py-3.5

                    rounded-lg

                    bg-[var(--input-bg)]
                    border border-[var(--border)]

                    text-[var(--text-h)]
                    text-sm sm:text-base

                    placeholder:text-[rgba(209,250,229,0.45)]

                    focus:border-[var(--accent)]
                    focus:ring-2 focus:ring-emerald-500/20

                    outline-none
                "
            />
        </div>
    );
}