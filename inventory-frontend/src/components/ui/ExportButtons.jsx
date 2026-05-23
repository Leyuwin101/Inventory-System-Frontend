import { Download, FileText } from "lucide-react";

export default function ExportButtons({ onCsv, onPdf, disabled = false, className = "" }) {
    return (
        <div className={`flex items-center gap-2 ${className}`}>
            <button
                type="button"
                onClick={onCsv}
                disabled={disabled}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--card-bg)] px-3 py-2 text-sm font-semibold text-[var(--text-h)] transition hover:bg-[var(--input-bg)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/40 disabled:cursor-not-allowed disabled:opacity-50"
            >
                <Download size={16} />
                CSV
            </button>
            <button
                type="button"
                onClick={onPdf}
                disabled={disabled}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--card-bg)] px-3 py-2 text-sm font-semibold text-[var(--text-h)] transition hover:bg-[var(--input-bg)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/40 disabled:cursor-not-allowed disabled:opacity-50"
            >
                <FileText size={16} />
                PDF
            </button>
        </div>
    );
}
