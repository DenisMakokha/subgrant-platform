const Contract = require('../models/contract');
const ContractArtifact = require('../models/contractArtifact');
const Budget = require('../models/budget');
const DocuSignService = require('../services/docusignService');
const auditLogger = require('../middleware/auditLogger');

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
        status: 'ready',
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
}

module.exports = ContractController;