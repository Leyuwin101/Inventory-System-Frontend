import React from "react";
import { Package, Layers, Wallet, TrendingUp, AlertTriangle } from "lucide-react";

export default function StatsGrid({ products = [], sales = [], lowStockCount = 0 }) {
    // 1. Total Products (Unique catalog items)
    const totalProducts = products.length;

    // 2. Total Stock Count (Sum of all item quantities)
    const totalStock = products.reduce((sum, p) => sum + (Number(p.stock_quantity ?? p.stock) || 0), 0);

    // 3. Inventory Value (Sum of price * stock)
    const totalValue = products.reduce((sum, p) => sum + ((Number(p.price) || 0) * (Number(p.stock_quantity ?? p.stock) || 0)), 0);

    // 4. Sales Today Revenue
    const todayStr = new Date().toDateString();
    const salesToday = sales.filter((s) => {
        const dateStr = s.saleDate || s.createdDate || s.timestamp || s.sale_date;
        const isCancelled = s.status === "CANCELLED" || s.status === "REFUNDED" || s.refunded || s.cancelled;
        return dateStr && new Date(dateStr).toDateString() === todayStr && !isCancelled;
    });
    const revenueToday = salesToday.reduce((sum, s) => sum + (Number(s.totalPrice || s.total_price || s.total || 0)), 0);

    // Cards configuration
    const statCards = [
        {
            title: "Unique Products",
            value: totalProducts.toLocaleString(),
            subtitle: "In catalog",
            icon: <Package size={22} />,
            color: "text-emerald-400 border-emerald-500/20 bg-emerald-500/5",
        },
        {
            title: "Total Stock Volume",
            value: totalStock.toLocaleString(),
            subtitle: "Units in warehouse",
            icon: <Layers size={22} />,
            color: "text-blue-400 border-blue-500/20 bg-blue-500/5",
        },
        {
            title: "Total Asset Value",
            value: `₱${totalValue.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
            subtitle: "Cumulative cost basis",
            icon: <Wallet size={22} />,
            color: "text-violet-400 border-violet-500/20 bg-violet-500/5",
        },
        {
            title: "Sales Revenue Today",
            value: `₱${revenueToday.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
            subtitle: `${salesToday.length} completed transactions`,
            icon: <TrendingUp size={22} />,
            color: "text-amber-400 border-amber-500/20 bg-amber-500/5",
        },
        {
            title: "Low Stock Items",
            value: lowStockCount.toString(),
            subtitle: "Needs immediate replenishment",
            icon: <AlertTriangle size={22} />,
            color: lowStockCount > 0 
                ? "text-rose-400 border-rose-500/30 bg-rose-500/10 animate-pulse" 
                : "text-gray-400 border-[var(--border)] bg-[var(--card-bg)]",
        }
    ];

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {statCards.map((card, idx) => (
                <div
                    key={idx}
                    className={`
                        p-5 rounded-xl border flex flex-col justify-between
                        shadow-[var(--shadow)] transition-all duration-300 hover:scale-[1.02]
                        ${card.color || "border-[var(--border)] bg-[var(--card-bg)]"}
                    `}
                >
                    <div className="flex items-center justify-between gap-4 mb-2">
                        <span className="text-xs font-medium text-[var(--muted)] uppercase tracking-wider">
                            {card.title}
                        </span>
                        <span className="p-2 rounded-lg bg-[var(--input-bg)]">
                            {card.icon}
                        </span>
                    </div>

                    <div>
                        <h3 className="text-xl md:text-2xl font-bold text-[var(--text-h)] leading-tight">
                            {card.value}
                        </h3>
                        <p className="text-xs text-[var(--muted)] mt-1">
                            {card.subtitle}
                        </p>
                    </div>
                </div>
            ))}
        </div>
    );
}
