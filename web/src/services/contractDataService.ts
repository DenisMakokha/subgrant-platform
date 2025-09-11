// Mock API service for now - replace with actual implementation
const apiService = {
  get: async (url: string) => ({ data: {} as any }),
  post: async (url: string, data: any) => ({ data: {} as any }),
};

export interface ContractData {
  // Grantor details
  grantor_name: string;
  grantor_registration: string;
  grantor_certificate: string;
  grantor_address: string;
  grantor_contact_person: string;
  grantor_contact_email: string;
  grantor_contact_phone: string;
  grantor_signatory_name: string;
  grantor_signatory_title: string;
  
  // Project details
  project_name: string;
  project_description: string;
  start_date: string;
  end_date: string;
  objective_1: string;
  objective_2: string;
  objective_3: string;
  agreement_number: string;
  
  // Partner/Grantee details
  partner_organization: string;
  grantee_registration: string;
  grantee_address: string;
  contact_person: string;
  contact_email: string;
  contact_phone: string;
  grantee_signatory_name: string;
  grantee_signatory_title: string;
  
  // Financial details
  total_amount: string;
  primary_funders: string;
  bank_name: string;
  bank_branch: string;
  account_name: string;
  account_number: string;
  swift_code: string;
  
  // Legal details
  governing_law: string;
  signature_date: string;
}

export interface ProjectData {
  id: string;
  name: string;
  description: string;
  start_date: string;
  end_date: string;
  objectives: string[];
  budget_id: string;
  partner_id: string;
}

export interface BudgetData {
  id: string;
  project_id: string;
  total_amount: number;
  currency: string;
  status: string;
  categories: BudgetCategory[];
}

export interface BudgetCategory {
  name: string;
  amount: number;
  description: string;
}

export interface PartnerData {
  id: string;
  name: string;
  registration: string;
  address: string;
  contact_person: string;
  contact_email: string;
  contact_phone: string;
  signatory_name: string;
  signatory_title: string;
}

export interface GrantorSettings {
  name: string;
  registration: string;
  certificate: string;
  address: string;
  contact_person: string;
  contact_email: string;
  contact_phone: string;
  signatory_name: string;
  signatory_title: string;
  bank_name: string;
  bank_branch: string;
  account_name: string;
  account_number: string;
  swift_code: string;
}

class ContractDataService {
  // Fetch grantor settings
  async getGrantorSettings(): Promise<GrantorSettings> {
    try {
      const response = await apiService.get('/contract-settings/grantor');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch grantor settings:', error);
      // Return default settings
      return {
        name: 'Zizi Afrique Foundation',
        registration: 'NGO Registration No. 12345',
        certificate: 'Certificate of Incorporation No. 67890',
        address: 'P.O. Box 12345, Nairobi, Kenya',
        contact_person: 'John Doe',
        contact_email: 'contact@ziziafrique.org',
        contact_phone: '+254 700 000 000',
        bank_name: 'Kenya Commercial Bank',
        bank_branch: 'Westlands Branch',
        account_name: 'Zizi Afrique Foundation',
        account_number: '1234567890',
        swift_code: 'KCBLKENA',
        signatory_name: 'Jane Smith',
        signatory_title: 'Executive Director'
      };
    }
  }

  // Save grantor settings
  async saveGrantorSettings(settings: GrantorSettings): Promise<void> {
    await apiService.post('/contract-settings/grantor', settings);
  }

