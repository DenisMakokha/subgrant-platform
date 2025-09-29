const express = require('express');
const router = express.Router();
const ContractController = require('../controllers/contractController');
const { authenticateToken, authorizeRole } = require('../middleware/auth');
const { checkPermission } = require('../middleware/rbac');

router.use(authenticateToken);

router.get(
  '/templates',
  checkPermission('contracts', 'read'),
  ContractController.getContractTemplates
);

router.post(
  '/',
  authorizeRole(['admin', 'admin']),
  checkPermission('contracts', 'create'),
  ContractController.createContract
);

router.get(
  '/',
  checkPermission('contracts', 'read'),
  ContractController.listContracts
);

router.get(
  '/:id',
  checkPermission('contracts', 'read'),
  ContractController.getContractById
);

router.post(
  '/:id/generate',
  authorizeRole(['admin', 'admin']),
  checkPermission('contracts', 'update'),
  ContractController.generateContract
);

router.post(
  '/:id/submit-for-approval',
  authorizeRole(['admin', 'admin']),
  checkPermission('contracts', 'update'),
  ContractController.submitForApproval
);

router.post(
  '/:id/mark-approved',
  authorizeRole(['admin', 'admin']),
  checkPermission('contracts', 'update'),
  ContractController.markApproved
);

router.post(
  '/:id/send-for-sign',
  authorizeRole(['admin', 'admin']),
  checkPermission('contracts', 'update'),
  ContractController.sendForSign
);

router.post(
  '/:id/mark-signed',
  authorizeRole(['admin', 'admin']),
  checkPermission('contracts', 'update'),
  ContractController.markSigned
);

router.post(
  '/:id/activate',
  authorizeRole(['admin', 'admin']),
  checkPermission('contracts', 'update'),
  ContractController.activateContract
);

router.post(
  '/:id/cancel',
  authorizeRole(['admin', 'admin']),
  checkPermission('contracts', 'update'),
  ContractController.cancelContract
);

router.get(
  '/:contractId/artifacts',
  checkPermission('contracts', 'read'),
  ContractController.listArtifacts
);

router.get(
  '/:contractId/artifacts/latest',
  checkPermission('contracts', 'read'),
  ContractController.getLatestArtifact
);

router.get(
  '/artifacts/:artifactId/download',
  checkPermission('contracts', 'read'),
  ContractController.downloadArtifact
);

module.exports = router;