import * as XLSX from 'xlsx-js-style';
import API from '../../api/axiosInstance';
import type { Transaction, Account } from '../../types/types';

interface ExportReportProps {
  account: Account;
  periodText: string;
  filterMode: 'month' | 'range';
  currentMonth: number;
  currentYear: number;
  startDate: string;
  endDate: string;
}

interface StatementResponse {
  startBalance: number;
  totalIn: number;
  totalOut: number;
  endBalance: number;
  transactions: Transaction[];
}

export default function ExportReport({ account, periodText, filterMode, currentMonth, currentYear, startDate, endDate }: ExportReportProps) {
  
  const handleExportExcel = async () => {
    try {
      const response = await API.get<StatementResponse>(
        `/transactions/statement?account_id=${account.id}&filterMode=${filterMode}&month=${currentMonth}&year=${currentYear}&startDate=${startDate}&endDate=${endDate}`
      );

      const { startBalance, totalIn, totalOut, endBalance, transactions } = response.data;

      const workbook = XLSX.utils.book_new();
      const worksheet: XLSX.WorkSheet = {};

      const fontName = 'Segoe UI';
      const borderThin = { style: 'thin', color: { rgb: 'E2E8F0' } };
      const borderBoldBottom = { style: 'medium', color: { rgb: '0F172A' } };
      
      const styleMainTitle = { font: { name: fontName, size: 16, bold: true, color: { rgb: '1E3A8A' } } };
      const stylePeriod = { font: { name: fontName, size: 11, bold: true, color: { rgb: '475569' } } };
      const styleMeta = { font: { name: fontName, size: 9, italic: true, color: { rgb: '94A3B8' } } };
      const styleBlockTitle = { font: { name: fontName, size: 12, bold: true, color: { rgb: '334155' } } };

      const styleTableHeader = {
        font: { name: fontName, size: 11, bold: true, color: { rgb: 'FFFFFF' } },
        fill: { fgColor: { rgb: '1E3A8A' } },
        alignment: { horizontal: 'center', vertical: 'center' },
        border: { bottom: borderBoldBottom }
      };

      const styleRowCommon = {
        font: { name: fontName, size: 10, color: { rgb: '334155' } },
        alignment: { vertical: 'center' },
        border: { bottom: borderThin }
      };

      const styleSaldoLabel = { ...styleRowCommon, font: { name: fontName, size: 10, bold: true, color: { rgb: '475569' } }, fill: { fgColor: { rgb: 'F8FAFC' } } };
      const styleSaldoVal = { ...styleRowCommon, font: { name: fontName, size: 10, bold: true }, alignment: { horizontal: 'right' }, fill: { fgColor: { rgb: 'F8FAFC' } } };

      const styleIncome = { font: { name: fontName, size: 10, bold: true, color: { rgb: '16A34A' } }, fill: { fgColor: { rgb: 'F0FDF4' } }, alignment: { horizontal: 'right', vertical: 'center' }, border: { bottom: borderThin } };
      const styleExpense = { font: { name: fontName, size: 10, bold: true, color: { rgb: 'DC2626' } }, fill: { fgColor: { rgb: 'FEF2F2' } }, alignment: { horizontal: 'right', vertical: 'center' }, border: { bottom: borderThin } };

worksheet['A1'] = { v: 'ОФИЦИАЛЬНАЯ ВЫПИСКА: КАПИТАЛТРЕКЕР', t: 's', s: styleMainTitle };      worksheet['A2'] = { v: `Счет: ${account.name} (${account.currency})  •  Период: ${periodText}`, t: 's', s: stylePeriod };
      worksheet['A3'] = { v: `Клиент: Түгөлбай  •  Выгружено: ${new Date().toLocaleDateString('ru-RU')} ${new Date().toLocaleTimeString('ru-RU')}`, t: 's', s: styleMeta };

      worksheet['A5'] = { v: 'БАЛАНС НА НАЧАЛО ПЕРИОДА', t: 's', s: styleSaldoLabel };
      worksheet['B5'] = { v: startBalance, t: 'n', s: styleSaldoVal, numFmt: '#,##0.00' };
      worksheet['A6'] = { v: 'ОБОРОТ ПО ПРИХОДУ (+)', t: 's', s: styleRowCommon };
      worksheet['B6'] = { v: totalIn, t: 'n', s: { ...styleRowCommon, font: { ...styleRowCommon.font, bold: true, color: { rgb: '16A34A' } }, alignment: { horizontal: 'right' } }, numFmt: '#,##0.00' };
      worksheet['A7'] = { v: 'ОБОРОТ ПО РАСХОДУ (-)', t: 's', s: styleRowCommon };
      worksheet['B7'] = { v: totalOut, t: 'n', s: { ...styleRowCommon, font: { ...styleRowCommon.font, bold: true, color: { rgb: 'DC2626' } }, alignment: { horizontal: 'right' } }, numFmt: '#,##0.00' };
      worksheet['A8'] = { v: 'БАЛАНС НА КОНЕЦ ПЕРИОДА', t: 's', s: { ...styleSaldoLabel, fill: { fgColor: { rgb: 'EFF6FF' } } } };
      worksheet['B8'] = { v: endBalance, t: 'n', s: { ...styleSaldoVal, fill: { fgColor: { rgb: 'EFF6FF' } }, font: { ...styleSaldoVal.font, color: { rgb: '1E40AF' } } }, numFmt: '#,##0.00' };

      worksheet['A10'] = { v: 'ПОДРОБНЫЙ ЖУРНАЛ СВЕРКИ ТРАНЗАКЦИЙ', t: 's', s: styleBlockTitle };
      const headers = ['Дата операции', 'Категория / Назначение', 'Тип операции', 'Сумма', 'Валюта', 'Комментарий к платежу'];
      headers.forEach((h, i) => {
        worksheet[XLSX.utils.encode_cell({ r: 10, c: i })] = { v: h, t: 's', s: styleTableHeader };
      });

      const displayTx = [...transactions].sort((a, b) => new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime());

      displayTx.forEach((tx, idx) => {
        const r = 11 + idx;
        const date = new Date(tx.transaction_date).toLocaleDateString('ru-RU');
        const category = tx.category_name || (tx.type === 'transfer' ? 'Внутренний перевод' : 'Разное');
        
        let typeText = tx.type === 'income' ? 'Зачисление' : tx.type === 'expense' ? 'Списание' : 'Перевод';
        let amountStyle = styleRowCommon;
        let currentBg = idx % 2 === 0 ? { fgColor: { rgb: 'FFFFFF' } } : { fgColor: { rgb: 'F8FAFC' } };

        if (tx.type === 'transfer' && tx.target_account_id === account.id) {
          typeText = 'Входящий перевод';
          amountStyle = styleIncome;
        } else if (tx.type === 'income') {
          amountStyle = styleIncome;
        } else if (tx.type === 'expense') {
          amountStyle = styleExpense;
        } else {
          amountStyle = styleIncome; // Используем стиль дохода для нейтральных переводов
        }

        worksheet[XLSX.utils.encode_cell({ r, c: 0 })] = { v: date, t: 's', s: { ...styleRowCommon, fill: currentBg, alignment: { horizontal: 'center' } } };
        worksheet[XLSX.utils.encode_cell({ r, c: 1 })] = { v: category, t: 's', s: { ...styleRowCommon, fill: currentBg } };
        worksheet[XLSX.utils.encode_cell({ r, c: 2 })] = { v: typeText, t: 's', s: { ...styleRowCommon, fill: currentBg, alignment: { horizontal: 'center' } } };
        
        const multiplier = (tx.type === 'expense' || (tx.type === 'transfer' && tx.account_id === account.id)) ? -1 : 1;
        worksheet[XLSX.utils.encode_cell({ r, c: 3 })] = { 
          v: tx.amount * multiplier, 
          t: 'n', 
          s: amountStyle,
          numFmt: '#,##0.00'
        };
        worksheet[XLSX.utils.encode_cell({ r, c: 4 })] = { v: account.currency, t: 's', s: { ...styleRowCommon, fill: currentBg, alignment: { horizontal: 'center' } } };
        worksheet[XLSX.utils.encode_cell({ r, c: 5 })] = { v: tx.description || '—', t: 's', s: { ...styleRowCommon, fill: currentBg } };
      });

      const totalRows = 11 + displayTx.length;
      worksheet['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 5 } }, { s: { r: 1, c: 0 }, e: { r: 1, c: 5 } }];
      worksheet['!ref'] = `A1:F${totalRows}`;

      // ИСПРАВЛЕНО: Массив ширин заполнен значениями по умолчанию
      const colsWidth: number[] = [15, 25, 20, 18, 10, 35];
      
      // ИСПРАВЛЕНО: Явно типизировали счётчики c и r как number для линтера
      for (let c: number = 0; c < 6; c++) {
        let maxLen = colsWidth[c];
        for (let r: number = 4; r < totalRows; r++) {
          const cell = worksheet[XLSX.utils.encode_cell({ r, c })];
          if (cell && cell.v) {
            let strLen = cell.v.toString().length;
            if (cell.t === 'n') strLen += 4; 
            if (strLen > maxLen) maxLen = strLen;
          }
        }
        colsWidth[c] = maxLen + 3;
      }
      worksheet['!cols'] = colsWidth.map(w => ({ wch: w }));

      const rowsHeight = [];
      for (let r: number = 0; r < totalRows; r++) {
        if (r === 0) rowsHeight.push({ hpt: 35 });
        else if (r === 10) rowsHeight.push({ hpt: 26 });
        else if (r > 10) rowsHeight.push({ hpt: 20 });
        else rowsHeight.push({ hpt: 18 });
      }
      worksheet['!rows'] = rowsHeight;

      XLSX.utils.book_append_sheet(workbook, worksheet, 'Банковская выписка');
      XLSX.writeFile(workbook, `Выписка_${account.name}_${periodText}.xlsx`);
    } catch (err) {
      console.error(err);
      alert('Ошибка генерации');
    }
  };

  return (
    <button
      onClick={handleExportExcel}
      className="rounded-xl border-2 border-blue-700 bg-blue-700 px-4 py-2 text-sm font-black text-white shadow-md transition-all duration-200 hover:bg-blue-800 flex items-center gap-2 cursor-pointer hover:scale-[1.01]"
    >
      👑 Получить выписку (.xlsx)
    </button>
  );
}
