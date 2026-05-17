import jsPDF from 'jspdf';
import { CartItem } from '../types';

export function generateOrderPdf(
  items: CartItem[],
  phone: string,
  totalPrice: number,
): void {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const W = doc.internal.pageSize.getWidth();
  const RED: [number, number, number] = [227, 25, 55];
  const DARK: [number, number, number] = [20, 20, 20];
  const GRAY: [number, number, number] = [120, 120, 120];
  const LIGHT: [number, number, number] = [248, 248, 248];

  const now = new Date();
  const dateStr = now.toLocaleDateString('en-GB'); // DD/MM/YYYY
  const orderNum = `ORD-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${String(now.getTime()).slice(-4)}`;

  // ── Header ────────────────────────────────────────────────────────────────
  doc.setFillColor(...RED);
  doc.rect(0, 0, W, 38, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(26);
  doc.setTextColor(255, 255, 255);
  doc.text('THub.ge', 20, 18);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text('Tesla Parts · Georgia', 20, 26);

  doc.setFontSize(9);
  doc.setTextColor(255, 200, 200);
  doc.text('ORDER FORM', W - 20, 18, { align: 'right' });
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.text(orderNum, W - 20, 26, { align: 'right' });

  // ── Order meta ───────────────────────────────────────────────────────────
  let y = 50;
  doc.setTextColor(...DARK);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('DATE', 20, y);
  doc.text('CUSTOMER PHONE', 80, y);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  y += 6;
  doc.text(dateStr, 20, y);
  doc.text(phone, 80, y);

  // ── Divider ───────────────────────────────────────────────────────────────
  y += 10;
  doc.setDrawColor(...RED);
  doc.setLineWidth(0.6);
  doc.line(20, y, W - 20, y);

  // ── Table header ─────────────────────────────────────────────────────────
  y += 8;
  doc.setFillColor(240, 240, 240);
  doc.rect(20, y - 5, W - 40, 9, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...GRAY);
  const COL = { num: 22, part: 30, name: 62, qty: 148, unit: 163, total: W - 22 };
  doc.text('#', COL.num, y);
  doc.text('PART NUMBER', COL.part, y);
  doc.text('DESCRIPTION', COL.name, y);
  doc.text('QTY', COL.qty, y, { align: 'center' });
  doc.text('UNIT', COL.unit, y);
  doc.text('TOTAL', COL.total, y, { align: 'right' });

  // ── Table rows ────────────────────────────────────────────────────────────
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  y += 9;

  items.forEach((item, i) => {
    const rowH = 9;
    if (i % 2 === 0) {
      doc.setFillColor(...LIGHT);
      doc.rect(20, y - 5.5, W - 40, rowH, 'F');
    }

    const rowTotal = item.product.price * item.quantity;
    const name = item.product.name.length > 50
      ? item.product.name.slice(0, 48) + '…'
      : item.product.name;

    doc.setTextColor(...DARK);
    doc.text(String(i + 1), COL.num, y);
    doc.text(item.product.partNumber, COL.part, y);
    doc.text(name, COL.name, y);
    doc.text(String(item.quantity), COL.qty, y, { align: 'center' });
    doc.text(`${item.product.price.toLocaleString()} GEL`, COL.unit, y);
    doc.text(`${rowTotal.toLocaleString()} GEL`, COL.total, y, { align: 'right' });

    y += rowH;
  });

  // ── Total row ─────────────────────────────────────────────────────────────
  y += 2;
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.line(20, y, W - 20, y);
  y += 8;

  doc.setFillColor(...RED);
  doc.rect(W - 70, y - 6, 50, 10, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(255, 255, 255);
  doc.text(`${totalPrice.toLocaleString()} GEL`, W - 22, y, { align: 'right' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...DARK);
  doc.text('ORDER TOTAL', 20, y);

  // ── T&C + Signature ───────────────────────────────────────────────────────
  y += 20;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...GRAY);
  doc.text(
    'By signing below, the customer confirms agreement with THub.ge terms and conditions.',
    20, y,
  );

  y += 12;
  doc.setDrawColor(...DARK);
  doc.setLineWidth(0.3);
  doc.line(20, y, 100, y);
  doc.line(130, y, 190, y);

  y += 5;
  doc.setFontSize(8);
  doc.text('Customer signature', 20, y);
  doc.text('Date', 130, y);

  // ── Footer ────────────────────────────────────────────────────────────────
  const pageH = doc.internal.pageSize.getHeight();
  doc.setFillColor(...RED);
  doc.rect(0, pageH - 14, W, 14, 'F');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.text(
    'THub.ge  ·  Tbilisi, Georgia  ·  +995 599 286 244  ·  info@thub.ge',
    W / 2,
    pageH - 5,
    { align: 'center' },
  );

  doc.save(`thub-order-${orderNum}.pdf`);
}
