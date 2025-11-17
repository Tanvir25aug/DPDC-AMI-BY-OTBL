const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');
const { Parser } = require('@json2csv/plainjs');
const logger = require('../config/logger');

class ReportService {
  /**
   * Export data to CSV
   */
  async exportToCSV(data, columns = null) {
    try {
      const fields = columns || Object.keys(data[0] || {});
      const parser = new Parser({ fields });
      const csv = parser.parse(data);

      return {
        data: csv,
        contentType: 'text/csv',
        filename: `report_${Date.now()}.csv`
      };
    } catch (error) {
      logger.error('CSV export error:', error);
      throw new Error('Failed to export CSV');
    }
  }

  /**
   * Export data to Excel
   */
  async exportToExcel(data, options = {}) {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet(options.sheetName || 'Report');

      // Set worksheet properties
      worksheet.properties.defaultRowHeight = 20;

      if (data.length === 0) {
        throw new Error('No data to export');
      }

      // Get columns
      const columns = options.columns || Object.keys(data[0]);

      // Add header row
      worksheet.columns = columns.map(col => ({
        header: col.toUpperCase().replace(/_/g, ' '),
        key: col,
        width: 20
      }));

      // Style header row
      worksheet.getRow(1).font = { bold: true, size: 12 };
      worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF4472C4' }
      };
      worksheet.getRow(1).font.color = { argb: 'FFFFFFFF' };

      // Add data rows
      data.forEach(row => {
        worksheet.addRow(row);
      });

      // Auto-filter
      worksheet.autoFilter = {
        from: 'A1',
        to: `${String.fromCharCode(64 + columns.length)}1`
      };

      // Generate buffer
      const buffer = await workbook.xlsx.writeBuffer();

      return {
        data: buffer,
        contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        filename: `report_${Date.now()}.xlsx`
      };
    } catch (error) {
      logger.error('Excel export error:', error);
      throw new Error('Failed to export Excel');
    }
  }

  /**
   * Export data to PDF
   */
  async exportToPDF(data, options = {}) {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 50 });
        const chunks = [];

        doc.on('data', chunk => chunks.push(chunk));
        doc.on('end', () => {
          const buffer = Buffer.concat(chunks);
          resolve({
            data: buffer,
            contentType: 'application/pdf',
            filename: `report_${Date.now()}.pdf`
          });
        });

        // Title
        doc.fontSize(20).text(options.title || 'Report', { align: 'center' });
        doc.moveDown();

        // Date
        doc.fontSize(10).text(`Generated: ${new Date().toLocaleString()}`, { align: 'right' });
        doc.moveDown();

        if (data.length === 0) {
          doc.fontSize(14).text('No data available', { align: 'center' });
        } else {
          // Table
          const columns = options.columns || Object.keys(data[0]);
          const columnWidth = 500 / columns.length;

          // Header
          doc.fontSize(10);
          let x = 50;
          columns.forEach(col => {
            doc.text(col.toUpperCase().replace(/_/g, ' '), x, doc.y, {
              width: columnWidth,
              align: 'left'
            });
            x += columnWidth;
          });

          doc.moveDown();

          // Rows (limit to 100 for PDF)
          const limitedData = data.slice(0, 100);
          limitedData.forEach(row => {
            x = 50;
            columns.forEach(col => {
              const value = row[col] !== null && row[col] !== undefined ? String(row[col]) : '';
              doc.text(value.substring(0, 30), x, doc.y, {
                width: columnWidth,
                align: 'left'
              });
              x += columnWidth;
            });
            doc.moveDown(0.5);

            // Add new page if needed
            if (doc.y > 700) {
              doc.addPage();
            }
          });

          if (data.length > 100) {
            doc.moveDown();
            doc.fontSize(8).text(`Note: Showing 100 of ${data.length} records`, { align: 'center' });
          }
        }

        // Footer
        const pages = doc.bufferedPageRange();
        for (let i = 0; i < pages.count; i++) {
          doc.switchToPage(i);
          doc.fontSize(8).text(
            `Page ${i + 1} of ${pages.count}`,
            50,
            doc.page.height - 50,
            { align: 'center' }
          );
        }

        doc.end();
      } catch (error) {
        logger.error('PDF export error:', error);
        reject(new Error('Failed to export PDF'));
      }
    });
  }

  /**
   * Export data in requested format
   */
  async exportData(data, format, options = {}) {
    switch (format.toLowerCase()) {
      case 'csv':
        return await this.exportToCSV(data, options.columns);
      case 'excel':
      case 'xlsx':
        return await this.exportToExcel(data, options);
      case 'pdf':
        return await this.exportToPDF(data, options);
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }
}

module.exports = new ReportService();
