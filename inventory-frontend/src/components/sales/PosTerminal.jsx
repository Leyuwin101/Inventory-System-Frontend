import { useState } from "react";
import { createSale } from "../../api/sales";
import { 
    ShoppingCart, 
    Search, 
    Plus, 
    Minus, 
    Trash2, 
    Loader2 
} from "lucide-react";

export default function PosTerminal({ products, currentUser, onCheckoutSuccess }) {
    const [cart, setCart] = useState([]);
    const [productSearch, setProductSearch] = useState("");
    const [checkoutLoading, setCheckoutLoading] = useState(false);
    const [receivedAmount, setReceivedAmount] = useState("");

    // POS Cart Operations
    const addToCart = (product) => {
        const pId = product.product_id || product.id;
        if (product.stock_quantity <= 0) {
            alert("This product is out of stock!");
            return;
        }

        const existing = cart.find((item) => (item.product_id || item.id) === pId);
        if (existing) {
            if (existing.qty >= product.stock_quantity) {
                alert(`Cannot add more. Only ${product.stock_quantity} items are available in stock.`);
                return;
            }
            setCart(
                cart.map((item) =>
                    (item.product_id || item.id) === pId ? { ...item, qty: item.qty + 1 } : item
                )
            );
        } else {
            setCart([...cart, { ...product, qty: 1 }]);
        }
    };

    const updateCartQty = (pId, amount) => {
        const item = cart.find((i) => (i.product_id || i.id) === pId);
        if (!item) return;

        const newQty = item.qty + amount;
        if (newQty <= 0) {
            removeFromCart(pId);
        } else {
            // Check stock limits
            if (amount > 0 && newQty > item.stock_quantity) {
                alert(`Cannot exceed available stock of ${item.stock_quantity} units.`);
                return;
            }
            setCart(
                cart.map((i) =>
                    (i.product_id || i.id) === pId ? { ...i, qty: newQty } : i
                )
            );
        }
    };

    const removeFromCart = (pId) => {
        setCart(cart.filter((item) => (item.product_id || item.id) !== pId));
    };

    // Calculations
    const cartSubtotal = cart.reduce((acc, item) => acc + item.price * item.qty, 0);
    const vatAmount = cartSubtotal * 0.12; // 12% standard Philippine VAT included
    const cartTotal = cartSubtotal; // FLAT subtotal

    const handleCheckout = async (e) => {
        e.preventDefault();
        if (cart.length === 0) return;

        const userId = currentUser?.id ?? currentUser?.userID ?? currentUser?.userId ?? currentUser?.user_id;
        if (!userId) {
            alert("Your account id could not be verified. Please log out and sign in again.");
            return;
        }
        
        const change = Number(receivedAmount) - cartTotal;
        if (receivedAmount && change < 0) {
            alert("Received payment amount is less than the transaction total!");
            return;
        }

        try {
            setCheckoutLoading(true);
            
            // Format SaleRequest items: { productId, quantity }
            const payload = {
                userId,
                paymentMethod: "CASH",
                status: "COMPLETED",
                items: cart.map((item) => ({
                    productId: item.product_id || item.id,
                    quantity: item.qty
                }))
            };

            await createSale(payload);

            const successReceipt = {
                total: cartTotal,
                received: receivedAmount ? Number(receivedAmount) : cartTotal,
                change: receivedAmount ? change : 0,
                itemsCount: cart.reduce((acc, i) => acc + i.qty, 0)
            };

            setCart([]);
            setReceivedAmount("");
            onCheckoutSuccess(successReceipt);
        } catch (err) {
            console.error(err);
            alert(err.response?.data?.message || "Checkout failed. Please check product stock levels.");
        } finally {
            setCheckoutLoading(false);
        }
    };

    const filteredProducts = products.filter((p) =>
        p.name?.toLowerCase().includes(productSearch.toLowerCase()) ||
        p.sku?.toLowerCase().includes(productSearch.toLowerCase())
    );

    return (
        <div className="grid grid-cols-1 gap-4 lg:gap-6 xl:grid-cols-12 xl:items-start animate-fade-in">
            {/* LEFT PANEL: PRODUCT CATALOG SEARCH */}
            <div className="xl:col-span-7 bg-[var(--card-bg)] border border-[var(--border)] rounded-lg p-3 sm:p-5 min-h-[360px] xl:h-[70vh] flex flex-col justify-between">
                <div>
                    <div className="relative mb-4">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" size={16} />
                        <input
                            type="text"
                            placeholder="Search product code or name..."
                            value={productSearch}
                            onChange={(e) => setProductSearch(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 rounded-md bg-[var(--input-bg)] border border-[var(--border)] text-sm text-[var(--text-h)] focus:outline-none"
                        />
                    </div>

                    <div className="overflow-y-auto max-h-[52dvh] xl:max-h-[50vh] pr-1 sm:pr-2 space-y-2">
                        {filteredProducts.length === 0 ? (
                            <div className="text-center py-10 text-xs text-[var(--muted)]">
                                No products match your search.
                            </div>
                        ) : (
                            filteredProducts.map((p) => {
                                const pId = p.product_id || p.id;
                                const outOfStock = p.stock_quantity <= 0;
                                
                                return (
                                    <div
                                        key={pId}
                                        onClick={() => !outOfStock && addToCart(p)}
                                        className={`
                                            p-3 rounded-md border border-[var(--border)]
                                            flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between
                                            transition select-none
                                            ${outOfStock 
                                                ? "opacity-50 cursor-not-allowed bg-red-950/10 border-red-500/10" 
                                                : "hover:bg-[var(--input-bg)] cursor-pointer"
                                            }
                                        `}
                                    >
                                        <div className="flex-1 min-w-0 pr-3">
                                            <h4 className="font-semibold text-xs text-[var(--text-h)] truncate">{p.name}</h4>
                                            <span className="text-[10px] text-[var(--muted)]">SKU: {p.sku || "N/A"}</span>
                                        </div>
                                        <div className="flex w-full items-center justify-between gap-3 text-right sm:w-auto">
                                            <div>
                                                <div className="font-bold text-xs text-[var(--accent)]">₱{Number(p.price).toFixed(2)}</div>
                                                <span className={`text-[9px] ${p.stock_quantity <= 5 ? "text-red-400 font-semibold animate-pulse" : "text-[var(--muted)]"}`}>
                                                    Stock: {p.stock_quantity}
                                                </span>
                                            </div>
                                            <div className="p-1 rounded bg-[var(--accent)]/10 text-[var(--accent)]">
                                                <Plus size={14} />
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                <div className="border-t border-[var(--border)] pt-3 text-[10px] text-[var(--muted)] flex flex-col sm:flex-row sm:justify-between gap-1">
                    <span>SariStore POS terminal operational</span>
                    <span>Logged in as: <span className="text-[var(--text-h)] font-medium">{currentUser?.username || currentUser?.email}</span></span>
                </div>
            </div>

            {/* RIGHT PANEL: CART & CHECKOUT PANEL */}
            <form onSubmit={handleCheckout} className="xl:col-span-5 bg-[var(--card-bg)] border border-[var(--border)] rounded-lg p-3 sm:p-5 flex flex-col justify-between min-h-[360px] xl:sticky xl:top-6 xl:h-[70vh]">
                <div className="flex flex-col min-h-[240px] xl:h-[40vh]">
                    <h3 className="text-xs font-semibold text-[var(--text-h)] mb-3 pb-2 border-b border-[var(--border)] flex justify-between items-center">
                        <span>Shopping Cart ({cart.reduce((acc, i) => acc + i.qty, 0)})</span>
                        {cart.length > 0 && (
                            <button 
                                type="button" 
                                onClick={() => setCart([])}
                                className="text-[10px] text-red-400 hover:underline animate-fade-in"
                            >
                                Clear Cart
                            </button>
                        )}
                    </h3>

                    <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                        {cart.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-center text-[var(--muted)]">
                                <ShoppingCart size={32} className="mb-2 opacity-55" />
                                <p className="text-xs">Cart is empty</p>
                                <p className="text-[10px]">Click products on the left to purchase</p>
                            </div>
                        ) : (
                            cart.map((item) => {
                                const pId = item.product_id || item.id;
                                return (
                                    <div key={pId} className="flex items-center justify-between p-2 rounded bg-[var(--input-bg)]/40 border border-[var(--border)]">
                                        <div className="flex-1 min-w-0 pr-2">
                                            <h4 className="font-medium text-xs text-[var(--text-h)] truncate">{item.name}</h4>
                                            <span className="text-[10px] text-[var(--accent)] font-semibold">
                                                ₱{Number(item.price * item.qty).toFixed(2)}
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => updateCartQty(pId, -1)}
                                                className="p-1 rounded bg-[var(--input-bg)] text-[var(--text-h)] hover:bg-[var(--border)] transition"
                                            >
                                                <Minus size={10} />
                                            </button>
                                            <span className="text-xs font-bold px-1.5 w-6 text-center">{item.qty}</span>
                                            <button
                                                type="button"
                                                onClick={() => updateCartQty(pId, 1)}
                                                className="p-1 rounded bg-[var(--input-bg)] text-[var(--text-h)] hover:bg-[var(--border)] transition"
                                            >
                                                <Plus size={10} />
                                            </button>
                                            
                                            <button
                                                type="button"
                                                onClick={() => removeFromCart(pId)}
                                                className="p-1 text-red-400 hover:bg-red-500/10 rounded transition ml-1"
                                            >
                                                <Trash2 size={12} />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* SUMMARIES & TENDER INPUT */}
                <div className="border-t border-[var(--border)] pt-4 space-y-3">
                    <div className="space-y-1.5 text-xs text-[var(--muted)]">
                        <div className="flex justify-between">
                            <span>Subtotal (VAT Inc.)</span>
                            <span className="text-[var(--text-h)]">₱{cartSubtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div className="flex justify-between text-[10px]">
                            <span>VAT Included (12%)</span>
                            <span>₱{vatAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div className="flex justify-between font-bold text-sm text-[var(--text-h)] pt-1.5 border-t border-[var(--border)]/40">
                            <span>Total Price</span>
                            <span className="text-[var(--accent)]">₱{cartTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                        </div>
                    </div>

                    {/* CASH RECEIVED INPUT */}
                    {cart.length > 0 && (
                        <div className="grid grid-cols-2 gap-3 items-center pt-2">
                            <div>
                                <label className="block text-[10px] text-[var(--muted)] mb-1">Cash Tendered (₱)</label>
                                <input
                                    type="number"
                                    min={cartTotal}
                                    step="1"
                                    placeholder="0.00"
                                    value={receivedAmount}
                                    onChange={(e) => setReceivedAmount(e.target.value)}
                                    className="w-full px-2 py-1.5 rounded bg-[var(--input-bg)] border border-[var(--border)] text-xs text-[var(--text-h)] focus:outline-none"
                                />
                            </div>
                            <div className="text-right">
                                <span className="block text-[10px] text-[var(--muted)]">Change Returned</span>
                                <span className="font-semibold text-xs text-[var(--text-h)]">
                                    ₱{receivedAmount ? Math.max(0, Number(receivedAmount) - cartTotal).toLocaleString(undefined, { minimumFractionDigits: 2 }) : "0.00"}
                                </span>
                            </div>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={checkoutLoading || cart.length === 0}
                        className="
                            w-full py-3 rounded-lg
                            bg-[var(--accent)] text-[var(--accent-text)]
                            font-bold text-xs uppercase tracking-wider
                            hover:opacity-90 disabled:opacity-50 transition
                            flex items-center justify-center gap-2
                        "
                    >
                        {checkoutLoading && <Loader2 size={14} className="animate-spin" />}
                        Pay & Print Receipt
                    </button>
                </div>
            </form>
        </div>
    );
}
