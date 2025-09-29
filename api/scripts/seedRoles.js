// Seed script for initial role definitions

const { CAPABILITIES } = require('../registry/capabilities');
const { DATA_KEYS } = require('../registry/dataKeys');
const db = require('../config/database');

// Initial role definitions
const initialRoles = [
  {
    id: 'admin',
    label: 'Administrator',
    inherits: [],
    caps: ['wizard.admin'],
    scopes: { project: 'all', tenant: 'all' },
    visibility_rules: [],
    version: 1,
    active: true
  },
  {
    id: 'partner',
    label: 'Partner',
    inherits: [],
    caps: [],
    scopes: { project: 'self', tenant: 'current' },
    visibility_rules: [],
    version: 1,
    active: true
  },
  {
    id: 'accountant',
    label: 'Accountant',
    inherits: [],
    caps: ['line.create', 'line.update', 'line.submit'],
    scopes: { project: 'all', tenant: 'current' },
    visibility_rules: [],
    version: 1,
    active: true
  },
  {
    id: 'budget_holder',
    label: 'Budget Holder',
    inherits: [],
    caps: ['line.create', 'line.update', 'line.submit'],
    scopes: { project: 'self', tenant: 'current' },
    visibility_rules: [],
    version: 1,
    active: true
  },
  {
    id: 'finance_manager',
    label: 'Finance Manager',
    inherits: [],
    caps: ['line.create', 'line.update', 'line.submit', 'approval.act'],
    scopes: { project: 'all', tenant: 'current' },
    visibility_rules: [],
    version: 1,
    active: true
  }
];

// Initial dashboard definitions
const initialDashboards = [
  {
    role_id: 'admin',
    version: 1,
    menus_json: [
      {
        key: 'admin',
        label: 'Admin',
        icon: 'admin',
        items: [
          {
            key: 'wizard',
            label: 'Role & Dashboard Wizard',
            route: '/app/admin/wizard'
          }
        ]
      }
    ],
    pages_json: [
      {
        key: 'dashboard',
        route: '/app/dashboard',
        widgets: []
      }
    ],
    active: true
  },
  {
    role_id: 'partner',
    version: 1,
    menus_json: [
      {
        key: 'finance',
        label: 'Finance',
        icon: 'finance',
        items: [
          {
            key: 'fund-requests',
            label: 'Fund Requests',
            route: '/app/partner/projects/:projectId/fund-requests'
          }
        ]
      }
    ],
    pages_json: [
      {
        key: 'dashboard',
        route: '/app/dashboard',
        widgets: []
      }
    ],
    active: true
  },
  {
    role_id: 'accountant',
    version: 1,
    menus_json: [
      {
        key: 'finance',
        label: 'Finance',
        icon: 'finance',
        items: [
          {
            key: 'budgets',
            label: 'Budgets',
            route: '/app/budgets'
          }
        ]
      }
    ],
    pages_json: [
      {
        key: 'dashboard',
        route: '/app/dashboard',
        widgets: []
      }
    ],
    active: true
  },
  {
    role_id: 'budget_holder',
    version: 1,
    menus_json: [
      {
        key: 'finance',
        label: 'Finance',
        icon: 'finance',
        items: [
          {
            key: 'budgets',
            label: 'Budgets',
            route: '/app/budgets'
          }
        ]
      }
    ],
    pages_json: [
      {
        key: 'dashboard',
        route: '/app/dashboard',
        widgets: []
      }
    ],
    active: true
  },
  {
    role_id: 'finance_manager',
    version: 1,
    menus_json: [
      {
        key: 'finance',
        label: 'Finance',
        icon: 'finance',
        items: [
          {
            key: 'budgets',
            label: 'Budgets',
            route: '/app/budgets'
          },
          {
            key: 'approvals',
            label: 'Approvals',
            route: '/app/approvals'
          }
        ]
      }
    ],
    pages_json: [
      {
        key: 'dashboard',
        route: '/app/dashboard',
        widgets: []
      }
    ],
    active: true
  }
];

async function seedRoles() {
  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');
    
    // Insert roles
    for (const role of initialRoles) {
      const query = `
        INSERT INTO roles (id, label, inherits, caps, scopes, visibility_rules, version, active)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (id) DO UPDATE SET
          label = EXCLUDED.label,
          inherits = EXCLUDED.inherits,
          caps = EXCLUDED.caps,
          scopes = EXCLUDED.scopes,
          visibility_rules = EXCLUDED.visibility_rules,
          version = EXCLUDED.version,
          active = EXCLUDED.active
      `;
      
      const values = [
        role.id,
        role.label,
        JSON.stringify(role.inherits),
        JSON.stringify(role.caps),
        JSON.stringify(role.scopes),
        JSON.stringify(role.visibility_rules),
        role.version,
        role.active
      ];
      
      await client.query(query, values);
      console.log(`Seeded role: ${role.id}`);
    }
    
    // Insert dashboards
    for (const dashboard of initialDashboards) {
      const query = `
        INSERT INTO dashboards (role_id, version, menus_json, pages_json, active)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (role_id) DO UPDATE SET
          version = EXCLUDED.version,
          menus_json = EXCLUDED.menus_json,
          pages_json = EXCLUDED.pages_json,
          active = EXCLUDED.active
      `;
      
      const values = [
        dashboard.role_id,
        dashboard.version,
        JSON.stringify(dashboard.menus_json),
        JSON.stringify(dashboard.pages_json),
        dashboard.active
      ];
      
      await client.query(query, values);
      console.log(`Seeded dashboard for role: ${dashboard.role_id}`);
    }
    
    await client.query('COMMIT');
    console.log('Role seeding completed successfully');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error seeding roles:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Run the seed script if this file is executed directly
if (require.main === module) {
  seedRoles()
    .then(() => {
      console.log('Role seeding script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Role seeding script failed:', error);
      process.exit(1);
    });
}

module.exports = { seedRoles, initialRoles, initialDashboards };