  // Fetch project data
  async getProjectData(projectId: string): Promise<ProjectData> {
    try {
      const response = await apiService.get(`/projects/${projectId}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch project data:', error);
      return {
        id: projectId,
        name: 'Assessment of Life-Skills and Values in East Africa',
        description: 'Educational research project focusing on life skills development',
        start_date: '2025-01-01',
        end_date: '2025-12-31',
        objectives: ['Objective 1', 'Objective 2', 'Objective 3'],
        budget_id: '',
        partner_id: ''
      };
    }
  }

  // Fetch budget data
  async getBudgetData(budgetId: string): Promise<BudgetData> {
    try {
      const response = await apiService.get(`/budgets/${budgetId}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch budget data:', error);
      return {
        id: budgetId,
        project_id: 'proj-001',
        total_amount: 738948,
        currency: 'USD',
        status: 'approved',
        categories: []
      };
    }
  }

  // Fetch partner data
  async getPartnerData(partnerId: string): Promise<PartnerData> {
    try {
      const response = await apiService.get(`/partners/${partnerId}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch partner data:', error);
      return {
        id: partnerId,
        name: 'Luigi Giussani Institute of Higher Education',
        registration: 'Indigenous NGO Reg. No. 4760',
        address: 'P.O BOX 40390 Sentamu Road, Luzira Kampala, Uganda',
        contact_person: 'John Mary Vianney Mitana',
        contact_email: 'contact@lgihe.org',
        contact_phone: '+256 xxx xxx xxx',
        signatory_name: 'John Mary Vianney Mitana',
        signatory_title: 'Executive Director'
      };
    }
  }

  // Compile all contract data
  async compileContractData(projectId: string, budgetId: string, partnerId: string): Promise<ContractData> {
    const [grantorSettings, projectData, budgetData, partnerData] = await Promise.all([
      this.getGrantorSettings(),
      this.getProjectData(projectId),
      this.getBudgetData(budgetId),
      this.getPartnerData(partnerId)
    ]);

    // Generate agreement number
    const agreementNumber = `SGA-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;
    
    // Format dates
    const formatDate = (dateString: string) => {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    };

    return {
      // Grantor details
      grantor_name: grantorSettings.name,
      grantor_registration: grantorSettings.registration,
      grantor_certificate: grantorSettings.certificate,
      grantor_address: grantorSettings.address,
      grantor_contact_person: grantorSettings.contact_person,
      grantor_contact_email: grantorSettings.contact_email,
      grantor_contact_phone: grantorSettings.contact_phone,
      grantor_signatory_name: grantorSettings.signatory_name,
      grantor_signatory_title: grantorSettings.signatory_title,
      
      // Project details
      project_name: projectData.name,
      project_description: projectData.description,
      start_date: formatDate(projectData.start_date),
      end_date: formatDate(projectData.end_date),
      objective_1: projectData.objectives[0] || 'Generate evidence and insights',
      objective_2: projectData.objectives[1] || 'Inform policy focus and public awareness',
      objective_3: projectData.objectives[2] || 'Amplify voice and strengthen local capacities',
      agreement_number: agreementNumber,
      
      // Partner/Grantee details
      partner_organization: partnerData.name,
      grantee_registration: partnerData.registration,
      grantee_address: partnerData.address,
      contact_person: partnerData.contact_person,
      contact_email: partnerData.contact_email,
      contact_phone: partnerData.contact_phone,
      grantee_signatory_name: partnerData.signatory_name,
      grantee_signatory_title: partnerData.signatory_title,
      
      // Financial details
      total_amount: `${budgetData.currency} ${budgetData.total_amount.toLocaleString()}`,
      primary_funders: 'World Partnership Foundation, Echidna Giving', // Could be dynamic
      bank_name: grantorSettings.bank_name,
      bank_branch: grantorSettings.bank_branch,
      account_name: grantorSettings.account_name,
      account_number: grantorSettings.account_number,
      swift_code: grantorSettings.swift_code,
      
      // Legal details
      governing_law: 'Kenya', // Could be configurable
      signature_date: formatDate(new Date().toISOString()),
    };
  }

  // Replace template variables
  replaceTemplateVariables(template: string, data: ContractData): string {
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      const value = data[key as keyof ContractData];
      return value || match;
    });
  }

  // Get partners/organizations
  async getPartners() {
    // Mock data for now - replace with real API call
    return [
      {
        id: 'partner-001',
        name: 'Luigi Giussani Institute',
        registration: 'NGO/REG/2020/001',
        address: '123 Education Street, Nairobi, Kenya',
        contact_person: 'Dr. Maria Santos',
        contact_email: 'maria.santos@lgi.org',
        contact_phone: '+254-700-123456',
        signatory_name: 'Dr. Maria Santos',
        signatory_title: 'Executive Director'
      },
      {
        id: 'partner-002',
        name: 'Community Health Partners',
        registration: 'NGO/REG/2019/045',
        address: '456 Health Avenue, Mombasa, Kenya',
        contact_person: 'John Kimani',
        contact_email: 'j.kimani@chp.org',
        contact_phone: '+254-700-789012',
        signatory_name: 'John Kimani',
        signatory_title: 'Program Director'
      },
      {
        id: 'partner-003',
        name: 'Water Access Initiative',
        registration: 'NGO/REG/2021/078',
        address: '789 Development Road, Kisumu, Kenya',
        contact_person: 'Sarah Wanjiku',
        contact_email: 's.wanjiku@wai.org',
        contact_phone: '+254-700-345678',
        signatory_name: 'Sarah Wanjiku',
        signatory_title: 'Country Director'
      }
    ];
  }

  // Generate contract from template
  async generateContract(templateId: string, projectId: string, budgetId: string, partnerId: string): Promise<string> {
    const contractData = await this.compileContractData(projectId, budgetId, partnerId);
    
    // Fetch template content
    const templateResponse = await apiService.get(`/contract-templates/${templateId}`);
    const template = templateResponse.data?.content || 'SUB-GRANT AGREEMENT\n\nThis agreement is between {{grantor_name}} and {{partner_organization}} for the project {{project_name}}.\n\nTotal Amount: {{total_amount}}\nProject Duration: {{start_date}} to {{end_date}}\n\nGrantor: {{grantor_name}}\nSignatory: {{grantor_signatory_name}}, {{grantor_signatory_title}}\n\nGrantee: {{partner_organization}}\nSignatory: {{grantee_signatory_name}}, {{grantee_signatory_title}}';
    
    // Replace variables
    return this.replaceTemplateVariables(template, contractData);
  }
}

export const contractDataService = new ContractDataService();
