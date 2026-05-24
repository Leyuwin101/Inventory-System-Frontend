import { Edit3, Mail, MapPin, Phone, Trash2, Truck, User } from "lucide-react";
import SupplierRow from "./SupplierRow";

export default function SupplierTable({ suppliers, canEdit, canDelete, onEdit, onDelete }) {
    return (
        <>
        <div className="space-y-3 md:hidden">
            {suppliers.map((supplier, idx) => {
                const id = supplier.id || supplier.supplierId || supplier.supplier_id || idx;
                const contact = supplier.contactName || supplier.contact_name || supplier.companyName || supplier.company_name || "N/A";
                return (
                    <article key={id} className="rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-4 shadow-[var(--shadow)]">
                        <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                                <div className="flex items-center gap-2 text-[var(--text-h)]">
                                    <Truck size={16} className="shrink-0 text-[var(--accent)]" />
                                    <h3 className="truncate text-sm font-semibold">{supplier.name}</h3>
                                </div>
                                <p className="mt-1 text-xs text-[var(--muted)]">ID: {id}</p>
                            </div>
                            <div className="flex shrink-0 gap-2">
                                {canEdit && (
                                    <button onClick={() => onEdit(supplier)} className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg bg-[var(--input-bg)] text-[var(--muted)] transition hover:bg-[var(--border)]" title="Edit Supplier">
                                        <Edit3 size={15} />
                                    </button>
                                )}
                                {canDelete && (
                                    <button onClick={() => onDelete(supplier)} className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg bg-red-500/10 text-red-400 transition hover:bg-red-500/20" title="Delete Supplier">
                                        <Trash2 size={15} />
                                    </button>
                                )}
                            </div>
                        </div>
                        <div className="mt-4 space-y-2 text-xs text-[var(--muted)]">
                            <div className="flex min-w-0 items-center gap-2">
                                <User size={14} className="shrink-0" />
                                <span className="truncate">{contact}</span>
                            </div>
                            <div className="flex min-w-0 items-center gap-2">
                                <Mail size={14} className="shrink-0" />
                                <span className="truncate">{supplier.email || "N/A"}</span>
                            </div>
                            <div className="flex min-w-0 items-center gap-2">
                                <Phone size={14} className="shrink-0" />
                                <span className="truncate">{supplier.phone || "N/A"}</span>
                            </div>
                            <div className="flex min-w-0 items-center gap-2">
                                <MapPin size={14} className="shrink-0" />
                                <span className="truncate">{supplier.address || "N/A"}</span>
                            </div>
                        </div>
                    </article>
                );
            })}
        </div>
        <div className="hidden w-full overflow-x-auto rounded-xl border border-[var(--border)] bg-[var(--card-bg)] md:block">
            <table className="w-full min-w-[900px] text-sm text-left">
                <thead className="sticky top-0 z-10 text-xs text-[var(--muted)] border-b border-[var(--border)] bg-[var(--input-bg)] uppercase">
                    <tr>
                        <th className="p-4 font-medium">Supplier</th>
                        <th className="p-4 font-medium">Contact Person</th>
                        <th className="p-4 font-medium">Email</th>
                        <th className="p-4 font-medium">Phone</th>
                        <th className="p-4 font-medium">Address</th>
                        <th className="p-4 font-medium text-right">Actions</th>
                    </tr>
                </thead>

                <tbody className="divide-y divide-[var(--border)] text-[var(--text)]">
                    {suppliers.map((sup, idx) => (
                        <SupplierRow
                            key={sup.id || sup.supplierId || sup.supplier_id || idx}
                            supplier={sup}
                            canEdit={canEdit}
                            canDelete={canDelete}
                            onEdit={onEdit}
                            onDelete={onDelete}
                        />
                    ))}
                </tbody>
            </table>
        </div>
        </>
    );
}
