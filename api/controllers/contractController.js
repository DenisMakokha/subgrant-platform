const Contract = require('../models/contract');
const ContractArtifact = require('../models/contractArtifact');
const Budget = require('../models/budget');
const DocuSignService = require('../services/docusignService');
const PDFGenerationService = require('../services/pdfGenerationService');
const auditLogger = require('../middleware/auditLogger');
const path = require('path');
const fs = require('fs');

class ContractController {
  // Create a new contract
  static async createContract(req, res) {
    try {
      const { budget_id, template_id, title, description } = req.body;
      const user_id = req.user.id;

      // Validate that the budget exists and is approved
      const budget = await Budget.findById(budget_id);
      if (!budget) {
        return res.status(404).json({ error: 'Budget not found' });
      }

      if (budget.status !== 'approved') {
        return res.status(400).json({ error: 'Only approved budgets can have contracts' });
      }

      // Create the contract
      const contractData = {
        budget_id,
        template_id,
        title,
        description,
        content: req.body.content || '',
        status: req.body.status || 'draft',
        created_by: user_id,
        updated_by: user_id
      };

      const contract = await Contract.create(contractData);
      
      // Log the contract creation
      try {
        await auditLogger.create({
          actor_id: user_id,
          action: 'CREATE_CONTRACT',
          entity_type: 'contract',
          entity_id: contract.id,
          before_state: null,
          after_state: contract,
          ip_address: req.ip || req.connection.remoteAddress,
          user_agent: req.get('User-Agent')
        });
      } catch (auditError) {
        console.error('Error creating audit log:', auditError);
      }

      res.status(201).json({
        message: 'Contract created successfully',
        contract
      });
    } catch (error) {
      console.error('Error creating contract:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Send contract for signing via DocuSign
  static async sendContractForSigning(req, res) {
    try {
      const { contractId } = req.params;
      const { signerEmail, signerName } = req.body;
      const user_id = req.user.id;

      // Find the contract
      const contract = await Contract.findById(contractId);
      if (!contract) {
        return res.status(404).json({ error: 'Contract not found' });
      }

      // Check if contract is in a valid state to be sent
      if (contract.status !== 'ready') {
        return res.status(400).json({ error: 'Contract is not in a valid state to be sent' });
      }

      // Initialize DocuSign service
      const docusignService = new DocuSignService();

      // Create envelope data
      const envelopeData = {
        templateId: contract.template_id,
        emailSubject: `Subgrant Agreement - ${contract.title}`,
        templateRoles: [
          {
            email: signerEmail,
            name: signerName,
            roleName: "Signer"
          }
        ],
        status: "sent"
      };

      // Create envelope
      const envelopeResponse = await docusignService.createEnvelope(envelopeData);

      // Update contract with envelope ID and status
      const updateData = {
        envelope_id: envelopeResponse.envelopeId,
        status: 'sent',
        sent_at: new Date(),
        updated_by: user_id
      };

      const updatedContract = await contract.update(updateData);
      
      // Log the contract sending
      try {
        await auditLogger.create({
          actor_id: user_id,
          action: 'SEND_CONTRACT_FOR_SIGNING',
          entity_type: 'contract',
          entity_id: contractId,
          before_state: contract,
          after_state: updatedContract,
          ip_address: req.ip || req.connection.remoteAddress,
          user_agent: req.get('User-Agent')
        });
      } catch (auditError) {
        console.error('Error creating audit log:', auditError);
      }

      res.status(200).json({
        message: 'Contract sent for signing successfully',
        contract: updatedContract
      });
    } catch (error) {
      console.error('Error sending contract for signing:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Get a contract by ID
  static async getContractById(req, res) {
    try {
      const { id } = req.params;
      const contract = await Contract.findById(id);

      if (!contract) {
        return res.status(404).json({ error: 'Contract not found' });
      }

      res.json(contract);
    } catch (error) {
      console.error('Error fetching contract:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Get contracts by budget ID
  static async getContractsByBudgetId(req, res) {
    try {
      const { budgetId } = req.params;
      const contracts = await Contract.findByBudgetId(budgetId);

      res.json(contracts);
    } catch (error) {
      console.error('Error fetching contracts:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Get all contracts with optional filters
  static async getAllContracts(req, res) {
    try {
      const { status, budget_id } = req.query;
      const filters = {};

      if (status) filters.status = status;
      if (budget_id) filters.budget_id = budget_id;

      const contracts = await Contract.findAll(filters);

      res.json(contracts);
    } catch (error) {
      console.error('Error fetching contracts:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Update a contract
  static async updateContract(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;
      const user_id = req.user.id;

      // Add updated_by field
      updateData.updated_by = user_id;

      // Find the contract
      const contract = await Contract.findById(id);
      if (!contract) {
        return res.status(404).json({ error: 'Contract not found' });
      }

      // Update the contract
      const updatedContract = await contract.update(updateData);
      
      // Log the contract update
      try {
        await auditLogger.create({
          actor_id: user_id,
          action: 'UPDATE_CONTRACT',
          entity_type: 'contract',
          entity_id: id,
          before_state: contract,
          after_state: updatedContract,
          ip_address: req.ip || req.connection.remoteAddress,
          user_agent: req.get('User-Agent')
        });
      } catch (auditError) {
        console.error('Error creating audit log:', auditError);
      }

      res.json({
        message: 'Contract updated successfully',
        contract: updatedContract
      });
    } catch (error) {
      console.error('Error updating contract:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Delete a contract
  static async deleteContract(req, res) {
    try {
      const { id } = req.params;

      // Find the contract
      const contract = await Contract.findById(id);
      if (!contract) {
        return res.status(404).json({ error: 'Contract not found' });
      }

      // Delete the contract
      await contract.delete();
      
      // Log the contract deletion
      try {
        await auditLogger.create({
          actor_id: req.user.id,
          action: 'DELETE_CONTRACT',
          entity_type: 'contract',
          entity_id: id,
          before_state: contract,
          after_state: null,
          ip_address: req.ip || req.connection.remoteAddress,
          user_agent: req.get('User-Agent')
        });
      } catch (auditError) {
        console.error('Error creating audit log:', auditError);
      }

      res.json({ message: 'Contract deleted successfully' });
    } catch (error) {
      console.error('Error deleting contract:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Upload a signed contract document
  static async uploadContractDocument(req, res) {
    try {
      const { contractId } = req.params;
      const { document_uri, document_name, mime_type, checksum } = req.body;
      const user_id = req.user.id;

      // Find the contract
      const contract = await Contract.findById(contractId);
      if (!contract) {
        return res.status(404).json({ error: 'Contract not found' });
      }

      // Get the latest version number
      const existingArtifacts = await ContractArtifact.findByContractId(contractId);
      const latestVersion = existingArtifacts.length > 0 
        ? Math.max(...existingArtifacts.map(a => a.version)) 
        : 0;

      // Create the contract artifact
      const artifactData = {
        contract_id: contractId,
        document_uri,
        document_name,
        mime_type,
        version: latestVersion + 1,
        checksum
      };

      const artifact = await ContractArtifact.create(artifactData);
      
      // Log the document upload
      try {
        await auditLogger.create({
          actor_id: user_id,
          action: 'UPLOAD_CONTRACT_DOCUMENT',
          entity_type: 'contract_artifact',
          entity_id: artifact.id,
          before_state: null,
          after_state: artifact,
          ip_address: req.ip || req.connection.remoteAddress,
          user_agent: req.get('User-Agent')
        });
      } catch (auditError) {
        console.error('Error creating audit log:', auditError);
      }

      res.status(201).json({
        message: 'Contract document uploaded successfully',
        artifact
      });
    } catch (error) {
      console.error('Error uploading contract document:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Get contract artifacts by contract ID
  static async getContractArtifacts(req, res) {
    try {
      const { contractId } = req.params;
      
      // Verify contract exists
      const contract = await Contract.findById(contractId);
      if (!contract) {
        return res.status(404).json({ error: 'Contract not found' });
      }

      const artifacts = await ContractArtifact.findByContractId(contractId);

      res.json(artifacts);
    } catch (error) {
      console.error('Error fetching contract artifacts:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Get the latest contract artifact
  static async getLatestContractArtifact(req, res) {
    try {
      const { contractId } = req.params;
      
      // Verify contract exists
      const contract = await Contract.findById(contractId);
      if (!contract) {
        return res.status(404).json({ error: 'Contract not found' });
      }

      const artifact = await ContractArtifact.findLatestByContractId(contractId);

      if (!artifact) {
        return res.status(404).json({ error: 'No artifacts found for this contract' });
      }

      res.json(artifact);
    } catch (error) {
      console.error('Error fetching latest contract artifact:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Download a contract document
  static async downloadContractDocument(req, res) {
    try {
      const { artifactId } = req.params;
      
      // Find the contract artifact
      const artifact = await ContractArtifact.findById(artifactId);
      if (!artifact) {
        return res.status(404).json({ error: 'Contract document not found' });
      }
      
      // Log the document download
      try {
        await auditLogger.create({
          actor_id: req.user.id,
          action: 'DOWNLOAD_CONTRACT_DOCUMENT',
          entity_type: 'contract_artifact',
          entity_id: artifactId,
          before_state: null,
          after_state: { id: artifactId, document_name: artifact.document_name },
          ip_address: req.ip || req.connection.remoteAddress,
          user_agent: req.get('User-Agent')
        });
      } catch (auditError) {
        console.error('Error creating audit log:', auditError);
      }
      
      // Retrieve the document from cloud storage
      // This would typically involve calling a cloud storage service like AWS S3, Azure Blob Storage, or Google Cloud Storage
      // For now, we'll simulate retrieving the document content
      // In a real implementation, you would replace this with actual cloud storage retrieval code
      
      // Example of how you might retrieve from AWS S3:
      // const s3 = new AWS.S3();
      // const params = {
      //   Bucket: process.env.S3_BUCKET_NAME,
      //   Key: artifact.document_uri
      // };
      // const data = await s3.getObject(params).promise();
      // res.send(data.Body);
      
      // For now, we'll send a placeholder response indicating where the real implementation would go
      res.setHeader('Content-Type', artifact.mime_type);
      res.setHeader('Content-Disposition', `attachment; filename="${artifact.document_name}"`);
      
      // Send a message indicating that this is where the real document content would be retrieved
      res.send(`Document content for ${artifact.document_name} would be retrieved from cloud storage here.`);
    } catch (error) {
      console.error('Error downloading contract document:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Generate professional PDF contract
  static async generateContractPDF(req, res) {
    try {
      const { contractId } = req.params;
      const user_id = req.user.id;

      // Find the contract
      const contract = await Contract.findById(contractId);
      if (!contract) {
        return res.status(404).json({ error: 'Contract not found' });
      }

      // Get contract data and template
      const contractData = await ContractController.compileContractData(contract);
      const templateContent = await ContractController.getTemplateContent(contract.template_id);

      // Initialize PDF generation service
      const pdfService = new PDFGenerationService();

      // Generate PDF
      const pdfBuffer = await pdfService.generateContractPDF(contractData, templateContent);

      // Create contract artifact record
      const artifactData = {
        contract_id: contractId,
        document_uri: `contracts/${contractId}/contract.pdf`,
        document_name: `${contract.title || 'Contract'}.pdf`,
        mime_type: 'application/pdf',
        version: 1,
        checksum: require('crypto').createHash('md5').update(pdfBuffer).digest('hex'),
        created_by: user_id
      };

      await ContractArtifact.create(artifactData);

      // Log PDF generation
      try {
        await auditLogger.create({
          actor_id: user_id,
          action: 'GENERATE_CONTRACT_PDF',
          entity_type: 'contract',
          entity_id: contractId,
          before_state: null,
          after_state: { pdf_generated: true },
          ip_address: req.ip || req.connection.remoteAddress,
          user_agent: req.get('User-Agent')
        });
      } catch (auditError) {
        console.error('Error creating audit log:', auditError);
      }

      // Set response headers for PDF download
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${artifactData.document_name}"`);
      res.setHeader('Content-Length', pdfBuffer.length);

      // Send PDF buffer
      res.send(pdfBuffer);
    } catch (error) {
      console.error('Error generating contract PDF:', error);
      res.status(500).json({ error: 'Failed to generate contract PDF' });
    }
  }

  // Compile contract data from various sources
  static async compileContractData(contract) {
    // This would fetch data from budget, project, partner, and grantor settings
    // For now, return sample data structure
    return {
      agreement_number: `SGA-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`,
      grantor_name: 'Zizi Afrique Foundation',
      grantor_registration: 'NGO Registration No. 12345',
      grantor_certificate: 'Certificate of Incorporation No. 67890',
      grantor_address: 'P.O. Box 12345, Nairobi, Kenya',
      grantor_contact_person: 'Dr. Sarah Mwangi',
      grantor_contact_email: 'grants@ziziafrique.org',
      grantor_contact_phone: '+254 20 123 4567',
      grantor_signatory_name: 'Dr. Sarah Mwangi',
      grantor_signatory_title: 'Executive Director',
      project_name: contract.title || 'Assessment of Life-Skills and Values in East Africa',
      project_description: contract.description || 'Educational research project focusing on life skills development',
      start_date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
      end_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
      objective_1: 'Generate evidence and insights',
      objective_2: 'Inform policy focus and public awareness',
      objective_3: 'Amplify voice and strengthen local capacities',
      partner_organization: 'Luigi Giussani Institute of Higher Education',
      grantee_registration: 'Indigenous NGO Reg. No. 4760',
      grantee_address: 'P.O BOX 40390 Sentamu Road, Luzira Kampala, Uganda',
      contact_person: 'John Mary Vianney Mitana',
      contact_email: 'contact@lgihe.org',
      contact_phone: '+256 xxx xxx xxx',
      grantee_signatory_name: 'John Mary Vianney Mitana',
      grantee_signatory_title: 'Executive Director',
      total_amount: 'USD 738,948',
      primary_funders: 'World Partnership Foundation, Echidna Giving',
      bank_name: 'Kenya Commercial Bank',
      bank_branch: 'Westlands Branch',
      account_name: 'Zizi Afrique Foundation',
      account_number: '1234567890',
      swift_code: 'KCBLKENA',
      governing_law: 'Kenya',
      signature_date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    };
  }

  // Get template content
  static async getTemplateContent(templateId) {
    // This would fetch from template database
    // For now, return a comprehensive contract template
    return `SUB-GRANT AGREEMENT

AGREEMENT NUMBER: {{agreement_number}}

PARTIES

This Sub-Grant Agreement ("Agreement") is entered into between:

GRANTOR: {{grantor_name}}, a non-governmental organization duly incorporated under the laws of Kenya, with {{grantor_registration}} and {{grantor_certificate}}, having its principal place of business at {{grantor_address}} (hereinafter referred to as "Grantor" or "Zizi Afrique Foundation").

GRANTEE: {{partner_organization}}, a non-governmental organization duly incorporated with {{grantee_registration}}, having its principal place of business at {{grantee_address}} (hereinafter referred to as "Grantee").

RECITALS

WHEREAS, Grantor has received funding from {{primary_funders}} to support educational and development initiatives in East Africa;

WHEREAS, Grantee has the expertise, capacity, and commitment to implement the Project as defined herein;

WHEREAS, Grantor desires to provide financial support to Grantee for the implementation of the Project;

NOW, THEREFORE, in consideration of the mutual covenants and agreements contained herein, the parties agree as follows:

1. PROJECT DESCRIPTION

The Grantee shall implement the project titled "{{project_name}}" (the "Project"). The Project aims to:

a) {{objective_1}}
b) {{objective_2}}  
c) {{objective_3}}

Project Description: {{project_description}}

2. GRANT AMOUNT AND DISBURSEMENT

2.1 Grant Amount: The total grant amount under this Agreement is {{total_amount}} (the "Grant").

2.2 Disbursement Schedule: The Grant shall be disbursed according to the approved budget and disbursement schedule attached as Annex A.

2.3 Banking Details: Funds shall be transferred to:
Bank Name: {{bank_name}}
Branch: {{bank_branch}}
Account Name: {{account_name}}
Account Number: {{account_number}}
SWIFT Code: {{swift_code}}

3. PROJECT PERIOD

The Project implementation period shall commence on {{start_date}} and conclude on {{end_date}}.

4. GRANTEE OBLIGATIONS

The Grantee shall:
a) Implement the Project in accordance with the approved proposal and budget
b) Maintain accurate financial records and documentation
c) Submit quarterly progress reports and financial reports
d) Comply with all applicable laws and regulations
e) Use the Grant funds solely for Project purposes

5. REPORTING REQUIREMENTS

5.1 Progress Reports: Quarterly reports due within 15 days of each quarter end
5.2 Financial Reports: Detailed financial statements with supporting documentation
5.3 Final Report: Comprehensive final report due within 30 days of Project completion

6. INTELLECTUAL PROPERTY

All intellectual property developed under this Project shall be jointly owned by Grantor and Grantee, with appropriate attribution.

7. TERMINATION

This Agreement may be terminated by either party with 30 days written notice for cause, including material breach of terms.

8. GOVERNING LAW

This Agreement shall be governed by and construed in accordance with the laws of {{governing_law}}.

9. ENTIRE AGREEMENT

This Agreement constitutes the entire agreement between the parties and supersedes all prior negotiations, representations, or agreements.

IN WITNESS WHEREOF, the parties have executed this Agreement on {{signature_date}}.`;
  }

  // Get contract templates
  static async getContractTemplates(req, res) {
    try {
      const templates = [
        {
          id: 'template-001',
          name: 'Standard Sub-Grant Agreement',
          category: 'Sub-Grant',
          description: 'Standard template for sub-grant agreements with comprehensive terms and conditions',
          content: ContractController.getDefaultTemplate(),
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          id: 'template-002',
          name: 'Research Grant Agreement',
          category: 'Research',
          description: 'Specialized template for research-focused grants with IP provisions',
          content: ContractController.getDefaultTemplate(),
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          id: 'template-003',
          name: 'Community Development Agreement',
          category: 'Community',
          description: 'Template for community development and social impact projects',
          content: ContractController.getDefaultTemplate(),
          created_at: new Date(),
          updated_at: new Date()
        }
      ];

      res.json(templates);
    } catch (error) {
      console.error('Error fetching contract templates:', error);
      res.status(500).json({ error: 'Failed to fetch contract templates' });
    }
  }
}

module.exports = ContractController;