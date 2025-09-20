// Canonical roles (single vocabulary)
const ROLES = {
  SYSTEM_ADMIN: 'admin',             // system admin
  PARTNER: 'partner_user',           // partner
  GRANTS_MANAGER: 'grants_manager',  // new
  COO: 'chief_operations_officer',   // new
  DONOR: 'donor',                    // (optional) read-only analytics
};

// Type helper for validation
const ROLE_VALUES = Object.values(ROLES);

// Role validation helper
function isValidRole(role) {
  return ROLE_VALUES.includes(role);
}

// Role normalization helper
function normalizeRole(role) {
  const r = (role || '').toLowerCase();
  if (r === 'admin') return ROLES.SYSTEM_ADMIN;
  if (r === 'partner' || r === 'partner_user') return ROLES.PARTNER;
  if (r === 'grants_manager') return ROLES.GRANTS_MANAGER;
  if (r === 'chief_operations_officer' || r === 'coo') return ROLES.COO;
  if (r === 'donor') return ROLES.DONOR;
  return ROLES.PARTNER; // default fallback
}

module.exports = {
  ROLES,
  ROLE_VALUES,
  isValidRole,
  normalizeRole
};
