import { Download, FileText } from "lucide-react";

export default function ExportButtons({ onCsv, onPdf, disabled = false, className = "" }) {
    return (
        <div className={`flex w-full items-center gap-2 sm:w-auto ${className}`}>
            <button
                type="button"
                onClick={onCsv}
                disabled={disabled}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--card-bg)] px-3 py-2 text-sm font-semibold text-[var(--text-h)] transition hover:bg-[var(--input-bg)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/40 disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none"
            >
                <Download size={16} />
                CSV
            </button>
            <button
                type="button"
                onClick={onPdf}
                disabled={disabled}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--card-bg)] px-3 py-2 text-sm font-semibold text-[var(--text-h)] transition hover:bg-[var(--input-bg)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/40 disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none"
            >
                <FileText size={16} />
                PDF
            </button>
        </div>
    );
}
