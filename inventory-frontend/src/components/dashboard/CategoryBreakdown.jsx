import { Link } from "react-router-dom";
import { Folder, ArrowRight } from "lucide-react";

export default function CategoryBreakdown({ products = [], categories = [] }) {
    const totalProducts = products.length;

    // Map and count categories
    const items = categories.map((cat, idx) => {
        const catId = cat.id || cat.categoryId || cat.category_id;
        const count = products.filter((p) => {
            const pCatId = p.categoryId || p.category_id || p.category?.id || p.category?.categoryId || p.category_id;
            return pCatId === catId || p.categoryName === cat.name;
        }).length;

        return {
            id: catId || idx,
            name: cat.name,
            count
        };
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, 5); // top 5 categories

    if (categories.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-8 rounded-xl border border-[var(--border)] bg-[var(--card-bg)] text-center h-full">
                <Folder size={32} className="text-[var(--muted)] mb-2" />
                <h4 className="text-sm font-medium text-[var(--text-h)]">No categories defined</h4>
                <p className="text-xs text-[var(--muted)] mt-1">Classification tags will appear here.</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full justify-between">
            <div className="space-y-4">
                {items.map((item) => {
                    const percentage = totalProducts > 0 ? Math.round((item.count / totalProducts) * 100) : 0;
                    
                    return (
                        <div key={item.id} className="space-y-1.5">
                            <div className="flex justify-between text-xs">
                                <span className="font-semibold text-[var(--text-h)] truncate max-w-[70%]">
                                    {item.name}
                                </span>
                                <span className="text-[var(--muted)] font-mono">
                                    {item.count} items ({percentage}%)
                                </span>
                            </div>
                            
                            {/* PROGRESS BAR */}
                            <div className="w-full h-2 rounded-full bg-[var(--input-bg)] overflow-hidden">
                                <div 
                                    style={{ width: `${percentage}%` }}
                                    className="h-full rounded-full bg-[var(--accent)] transition-all duration-500"
                                />
                            </div>
                        </div>
                    );
                })}
            </div>

            <Link
                to="/inventory"
                className="
                    mt-4 pt-3 border-t border-[var(--border)]
                    text-xs font-medium text-[var(--accent)] hover:underline
                    flex items-center justify-center gap-1.5 transition-colors
                "
            >
                Manage stock categories
                <ArrowRight size={12} />
            </Link>
        </div>
    );
}
