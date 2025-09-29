const express = require('express');
const router = express.Router();
const emailController = require('../controllers/emailController');
const authMiddleware = require('../middleware/auth');

// All email routes require authentication
router.use(authMiddleware);

// Email templates
router.get('/templates', emailController.getTemplates);
router.get('/templates/:id', emailController.getTemplateById);
router.post('/templates', emailController.createTemplate);
router.put('/templates/:id', emailController.updateTemplate);
router.delete('/templates/:id', emailController.deleteTemplate);

// Email senders
router.get('/senders', emailController.getSenders);
router.post('/senders', emailController.createSender);

// Email providers
router.get('/providers', emailController.getProviders);
router.post('/providers', emailController.createProvider);

// Email outbox
router.get('/outbox', emailController.getOutbox);
router.get('/outbox/:id/deliveries', emailController.getDeliveries);

// Email suppressions
router.get('/suppressions', emailController.getSuppressions);
router.post('/suppressions', emailController.suppressEmail);
router.delete('/suppressions', emailController.unsuppressEmail);

// Email preferences
router.get('/preferences/:userId/:emailType', emailController.getEmailPreferences);
router.put('/preferences/:userId/:emailType', emailController.updateEmailPreferences);

// Send email
router.post('/send', emailController.sendEmail);

module.exports = router;