import { useState, useEffect } from "react";
import { Folder, X, Loader2 } from "lucide-react";

export default function CategoryModal({ isOpen, onClose, selectedCategory, onSave, loading }) {
    const [form, setForm] = useState({ name: "", description: "" });

    useEffect(() => {
        if (selectedCategory) {
            setForm({
                name: selectedCategory.name || "",
                description: selectedCategory.description || ""
            });
        } else {
            setForm({ name: "", description: "" });
        }
    }, [selectedCategory, isOpen]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!form.name.trim()) return;
        onSave({
            name: form.name.trim(),
            description: form.description.trim() || null
        });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50 p-0 sm:items-center sm:p-4">
            <div className="w-full max-w-md p-4 sm:p-6 rounded-t-2xl sm:rounded-xl bg-[var(--card-bg)] border border-[var(--border)] shadow-2xl max-h-[92dvh] overflow-y-auto">
                <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-2">
                        <Folder className="text-[var(--accent)]" size={20} />
                        <h2 className="text-lg font-semibold text-[var(--text-h)]">
                            {selectedCategory ? "Edit Category" : "Add Category"}
                        </h2>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={loading}
                        className="p-1 rounded hover:bg-[var(--input-bg)] transition"
                    >
                        <X size={20} className="text-[var(--muted)]" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm text-[var(--muted)] mb-1.5">Category Name *</label>
                        <input
                            type="text"
                            required
                            placeholder="e.g. Beverages, Canned Goods"
                            value={form.name}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                            className="w-full px-3 py-2.5 rounded-lg bg-[var(--input-bg)] border border-[var(--border)] text-[var(--text-h)] text-sm focus:outline-none"
                        />
                    </div>

                    <div>
                        <label className="block text-sm text-[var(--muted)] mb-1.5">Description</label>
                        <textarea
                            placeholder="Enter category description..."
                            rows="3"
                            value={form.description}
                            onChange={(e) => setForm({ ...form, description: e.target.value })}
                            className="w-full px-3 py-2.5 rounded-lg bg-[var(--input-bg)] border border-[var(--border)] text-[var(--text-h)] text-sm focus:outline-none resize-none"
                        />
                    </div>

                    <div className="sticky bottom-0 -mx-4 mt-6 flex flex-col gap-3 border-t border-[var(--border)] bg-[var(--card-bg)] px-4 pt-4 sm:static sm:mx-0 sm:flex-row sm:justify-end sm:bg-transparent sm:px-0">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={loading}
                            className="px-4 py-2.5 text-sm font-medium rounded-lg text-[var(--muted)] hover:bg-[var(--input-bg)] transition"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading || !form.name.trim()}
                            className="
                                flex items-center justify-center gap-2
                                px-5 py-2.5 text-sm font-medium rounded-lg
                                bg-[var(--accent)] text-[var(--accent-text)]
                                hover:opacity-90 transition disabled:opacity-50
                            "
                        >
                            {loading && <Loader2 size={16} className="animate-spin" />}
                            {selectedCategory ? "Save Changes" : "Create"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
