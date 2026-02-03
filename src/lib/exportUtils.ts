import { jsPDF } from 'jspdf';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import { bg } from 'date-fns/locale';
import { InventoryProduct, StockMovement, MOVEMENT_TYPE_LABELS } from '@/types/inventory';

// Common PDF settings
const PDF_SETTINGS = {
  margin: 20,
  lineHeight: 7,
  fontSize: {
    title: 16,
    subtitle: 12,
    header: 10,
    body: 9,
  },
};

// Helper to add page header
const addPdfHeader = (doc: jsPDF, title: string, subtitle?: string) => {
  doc.setFontSize(PDF_SETTINGS.fontSize.title);
  doc.setFont('helvetica', 'bold');
  doc.text(title, PDF_SETTINGS.margin, PDF_SETTINGS.margin);
  
  if (subtitle) {
    doc.setFontSize(PDF_SETTINGS.fontSize.subtitle);
    doc.setFont('helvetica', 'normal');
    doc.text(subtitle, PDF_SETTINGS.margin, PDF_SETTINGS.margin + 8);
  }
  
  doc.setFontSize(PDF_SETTINGS.fontSize.body);
  doc.text(
    `Генериран: ${format(new Date(), 'dd.MM.yyyy HH:mm', { locale: bg })}`,
    PDF_SETTINGS.margin,
    PDF_SETTINGS.margin + (subtitle ? 16 : 8)
  );
  
  return subtitle ? 28 : 20;
};

