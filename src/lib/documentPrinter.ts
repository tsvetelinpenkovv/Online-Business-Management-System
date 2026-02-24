import { jsPDF } from 'jspdf';
import { format } from 'date-fns';
import { bg } from 'date-fns/locale';

interface CompanyInfo {
  name?: string;
  eik?: string;
  vat_number?: string;
  address?: string;
  phone?: string;
  email?: string;
  manager_name?: string;
  bank_name?: string;
  bank_iban?: string;
  bank_bic?: string;
}

interface OrderForPrint {
  id: number;
  code: string;
  created_at: string;
  customer_name: string;
  phone: string;
  customer_email?: string | null;
  delivery_address?: string | null;
  product_name: string;
  quantity: number;
  total_price: number;
  status: string;
  comment?: string | null;
  items?: Array<{ product_name: string; catalog_number?: string; quantity: number; unit_price: number; total_price: number }>;
}

interface StockDocumentForPrint {
  document_number: string;
  document_type: string;
  document_date: string;
  counterparty_name?: string;
  notes?: string;
  total_amount?: number;
  items: Array<{ product_name: string; sku?: string; quantity: number; unit_price?: number; total_price?: number }>;
}

const MARGIN = 20;
const LINE_H = 7;

const drawHeader = (doc: jsPDF, title: string, company: CompanyInfo, y: number = MARGIN) => {
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(title, MARGIN, y);
  y += 8;
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  if (company.name) { doc.text(company.name, MARGIN, y); y += 5; }
  if (company.eik) { doc.text(`ЕИК: ${company.eik}`, MARGIN, y); y += 5; }
  if (company.address) { doc.text(company.address, MARGIN, y); y += 5; }
  if (company.phone) { doc.text(`Тел: ${company.phone}`, MARGIN, y); y += 5; }
  
  y += 3;
  doc.line(MARGIN, y, 190, y);
  y += 5;
  return y;
};

const drawFooter = (doc: jsPDF, y: number) => {
  y += 10;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(`Дата на печат: ${format(new Date(), 'dd.MM.yyyy HH:mm', { locale: bg })}`, MARGIN, y);
  return y;
};

// ========== 1. ОПАКОВЪЧЕН ЛИСТ (Packing Slip) ==========
export const printPackingSlip = (order: OrderForPrint, company: CompanyInfo) => {
  const doc = new jsPDF();
  let y = drawHeader(doc, 'ОПАКОВЪЧЕН ЛИСТ', company);

  // Order info
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(`Поръчка: #${order.code}`, MARGIN, y);
  doc.text(`Дата: ${format(new Date(order.created_at), 'dd.MM.yyyy')}`, 120, y);
  y += LINE_H;

  doc.setFont('helvetica', 'normal');
  doc.text(`Клиент: ${order.customer_name}`, MARGIN, y); y += 5;
  doc.text(`Телефон: ${order.phone}`, MARGIN, y); y += 5;
  if (order.delivery_address) {
    doc.text(`Адрес: ${order.delivery_address}`, MARGIN, y); y += 5;
  }
  y += 5;

  // Items table header
  doc.line(MARGIN, y, 190, y); y += 5;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('№', MARGIN, y);
  doc.text('Продукт', MARGIN + 10, y);
  doc.text('Кат. №', 120, y);
  doc.text('Кол.', 155, y);
  doc.text('Проверено', 170, y);
  y += LINE_H;
  doc.line(MARGIN, y - 3, 190, y - 3);

  // Items
  doc.setFont('helvetica', 'normal');
  const items = order.items && order.items.length > 0
    ? order.items
    : [{ product_name: order.product_name, catalog_number: '', quantity: order.quantity, unit_price: 0, total_price: 0 }];

  items.forEach((item, i) => {
    if (y > 270) { doc.addPage(); y = MARGIN; }
    doc.text(`${i + 1}`, MARGIN, y);
    doc.text(item.product_name.substring(0, 50), MARGIN + 10, y);
    doc.text(item.catalog_number || '-', 120, y);
    doc.text(String(item.quantity), 155, y);
    doc.rect(172, y - 4, 8, 5); // checkbox
    y += LINE_H;
  });

  y += 5;
  doc.line(MARGIN, y, 190, y); y += 8;
  doc.setFontSize(9);
  doc.text(`Общо артикули: ${items.length}`, MARGIN, y);
  doc.text(`Общо бройки: ${items.reduce((s, i) => s + i.quantity, 0)}`, 100, y);

  if (order.comment) {
    y += 10;
    doc.text(`Забележка: ${order.comment}`, MARGIN, y);
  }

  // Signatures
  y += 20;
  doc.text('Подготвил: ____________________', MARGIN, y);
  doc.text('Проверил: ____________________', 110, y);

  drawFooter(doc, y + 10);
  doc.save(`опаковъчен_лист_${order.code}.pdf`);
};

