import { Order } from '@/types/order';

interface CompanySettings {
  company_name: string | null;
  registered_address: string | null;
  correspondence_address: string | null;
  eik: string | null;
  vat_number: string | null;
  phone: string | null;
  email: string | null;
  manager_name: string | null;
}

export const generateOrderReceiptHTML = (
  orders: Order[],
  companySettings: CompanySettings | null,
  logoUrl: string | null
): string => {
  const today = new Date().toLocaleDateString('bg-BG');
  
  const ordersHTML = orders.map((order, index) => `
    <div class="receipt ${index > 0 ? 'page-break' : ''}">
      <div class="header">
        ${logoUrl ? `<img src="${logoUrl}" alt="Лого" class="logo" />` : ''}
        <h1>СТОКОВА РАЗПИСКА</h1>
        <p class="date">Дата: ${today}</p>
        <p class="order-number">Поръчка №: ${order.code}</p>
      </div>
      
      <div class="parties">
        <div class="party seller">
          <h3>ДОСТАВЧИК:</h3>
          <p class="company-name">${companySettings?.company_name || 'Не е посочено'}</p>
          ${companySettings?.eik ? `<p>ЕИК: ${companySettings.eik}</p>` : ''}
          ${companySettings?.vat_number ? `<p>ДДС №: ${companySettings.vat_number}</p>` : ''}
          ${companySettings?.registered_address ? `<p>Адрес: ${companySettings.registered_address}</p>` : ''}
          ${companySettings?.phone ? `<p>Тел: ${companySettings.phone}</p>` : ''}
          ${companySettings?.email ? `<p>Имейл: ${companySettings.email}</p>` : ''}
        </div>
        
        <div class="party buyer">
          <h3>ПОЛУЧАТЕЛ:</h3>
          <p class="company-name">${order.customer_name}</p>
          <p>Тел: ${order.phone}</p>
          ${order.customer_email ? `<p>Имейл: ${order.customer_email}</p>` : ''}
          ${order.delivery_address ? `<p>Адрес за доставка: ${order.delivery_address}</p>` : ''}
        </div>
      </div>
      
      <table class="items">
        <thead>
          <tr>
            <th class="num">№</th>
            <th class="product">Продукт</th>
            <th class="catalog">Кат. №</th>
            <th class="qty">Кол.</th>
            <th class="price">Ед. цена</th>
            <th class="total">Стойност</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td class="num">1</td>
            <td class="product">${order.product_name}</td>
            <td class="catalog">${order.catalog_number || '-'}</td>
            <td class="qty">${order.quantity}</td>
            <td class="price">€ ${(order.total_price / order.quantity).toFixed(2)}</td>
            <td class="total">€ ${order.total_price.toFixed(2)}</td>
          </tr>
        </tbody>
        <tfoot>
          <tr class="total-row">
            <td colspan="5" class="total-label">ОБЩО:</td>
            <td class="total-amount">€ ${order.total_price.toFixed(2)}</td>
          </tr>
        </tfoot>
      </table>
      
      ${order.comment ? `
        <div class="comment">
          <strong>Коментар:</strong> ${order.comment}
        </div>
      ` : ''}
      
      <div class="signatures">
        <div class="signature">
          <p>Предал: ___________________</p>
          <p class="name">${companySettings?.manager_name || ''}</p>
        </div>
        <div class="signature">
          <p>Получил: ___________________</p>
        </div>
      </div>
    </div>
  `).join('');

  return `
    <!DOCTYPE html>
    <html lang="bg">
    <head>
      <meta charset="UTF-8">
      <title>Стокова разписка</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          font-size: 14px;
          line-height: 1.5;
          color: #333;
          background: white;
        }
        
        .receipt {
          max-width: 800px;
          margin: 0 auto;
          padding: 40px;
        }
        
        .page-break {
          page-break-before: always;
        }
        
        .header {
          text-align: center;
          margin-bottom: 30px;
          padding-bottom: 20px;
          border-bottom: 2px solid #333;
        }
        
        .header .logo {
          max-width: 120px;
          max-height: 60px;
          object-fit: contain;
          margin-bottom: 15px;
        }
        
        .header h1 {
          font-size: 24px;
          font-weight: bold;
          margin-bottom: 10px;
        }
        
        .header .date,
        .header .order-number {
          font-size: 14px;
          color: #666;
        }
        
        .parties {
          display: flex;
          justify-content: space-between;
          gap: 40px;
          margin-bottom: 30px;
        }
        
        .party {
          flex: 1;
          padding: 15px;
          background: #f9f9f9;
          border-radius: 12px;
        }
        
        .party h3 {
          font-size: 12px;
          color: #666;
          margin-bottom: 8px;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        
        .party .company-name {
          font-size: 16px;
          font-weight: 600;
          margin-bottom: 8px;
        }
        
        .party p {
          font-size: 13px;
          margin-bottom: 4px;
        }
        
        .items {
          width: 100%;
          border-collapse: separate;
          border-spacing: 0;
          margin-bottom: 30px;
          border-radius: 12px;
          overflow: hidden;
          border: 1px solid #ddd;
        }
        
        .items th,
        .items td {
          padding: 12px;
          text-align: left;
        }
        
        .items th {
          background: #f5f5f5;
          font-weight: 600;
          font-size: 12px;
          text-transform: uppercase;
          border-bottom: 1px solid #ddd;
        }
        
        .items th:first-child {
          border-top-left-radius: 12px;
        }
        
        .items th:last-child {
          border-top-right-radius: 12px;
        }
        
        .items .num { width: 40px; text-align: center; }
        .items .catalog { width: 100px; }
        .items .qty { width: 60px; text-align: center; }
        .items .price { width: 100px; text-align: right; }
        .items .total { width: 120px; text-align: right; }
        
        .items tbody td {
          background: white;
          border-bottom: 1px solid #eee;
        }
        
        .items tfoot .total-row td {
          background: #f5f5f5;
          font-weight: bold;
        }
        
        .items tfoot .total-row td:first-child {
          border-bottom-left-radius: 12px;
        }
        
        .items tfoot .total-row td:last-child {
          border-bottom-right-radius: 12px;
        }
        
        .items .total-label {
          text-align: right;
          font-size: 14px;
        }
        
        .items .total-amount {
          text-align: right;
          font-size: 16px;
          color: #2563eb;
        }
        
        .comment {
          padding: 15px;
          background: #fffbeb;
          border-left: 4px solid #f59e0b;
          border-radius: 12px;
          margin-bottom: 30px;
          font-size: 13px;
        }
        
        .signatures {
          display: flex;
          justify-content: space-between;
          margin-top: 60px;
          padding-top: 30px;
        }
        
        .signature {
          text-align: center;
        }
        
        .signature p {
          margin-bottom: 8px;
        }
        
        .signature .name {
          font-size: 12px;
          color: #666;
        }
        
        @media print {
          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          
          .receipt {
            padding: 20px;
          }
          
          .page-break {
            page-break-before: always;
          }
        }
      </style>
    </head>
    <body>
      ${ordersHTML}
      <script>
        window.onload = function() {
          window.print();
        };
      </script>
    </body>
    </html>
  `;
};

export const printOrderReceipts = (
  orders: Order[],
  companySettings: CompanySettings | null,
  logoUrl: string | null
): void => {
  const html = generateOrderReceiptHTML(orders, companySettings, logoUrl);
  const printWindow = window.open('', '_blank');
  
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
  }
};
