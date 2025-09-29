// Feature flags registry

const FEATURE_FLAGS = [
  {
    key: 'contracts.enabled',
    description: 'Enable contracts module',
    defaultValue: false,
    caps: ['contracts.read']
  },
  {
    key: 'approvals.enabled',
    description: 'Enable approvals module',
    defaultValue: false,
    caps: ['approvals.read']
  },
  {
    key: 'wizard.admin',
    description: 'Enable admin wizard',
    defaultValue: false,
    caps: ['admin.wizard']
  }
];

module.exports = { FEATURE_FLAGS };