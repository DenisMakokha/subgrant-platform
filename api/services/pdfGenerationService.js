const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

class PDFGenerationService {
  constructor() {
    this.pageMargin = 50;
    this.headerHeight = 100;
    this.footerHeight = 50;
  }

  // Generate professional contract PDF
  async generateContractPDF(contractData, templateContent) {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: 'A4',
          margins: {
            top: this.pageMargin + this.headerHeight,
            bottom: this.pageMargin + this.footerHeight,
            left: this.pageMargin,
            right: this.pageMargin
          }
        });

        const chunks = [];
        doc.on('data', chunk => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        // Add header and footer to all pages
        this.addHeaderFooter(doc, contractData);

        // Add title page
        this.addTitlePage(doc, contractData);

        // Add contract content
        this.addContractContent(doc, templateContent, contractData);

        // Add signature page
        this.addSignaturePage(doc, contractData);

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  // Add professional header and footer
  addHeaderFooter(doc, contractData) {
    const pageCount = doc.bufferedPageRange().count;
    
    for (let i = 0; i < pageCount; i++) {
      doc.switchToPage(i);
      
      // Header
      doc.fontSize(10)
         .fillColor('#666666')
         .text('Zizi Afrique Foundation', this.pageMargin, 20, { align: 'left' })
         .text(`Agreement No: ${contractData.agreement_number}`, this.pageMargin, 20, { align: 'right' })
         .moveTo(this.pageMargin, 45)
         .lineTo(doc.page.width - this.pageMargin, 45)
         .stroke('#cccccc');

      // Footer
      const footerY = doc.page.height - 30;
      doc.fontSize(8)
         .fillColor('#999999')
         .text('CONFIDENTIAL - Sub-Grant Agreement', this.pageMargin, footerY, { align: 'left' })
         .text(`Page ${i + 1}`, this.pageMargin, footerY, { align: 'right' });
    }
  }

  // Add professional title page
  addTitlePage(doc, contractData) {
    // Logo area (placeholder)
    doc.rect(this.pageMargin, 120, 100, 60)
       .stroke('#cccccc');
    doc.fontSize(8)
       .fillColor('#999999')
       .text('LOGO', this.pageMargin + 40, 145);

    // Main title
    doc.fontSize(24)
       .fillColor('#2c3e50')
       .font('Helvetica-Bold')
       .text('SUB-GRANT AGREEMENT', this.pageMargin, 220, { align: 'center' });

    // Agreement details box
    const boxY = 280;
    doc.rect(this.pageMargin, boxY, doc.page.width - 2 * this.pageMargin, 200)
       .fillAndStroke('#f8f9fa', '#e9ecef');

    doc.fontSize(14)
       .fillColor('#2c3e50')
       .font('Helvetica-Bold')
       .text('Agreement Details', this.pageMargin + 20, boxY + 20);

    doc.fontSize(11)
       .fillColor('#495057')
       .font('Helvetica')
       .text(`Agreement Number: ${contractData.agreement_number}`, this.pageMargin + 20, boxY + 50)
       .text(`Project: ${contractData.project_name}`, this.pageMargin + 20, boxY + 70)
       .text(`Grantor: ${contractData.grantor_name}`, this.pageMargin + 20, boxY + 90)
       .text(`Grantee: ${contractData.partner_organization}`, this.pageMargin + 20, boxY + 110)
       .text(`Total Amount: ${contractData.total_amount}`, this.pageMargin + 20, boxY + 130)
       .text(`Duration: ${contractData.start_date} to ${contractData.end_date}`, this.pageMargin + 20, boxY + 150);

    // Date and location
    doc.fontSize(12)
       .fillColor('#6c757d')
       .text(`Nairobi, Kenya`, this.pageMargin, 520, { align: 'center' })
       .text(`${contractData.signature_date}`, this.pageMargin, 540, { align: 'center' });

    doc.addPage();
  }

  // Add formatted contract content
  addContractContent(doc, templateContent, contractData) {
    // Replace template variables
    const processedContent = this.replaceTemplateVariables(templateContent, contractData);
    
    // Split content into sections
    const sections = this.parseContractSections(processedContent);
    
    sections.forEach((section, index) => {
      if (index > 0) {
        // Add some space between sections
        doc.moveDown(1);
      }

      if (section.type === 'heading') {
        doc.fontSize(16)
           .fillColor('#2c3e50')
           .font('Helvetica-Bold')
           .text(section.content, { align: 'left' })
           .moveDown(0.5);
      } else if (section.type === 'subheading') {
        doc.fontSize(14)
           .fillColor('#495057')
           .font('Helvetica-Bold')
           .text(section.content, { align: 'left' })
           .moveDown(0.3);
      } else if (section.type === 'paragraph') {
        doc.fontSize(11)
           .fillColor('#212529')
           .font('Helvetica')
           .text(section.content, { 
             align: 'justify',
             lineGap: 2
           })
           .moveDown(0.5);
      } else if (section.type === 'list') {
        section.items.forEach(item => {
          doc.fontSize(11)
             .fillColor('#212529')
             .font('Helvetica')
             .text(`• ${item}`, { 
               indent: 20,
               align: 'left',
               lineGap: 2
             });
        });
        doc.moveDown(0.5);
      }

      // Check if we need a new page
      if (doc.y > doc.page.height - 150) {
        doc.addPage();
      }
    });
  }

  // Add signature page
  addSignaturePage(doc, contractData) {
    doc.addPage();
    
    doc.fontSize(18)
       .fillColor('#2c3e50')
       .font('Helvetica-Bold')
       .text('SIGNATURES', { align: 'center' })
       .moveDown(2);

    // Grantor signature section
    doc.fontSize(14)
       .fillColor('#495057')
       .font('Helvetica-Bold')
       .text('GRANTOR:', { align: 'left' })
       .moveDown(0.5);

    doc.fontSize(11)
       .fillColor('#212529')
       .font('Helvetica')
       .text(contractData.grantor_name)
       .moveDown(2);

    // Signature line
    doc.moveTo(this.pageMargin, doc.y)
       .lineTo(300, doc.y)
       .stroke('#000000');
    
    doc.moveDown(0.5)
       .text(`${contractData.grantor_signatory_name}`)
       .text(`${contractData.grantor_signatory_title}`)
       .text(`Date: _________________`)
       .moveDown(3);

    // Grantee signature section
    doc.fontSize(14)
       .fillColor('#495057')
       .font('Helvetica-Bold')
       .text('GRANTEE:', { align: 'left' })
       .moveDown(0.5);

    doc.fontSize(11)
       .fillColor('#212529')
       .font('Helvetica')
       .text(contractData.partner_organization)
       .moveDown(2);

    // Signature line
    doc.moveTo(this.pageMargin, doc.y)
       .lineTo(300, doc.y)
       .stroke('#000000');
    
    doc.moveDown(0.5)
       .text(`${contractData.grantee_signatory_name}`)
       .text(`${contractData.grantee_signatory_title}`)
       .text(`Date: _________________`);

    // Witness section
    doc.moveDown(3)
       .fontSize(14)
       .fillColor('#495057')
       .font('Helvetica-Bold')
       .text('WITNESS:', { align: 'left' })
       .moveDown(2);

    doc.fontSize(11)
       .fillColor('#212529')
       .font('Helvetica');

    // Witness signature line
    doc.moveTo(this.pageMargin, doc.y)
       .lineTo(300, doc.y)
       .stroke('#000000');
    
    doc.moveDown(0.5)
       .text('Name: _________________________')
       .text('Signature: ____________________')
       .text('Date: _________________');
  }

  // Replace template variables with actual data
  replaceTemplateVariables(template, data) {
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      const value = data[key];
      return value || match;
    });
  }

  // Parse contract content into structured sections
  parseContractSections(content) {
    const lines = content.split('\n');
    const sections = [];
    let currentSection = null;

    lines.forEach(line => {
      const trimmedLine = line.trim();
      
      if (!trimmedLine) return;

      // Detect headings (ALL CAPS or numbered)
      if (trimmedLine === trimmedLine.toUpperCase() && trimmedLine.length > 3) {
        sections.push({
          type: 'heading',
          content: trimmedLine
        });
      }
      // Detect numbered sections
      else if (/^\d+\./.test(trimmedLine)) {
        sections.push({
          type: 'subheading',
          content: trimmedLine
        });
      }
      // Detect list items
      else if (/^[a-z]\)/.test(trimmedLine) || /^•/.test(trimmedLine) || /^-/.test(trimmedLine)) {
        if (currentSection && currentSection.type === 'list') {
          currentSection.items.push(trimmedLine.replace(/^[a-z]\)|^•|^-/, '').trim());
        } else {
          currentSection = {
            type: 'list',
            items: [trimmedLine.replace(/^[a-z]\)|^•|^-/, '').trim()]
          };
          sections.push(currentSection);
        }
      }
      // Regular paragraphs
      else {
        currentSection = {
          type: 'paragraph',
          content: trimmedLine
        };
        sections.push(currentSection);
      }
    });

    return sections;
  }

  // Generate contract and save to file
  async generateAndSaveContract(contractData, templateContent, outputPath) {
    try {
      const pdfBuffer = await this.generateContractPDF(contractData, templateContent);
      
      // Ensure directory exists
      const dir = path.dirname(outputPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      // Save PDF to file
      fs.writeFileSync(outputPath, pdfBuffer);
      
      return {
        success: true,
        filePath: outputPath,
        fileSize: pdfBuffer.length
      };
    } catch (error) {
      console.error('Error generating PDF:', error);
      throw new Error(`Failed to generate PDF: ${error.message}`);
    }
  }
}

module.exports = PDFGenerationService;
