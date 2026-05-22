import React from "react";
import { Tag, Edit3, Trash2 } from "lucide-react";

export default function CategoryCard({ category, index, canEdit, canDelete, onEdit, onDelete }) {
    const id = category.id || category.categoryId || category.category_id;
    // Beautiful procedural gradients for class aesthetics
    const hue = (index * 45) % 360;
    const gradColor = `hsla(${hue}, 70%, 50%, 0.15)`;

    return (
        <div 
            style={{ borderLeftColor: `hsla(${hue}, 70%, 50%, 0.8)` }}
            className="
                group relative
                p-5 rounded-xl
                bg-[var(--card-bg)]
                border border-[var(--border)] border-l-[4px]
                hover:border-l-[6px]
                transition-all duration-300
                flex flex-col justify-between
                hover:shadow-[var(--shadow)]
            "
        >
            <div>
                <div className="flex items-start justify-between mb-3">
                    <div 
                        style={{ backgroundColor: gradColor }}
                        className="p-2.5 rounded-lg flex items-center justify-center"
                    >
                        <Tag style={{ color: `hsla(${hue}, 80%, 60%, 1)` }} size={18} />
                    </div>

                    {/* ACTION BUTTONS */}
                    <div className="flex items-center gap-1.5 opacity-80 group-hover:opacity-100 transition">
                        {canEdit && (
                            <button
                                onClick={() => onEdit(category)}
                                className="p-1.5 rounded hover:bg-[var(--input-bg)] text-[var(--muted)] hover:text-[var(--text-h)] transition"
                                title="Edit Category"
                            >
                                <Edit3 size={14} />
                            </button>
                        )}
                        {canDelete && (
                            <button
                                onClick={() => onDelete(category)}
                                className="p-1.5 rounded hover:bg-red-500/10 text-[var(--muted)] hover:text-red-400 transition"
                                title="Delete Category"
                            >
                                <Trash2 size={14} />
                            </button>
                        )}
                    </div>
                </div>

                <h3 className="font-semibold text-base text-[var(--text-h)] mb-1 group-hover:text-[var(--accent)] transition">
                    {category.name}
                </h3>
                <p className="text-sm text-[var(--muted)] leading-relaxed line-clamp-3">
                    {category.description || "No description provided."}
                </p>
            </div>
            
            <div className="mt-4 pt-3 border-t border-[var(--border)] flex justify-between items-center text-xs text-[var(--muted)]">
                <span>ID: <code className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--input-bg)] text-[var(--text-h)]">{id}</code></span>
            </div>
        </div>
    );
}
