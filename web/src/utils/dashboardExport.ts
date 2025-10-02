import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

/**
 * Dashboard Export Utilities
 * 
 * Features:
 * - Export dashboard to PDF
 * - Capture dashboard screenshot
 * - Include metadata and branding
 * - Multiple page support
 */

export interface ExportOptions {
  filename?: string;
  includeHeader?: boolean;
  includeFooter?: boolean;
  quality?: number;
  orientation?: 'portrait' | 'landscape';
}

export async function exportDashboardToPDF(
  elementId: string,
  options: ExportOptions = {}
): Promise<void> {
  const {
    filename = `dashboard-${new Date().toISOString().split('T')[0]}.pdf`,
    includeHeader = true,
    includeFooter = true,
    quality = 0.95,
    orientation = 'landscape'
  } = options;

  try {
    // Get the dashboard element
    const element = document.getElementById(elementId);
    if (!element) {
      throw new Error(`Element with id "${elementId}" not found`);
    }

    // Show loading indicator
    const loadingEl = document.createElement('div');
    loadingEl.id = 'pdf-export-loading';
    loadingEl.className = 'fixed inset-0 bg-black/50 flex items-center justify-center z-50';
    loadingEl.innerHTML = `
      <div class="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-2xl">
        <div class="flex items-center space-x-4">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span class="text-lg font-medium text-gray-900 dark:text-white">Generating PDF...</span>
        </div>
      </div>
    `;
    document.body.appendChild(loadingEl);

    // Capture the dashboard as canvas
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      windowWidth: element.scrollWidth,
      windowHeight: element.scrollHeight
    });

    // Create PDF
    const imgWidth = orientation === 'landscape' ? 297 : 210; // A4 dimensions in mm
    const imgHeight = orientation === 'landscape' ? 210 : 297;
    const pageHeight = imgHeight - 20; // Leave margin
    
    const pdf = new jsPDF({
      orientation,
      unit: 'mm',
      format: 'a4'
    });

    // Calculate image dimensions
    const imgData = canvas.toDataURL('image/png', quality);
    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = imgWidth - 20; // 10mm margin on each side
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

    // Add header
    if (includeHeader) {
      pdf.setFontSize(18);
      pdf.setTextColor(37, 99, 235); // Blue color
      pdf.text('Dashboard Report', 10, 15);
      
      pdf.setFontSize(10);
      pdf.setTextColor(100, 100, 100);
      pdf.text(`Generated: ${new Date().toLocaleString()}`, 10, 22);
      
      // Add line
      pdf.setDrawColor(200, 200, 200);
      pdf.line(10, 25, imgWidth - 10, 25);
    }

    // Add dashboard image
    const yOffset = includeHeader ? 30 : 10;
    
    if (pdfHeight > pageHeight) {
      // Multiple pages needed
      let heightLeft = pdfHeight;
      let position = yOffset;
      let page = 0;

      while (heightLeft > 0) {
        if (page > 0) {
          pdf.addPage();
          position = 10;
        }

        pdf.addImage(
          imgData,
          'PNG',
          10,
          position,
          pdfWidth,
          pdfHeight,
          undefined,
          'FAST'
        );

        heightLeft -= pageHeight;
        page++;
      }
    } else {
      // Single page
      pdf.addImage(
        imgData,
        'PNG',
        10,
        yOffset,
        pdfWidth,
        pdfHeight,
        undefined,
        'FAST'
      );
    }

    // Add footer
    if (includeFooter) {
      const pageCount = pdf.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        pdf.setPage(i);
        pdf.setFontSize(8);
        pdf.setTextColor(150, 150, 150);
        pdf.text(
          `Page ${i} of ${pageCount}`,
          imgWidth / 2,
          imgHeight - 5,
          { align: 'center' }
        );
        pdf.text(
          'Subgrant Platform',
          imgWidth - 10,
          imgHeight - 5,
          { align: 'right' }
        );
      }
    }

    // Save PDF
    pdf.save(filename);

    // Remove loading indicator
    document.body.removeChild(loadingEl);

    // Show success message
    showToast('Dashboard exported successfully!', 'success');
  } catch (error) {
    console.error('Error exporting dashboard:', error);
    
    // Remove loading indicator
    const loadingEl = document.getElementById('pdf-export-loading');
    if (loadingEl) {
      document.body.removeChild(loadingEl);
    }

    showToast('Failed to export dashboard', 'error');
    throw error;
  }
}

export async function captureDashboardScreenshot(
  elementId: string
): Promise<string> {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error(`Element with id "${elementId}" not found`);
  }

  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    logging: false,
    backgroundColor: '#ffffff'
  });

  return canvas.toDataURL('image/png', 0.95);
}

function showToast(message: string, type: 'success' | 'error') {
  // Simple toast notification
  const toast = document.createElement('div');
  toast.className = `fixed bottom-4 right-4 px-6 py-3 rounded-lg shadow-lg z-50 ${
    type === 'success'
      ? 'bg-green-500 text-white'
      : 'bg-red-500 text-white'
  }`;
  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.3s';
    setTimeout(() => document.body.removeChild(toast), 300);
  }, 3000);
}
