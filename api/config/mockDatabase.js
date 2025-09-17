// Mock database for testing purposes
const mockData = {
  organizations: [
    {
      id: '1',
      name: 'Test Organization',
      legal_name: 'Test Organization Ltd',
      registration_number: 'REG123456',
      tax_id: 'TAX123456',
      address: '123 Test Street',
      country: 'Test Country',
      phone: '+1234567890',
      email: 'info@testorg.com',
      website: 'https://testorg.com',
      description: 'A test organization',
      status: 'active',
      compliance_status: 'approved',
      due_diligence_completed: true,
      due_diligence_date: new Date(),
      created_at: new Date(),
      updated_at: new Date()
    }
  ],
  users: [
    {
      id: '1',
      organization_id: '1',
      first_name: 'Admin',
      last_name: 'User',
      email: 'admin@example.com',
      phone: '+1234567890',
      role: 'system_administrator',
      status: 'active',
      mfa_enabled: false,
      password_hash: '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password: password
      last_login: new Date(),
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: '2',
      organization_id: '1',
      first_name: 'Partner',
      last_name: 'User',
      email: 'partner@example.com',
      phone: '+1234567891',
      role: 'partner_user',
      status: 'active',
      mfa_enabled: false,
      password_hash: '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password: password
      last_login: new Date(),
      created_at: new Date(),
      updated_at: new Date()
    }
  ],
  projects: [],
  budget_categories: [],
  budgets: [],
  budget_lines: [],
  review_comments: []
};

// Mock database functions
const mockDb = {
  query: async (query, params = []) => {
    // This is a very simplified mock that only handles specific queries
    if (query.includes('SELECT') && query.includes('users') && query.includes('email')) {
      const email = params[0];
      const user = mockData.users.find(u => u.email === email);
      return { rows: user ? [user] : [] };
    }
    
    if (query.includes('SELECT') && query.includes('users') && query.includes('id')) {
      const id = params[0];
      const user = mockData.users.find(u => u.id === id);
      return { rows: user ? [user] : [] };
    }
    
    if (query.includes('SELECT') && query.includes('users')) {
      return { rows: mockData.users };
    }
    
    if (query.includes('SELECT') && query.includes('organizations')) {
      return { rows: mockData.organizations };
    }
    
    if (query.includes('INSERT') && query.includes('users')) {
      const newUser = {
        id: String(mockData.users.length + 1),
        organization_id: params[0],
        first_name: params[1],
        last_name: params[2],
        email: params[3],
        phone: params[4],
        role: params[5],
        status: 'active',
        mfa_enabled: false,
        password_hash: params[6],
        last_login: null,
        created_at: new Date(),
        updated_at: new Date()
      };
      mockData.users.push(newUser);
      return { rows: [newUser] };
    }
    
    // For other queries, return empty results
    return { rows: [] };
  },
  
  connect: async () => {
    console.log('Connected to mock database');
    return {};
  },
  
  end: async () => {
    console.log('Disconnected from mock database');
  }
};

module.exports = mockDb;