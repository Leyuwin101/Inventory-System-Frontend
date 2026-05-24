import { Link } from "react-router-dom";
import { Package, ArrowRight, ShieldCheck } from "lucide-react";

export default function LowStockAlerts({ lowStockProducts = [] }) {
    if (lowStockProducts.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-8 rounded-xl border border-[var(--border)] bg-[var(--card-bg)] text-center h-full">
                <ShieldCheck size={36} className="text-emerald-400 mb-2 animate-bounce" />
                <h4 className="text-sm font-medium text-[var(--text-h)]">Inventory well stocked</h4>
                <p className="text-xs text-[var(--muted)] mt-1">No products are currently low in stock.</p>
            </div>
        );
    }

    // Sort by stock ascending (worst first), slice top 5
    const productsToRender = [...lowStockProducts]
        .sort((a, b) => (a.stock || 0) - (b.stock || 0))
        .slice(0, 5);

    return (
        <div className="flex flex-col h-full justify-between">
            <div className="divide-y divide-[var(--border)]">
                {productsToRender.map((p, idx) => {
                    const id = p.id || p.productId || p.product_id;
                    const stock = p.stock || 0;
                    
                    return (
                        <div key={id || idx} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3 min-w-0">
                                <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400">
                                    <Package size={16} />
                                </div>
                                <div className="min-w-0">
                                    <h4 className="text-xs font-semibold text-[var(--text-h)] truncate">
                                        {p.name}
                                    </h4>
                                    <p className="text-[10px] text-[var(--muted)] truncate mt-0.5">
                                        SKU: {p.sku || "N/A"} | Category: {p.categoryName || p.category?.name || "Uncategorized"}
                                    </p>
                                </div>
                            </div>

                            <div className="text-right flex-shrink-0">
                                <span className={`
                                    text-xs font-bold px-2 py-0.5 rounded-full
                                    ${stock === 0 
                                        ? "bg-rose-500/20 text-rose-400 border border-rose-500/30" 
                                        : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                                    }
                                `}>
                                    {stock === 0 ? "Out of stock" : `${stock} units`}
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>

            <Link
                to="/products"
                className="
                    mt-4 pt-3 border-t border-[var(--border)]
                    text-xs font-medium text-[var(--accent)] hover:underline
                    flex items-center justify-center gap-1.5 transition-colors
                "
            >
                Restock catalog products
                <ArrowRight size={12} />
            </Link>
        </div>
    );
}
