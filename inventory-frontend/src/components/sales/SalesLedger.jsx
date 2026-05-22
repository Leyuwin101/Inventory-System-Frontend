import React from "react";
import { Receipt, Clock, RefreshCw } from "lucide-react";

export default function SalesLedger({ sales, isAdminOrManager, onCancelSale }) {
    if (sales.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-12 rounded-xl bg-[var(--card-bg)] border border-[var(--border)] text-center animate-fade-in">
                <Receipt size={48} className="text-[var(--muted)] mb-3" />
                <h3 className="text-lg text-[var(--text-h)] font-medium mb-1">No Transactions Recorded</h3>
                <p className="text-sm text-[var(--muted)] max-w-md">
                    All logged client invoice sales and cash checkouts will be ledgered in this audit panel.
                </p>
            </div>
        );
    }

    return (
        <div className="w-full overflow-x-auto rounded-xl border border-[var(--border)] bg-[var(--card-bg)] animate-fade-in">
            <table className="w-full min-w-[900px] text-sm text-left">
                <thead className="text-xs text-[var(--muted)] border-b border-[var(--border)] bg-[var(--input-bg)] uppercase">
                    <tr>
                        <th className="p-4 font-medium">Invoice ID</th>
                        <th className="p-4 font-medium">Date &amp; Time</th>
                        <th className="p-4 font-medium">Cashier Operator</th>
                        <th className="p-4 font-medium">Purchased Items Summary</th>
                        <th className="p-4 font-medium">Total Revenue</th>
                        <th className="p-4 font-medium text-right">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)] text-[var(--text)]">
                    {sales.map((sale, idx) => {
                        const sId = sale.id || sale.saleId || sale.sale_id;
                        
                        // Format transaction items summary
                        const itemsSummary = (sale.items || [])
                            .map((it) => `${it.productName || it.product_name || "Item"} (x${it.quantity})`)
                            .join(", ");
                            
                        const dateStr = sale.saleDate || sale.createdDate || sale.timestamp || sale.sale_date;
                        const formattedDate = dateStr ? new Date(dateStr).toLocaleString("en-PH", {
                            dateStyle: "short",
                            timeStyle: "short"
                        }) : "Recent Time";

                        // Total Price
                        const revenue = sale.totalPrice || sale.total_price || sale.total || 0;
                        const isRefunded = sale.status === "CANCELLED" || sale.status === "REFUNDED" || sale.refunded || sale.cancelled;

                        return (
                            <tr key={sId || idx} className={`hover:bg-[var(--input-bg)]/40 transition ${isRefunded ? "opacity-45 bg-red-950/5" : ""}`}>
                                <td className="p-4 font-medium text-[var(--text-h)]">
                                    <div className="flex items-center gap-2">
                                        <Receipt size={14} className="text-[var(--muted)]" />
                                        <span className="font-mono">#INV-{sId}</span>
                                    </div>
                                </td>

                                <td className="p-4 text-xs text-[var(--muted)]">
                                    <div className="flex items-center gap-1.5">
                                        <Clock size={12} />
                                        <span>{formattedDate}</span>
                                    </div>
                                </td>

                                <td className="p-4 text-xs">
                                    <div>
                                        <div className="font-semibold text-[var(--text-h)]">{sale.cashierName || sale.username || "Staff Cashier"}</div>
                                        <span className="text-[9px] text-[var(--muted)]">User ID: {sale.userId || sale.user_id || 1}</span>
                                    </div>
                                </td>

                                <td className="p-4 text-xs max-w-sm truncate" title={itemsSummary}>
                                    <span className="text-[var(--muted)]">{itemsSummary || "No detailed items"}</span>
                                </td>

                                <td className="p-4">
                                    <div className="flex flex-col">
                                        <span className={`font-bold text-xs ${isRefunded ? "line-through text-red-400" : "text-[var(--accent)]"}`}>
                                            ₱{Number(revenue).toFixed(2)}
                                        </span>
                                        {isRefunded && (
                                            <span className="text-[8px] uppercase tracking-wider text-red-400 font-bold mt-0.5">
                                                Cancelled / Refunded
                                            </span>
                                        )}
                                    </div>
                                </td>

                                <td className="p-4 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        {isAdminOrManager && !isRefunded && (
                                            <button
                                                onClick={() => onCancelSale(sale)}
                                                className="px-2.5 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs transition flex items-center gap-1"
                                                title="Cancel & Refund Transaction"
                                            >
                                                <RefreshCw size={12} />
                                                Refund
                                            </button>
                                        )}
                                        
                                        {isRefunded && (
                                            <span className="text-xs text-[var(--muted)] italic">Closed Ledger</span>
                                        )}

                                        {!isAdminOrManager && !isRefunded && (
                                            <span className="text-xs text-green-400 italic">Confirmed</span>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}
