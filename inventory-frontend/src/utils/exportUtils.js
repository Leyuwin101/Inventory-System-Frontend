const escapeCsvCell = (value) => {
    const text = value == null ? "" : String(value);
    return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

const downloadBlob = (blob, filename) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
};

const sanitizeFilename = (value) =>
    String(value || "export")
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");

export const exportToCsv = ({ title, columns, rows }) => {
    const csv = [
        columns.map((column) => escapeCsvCell(column.header)).join(","),
        ...rows.map((row) => columns.map((column) => escapeCsvCell(column.accessor(row))).join(",")),
    ].join("\n");

    const stamp = new Date().toISOString().slice(0, 10);
    downloadBlob(new Blob([csv], { type: "text/csv;charset=utf-8" }), `${sanitizeFilename(title)}-${stamp}.csv`);
};

export const exportToPdf = ({ title, columns, rows, subtitle }) => {
    const generatedAt = new Intl.DateTimeFormat("en-PH", {
        dateStyle: "medium",
        timeStyle: "short",
    }).format(new Date());

    const html = `
        <!doctype html>
        <html>
            <head>
                <title>${title}</title>
                <style>
                    @page { margin: 18mm 12mm; }
                    body { font-family: Arial, sans-serif; color: #17201b; }
                    h1 { margin: 0 0 4px; font-size: 22px; }
                    .meta { margin-bottom: 18px; color: #53665c; font-size: 12px; }
                    table { border-collapse: collapse; width: 100%; font-size: 11px; }
                    thead { display: table-header-group; }
                    tr { page-break-inside: avoid; }
                    th { background: #eef5f0; text-align: left; font-weight: 700; }
                    th, td { border: 1px solid #cad8d0; padding: 7px 8px; vertical-align: top; }
                    tbody tr:nth-child(even) { background: #f8fbf9; }
                    .footer { position: fixed; bottom: 0; right: 0; font-size: 10px; color: #6b7c72; }
                </style>
            </head>
            <body>
                <h1>${title}</h1>
                <div class="meta">${subtitle ? `${subtitle}<br>` : ""}Date generated: ${generatedAt}</div>
                <table>
                    <thead>
                        <tr>${columns.map((column) => `<th>${column.header}</th>`).join("")}</tr>
                    </thead>
                    <tbody>
                        ${rows.map((row) => `<tr>${columns.map((column) => `<td>${column.accessor(row) ?? ""}</td>`).join("")}</tr>`).join("")}
                    </tbody>
                </table>
                <div class="footer">Use your browser print dialog to save as PDF. Pagination is handled by the PDF renderer.</div>
                <script>window.onload = () => { window.print(); setTimeout(() => window.close(), 400); };</script>
            </body>
        </html>
    `;

    const printWindow = window.open("", "_blank", "noopener,noreferrer,width=1100,height=800");
    if (!printWindow) return;
    printWindow.document.write(html);
    printWindow.document.close();
};
