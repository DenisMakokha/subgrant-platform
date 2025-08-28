const express = require('express');
const router = express.Router();
const xeroService = require('../services/xeroService');

// Xero webhook endpoint
router.post('/webhook', express.raw({ type: 'application/json' }), (req, res) => {
  try {
    // Validate webhook signature
    xeroService.validateWebhookSignature(req);
    
    // Parse the JSON body
    const events = JSON.parse(req.body);
    
    // Process each event
    Promise.all(events.map(event => xeroService.processWebhookEvent(event)))
      .then(results => {
        console.log('Webhook events processed:', results);
        res.status(200).send('OK');
      })
      .catch(error => {
        console.error('Error processing webhook events:', error);
        res.status(500).json({ error: 'Failed to process webhook events' });
      });
  } catch (error) {
    console.error('Webhook validation failed:', error);
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;