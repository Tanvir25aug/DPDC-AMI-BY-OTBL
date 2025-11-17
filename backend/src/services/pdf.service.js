const PDFDocument = require('pdfkit');
const logger = require('../config/logger');
const path = require('path');

/**
 * PDF Service
 * Handles PDF generation for reports
 */
class PDFService {
  /**
   * Generate NOCS RC/DC Report PDF (Summary Only)
   * @param {Object} nocsData - NOCS summary data
   * @returns {PDFDocument} PDF document stream
   */
  generateNocsReport(nocsData) {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 0
      });

      const pageWidth = 595.28;
      const pageHeight = 841.89;
      const currentDate = new Date().toLocaleString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      // Logo paths
      const dpdcLogoPath = path.join(__dirname, '../../../logo/DPDC_Logo.png');
      const otblLogoPath = path.join(__dirname, '../../../logo/OTBL_logo.png');

      // ========== HEADER SECTION ==========
      // Gradient-like header background
      doc.rect(0, 0, pageWidth, 180)
        .fill('#1e3a8a');

      doc.rect(0, 120, pageWidth, 60)
        .fillOpacity(0.3)
        .fill('#3b82f6')
        .fillOpacity(1);

      // DPDC Logo (Left)
      try {
        doc.image(dpdcLogoPath, 35, 25, { width: 70, height: 70 });
      } catch (err) {
        logger.warn('[PDF Service] Could not load DPDC logo:', err.message);
      }

      // OTBL Logo (Right) - Fit to contain within bounds
      try {
        doc.image(otblLogoPath, pageWidth - 105, 25, { fit: [70, 70], align: 'center', valign: 'center' });
      } catch (err) {
        logger.warn('[PDF Service] Could not load OTBL logo:', err.message);
      }

      // Main Title
      doc.fontSize(24)
        .font('Helvetica-Bold')
        .fillColor('#ffffff')
        .text('DPDC AMI RC/DC', 115, 45, { width: 365, align: 'center' });

      doc.fontSize(14)
        .font('Helvetica')
        .fillColor('#bfdbfe')
        .text('NOCS Summary Report', 115, 72, { width: 365, align: 'center' });

      // Report Info Box
      doc.rect(50, 120, pageWidth - 100, 45)
        .fillAndStroke('#ffffff', '#dbeafe');

      doc.fontSize(11)
        .fillColor('#1e40af')
        .font('Helvetica-Bold')
        .text('Report Generated:', 70, 132);

      doc.fontSize(10)
        .fillColor('#475569')
        .font('Helvetica')
        .text(currentDate, 70, 148);

      doc.fontSize(11)
        .fillColor('#1e40af')
        .font('Helvetica-Bold')
        .text('NOCS Location:', pageWidth - 280, 132);

      doc.fontSize(10)
        .fillColor('#475569')
        .font('Helvetica')
        .text(nocsData.nocsName, pageWidth - 280, 148, { width: 200 });

      // ========== SUMMARY STATISTICS SECTION ==========
      let yPos = 220;

      // Section Header
      doc.fontSize(20)
        .font('Helvetica-Bold')
        .fillColor('#1e293b')
        .text('Summary Statistics', 50, yPos);

      yPos += 40;

      // Total Commands Card
      this.drawStatCard(doc, 50, yPos, 495, 80, {
        label: 'Total Commands',
        value: nocsData.total,
        color: '#6366f1',
        bgColor: '#eef2ff'
      });

      yPos += 100;

      // ========== REMOTE CONNECT SECTION ==========
      doc.fontSize(16)
        .font('Helvetica-Bold')
        .fillColor('#059669')
        .text('Remote Connect Commands', 50, yPos);

      yPos += 35;

      // RC Success Card
      this.drawStatCard(doc, 50, yPos, 235, 90, {
        label: 'Completed',
        value: nocsData.rcSuccess,
        color: '#059669',
        bgColor: '#d1fae5',
        subText: 'Successfully connected'
      });

      // RC In Progress Card
      this.drawStatCard(doc, 310, yPos, 235, 90, {
        label: 'In Progress',
        value: nocsData.rcInProgress,
        color: '#d97706',
        bgColor: '#fef3c7',
        subText: 'Currently processing'
      });

      yPos += 110;

      // ========== REMOTE DISCONNECT SECTION ==========
      doc.fontSize(16)
        .font('Helvetica-Bold')
        .fillColor('#dc2626')
        .text('Remote Disconnect Commands', 50, yPos);

      yPos += 35;

      // DC Success Card
      this.drawStatCard(doc, 50, yPos, 158, 90, {
        label: 'Completed',
        value: nocsData.dcSuccess,
        color: '#059669',
        bgColor: '#d1fae5',
        subText: 'Successful'
      });

      // DC In Progress Card
      this.drawStatCard(doc, 228, yPos, 158, 90, {
        label: 'In Progress',
        value: nocsData.dcInProgress,
        color: '#d97706',
        bgColor: '#fef3c7',
        subText: 'Processing'
      });

      // DC Failed Card
      this.drawStatCard(doc, 406, yPos, 139, 90, {
        label: 'Failed',
        value: nocsData.dcFailed,
        color: '#dc2626',
        bgColor: '#fee2e2',
        subText: 'Discarded'
      });

      yPos += 110;

      // ========== SUCCESS RATE SECTION ==========
      doc.fontSize(16)
        .font('Helvetica-Bold')
        .fillColor('#1e293b')
        .text('Success Rates', 50, yPos);

      yPos += 35;

      // Calculate success rates
      const rcTotal = nocsData.rcSuccess + nocsData.rcInProgress;
      const dcTotal = nocsData.dcSuccess + nocsData.dcInProgress + nocsData.dcFailed;
      const rcRate = rcTotal > 0 ? ((nocsData.rcSuccess / rcTotal) * 100).toFixed(1) : '0.0';
      const dcRate = dcTotal > 0 ? ((nocsData.dcSuccess / dcTotal) * 100).toFixed(1) : '0.0';
      const overallRate = nocsData.total > 0 ? (((nocsData.rcSuccess + nocsData.dcSuccess) / nocsData.total) * 100).toFixed(1) : '0.0';

      // RC Success Rate
      this.drawProgressCard(doc, 50, yPos, 158, {
        label: 'RC Success Rate',
        percentage: rcRate,
        color: '#059669'
      });

      // DC Success Rate
      this.drawProgressCard(doc, 228, yPos, 158, {
        label: 'DC Success Rate',
        percentage: dcRate,
        color: '#2563eb'
      });

      // Overall Success Rate
      this.drawProgressCard(doc, 406, yPos, 139, {
        label: 'Overall Success',
        percentage: overallRate,
        color: '#7c3aed'
      });

      // ========== FOOTER ==========
      const footerY = pageHeight - 60;

      doc.moveTo(50, footerY)
        .lineTo(pageWidth - 50, footerY)
        .strokeColor('#e2e8f0')
        .lineWidth(1)
        .stroke();

      doc.fontSize(9)
        .fillColor('#64748b')
        .font('Helvetica')
        .text('Generated by DPDC AMI System', 50, footerY + 15, { align: 'center', width: pageWidth - 100 });

      doc.fontSize(8)
        .fillColor('#94a3b8')
        .text('Dhaka Power Distribution Company Limited', 50, footerY + 30, { align: 'center', width: pageWidth - 100 });

      logger.info(`[PDF Service] Generated NOCS report for: ${nocsData.nocsName}`);

      return doc;
    } catch (error) {
      logger.error('[PDF Service] Error generating NOCS report:', error);
      throw error;
    }
  }

  /**
   * Draw a statistics card
   */
  drawStatCard(doc, x, y, width, height, options) {
    const { label, value, color, bgColor, subText } = options;

    // Card background
    doc.roundedRect(x, y, width, height, 8)
      .fill(bgColor);

    // Colored left border
    doc.rect(x, y, 5, height)
      .fill(color);

    // Label
    doc.fontSize(12)
      .font('Helvetica-Bold')
      .fillColor('#64748b')
      .text(label, x + 20, y + 15, { width: width - 30 });

    // Value
    doc.fontSize(36)
      .font('Helvetica-Bold')
      .fillColor(color)
      .text(value, x + 20, y + 32);

    // Subtext (if provided)
    if (subText) {
      doc.fontSize(9)
        .font('Helvetica')
        .fillColor('#94a3b8')
        .text(subText, x + 20, y + height - 20, { width: width - 30 });
    }
  }

  /**
   * Draw a progress/percentage card
   */
  drawProgressCard(doc, x, y, width, options) {
    const { label, percentage, color } = options;

    // Card background
    doc.roundedRect(x, y, width, 70, 8)
      .fill('#f8fafc');

    // Label
    doc.fontSize(10)
      .font('Helvetica')
      .fillColor('#64748b')
      .text(label, x + 15, y + 12, { width: width - 30, align: 'center' });

    // Percentage
    doc.fontSize(28)
      .font('Helvetica-Bold')
      .fillColor(color)
      .text(`${percentage}%`, x + 15, y + 28, { width: width - 30, align: 'center' });
  }
}

module.exports = new PDFService();
