const FundRequestRepository = require('../repositories/fundRequestRepository');
const { v4: uuidv4 } = require('uuid');

exports.createFundRequest = async (req, res, next) => {
  try {
    const actorId = req.user.id;
    const { projectId, partnerId, amount, currency, purpose, period_start, period_end } = req.body;

    // Validate required fields
    if (!projectId || !partnerId || !amount || !currency || !purpose) {
      return res.status(400).json({ error: 'projectId, partnerId, amount, currency, and purpose are required' });
    }

    // Validate amount
    const amountNum = Number(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      return res.status(400).json({ error: 'amount must be a positive number' });
    }

    const fundRequest = {
      id: uuidv4(),
      projectId,
      partnerId,
      amount: amountNum,
      currency,
      purpose,
      periodFrom: period_start || null,
      periodTo: period_end || null,
      status: 'draft',
      createdBy: actorId
    };

    const result = await FundRequestRepository.create(fundRequest);
    
    // Return the created fund request
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

exports.getFundRequests = async (req, res, next) => {
  try {
    const { project_id, partner_id } = req.query;

    // Validate required query parameters
    if (!project_id || !partner_id) {
      return res.status(400).json({ error: 'project_id and partner_id are required query parameters' });
    }

    const fundRequests = await FundRequestRepository.findByProjectAndPartner(project_id, partner_id);
    
    // Return the fund requests
    res.json(fundRequests);
  } catch (error) {
    next(error);
  }
};

exports.getFundRequestById = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({ error: 'id is required' });
    }

    const fundRequest = await FundRequestRepository.findById(id);
    
    if (!fundRequest) {
      return res.status(404).json({ error: 'Fund request not found' });
    }
    
    res.json(fundRequest);
  } catch (error) {
    next(error);
  }
};

exports.updateFundRequest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    if (!id) {
      return res.status(400).json({ error: 'id is required' });
    }

    // Remove fields that shouldn't be updated directly
    delete updates.id;
    delete updates.createdBy;
    delete updates.createdAt;

    const fundRequest = await FundRequestRepository.update(id, updates);
    
    if (!fundRequest) {
      return res.status(404).json({ error: 'Fund request not found' });
    }
    
    res.json(fundRequest);
  } catch (error) {
    next(error);
  }
};

// SSoT endpoints for the frontend
exports.ssotList = async (req, res, next) => {
  try {
    const { projectId, partnerId } = req.query;

    // Validate required query parameters
    if (!projectId || !partnerId) {
      return res.status(400).json({ error: 'projectId and partnerId are required query parameters' });
    }

    const fundRequests = await FundRequestRepository.findByProjectAndPartner(projectId, partnerId);
    
    // Return the fund requests in the format expected by the frontend
    res.json({ items: fundRequests });
  } catch (error) {
    next(error);
  }
};

exports.ssotCreate = async (req, res, next) => {
  try {
    const actorId = req.user.id;
    const { projectId, partnerId, amount, currency, purpose, period_start, period_end } = req.body;

    // Validate required fields
    if (!projectId || !partnerId || !amount || !currency || !purpose) {
      return res.status(400).json({ error: 'projectId, partnerId, amount, currency, and purpose are required' });
    }

    // Validate amount
    const amountNum = Number(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      return res.status(400).json({ error: 'amount must be a positive number' });
    }

    const fundRequest = {
      id: uuidv4(),
      projectId,
      partnerId,
      amount: amountNum,
      currency,
      purpose,
      periodFrom: period_start || null,
      periodTo: period_end || null,
      status: 'submitted',
      createdBy: actorId
    };

    const result = await FundRequestRepository.create(fundRequest);
    
    // Return the created fund request in the format expected by the frontend
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};