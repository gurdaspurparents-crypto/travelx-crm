// Export Utility for Excel and PDF reporting across Travelx CRM

export const downloadExcelReport = (endpoint, defaultFilename) => {
  window.location.href = endpoint;
};

export const exportToPDF = (title, subtitle, headers, dataRows) => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Please allow popups to generate PDF report');
    return;
  }

  const currentDate = new Date().toLocaleString('en-IN', {
    dateStyle: 'full',
    timeStyle: 'short'
  });

  const tableHeadersHtml = headers.map(h => `<th style="padding: 8px 10px; background-color: #0f172a; color: #f8fafc; border: 1px solid #334155; text-align: left; font-size: 11px; text-transform: uppercase;">${h}</th>`).join('');

  const tableRowsHtml = dataRows.map((row, index) => {
    const bg = index % 2 === 0 ? '#1e293b' : '#0f172a';
    const cells = row.map(cell => `<td style="padding: 7px 10px; border: 1px solid #334155; color: #e2e8f0; font-size: 11px;">${cell ?? '—'}</td>`).join('');
    return `<tr style="background-color: ${bg};">${cells}</tr>`;
  }).join('');

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Travelx CRM Report - ${title}</title>
        <style>
          @page { margin: 15mm; size: A4 landscape; }
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #020617; color: #f8fafc; margin: 0; padding: 20px; }
          .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #38bdf8; padding-bottom: 12px; margin-bottom: 16px; }
          .brand { font-size: 22px; font-weight: 800; color: #38bdf8; letter-spacing: 0.5px; }
          .subtitle { font-size: 12px; color: #94a3b8; margin-top: 4px; }
          .meta { text-align: right; font-size: 11px; color: #94a3b8; }
          .summary-box { background: #0f172a; border: 1px solid #334155; padding: 10px 14px; border-radius: 8px; margin-bottom: 16px; font-size: 12px; color: #cbd5e1; display: flex; justify-content: space-between; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          .footer { margin-top: 24px; font-size: 10px; color: #64748b; text-align: center; border-top: 1px solid #1e293b; padding-top: 8px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="brand">✈️ Travelx B2B Agent CRM</div>
            <div class="subtitle">${title} — ${subtitle || 'Official Management Report'}</div>
          </div>
          <div class="meta">
            <div>Generated: <strong>${currentDate}</strong></div>
            <div>Total Records: <strong>${dataRows.length}</strong></div>
          </div>
        </div>

        <div class="summary-box">
          <span>Report Status: <strong>Verified Live Database Export</strong></span>
          <span>Confidentiality: <strong>Internal Management Record</strong></span>
        </div>

        <table>
          <thead>
            <tr>${tableHeadersHtml}</tr>
          </thead>
          <tbody>
            ${tableRowsHtml}
          </tbody>
        </table>

        <div class="footer">
          Travelx B2B Agent Marketing & Lead Conversion CRM • Confidential Business Report
        </div>

        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 500);
          };
        </script>
      </body>
    </html>
  `;

  printWindow.document.write(htmlContent);
  printWindow.document.close();
};
