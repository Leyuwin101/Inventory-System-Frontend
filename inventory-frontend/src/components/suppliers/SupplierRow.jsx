import React from "react";
import { Truck, User, Mail, Phone, MapPin, Edit3, Trash2 } from "lucide-react";

export default function SupplierRow({ supplier, canEdit, canDelete, onEdit, onDelete }) {
    const id = supplier.id || supplier.supplierId || supplier.supplier_id;
    const contact = supplier.contactName || supplier.contact_name || supplier.companyName || supplier.company_name || "N/A";

    return (
        <tr className="hover:bg-[var(--input-bg)] transition group">
            {/* NAME */}
            <td className="p-4 font-medium text-[var(--text-h)] flex items-center gap-3">
                <div className="p-2 rounded-lg bg-[var(--accent)]/10 text-[var(--accent)]">
                    <Truck size={16} />
                </div>
                <div>
                    <div>{supplier.name}</div>
                    <span className="text-[10px] text-[var(--muted)]">ID: {id}</span>
                </div>
            </td>

            {/* CONTACT */}
            <td className="p-4">
                <div className="flex items-center gap-2">
                    <User size={14} className="text-[var(--muted)]" />
                    <span>{contact}</span>
                </div>
            </td>

            {/* EMAIL */}
            <td className="p-4">
                <div className="flex items-center gap-2">
                    <Mail size={14} className="text-[var(--muted)]" />
                    <a href={`mailto:${supplier.email}`} className="hover:text-[var(--accent)] transition">
                        {supplier.email}
                    </a>
                </div>
            </td>

            {/* PHONE */}
            <td className="p-4">
                <div className="flex items-center gap-2 text-xs">
                    <Phone size={14} className="text-[var(--muted)]" />
                    <span>{supplier.phone || "N/A"}</span>
                </div>
            </td>

            {/* ADDRESS */}
            <td className="p-4 max-w-xs truncate">
                <div className="flex items-center gap-2 text-xs">
                    <MapPin size={14} className="text-[var(--muted)] flex-shrink-0" />
                    <span className="truncate" title={supplier.address}>
                        {supplier.address || "N/A"}
                    </span>
                </div>
            </td>

            {/* ACTIONS */}
            <td className="p-4 text-right">
                <div className="flex items-center justify-end gap-2">
                    {canEdit && (
                        <button
                            onClick={() => onEdit(supplier)}
                            className="p-2 rounded-lg bg-[var(--input-bg)] hover:bg-[var(--border)] text-[var(--muted)] hover:text-[var(--text-h)] transition"
                            title="Edit Supplier"
                        >
                            <Edit3 size={14} />
                        </button>
                    )}

                    {canDelete && (
                        <button
                            onClick={() => onDelete(supplier)}
                            className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition"
                            title="Delete Supplier"
                        >
                            <Trash2 size={14} />
                        </button>
                    )}

                    {!canEdit && !canDelete && (
                        <span className="text-xs text-[var(--muted)] italic">View Only</span>
                    )}
                </div>
            </td>
        </tr>
    );
}
