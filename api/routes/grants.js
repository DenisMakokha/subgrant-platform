const express = require('express');
const router = express.Router();
const CreateGrantService = require('../services/grants/createGrantService');
const GrantRepository = require('../repositories/grantRepository');
const GrantSSOTRepository = require('../repositories/grantSSOTRepository');

/**
 * @route POST /api/grants
 * @desc Create a new grant with all SSOT components
 * @access Private
 */
router.post('/', async (req, res) => {
  try {
    const actorId = req.user?.id;
    if (!actorId) {
      return res.status(401).json({ 
        success: false, 
        error: 'Authentication required' 
      });
    }

    // Validate input data
    const validationErrors = CreateGrantService.validateGrantData(req.body);
    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: validationErrors
      });
    }

    const result = await CreateGrantService.createGrant(req.body, actorId);

    res.status(201).json({
      success: true,
      data: result,
      message: 'Grant created successfully'
    });
  } catch (error) {
    console.error('Error creating grant:', error);
    
    // Handle unique constraint violations
    if (error.code === '23505' && error.constraint === 'grants_grant_number_key') {
      return res.status(409).json({
        success: false,
        error: 'Grant number already exists'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to create grant',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route GET /api/grants
 * @desc List grants with optional filtering
 * @access Private
 */
router.get('/', async (req, res) => {
  try {
    const { status, program_manager, currency, use_ssot } = req.query;
    
    const filters = {};
    if (status) filters.status = status;
    if (program_manager) filters.programManager = program_manager;
    if (currency) filters.currency = currency;

    // Use SSOT repository if requested, otherwise use canonical
    const repository = use_ssot === 'true' ? GrantSSOTRepository : GrantRepository;
    const grants = await repository.list(filters);

    res.json({
      success: true,
      data: grants,
      count: grants.length
    });
  } catch (error) {
    console.error('Error listing grants:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve grants'
    });
  }
});

/**
 * @route GET /api/grants/:id
 * @desc Get a specific grant by ID
 * @access Private
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { use_ssot } = req.query;

    // Use SSOT repository if requested, otherwise use canonical
    const repository = use_ssot === 'true' ? GrantSSOTRepository : GrantRepository;
    const grant = await repository.findById(id);

    if (!grant) {
      return res.status(404).json({
        success: false,
        error: 'Grant not found'
      });
    }

    res.json({
      success: true,
      data: grant
    });
  } catch (error) {
    console.error('Error retrieving grant:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve grant'
    });
  }
});

/**
 * @route PUT /api/grants/:id
 * @desc Update a grant and propagate to SSOT
 * @access Private
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const actorId = req.user?.id;

    if (!actorId) {
      return res.status(401).json({ 
        success: false, 
        error: 'Authentication required' 
      });
    }

    const updatedGrant = await CreateGrantService.updateGrant(id, req.body, actorId);

    if (!updatedGrant) {
      return res.status(404).json({
        success: false,
        error: 'Grant not found'
      });
    }

    res.json({
      success: true,
      data: updatedGrant,
      message: 'Grant updated successfully'
    });
  } catch (error) {
    console.error('Error updating grant:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update grant'
    });
  }
});

/**
 * @route DELETE /api/grants/:id
 * @desc Delete a grant and remove from SSOT
 * @access Private
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const actorId = req.user?.id;

    if (!actorId) {
      return res.status(401).json({ 
        success: false, 
        error: 'Authentication required' 
      });
    }

    await CreateGrantService.deleteGrant(id, actorId);

    res.json({
      success: true,
      message: 'Grant deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting grant:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete grant'
    });
  }
});

/**
 * @route GET /api/grants/project/:projectId
 * @desc Get grants for a specific project
 * @access Private
 */
router.get('/project/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;
    const { use_ssot } = req.query;

    // Use SSOT repository if requested, otherwise use canonical
    const repository = use_ssot === 'true' ? GrantSSOTRepository : GrantRepository;
    const grants = await repository.findByProject(projectId);

    res.json({
      success: true,
      data: grants,
      count: grants.length
    });
  } catch (error) {
    console.error('Error retrieving project grants:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve project grants'
    });
  }
});

/**
 * @route GET /api/grants/number/:grantNumber
 * @desc Get grant by grant number
 * @access Private
 */
router.get('/number/:grantNumber', async (req, res) => {
  try {
    const { grantNumber } = req.params;
    const { use_ssot } = req.query;

    // Use SSOT repository if requested, otherwise use canonical
    const repository = use_ssot === 'true' ? GrantSSOTRepository : GrantRepository;
    const grant = await repository.findByGrantNumber(grantNumber);

    if (!grant) {
      return res.status(404).json({
        success: false,
        error: 'Grant not found'
      });
    }

    res.json({
      success: true,
      data: grant
    });
  } catch (error) {
    console.error('Error retrieving grant by number:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve grant'
    });
  }
});

/**
 * @route POST /api/grants/generate-number
 * @desc Generate a new grant number
 * @access Private
 */
router.post('/generate-number', async (req, res) => {
  try {
    const grantNumber = CreateGrantService.generateGrantNumber();
    
    // Check if the generated number already exists
    const existing = await GrantRepository.findByGrantNumber(grantNumber);
    if (existing) {
      // Generate a new one if collision occurs
      const newNumber = CreateGrantService.generateGrantNumber();
      return res.json({
        success: true,
        data: { grant_number: newNumber }
      });
    }

    res.json({
      success: true,
      data: { grant_number: grantNumber }
    });
  } catch (error) {
    console.error('Error generating grant number:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate grant number'
    });
  }
});

/**
 * @route POST /api/grants/suggest-reporting-dates
 * @desc Generate suggested reporting dates
 * @access Private
 */
router.post('/suggest-reporting-dates', async (req, res) => {
  try {
    const { open_date, close_date, frequency = 'quarterly' } = req.body;

    if (!open_date || !close_date) {
      return res.status(400).json({
        success: false,
        error: 'open_date and close_date are required'
      });
    }

    const suggestions = CreateGrantService.suggestReportingDates(open_date, close_date, frequency);

    res.json({
      success: true,
      data: {
        financial_reporting_dates: suggestions,
        narrative_reporting_dates: suggestions
      }
    });
  } catch (error) {
    console.error('Error generating reporting date suggestions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate reporting date suggestions'
    });
  }
});

module.exports = router;