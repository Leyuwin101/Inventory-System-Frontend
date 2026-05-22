import React, { useState, useEffect } from "react";
import { Truck, X, Loader2 } from "lucide-react";

export default function SupplierModal({ isOpen, onClose, selectedSupplier, onSave, loading }) {
    const [form, setForm] = useState({
        name: "",
        contactName: "",
        email: "",
        phone: "",
        address: ""
    });

    useEffect(() => {
        if (selectedSupplier) {
            setForm({
                name: selectedSupplier.name || "",
                contactName: selectedSupplier.contactName || selectedSupplier.contact_name || "",
                email: selectedSupplier.email || "",
                phone: selectedSupplier.phone || "",
                address: selectedSupplier.address || ""
            });
        } else {
            setForm({
                name: "",
                contactName: "",
                email: "",
                phone: "",
                address: ""
            });
        }
    }, [selectedSupplier, isOpen]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!form.name.trim() || !form.email.trim()) return;
        onSave({
            name: form.name.trim(),
            contactName: form.contactName.trim() || null,
            email: form.email.trim(),
            phone: form.phone.trim() || null,
            address: form.address.trim() || null
        });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="w-full max-w-lg p-6 rounded-xl bg-[var(--card-bg)] border border-[var(--border)] shadow-2xl">
                <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-2">
                        <Truck className="text-[var(--accent)]" size={20} />
                        <h2 className="text-lg font-semibold text-[var(--text-h)]">
                            {selectedSupplier ? "Edit Supplier Partner" : "Establish New Partnership"}
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
                        <label className="block text-sm text-[var(--muted)] mb-1.5">Supplier Company Name *</label>
                        <input
                            type="text"
                            required
                            placeholder="e.g. San Miguel Corp, Coca-Cola Bottlers"
                            value={form.name}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                            className="w-full px-3 py-2.5 rounded-lg bg-[var(--input-bg)] border border-[var(--border)] text-[var(--text-h)] text-sm focus:outline-none"
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm text-[var(--muted)] mb-1.5">Contact Person Name</label>
                            <input
                                type="text"
                                placeholder="e.g. Juan dela Cruz"
                                value={form.contactName}
                                onChange={(e) => setForm({ ...form, contactName: e.target.value })}
                                className="w-full px-3 py-2.5 rounded-lg bg-[var(--input-bg)] border border-[var(--border)] text-[var(--text-h)] text-sm focus:outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-[var(--muted)] mb-1.5">Phone Number</label>
                            <input
                                type="tel"
                                placeholder="e.g. +63 917 123 4567"
                                value={form.phone}
                                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                                className="w-full px-3 py-2.5 rounded-lg bg-[var(--input-bg)] border border-[var(--border)] text-[var(--text-h)] text-sm focus:outline-none"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm text-[var(--muted)] mb-1.5">Email Address *</label>
                        <input
                            type="email"
                            required
                            placeholder="supplier@company.com"
                            value={form.email}
                            onChange={(e) => setForm({ ...form, email: e.target.value })}
                            className="w-full px-3 py-2.5 rounded-lg bg-[var(--input-bg)] border border-[var(--border)] text-[var(--text-h)] text-sm focus:outline-none"
                        />
                    </div>

                    <div>
                        <label className="block text-sm text-[var(--muted)] mb-1.5">Office / Warehouse Address</label>
                        <textarea
                            placeholder="Physical address for logistics dispatch..."
                            rows="2"
                            value={form.address}
                            onChange={(e) => setForm({ ...form, address: e.target.value })}
                            className="w-full px-3 py-2.5 rounded-lg bg-[var(--input-bg)] border border-[var(--border)] text-[var(--text-h)] text-sm focus:outline-none resize-none"
                        />
                    </div>

                    <div className="flex justify-end gap-3 mt-6 pt-3 border-t border-[var(--border)]">
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
                            disabled={loading || !form.name.trim() || !form.email.trim()}
                            className="
                                flex items-center gap-2
                                px-5 py-2.5 text-sm font-medium rounded-lg
                                bg-[var(--accent)] text-[var(--accent-text)]
                                hover:opacity-90 transition disabled:opacity-50
                            "
                        >
                            {loading && <Loader2 size={16} className="animate-spin" />}
                            {selectedSupplier ? "Save Changes" : "Establish Link"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
