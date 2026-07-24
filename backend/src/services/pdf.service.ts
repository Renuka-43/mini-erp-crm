import PDFDocument from 'pdfkit';

export const generateChallanPDF = (challan: any): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const buffers: Buffer[] = [];

      doc.on('data', (chunk) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));

      const customer = JSON.parse(challan.customerSnapshot || '{}');

      // Document Header
      doc.fillColor('#1E293B').fontSize(22).text('MINI ERP & CRM PORTAL', { align: 'right' });
      doc.fontSize(10).fillColor('#64748B').text('Wholesale & Distribution Division', { align: 'right' });
      doc.text('Official Sales Challan / Delivery Docket', { align: 'right' });
      doc.moveDown(1.5);

      // Divider
      doc.strokeColor('#E2E8F0').lineWidth(1).moveTo(50, doc.y).lineTo(545, doc.y).stroke();
      doc.moveDown(1);

      // Challan Meta Info
      const topY = doc.y;
      doc.fillColor('#0F172A').fontSize(14).text(`SALES CHALLAN #${challan.challanNumber}`, 50, topY);
      doc.fontSize(10).fillColor('#475569');
      doc.text(`Status: ${challan.status}`, 50, topY + 20);
      doc.text(`Date: ${new Date(challan.createdAt).toLocaleDateString('en-US', { dateStyle: 'medium' })}`, 50, topY + 35);
      doc.text(`Issued By: ${challan.createdBy?.name || 'System User'}`, 50, topY + 50);

      // Customer Box
      doc.fillColor('#0F172A').fontSize(12).text('CUSTOMER DETAILS:', 320, topY);
      doc.fontSize(10).fillColor('#334155');
      doc.text(`Name: ${customer.name || 'N/A'}`, 320, topY + 18);
      doc.text(`Business: ${customer.businessName || 'N/A'}`, 320, topY + 32);
      doc.text(`Mobile: ${customer.mobile || 'N/A'}`, 320, topY + 46);
      doc.text(`GST No: ${customer.gstNumber || 'N/A'}`, 320, topY + 60);
      doc.text(`Address: ${customer.address || 'N/A'}`, 320, topY + 74);

      doc.moveDown(5);

      // Table Header
      const tableTop = doc.y + 20;
      doc.fillColor('#1E293B').fontSize(10).font('Helvetica-Bold');
      doc.text('#', 50, tableTop);
      doc.text('Item Description', 80, tableTop);
      doc.text('Qty', 320, tableTop, { width: 50, align: 'right' });
      doc.text('Unit Price ($)', 380, tableTop, { width: 80, align: 'right' });
      doc.text('Subtotal ($)', 470, tableTop, { width: 75, align: 'right' });

      doc.strokeColor('#CBD5E1').lineWidth(1).moveTo(50, tableTop + 15).lineTo(545, tableTop + 15).stroke();

      // Table Body
      let y = tableTop + 25;
      doc.font('Helvetica');

      challan.items.forEach((item: any, index: number) => {
        const prod = JSON.parse(item.productSnapshot || '{}');
        doc.fillColor('#334155').fontSize(9);
        doc.text(`${index + 1}`, 50, y);
        doc.text(`${prod.name || 'Product'} (${prod.sku || 'N/A'})`, 80, y, { width: 230 });
        doc.text(`${item.quantity}`, 320, y, { width: 50, align: 'right' });
        doc.text(`${item.unitPrice.toFixed(2)}`, 380, y, { width: 80, align: 'right' });
        doc.text(`${item.subtotal.toFixed(2)}`, 470, y, { width: 75, align: 'right' });
        y += 20;
      });

      doc.strokeColor('#E2E8F0').lineWidth(1).moveTo(50, y).lineTo(545, y).stroke();
      y += 15;

      // Summary
      doc.font('Helvetica-Bold').fontSize(10).fillColor('#0F172A');
      doc.text(`Total Quantity: ${challan.totalQuantity}`, 320, y, { width: 100, align: 'right' });
      doc.text(`Grand Total: $${challan.totalAmount.toFixed(2)}`, 450, y, { width: 95, align: 'right' });

      y += 40;
      doc.font('Helvetica-Oblique').fontSize(9).fillColor('#64748B');
      doc.text('Thank you for your business! This is a system-generated sales challan document.', 50, y, { align: 'center' });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};
