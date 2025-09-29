// middleware/rbacMatrix.js
const { ROLES } = require('../shared/constants/roles');

const PERMISSIONS = {
  admin_dashboard:      { [ROLES.SYSTEM_ADMIN]: 'view' },
  partner_dashboard:    { [ROLES.PARTNER]: 'view' },
  gm_dashboard:         { [ROLES.GRANTS_MANAGER]: 'view' },
  coo_dashboard:        { [ROLES.COO]: 'view' },
  donor_dashboard:      { [ROLES.DONOR]: 'view' },

  review_queue_gm:      { [ROLES.GRANTS_MANAGER]: 'manage', [ROLES.SYSTEM_ADMIN]: 'manage' },
  review_queue_coo:     { [ROLES.COO]: 'manage', [ROLES.SYSTEM_ADMIN]: 'manage' },

  onboarding_partner:   { [ROLES.PARTNER]: 'edit' },
  applications_partner: { [ROLES.PARTNER]: 'edit' },
  compliance_partner:   { [ROLES.PARTNER]: 'edit' },
  me_partner:           { [ROLES.PARTNER]: 'edit' },
  finance_partner:      { [ROLES.PARTNER]: 'view' },

  audit_logs:           { [ROLES.SYSTEM_ADMIN]: 'read' },
};

// Check if user has permission for a resource/action
function checkPermission(userRole, resource, action = 'view') {
  const resourcePerms = PERMISSIONS[resource];
  if (!resourcePerms) return false;
  
  const userPerm = resourcePerms[userRole];
  if (!userPerm) return false;
  
  // Simple permission hierarchy: manage > edit > view > read
  const hierarchy = ['read', 'view', 'edit', 'manage'];
  const requiredLevel = hierarchy.indexOf(action);
  const userLevel = hierarchy.indexOf(userPerm);
  
  return userLevel >= requiredLevel;
}

module.exports = {
  PERMISSIONS,
  checkPermission
};