// Export inventory stock report to PDF
export const exportStockReportPDF = (
  products: InventoryProduct[],
  companyName?: string
) => {
  const doc = new jsPDF();
  
  const headerOffset = addPdfHeader(
    doc, 
    'Справка за наличности',
    companyName
  );
  
  let yPosition = PDF_SETTINGS.margin + headerOffset;
  
  // Table header
  doc.setFontSize(PDF_SETTINGS.fontSize.header);
  doc.setFont('helvetica', 'bold');
  
  const columns = ['Код', 'Наименование', 'Категория', 'Наличност', 'Мин.', 'Покупна', 'Стойност'];
  const columnWidths = [20, 55, 30, 20, 15, 20, 25];
  let xPosition = PDF_SETTINGS.margin;
  
  columns.forEach((col, i) => {
    doc.text(col, xPosition, yPosition);
    xPosition += columnWidths[i];
  });
  
  yPosition += PDF_SETTINGS.lineHeight;
  doc.line(PDF_SETTINGS.margin, yPosition - 3, 200, yPosition - 3);
  
  // Table body
  doc.setFontSize(PDF_SETTINGS.fontSize.body);
  doc.setFont('helvetica', 'normal');
  
  let totalValue = 0;
  
  products.forEach((product) => {
    if (yPosition > 270) {
      doc.addPage();
      yPosition = PDF_SETTINGS.margin;
    }
    
    const value = product.current_stock * product.purchase_price;
    totalValue += value;
    
    xPosition = PDF_SETTINGS.margin;
    const row = [
      product.sku.substring(0, 12),
      product.name.substring(0, 35),
      (product.category?.name || '-').substring(0, 18),
      product.current_stock.toString(),
      product.min_stock_level.toString(),
      product.purchase_price.toFixed(2),
      value.toFixed(2),
    ];
    
    row.forEach((cell, i) => {
      doc.text(cell, xPosition, yPosition);
      xPosition += columnWidths[i];
    });
    
    yPosition += PDF_SETTINGS.lineHeight;
  });
  
  // Total row
  yPosition += 5;
  doc.line(PDF_SETTINGS.margin, yPosition - 3, 200, yPosition - 3);
  doc.setFont('helvetica', 'bold');
  doc.text('ОБЩО:', PDF_SETTINGS.margin, yPosition);
  doc.text(`${products.length} артикула`, PDF_SETTINGS.margin + 75, yPosition);
  doc.text(`${totalValue.toFixed(2)} EUR`, PDF_SETTINGS.margin + 145, yPosition);
  
  doc.save(`наличности_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
};

// Export stock movements report to PDF
export const exportMovementsReportPDF = (
  movements: StockMovement[],
  dateFrom: string,
  dateTo: string,
  companyName?: string
) => {
  const doc = new jsPDF();
  
  const headerOffset = addPdfHeader(
    doc, 
    'Справка за движения',
    `${companyName ? companyName + ' | ' : ''}${format(new Date(dateFrom), 'dd.MM.yyyy')} - ${format(new Date(dateTo), 'dd.MM.yyyy')}`
  );
  
  let yPosition = PDF_SETTINGS.margin + headerOffset;
  
  // Table header
  doc.setFontSize(PDF_SETTINGS.fontSize.header);
  doc.setFont('helvetica', 'bold');
  
  const columns = ['Дата', 'Тип', 'Артикул', 'Код', 'Кол.', 'Преди', 'След', 'Сума'];
  const columnWidths = [25, 18, 45, 25, 15, 18, 18, 22];
  let xPosition = PDF_SETTINGS.margin;
  
  columns.forEach((col, i) => {
    doc.text(col, xPosition, yPosition);
    xPosition += columnWidths[i];
  });
  
  yPosition += PDF_SETTINGS.lineHeight;
  doc.line(PDF_SETTINGS.margin, yPosition - 3, 200, yPosition - 3);
  
  // Table body
  doc.setFontSize(PDF_SETTINGS.fontSize.body);
  doc.setFont('helvetica', 'normal');
  
  let totalIn = 0;
  let totalOut = 0;
  
  movements.forEach((movement) => {
    if (yPosition > 270) {
      doc.addPage();
      yPosition = PDF_SETTINGS.margin;
    }
    
    if (movement.movement_type === 'in' || movement.movement_type === 'return') {
      totalIn += movement.total_price;
    } else if (movement.movement_type === 'out') {
      totalOut += movement.total_price;
    }
    
    xPosition = PDF_SETTINGS.margin;
    const row = [
      format(new Date(movement.created_at), 'dd.MM.yy HH:mm'),
      MOVEMENT_TYPE_LABELS[movement.movement_type]?.substring(0, 8) || movement.movement_type,
      (movement.product?.name || '-').substring(0, 28),
      (movement.product?.sku || '-').substring(0, 14),
      movement.quantity.toString(),
      movement.stock_before.toString(),
      movement.stock_after.toString(),
      movement.total_price.toFixed(2),
    ];
    
    row.forEach((cell, i) => {
      doc.text(cell, xPosition, yPosition);
      xPosition += columnWidths[i];
    });
    
    yPosition += PDF_SETTINGS.lineHeight;
  });
  
  // Summary
  yPosition += 5;
  doc.line(PDF_SETTINGS.margin, yPosition - 3, 200, yPosition - 3);
  doc.setFont('helvetica', 'bold');
  doc.text(`Общо движения: ${movements.length}`, PDF_SETTINGS.margin, yPosition);
  yPosition += PDF_SETTINGS.lineHeight;
  doc.text(`Приходи: ${totalIn.toFixed(2)} EUR`, PDF_SETTINGS.margin, yPosition);
  doc.text(`Разходи: ${totalOut.toFixed(2)} EUR`, PDF_SETTINGS.margin + 60, yPosition);
  
  doc.save(`движения_${dateFrom}_${dateTo}.pdf`);
};

// Export inventory to Excel
export const exportStockReportExcel = (
  products: InventoryProduct[],
  filename?: string
) => {
  const data = products.map(p => ({
    'Код': p.sku,
    'Наименование': p.name,
    'Категория': p.category?.name || '',
    'Наличност': p.current_stock,
    'Резервирано': (p as any).reserved_stock || 0,
    'Свободно': p.current_stock - ((p as any).reserved_stock || 0),
    'Мин. ниво': p.min_stock_level,
    'Мерна единица': p.unit?.abbreviation || 'бр.',
    'Покупна цена': p.purchase_price,
    'Продажна цена': p.sale_price,
    'Стойност (покупна)': p.current_stock * p.purchase_price,
    'Стойност (продажна)': p.current_stock * p.sale_price,
    'Баркод': p.barcode || '',
    'Активен': p.is_active ? 'Да' : 'Не',
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Наличности');
  
  // Auto-width columns
  const colWidths = Object.keys(data[0] || {}).map(key => ({
    wch: Math.max(key.length, 12)
  }));
  ws['!cols'] = colWidths;
  
  XLSX.writeFile(wb, filename || `наличности_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
};

// Export movements to Excel
export const exportMovementsReportExcel = (
  movements: StockMovement[],
  dateFrom: string,
  dateTo: string
) => {
  const data = movements.map(m => ({
    'Дата': format(new Date(m.created_at), 'dd.MM.yyyy HH:mm'),
    'Тип': MOVEMENT_TYPE_LABELS[m.movement_type] || m.movement_type,
    'Артикул': m.product?.name || '',
    'Код': m.product?.sku || '',
    'Количество': m.quantity,
    'Преди': m.stock_before,
    'След': m.stock_after,
    'Ед. цена': m.unit_price,
    'Обща сума': m.total_price,
    'Причина': m.reason || '',
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Движения');
  
  const colWidths = Object.keys(data[0] || {}).map(key => ({
    wch: Math.max(key.length, 12)
  }));
  ws['!cols'] = colWidths;
  
  XLSX.writeFile(wb, `движения_${dateFrom}_${dateTo}.xlsx`);
};

// Export orders to Excel
export const exportOrdersExcel = (
  orders: any[],
  filename?: string
) => {
  const data = orders.map(o => ({
    'ID': o.id,
    'Код': o.code,
    'Дата': format(new Date(o.created_at), 'dd.MM.yyyy HH:mm'),
    'Клиент': o.customer_name,
    'Телефон': o.phone,
    'Email': o.customer_email || '',
    'Продукт': o.product_name,
    'Количество': o.quantity,
    'Сума': o.total_price,
    'Статус': o.status,
    'Адрес': o.delivery_address || '',
    'Източник': o.source || '',
    'Куриер': o.courier?.name || '',
    'Товарителница': o.courier_tracking_url || '',
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Поръчки');
  
  const colWidths = Object.keys(data[0] || {}).map(key => ({
    wch: Math.max(key.length, 15)
  }));
  ws['!cols'] = colWidths;
  
  XLSX.writeFile(wb, filename || `поръчки_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
};

// Export orders to PDF
export const exportOrdersPDF = (
  orders: any[],
  companyName?: string,
  dateFrom?: string,
  dateTo?: string
) => {
  const doc = new jsPDF('landscape');
  
  const period = dateFrom && dateTo 
    ? `${format(new Date(dateFrom), 'dd.MM.yyyy')} - ${format(new Date(dateTo), 'dd.MM.yyyy')}`
    : format(new Date(), 'dd.MM.yyyy');
  
  const headerOffset = addPdfHeader(
    doc, 
    'Справка за поръчки',
    `${companyName ? companyName + ' | ' : ''}${period}`
  );
  
  let yPosition = PDF_SETTINGS.margin + headerOffset;
  
  // Table header
  doc.setFontSize(PDF_SETTINGS.fontSize.header);
  doc.setFont('helvetica', 'bold');
  
  const columns = ['ID', 'Дата', 'Клиент', 'Телефон', 'Продукт', 'Кол.', 'Сума', 'Статус'];
  const columnWidths = [15, 25, 45, 30, 70, 15, 25, 30];
  let xPosition = PDF_SETTINGS.margin;
  
  columns.forEach((col, i) => {
    doc.text(col, xPosition, yPosition);
    xPosition += columnWidths[i];
  });
  
  yPosition += PDF_SETTINGS.lineHeight;
  doc.line(PDF_SETTINGS.margin, yPosition - 3, 280, yPosition - 3);
  
  // Table body
  doc.setFontSize(PDF_SETTINGS.fontSize.body);
  doc.setFont('helvetica', 'normal');
  
  let totalAmount = 0;
  
  orders.forEach((order) => {
    if (yPosition > 190) {
      doc.addPage();
      yPosition = PDF_SETTINGS.margin;
    }
    
    totalAmount += order.total_price;
    
    xPosition = PDF_SETTINGS.margin;
    const row = [
      order.id.toString(),
      format(new Date(order.created_at), 'dd.MM.yy'),
      order.customer_name.substring(0, 28),
      order.phone,
      order.product_name.substring(0, 45),
      order.quantity.toString(),
      order.total_price.toFixed(2),
      order.status.substring(0, 18),
    ];
    
    row.forEach((cell, i) => {
      doc.text(cell, xPosition, yPosition);
      xPosition += columnWidths[i];
    });
    
    yPosition += PDF_SETTINGS.lineHeight;
  });
  
  // Total row
  yPosition += 5;
  doc.line(PDF_SETTINGS.margin, yPosition - 3, 280, yPosition - 3);
  doc.setFont('helvetica', 'bold');
  doc.text(`Общо поръчки: ${orders.length}`, PDF_SETTINGS.margin, yPosition);
  doc.text(`Обща сума: ${totalAmount.toFixed(2)} EUR`, PDF_SETTINGS.margin + 100, yPosition);
  
  doc.save(`поръчки_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
};
