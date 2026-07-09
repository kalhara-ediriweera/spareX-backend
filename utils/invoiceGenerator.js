import PDFDocument from 'pdfkit';

export const generateInvoicePdf = (order, res) => {
  const doc = new PDFDocument({ margin: 50 });

  // Pipe to response
  doc.pipe(res);

  // Header Logo and Info
  doc
    .fillColor('#FF6B00')
    .fontSize(28)
    .text('SPAREX', 50, 50, { bold: true })
    .fillColor('#444444')
    .fontSize(10)
    .text('Premium Vehicle Spare Parts Store', 50, 80)
    .text('No. 88/8/2, Colombo, Sri Lanka', 50, 95)
    .text('Hotline: 077-255-7541 | support@sparex.lk', 50, 110);

  // Invoice Meta Info
  doc
    .fillColor('#000000')
    .fontSize(14)
    .text('INVOICE', 400, 50, { align: 'right', bold: true })
    .fontSize(10)
    .text(`Invoice No: INV-${order._id.toString().substring(18).toUpperCase()}`, 400, 70, { align: 'right' })
    .text(`Date: ${new Date(order.createdAt).toLocaleDateString()}`, 400, 85, { align: 'right' })
    .text(`Payment: ${order.paymentMethod} (${order.isPaid ? 'Paid' : 'Unpaid'})`, 400, 100, { align: 'right' });

  // Divider
  doc.moveTo(50, 135).lineTo(550, 135).strokeColor('#cccccc').stroke();

  // Addresses
  doc
    .fontSize(12)
    .text('Bill To:', 50, 155, { bold: true })
    .fontSize(10);
  
  if (order.user) {
    doc.text(order.user.name, 50, 175);
    doc.text(order.user.email, 50, 190);
  } else {
    doc.text(order.guestDetails.name, 50, 175);
    doc.text(order.guestDetails.email, 50, 190);
  }
  
  const addr = order.shippingAddress;
  doc.text(`${addr.street}, ${addr.city}`, 50, 205);
  doc.text(`${addr.state}, ${addr.postalCode}`, 50, 220);

  // Delivery details
  doc
    .fontSize(12)
    .text('Shipping Status:', 350, 155, { bold: true })
    .fontSize(10)
    .text(`Status: ${order.status}`, 350, 175)
    .text(`Is Paid: ${order.isPaid ? 'Yes' : 'No'}`, 350, 190);

  // Divider
  doc.moveTo(50, 245).lineTo(550, 245).strokeColor('#cccccc').stroke();

  // Table Headers
  const itemTableTop = 270;
  doc
    .fontSize(10)
    .text('Item / Part Number', 50, itemTableTop, { bold: true })
    .text('Qty', 300, itemTableTop, { bold: true, width: 30, align: 'right' })
    .text('Unit Price', 350, itemTableTop, { bold: true, width: 90, align: 'right' })
    .text('Amount', 450, itemTableTop, { bold: true, width: 100, align: 'right' });

  // Table divider
  doc.moveTo(50, 285).lineTo(550, 285).strokeColor('#999999').stroke();

  let position = 295;
  order.orderItems.forEach(item => {
    doc
      .fontSize(9)
      .text(`${item.title}\n(PN: ${item.partNumber})`, 50, position, { width: 230 })
      .text(item.quantity.toString(), 300, position, { width: 30, align: 'right' })
      .text(`Rs. ${item.price.toFixed(2)}`, 350, position, { width: 90, align: 'right' })
      .text(`Rs. ${(item.quantity * item.price).toFixed(2)}`, 450, position, { width: 100, align: 'right' });
    
    position += 35;
  });

  // Totals Section
  doc.moveTo(50, position).lineTo(550, position).strokeColor('#cccccc').stroke();
  position += 15;

  doc
    .fontSize(9)
    .text('Subtotal:', 350, position, { align: 'right' })
    .text(`Rs. ${order.itemsPrice.toFixed(2)}`, 450, position, { align: 'right' });
  position += 15;

  doc
    .text('Shipping:', 350, position, { align: 'right' })
    .text(`Rs. ${order.shippingPrice.toFixed(2)}`, 450, position, { align: 'right' });
  position += 15;

  if (order.discountPrice > 0) {
    doc
      .text('Discount:', 350, position, { align: 'right' })
      .text(`-Rs. ${order.discountPrice.toFixed(2)}`, 450, position, { align: 'right' });
    position += 15;
  }

  doc
    .fontSize(11)
    .text('Total:', 350, position, { align: 'right', bold: true })
    .text(`Rs. ${order.totalPrice.toFixed(2)}`, 450, position, { align: 'right', bold: true });

  // Footer Note
  doc
    .fontSize(10)
    .fillColor('#666666')
    .text('Thank you for shopping with SpareX! Genuine Parts Guaranteed.', 50, 700, { align: 'center', italic: true });

  doc.end();
};
