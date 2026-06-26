import { C } from './theme';

export const getDaysToExpiry = (d) => {
  const diff = Math.ceil((new Date(d) - new Date()) / 86400000);
  return diff;
};

export const getExpiryStatus = (d) => { 
  const days = getDaysToExpiry(d); 
  if(days < 0) return {label:"Expired",color:C.red,bg:"rgba(239,68,68,0.12)"}; 
  if(days <= 30) return {label:"Critical",color:C.red,bg:"rgba(239,68,68,0.12)"}; 
  if(days <= 90) return {label:"Expiring Soon",color:C.orange,bg:"rgba(245,130,32,0.12)"}; 
  if(days <= 180) return {label:"Warning",color:C.yellow,bg:"rgba(234,179,8,0.12)"}; 
  return {label:"Safe",color:C.teal,bg:"rgba(var(--primary-rgb),0.08)"}; 
};

export const getStockStatus = (q, t) => { 
  if(q === 0) return {label:"Out of Stock",color:C.red,bg:"rgba(239,68,68,0.12)"}; 
  if(q <= t * 0.5) return {label:"Critical Low",color:C.red,bg:"rgba(239,68,68,0.12)"}; 
  if(q <= t) return {label:"Low Stock",color:C.orange,bg:"rgba(245,130,32,0.12)"}; 
  return {label:"In Stock",color:C.teal,bg:"rgba(var(--primary-rgb),0.08)"}; 
};

export const fmtDate = d => new Date(d).toLocaleDateString("en-IN", {day:"2-digit",month:"short",year:"numeric"});
export const fmtCurrency = n => `₹${Number(n).toFixed(2)}`;

export function escapeCsvValue(value) {
  const normalized = String(value ?? "").replace(/\r\n|\r|\n/g, " ");
  return `"${normalized.replace(/"/g, '""')}"`;
}

export function buildCsvContent(rows = [], columns = []) {
  if (!rows.length) return "";

  const exportColumns = columns.length
    ? columns
    : Object.keys(rows[0]).map(key => ({ label: key, key }));

  const header = exportColumns.map(column => escapeCsvValue(column.label)).join(",");
  const body = rows.map(row => exportColumns.map(column => {
    const rawValue = column.format ? column.format(row) : row[column.key];
    return escapeCsvValue(rawValue);
  }).join(",")).join("\n");

  return `\uFEFF${[header, body].join("\n")}`;
}

export function buildPrintableReportHtml({ title, subtitle, rows = [], columns = [], filename = "report" }) {
  const escapeHtml = (value) => String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");

  const exportColumns = columns.length
    ? columns
    : Object.keys(rows[0] || {}).map(key => ({ label: key, key }));

  const headers = exportColumns.map(column => `<th>${escapeHtml(column.label)}</th>`).join("");
  const body = rows.map(row => {
    const cells = exportColumns.map(column => {
      const rawValue = column.format ? column.format(row) : row[column.key];
      return `<td>${escapeHtml(rawValue)}</td>`;
    }).join("");
    return `<tr>${cells}</tr>`;
  }).join("");

  return `
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>${escapeHtml(filename)}</title>
        <style>
          :root { color-scheme: light; }
          * { box-sizing: border-box; }
          body { font-family: Arial, Helvetica, sans-serif; margin: 0; padding: 32px; color: #1f2937; background: #fff; }
          .header { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; margin-bottom: 20px; }
          h1 { margin: 0 0 6px; font-size: 24px; }
          p { margin: 0; color: #6b7280; }
          .meta { font-size: 12px; color: #6b7280; text-align: right; }
          table { width: 100%; border-collapse: collapse; font-size: 12px; }
          th, td { border: 1px solid #d1d5db; padding: 8px 10px; text-align: left; vertical-align: top; }
          th { background: #f3f4f6; font-weight: 700; }
          tr:nth-child(even) td { background: #fafafa; }
          @media print { body { padding: 0; } .no-print { display: none; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <h1>${escapeHtml(title)}</h1>
            ${subtitle ? `<p>${escapeHtml(subtitle)}</p>` : ""}
          </div>
          <div class="meta">
            <div>Generated on ${escapeHtml(new Date().toLocaleString())}</div>
            <div>${escapeHtml(filename)}.pdf</div>
          </div>
        </div>
        <table>
          <thead><tr>${headers}</tr></thead>
          <tbody>${body}</tbody>
        </table>
      </body>
    </html>
  `;
}

function normalizeExportInput(dataOrOptions, maybeFilename) {
  if (Array.isArray(dataOrOptions)) {
    return { rows: dataOrOptions, filename: maybeFilename || "report.csv", columns: [] };
  }

  return {
    rows: dataOrOptions?.rows || [],
    filename: dataOrOptions?.filename || maybeFilename || "report.csv",
    columns: dataOrOptions?.columns || [],
  };
}

export function exportCSV(dataOrOptions, maybeFilename) {
  const { rows, filename, columns } = normalizeExportInput(dataOrOptions, maybeFilename);
  if (!rows.length) return;

  const csv = buildCsvContent(rows, columns);
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  a.download = filename;
  a.click();
}

export function exportPDF(dataOrOptions) {
  const { rows, filename, columns, title, subtitle } = dataOrOptions || {};
  if (typeof window === "undefined" || !rows?.length) return;

  const opened = window.open("", "_blank", "noopener,noreferrer,width=1200,height=900");
  if (!opened) return;

  opened.document.open();
  opened.document.write(buildPrintableReportHtml({ title, subtitle, rows, columns, filename }));
  opened.document.close();
  opened.focus();
  opened.print();
}