// ========== 2. ПРИЕМО-ПРЕДАВАТЕЛЕН ПРОТОКОЛ (Handover Protocol) ==========
export const printHandoverProtocol = (order: OrderForPrint, company: CompanyInfo) => {
  const doc = new jsPDF();
  let y = drawHeader(doc, 'ПРИЕМО-ПРЕДАВАТЕЛЕН ПРОТОКОЛ', company);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Дата: ${format(new Date(), 'dd.MM.yyyy', { locale: bg })}`, MARGIN, y); y += LINE_H;
  doc.text(`Относно поръчка: #${order.code} от ${format(new Date(order.created_at), 'dd.MM.yyyy')}`, MARGIN, y); y += LINE_H * 2;

  doc.text('Предаващ:', MARGIN, y);
  doc.setFont('helvetica', 'bold');
  doc.text(company.name || '_______________', 60, y);
  y += LINE_H;

  doc.setFont('helvetica', 'normal');
  doc.text('Приемащ:', MARGIN, y);
  doc.setFont('helvetica', 'bold');
  doc.text(order.customer_name, 60, y);
  y += LINE_H;

  doc.setFont('helvetica', 'normal');
  if (order.delivery_address) {
    doc.text(`Адрес: ${order.delivery_address}`, MARGIN, y); y += LINE_H;
  }
  doc.text(`Телефон: ${order.phone}`, MARGIN, y); y += LINE_H * 2;

  // Items
  doc.line(MARGIN, y, 190, y); y += 5;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('№', MARGIN, y);
  doc.text('Описание', MARGIN + 10, y);
  doc.text('Кол.', 130, y);
  doc.text('Ед. цена', 150, y);
  doc.text('Стойност', 175, y);
  y += LINE_H;
  doc.line(MARGIN, y - 3, 190, y - 3);

  doc.setFont('helvetica', 'normal');
  const items = order.items && order.items.length > 0
    ? order.items
    : [{ product_name: order.product_name, quantity: order.quantity, unit_price: order.total_price / order.quantity, total_price: order.total_price, catalog_number: '' }];

  items.forEach((item, i) => {
    doc.text(`${i + 1}`, MARGIN, y);
    doc.text(item.product_name.substring(0, 55), MARGIN + 10, y);
    doc.text(String(item.quantity), 130, y);
    doc.text(item.unit_price.toFixed(2), 150, y);
    doc.text(item.total_price.toFixed(2), 175, y);
    y += LINE_H;
  });

  y += 3;
  doc.line(MARGIN, y, 190, y); y += 5;
  doc.setFont('helvetica', 'bold');
  doc.text(`ОБЩА СТОЙНОСТ: ${order.total_price.toFixed(2)} EUR`, 130, y);
  y += LINE_H * 3;

  doc.setFont('helvetica', 'normal');
  doc.text('С подписването на този протокол, приемащата страна потвърждава,', MARGIN, y); y += 5;
  doc.text('че е получила описаните артикули в добро състояние.', MARGIN, y);
  y += 15;

  doc.text('Предал: ____________________', MARGIN, y);
  doc.text('Приел: ____________________', 110, y);
  y += 10;
  doc.text('(подпис, печат)', MARGIN + 15, y);
  doc.text('(подпис)', 125, y);

  drawFooter(doc, y + 10);
  doc.save(`протокол_${order.code}.pdf`);
};

