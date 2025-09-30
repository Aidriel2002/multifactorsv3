import { QuotationItem } from "../printable-quotation/page";

export type PrintType = 'project' | 'quotation' | 'purchaseOrder';

export const handlePrint = (data: any, type: PrintType, id: string) => {
  const printWindow = window.open('', '_blank', 'width=800,height=600');
  if (!printWindow) return;

  const logoUrl = `${window.location.origin}/logo.png`;
  const formatCurrency = (val: number = 0) =>
    `₱ ${(val || 0).toFixed?.(2) || '0.00'}`;

  // Format date helper
  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Handle different item structures for different document types
  const items: QuotationItem[] = data.items ?? [];

  // Calculate totals - use existing totals if available, otherwise calculate
  const calculateTotals = (items: QuotationItem[]) => {
    const totalPrice = items.reduce((sum, item) => {
      const total = Number(item.total ?? 0);
      const qty = Number(item.qty ?? 0);
      const unitPrice = Number(item.unitPrice ?? 0);
      return sum + (total || qty * unitPrice);
    }, 0);

    const vat = totalPrice * 0.12;
    const grandTotal = totalPrice + vat;
    return { totalPrice, vat, grandTotal };
  };

  // Use provided totals or calculate them
  const totals = data.totals || calculateTotals(items);

  const baseStyles = `
    <style>
      @page { size: A4; margin: 20mm; }
      @media print {
        body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; margin: 0; }
        header, footer { position: fixed; }
        header { top: 0; }
        footer { bottom: 0; }
        main { page-break-after: auto; }
        table, tr, td, th { page-break-inside: avoid !important; }
        img { display: block !important; visibility: visible !important; max-width: 100% !important; height: auto !important; }
      }
      body { font-family: Arial, sans-serif; font-size: 14px; color: black; line-height: 1.5; }
      header { left: 0; right: 0; height: 120px; text-align: center; padding: 10px 0; }
      header img { height: 80px; display: block; margin: 0 auto; }
      footer { left: 0; right: 0; display: flex; justify-content: space-between; padding: 0 60px; }
      footer div { width: 30%; text-align: center; border-top: 1px solid black; padding-top: 5px; }
      main { margin-top: 180px; margin-bottom: 120px; padding: 0 40px; }
      table { border-collapse: collapse; width: 100%; margin-top: 20px; }
      th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
      th { background: #f8f9fa; font-weight: bold; }
      .document-title { font-size: 24px; font-weight: bold; text-align: center; margin-bottom: 30px; color: #2563eb; }
      .info-section { margin: 20px 0; padding: 15px; background-color: #ffffffff; border-radius: 5px; }
      .info-section h3 { margin: 0 0 15px 0; color: #374151; font-size: 16px; border-bottom: 2px solid #ffffffff; padding-bottom: 5px; }
      .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
      .info-item { margin-bottom: 10px; }
      .info-item strong { color: #374151; display: inline-block; min-width: 120px; }
      .supplier-section { background-color: #ffffffff; padding: 15px; border-radius: 5px; margin: 15px 0; border-left: 4px solid #ffffffff; }
      .status-badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; text-transform: uppercase; }
      .status-new { background-color: #dbeafe; color: #1e40af; }
      .status-ongoing { background-color: #fef3c7; color: #92400e; }
      .status-completed { background-color: #d1fae5; color: #065f46; }
      .timeline-section { background-color: #f0f9ff; padding: 15px; border-radius: 5px; margin: 15px 0; }
      .description-section { background-color: #f9fafb; padding: 15px; border-radius: 5px; margin: 15px 0; border-left: 4px solid #10b981; }
    </style>
  `;

  let bodyContent = '';

  switch (type) {
    case 'project':
      bodyContent = `
        <div class="document-title">PROJECT DETAILS</div>
        
        <!-- Project Header Information -->
        <div class="info-section">
          <div class="info-grid">
            <div>
              <div class="info-item">
                <strong>Reference No:</strong> ${data.refNo || data.projectRefNo || '-'}
              </div>
              <div class="info-item">
                <strong>Project Name:</strong> ${data.projectName || '-'}
              </div>
              <div class="info-item">
                <strong>Status:</strong> 
                <span class="status-badge status-${(data.status || 'new').toLowerCase()}">${data.status || 'New'}</span>
              </div>
            </div>
            <div>
              <div class="info-item">
                <strong>Created Date:</strong> ${data.createdAt ? formatDate(data.createdAt.toDate?.() || data.createdAt) : formatDate(data.date) || new Date().toLocaleDateString()}
              </div>
              ${data.updatedAt ? `
                <div class="info-item">
                  <strong>Last Updated:</strong> ${formatDate(data.updatedAt.toDate?.() || data.updatedAt)}
                </div>
              ` : ''}
            </div>
          </div>
        </div>

        <!-- Client Information Section -->
        <div class="info-section">
          <h3>Client Information</h3>
          <div class="info-grid">
            <div>
              <div class="info-item">
                <strong>Client Name:</strong> ${data.clientName || '-'}
              </div>
              <div class="info-item">
                <strong>Position:</strong> ${data.clientPosition || '-'}
              </div>
              <div class="info-item">
                <strong>Contact Number:</strong> ${data.clientContactNumber || data.contact || '-'}
              </div>
            </div>
            <div>
              ${data.clientAddress || data.address ? `
                <div class="info-item">
                  <strong>Address:</strong><br>
                  ${data.clientAddress || data.address}
                </div>
              ` : ''}
            </div>
          </div>
        </div>

        <!-- Project Timeline Section -->
        <div class="timeline-section">
          <h3>Project Timeline</h3>
          <div class="info-grid">
            <div>
              <div class="info-item">
                <strong>Start Date:</strong> ${formatDate(data.startDate)}
              </div>
            </div>
            <div>
              <div class="info-item">
                <strong>End Date:</strong> ${formatDate(data.endDate)}
              </div>
            </div>
          </div>
          ${data.startDate && data.endDate ? `
            <div class="info-item" style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #e5e7eb;">
              <strong>Project Duration:</strong> ${(() => {
                const start = new Date(data.startDate);
                const end = new Date(data.endDate);
                const diffTime = Math.abs(end.getTime() - start.getTime());
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                return `${diffDays} day${diffDays !== 1 ? 's' : ''}`;
              })()}
            </div>
          ` : ''}
        </div>

        <!-- Project Description Section -->
        ${data.description ? `
          <div class="description-section">
            <h3>Project Description</h3>
            <div style="white-space: pre-line; line-height: 1.6;">
              ${data.description}
            </div>
          </div>
        ` : ''}

        <!-- Project Items/Scope (if available) -->
        ${data.items?.length ? `
          <div class="info-section">
            <h3>Project Scope/Items</h3>
            <table style="width:100%; border-collapse:collapse; margin-top:10px;">
              <thead>
                <tr>
                  <th style="border:1px solid #ddd; padding:8px; background-color:#f8f9fa;">Item</th>
                  <th style="border:1px solid #ddd; padding:8px; background-color:#f8f9fa;">Description</th>
                  <th style="border:1px solid #ddd; padding:8px; background-color:#f8f9fa; text-align:right;">Quantity</th>
                  ${data.items.some((item: any) => item.unitPrice) ? '<th style="border:1px solid #ddd; padding:8px; background-color:#f8f9fa; text-align:right;">Unit Price</th>' : ''}
                  ${data.items.some((item: any) => item.total) ? '<th style="border:1px solid #ddd; padding:8px; background-color:#f8f9fa; text-align:right;">Total</th>' : ''}
                </tr>
              </thead>
              <tbody>
                ${data.items.map((item: any, index: number) => `
                  <tr>
                    <td style="border:1px solid #ddd; padding:8px;">${index + 1}</td>
                    <td style="border:1px solid #ddd; padding:8px;">${item.description || '-'}</td>
                    <td style="border:1px solid #ddd; padding:8px; text-align:right;">${item.qty || '-'}</td>
                    ${data.items.some((item: any) => item.unitPrice) ? `<td style="border:1px solid #ddd; padding:8px; text-align:right;">${item.unitPrice ? formatCurrency(Number(item.unitPrice)) : '-'}</td>` : ''}
                    ${data.items.some((item: any) => item.total) ? `<td style="border:1px solid #ddd; padding:8px; text-align:right;">${item.total ? formatCurrency(Number(item.total)) : '-'}</td>` : ''}
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        ` : ''}

        <!-- Project Totals (if available) -->
        ${(data.items?.length && data.items.some((item: any) => item.total || item.unitPrice)) ? `
          <div style="text-align:right; margin-top:20px; padding: 15px; background-color: #f8f9fa; border-radius: 5px;">
            <div style="font-size: 16px;">
              <div style="margin: 8px 0;"><strong>Subtotal:</strong> ${formatCurrency(totals.totalPrice)}</div>
              <div style="margin: 8px 0;"><strong>VAT (12%):</strong> ${formatCurrency(totals.vat)}</div>
              <div style="font-size: 18px; font-weight: bold; margin: 12px 0; padding-top: 8px; border-top: 2px solid #374151; color: #1f2937;">
                <strong>Grand Total:</strong> ${formatCurrency(totals.grandTotal)}
              </div>
            </div>
          </div>
        ` : ''}

        <!-- Additional Project Information (if available) -->
        ${(data.notes || data.remarks || data.additionalInfo) ? `
          <div class="info-section" style="margin-top: 30px;">
            <h3>Additional Information</h3>
            ${data.notes ? `<div class="info-item"><strong>Notes:</strong><br>${data.notes}</div>` : ''}
            ${data.remarks ? `<div class="info-item"><strong>Remarks:</strong><br>${data.remarks}</div>` : ''}
            ${data.additionalInfo ? `<div class="info-item"><strong>Additional Info:</strong><br>${data.additionalInfo}</div>` : ''}
          </div>
        ` : ''}
      `;
      break;

    case 'quotation':
      bodyContent = `
        <div style="margin-bottom:20px; text-align:right;">
          <p><strong>Quotation Ref:</strong> ${data.refNo || '-'}</p>
          <p><strong>Project Ref No:</strong> ${data.projectRefNo || '-'}</p>
          <p><strong>Date:</strong> ${data.date || new Date().toLocaleDateString()}</p>
        </div>

        <div style="margin-bottom:20px;">
          <p><strong>Customer Name:</strong> ${data.name || '-'}</p>
          ${data.position ? `<p><strong>Position:</strong> ${data.position}</p>` : ''}
          ${data.address ? `<p><strong>Address:</strong> ${data.address}</p>` : ''}
          ${data.through ? `<p><strong>Through:</strong> ${data.through}</p>` : ''}
        </div>

        ${data.subject ? `<p><strong>Subject:</strong> ${data.subject}</p>` : ''}
        ${data.description ? `<p style="white-space: pre-line;"><strong>Description:</strong><br>${data.description}</p>` : ''}

        ${
          data.items?.length
            ? `<table style="width:100%; border-collapse:collapse; margin-bottom:20px;">
                <thead>
                  <tr style="background-color:#e5e7eb;">
                    <th style="border:1px solid #888; padding:6px;">Qty</th>
                    <th style="border:1px solid #888; padding:6px;">Description</th>
                    <th style="border:1px solid #888; padding:6px; text-align:right;">Unit Price</th>
                    <th style="border:1px solid #888; padding:6px; text-align:right;">Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${data.items
                    .map(
                      (item: QuotationItem) => `
                    <tr>
                      <td style="border:1px solid #888; padding:6px; text-align:center;">${item.qty ?? '-'}</td>
                      <td style="border:1px solid #888; padding:6px;">${item.description || '-'}</td>
                      <td style="border:1px solid #888; padding:6px; text-align:right;">${formatCurrency(Number(item.unitPrice ?? 0))}</td>
                      <td style="border:1px solid #888; padding:6px; text-align:right;">${formatCurrency(Number(item.total ?? 0) || (Number(item.qty ?? 0) * Number(item.unitPrice ?? 0)))}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>`
            : ''
        }

        <div style="text-align:right; margin-top:20px;">
          <p><strong>Total:</strong> ${formatCurrency(totals.totalPrice)}</p>
          <p><strong>VAT (12%):</strong> ${formatCurrency(totals.vat)}</p>
          <p style="font-size:16px; font-weight:bold;">Grand Total: ${formatCurrency(totals.grandTotal)}</p>
        </div>
      `;
      break;

    case 'purchaseOrder':
      // Handle different total calculation scenarios
      let poTotals;
      
      if (data.items?.length > 0) {
        // If there are line items, use calculated totals from items
        poTotals = totals;
      } else if (data.total || data.totalAmount) {
        // If there's a single total amount (from simple form), calculate VAT from that
        const baseTotal = Number(data.total || data.totalAmount || 0);
        poTotals = {
          totalPrice: baseTotal,
          subtotal: baseTotal,
          vat: baseTotal * 0.12,
          grandTotal: baseTotal + (baseTotal * 0.12)
        };
      } else if (data.totals) {
        // Use provided totals object
        poTotals = data.totals;
      } else {
        // Fallback to zero totals
        poTotals = { totalPrice: 0, subtotal: 0, vat: 0, grandTotal: 0 };
      }

      bodyContent = `
        <div class="info-section">
          <div style="display: flex; justify-content: space-between; margin-bottom: 15px;">
            <div>
              <p><strong>Project Ref:</strong> ${data.projectRefNo || data.refNo || '-'}</p>
              ${data.projectName ? `<p><strong>Project:</strong> ${data.projectName}</p>` : ''}
            </div>
            <div style="text-align: right;">
              <p><strong>PO Number:</strong> ${data.poNumber || data.poNumber || '-'}</p>
              <p><strong>Date:</strong> ${data.date ? new Date(data.date).toLocaleDateString() : new Date().toLocaleDateString()}</p>
            </div>
          </div>
        </div>

        <div class="supplier-section">
          <h3 style="margin: 0 0 10px 0; color: #fffdfdff;">Supplier Information</h3>
          <p><strong>Supplier:</strong> ${data.supplierName || data.supplier || '-'}</p>
          ${data.address || data.supplierAddress ? `<p><strong>Address:</strong> ${data.address || data.supplierAddress}</p>` : ''}
          ${data.contact || data.supplierContactNumber ? `<p><strong>Contact:</strong> ${data.contact || data.supplierContactNumber}</p>` : ''}
          ${data.position || data.supplierPosition ? `<p><strong>Position:</strong> ${data.position || data.supplierPosition}</p>` : ''}
        </div>

        ${
          data.items?.length
            ? `<table style="width:100%; border-collapse:collapse; margin:20px 0;">
                <thead>
                  <tr style="background-color:#e5e7eb;">
                    <th style="border:1px solid #888; padding:8px; width:10%;">Qty</th>
                    <th style="border:1px solid #888; padding:8px; width:50%;">Description</th>
                    <th style="border:1px solid #888; padding:8px; width:20%; text-align:right;">Unit Price</th>
                    <th style="border:1px solid #888; padding:8px; width:20%; text-align:right;">Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${data.items
                    .map(
                      (item: any) => `
                      <tr>
                        <td style="border:1px solid #888; padding:8px; text-align:center;">${item.qty ?? '-'}</td>
                        <td style="border:1px solid #888; padding:8px;">${item.description || '-'}</td>
                        <td style="border:1px solid #888; padding:8px; text-align:right;">${formatCurrency(Number(item.unitPrice ?? 0))}</td>
                        <td style="border:1px solid #888; padding:8px; text-align:right;">${formatCurrency(Number(item.total ?? 0) || (Number(item.qty ?? 0) * Number(item.unitPrice ?? 0)))}</td>
                      </tr>
                    `
                    )
                    .join('')}
                </tbody>
              </table>`
            : (data.total || data.totalAmount) 
              ? `<div style="text-align: center; margin: 30px 0; padding: 20px; background-color: #ffffffff; border-radius: 5px;">
                  <p style="margin: 0; font-size: 16px;"><strong>Purchase Order Amount:</strong> ${formatCurrency(Number(data.total || data.totalAmount))}</p>
                </div>`
              : '<p style="text-align: center; margin: 30px 0; color: #ffffffff;">No items or amount specified</p>'
        }

        <div style="text-align:right; margin-top:30px; border-top: 2px solid #ffffffff; padding-top: 15px;">
          <p style="margin: 5px 0;"><strong>Total:</strong> ${formatCurrency(poTotals.totalPrice || poTotals.subtotal)}</p>
          <p style="margin: 5px 0;"><strong>VAT (12%):</strong> ${formatCurrency(poTotals.vat)}</p>
          <p style="font-size:18px; font-weight:bold; margin: 10px 0; color: #000000ff;">Grand Total: ${formatCurrency(poTotals.grandTotal)}</p>
        </div>
      `;
      break;
  }

  const htmlContent = `
    <html>
      <head>
        <title>Print ${type}</title>
        ${baseStyles}
      </head>
      <body>
        <header>
          <img 
            src="${logoUrl}" 
            alt="Company Logo" 
            onload="this.style.visibility='visible'" 
            style="visibility:hidden; display:block; margin:0 auto;" 
          />
        </header>  
        <main>
          ${bodyContent}
        </main>
        <footer>
          <div>Prepared by</div>
          <div>Approved by</div>
        </footer>
      </body>
    </html>
  `;

  printWindow.document.write(htmlContent);
  printWindow.document.close();

  const img = printWindow.document.querySelector('img');
  if (img) {
    if (img.complete) {
      setTimeout(() => printWindow.print(), 100);
    } else {
      img.onload = () => setTimeout(() => printWindow.print(), 100);
      img.onerror = () => {
        console.warn('Logo failed to load');
        setTimeout(() => printWindow.print(), 100);
      };
    }
  } else {
    setTimeout(() => printWindow.print(), 100);
  }
};