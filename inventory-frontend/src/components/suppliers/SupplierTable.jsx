import React from "react";
import SupplierRow from "./SupplierRow";

export default function SupplierTable({ suppliers, canEdit, canDelete, onEdit, onDelete }) {
    return (
        <div className="w-full overflow-x-auto rounded-xl border border-[var(--border)] bg-[var(--card-bg)]">
            <table className="w-full min-w-[900px] text-sm text-left">
                <thead className="text-xs text-[var(--muted)] border-b border-[var(--border)] bg-[var(--input-bg)] uppercase">
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
    );
}
