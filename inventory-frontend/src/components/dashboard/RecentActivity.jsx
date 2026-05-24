import { Link } from "react-router-dom";
import { Receipt, Clock, ArrowRight } from "lucide-react";

export default function RecentActivity({ sales = [] }) {
    // Sort sales by date/id descending, take top 5
    const recentSales = [...sales]
        .sort((a, b) => {
            const dateA = new Date(a.saleDate || a.createdDate || a.timestamp || a.sale_date || 0);
            const dateB = new Date(b.saleDate || b.createdDate || b.timestamp || b.sale_date || 0);
            return dateB - dateA;
        })
        .slice(0, 5);

    if (recentSales.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-8 rounded-xl border border-[var(--border)] bg-[var(--card-bg)] text-center h-full">
                <Receipt size={32} className="text-[var(--muted)] mb-2" />
                <h4 className="text-sm font-medium text-[var(--text-h)]">No recent transactions</h4>
                <p className="text-xs text-[var(--muted)] mt-1">Recorded sales will appear here.</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full justify-between">
            <div className="divide-y divide-[var(--border)]">
                {recentSales.map((sale, idx) => {
                    const sId = sale.id || sale.saleId || sale.sale_id;
                    const revenue = sale.totalPrice || sale.total_price || sale.total || 0;
                    const itemsCount = (sale.items || []).reduce((sum, item) => sum + (item.quantity || 0), 0);
                    const isRefunded = sale.status === "CANCELLED" || sale.status === "REFUNDED" || sale.refunded || sale.cancelled;
                    
                    const dateStr = sale.saleDate || sale.createdDate || sale.timestamp || sale.sale_date;
                    const formattedDate = dateStr ? new Date(dateStr).toLocaleTimeString("en-PH", {
                        hour: "2-digit",
                        minute: "2-digit"
                    }) : "Just now";

                    return (
                        <div key={sId || idx} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3 min-w-0">
                                <div className={`p-2 rounded-lg ${isRefunded ? 'bg-red-500/10 text-red-400' : 'bg-[var(--input-bg)] text-[var(--accent)]'}`}>
                                    <Receipt size={16} />
                                </div>
                                <div className="min-w-0">
                                    <div className="flex items-center gap-1.5">
                                        <span className="font-mono text-xs font-semibold text-[var(--text-h)]">
                                            #INV-{sId}
                                        </span>
                                        {isRefunded && (
                                            <span className="text-[8px] px-1 rounded bg-red-500/20 text-red-400 font-bold uppercase tracking-wider">
                                                Refunded
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-[var(--muted)] truncate mt-0.5">
                                        {itemsCount} {itemsCount === 1 ? "item" : "items"} checked out by {sale.cashierName || sale.username || "Staff Cashier"}
                                    </p>
                                </div>
                            </div>

                            <div className="text-right flex-shrink-0">
                                <span className={`text-xs font-bold ${isRefunded ? 'line-through text-red-400' : 'text-[var(--text-h)]'}`}>
                                    ₱{Number(revenue).toFixed(2)}
                                </span>
                                <div className="flex items-center justify-end gap-1 text-[10px] text-[var(--muted)] mt-0.5">
                                    <Clock size={10} />
                                    <span>{formattedDate}</span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
            
            <Link
                to="/sales"
                className="
                    mt-4 pt-3 border-t border-[var(--border)]
                    text-xs font-medium text-[var(--accent)] hover:underline
                    flex items-center justify-center gap-1.5 transition-colors
                "
            >
                View all transactions
                <ArrowRight size={12} />
            </Link>
        </div>
    );
}