// ========== 3. СТОКОВА РАЗПИСКА (Stock Receipt) ==========
export const printStockReceipt = (stockDoc: StockDocumentForPrint, company: CompanyInfo) => {
  const doc = new jsPDF();
  const typeLabels: Record<string, string> = {
    receiving: 'ПРИЕМНА СТОКОВА РАЗПИСКА',
    dispatch: 'РАЗХОДНА СТОКОВА РАЗПИСКА',
    adjustment: 'КОРЕКЦИОННА СТОКОВА РАЗПИСКА',
    return: 'РАЗПИСКА ЗА ВРЪЩАНЕ',
    inventory: 'ИНВЕНТАРИЗАЦИОННА РАЗПИСКА',
  };
  
  let y = drawHeader(doc, typeLabels[stockDoc.document_type] || 'СТОКОВА РАЗПИСКА', company);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Документ №: ${stockDoc.document_number}`, MARGIN, y);
  doc.text(`Дата: ${format(new Date(stockDoc.document_date), 'dd.MM.yyyy')}`, 120, y);
  y += LINE_H;
  
  if (stockDoc.counterparty_name) {
    doc.text(`Контрагент: ${stockDoc.counterparty_name}`, MARGIN, y); y += LINE_H;
  }
  y += 3;

  // Items
  doc.line(MARGIN, y, 190, y); y += 5;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('№', MARGIN, y);
  doc.text('Артикул', MARGIN + 10, y);
  doc.text('Код', 110, y);
  doc.text('Кол.', 140, y);
  doc.text('Ед. цена', 155, y);
  doc.text('Стойност', 177, y);
  y += LINE_H;
  doc.line(MARGIN, y - 3, 190, y - 3);

  doc.setFont('helvetica', 'normal');
  stockDoc.items.forEach((item, i) => {
    if (y > 270) { doc.addPage(); y = MARGIN; }
    doc.text(`${i + 1}`, MARGIN, y);
    doc.text((item.product_name || '').substring(0, 45), MARGIN + 10, y);
    doc.text(item.sku || '-', 110, y);
    doc.text(String(item.quantity), 140, y);
    doc.text((item.unit_price || 0).toFixed(2), 155, y);
    doc.text((item.total_price || 0).toFixed(2), 177, y);
    y += LINE_H;
  });

  y += 3;
  doc.line(MARGIN, y, 190, y); y += 5;
  doc.setFont('helvetica', 'bold');
  doc.text(`ОБЩА СТОЙНОСТ: ${(stockDoc.total_amount || 0).toFixed(2)} EUR`, 130, y);

  if (stockDoc.notes) {
    y += 10;
    doc.setFont('helvetica', 'normal');
    doc.text(`Забележка: ${stockDoc.notes}`, MARGIN, y);
  }

  y += 20;
  doc.setFont('helvetica', 'normal');
  doc.text('Предал: ____________________', MARGIN, y);
  doc.text('Приел: ____________________', 110, y);

  drawFooter(doc, y + 10);
  doc.save(`разписка_${stockDoc.document_number}.pdf`);
};

// ========== 4. ПРОФОРМА ФАКТУРА (Proforma Invoice) ==========
export const printProformaInvoice = (order: OrderForPrint, company: CompanyInfo) => {
  const doc = new jsPDF();
  let y = drawHeader(doc, 'ПРОФОРМА ФАКТУРА', company);

  // Company details (seller)
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('ДОСТАВЧИК:', MARGIN, y);
  doc.setFont('helvetica', 'normal');
  y += 5;
  if (company.name) { doc.text(company.name, MARGIN, y); y += 5; }
  if (company.eik) { doc.text(`ЕИК: ${company.eik}`, MARGIN, y); y += 5; }
  if (company.vat_number) { doc.text(`ДДС №: ${company.vat_number}`, MARGIN, y); y += 5; }
  if (company.address) { doc.text(`Адрес: ${company.address}`, MARGIN, y); y += 5; }
  if (company.bank_iban) { doc.text(`IBAN: ${company.bank_iban}`, MARGIN, y); y += 5; }
  if (company.bank_bic) { doc.text(`BIC: ${company.bank_bic}`, MARGIN, y); y += 5; }

  // Buyer
  y += 5;
  doc.setFont('helvetica', 'bold');
  doc.text('ПОЛУЧАТЕЛ:', MARGIN, y);
  doc.setFont('helvetica', 'normal');
  y += 5;
  doc.text(order.customer_name, MARGIN, y); y += 5;
  if (order.delivery_address) { doc.text(`Адрес: ${order.delivery_address}`, MARGIN, y); y += 5; }
  doc.text(`Телефон: ${order.phone}`, MARGIN, y); y += 5;
  if (order.customer_email) { doc.text(`Email: ${order.customer_email}`, MARGIN, y); y += 5; }

  // Reference info
  y += 5;
  doc.text(`Поръчка: #${order.code}`, MARGIN, y);
  doc.text(`Дата: ${format(new Date(), 'dd.MM.yyyy')}`, 120, y);
  y += LINE_H + 3;

  // Items
  doc.line(MARGIN, y, 190, y); y += 5;
  doc.setFont('helvetica', 'bold');
  doc.text('№', MARGIN, y);
  doc.text('Описание', MARGIN + 10, y);
  doc.text('Кол.', 125, y);
  doc.text('Ед. цена', 145, y);
  doc.text('Стойност', 172, y);
  y += LINE_H;
  doc.line(MARGIN, y - 3, 190, y - 3);

  doc.setFont('helvetica', 'normal');
  const items = order.items && order.items.length > 0
    ? order.items
    : [{ product_name: order.product_name, quantity: order.quantity, unit_price: order.total_price / order.quantity, total_price: order.total_price, catalog_number: '' }];

  let subtotal = 0;
  items.forEach((item, i) => {
    doc.text(`${i + 1}`, MARGIN, y);
    doc.text(item.product_name.substring(0, 52), MARGIN + 10, y);
    doc.text(String(item.quantity), 125, y);
    doc.text(item.unit_price.toFixed(2), 145, y);
    doc.text(item.total_price.toFixed(2), 172, y);
    subtotal += item.total_price;
    y += LINE_H;
  });

  const vat = subtotal * 0.2;
  const total = subtotal + vat;

  y += 3;
  doc.line(MARGIN, y, 190, y); y += 5;
  
  doc.text('Данъчна основа:', 120, y);
  doc.text(`${subtotal.toFixed(2)} EUR`, 172, y); y += 5;
  doc.text('ДДС 20%:', 120, y);
  doc.text(`${vat.toFixed(2)} EUR`, 172, y); y += 5;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('ОБЩО:', 120, y);
  doc.text(`${total.toFixed(2)} EUR`, 168, y);

  y += 15;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.text('Тази проформа фактура не е данъчен документ.', MARGIN, y); y += 4;
  doc.text('Валидна е за 14 дни от датата на издаване.', MARGIN, y);

  y += 15;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('Съставил: ____________________', MARGIN, y);
  if (company.manager_name) {
    doc.text(`(${company.manager_name})`, MARGIN + 15, y + 5);
  }

  drawFooter(doc, y + 15);
  doc.save(`проформа_${order.code}.pdf`);
};
