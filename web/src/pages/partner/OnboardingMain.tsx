import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { fetchWithAuth } from '../../services/api';
import OnboardingWizard from '../../components/onboarding/OnboardingWizard';
import FormField from '../../components/onboarding/FormField';

// All African Countries and their major cities/states
const LOCATION_DATA = {
  // East Africa
  'Kenya': {
    cities: ['Nairobi', 'Mombasa', 'Kisumu', 'Nakuru', 'Eldoret', 'Thika', 'Malindi', 'Kitale', 'Garissa', 'Kakamega', 'Machakos', 'Meru', 'Nyeri', 'Kericho'],
    states: ['Nairobi County', 'Mombasa County', 'Kisumu County', 'Nakuru County', 'Uasin Gishu County', 'Kiambu County', 'Kilifi County', 'Trans Nzoia County', 'Garissa County', 'Kakamega County', 'Machakos County', 'Meru County', 'Nyeri County', 'Kericho County']
  },
  'Uganda': {
    cities: ['Kampala', 'Gulu', 'Lira', 'Mbarara', 'Jinja', 'Mbale', 'Mukono', 'Kasese', 'Masaka', 'Entebbe'],
    states: ['Central Region', 'Eastern Region', 'Northern Region', 'Western Region']
  },
  'Tanzania': {
    cities: ['Dar es Salaam', 'Mwanza', 'Arusha', 'Dodoma', 'Mbeya', 'Morogoro', 'Tanga', 'Kahama', 'Tabora', 'Zanzibar City'],
    states: ['Dar es Salaam Region', 'Mwanza Region', 'Arusha Region', 'Dodoma Region', 'Mbeya Region', 'Morogoro Region', 'Tanga Region', 'Shinyanga Region', 'Tabora Region', 'Zanzibar Urban/West Region']
  },
  'Rwanda': {
    cities: ['Kigali', 'Butare', 'Gitarama', 'Ruhengeri', 'Gisenyi', 'Cyangugu', 'Kibungo', 'Byumba'],
    states: ['Kigali City', 'Southern Province', 'Western Province', 'Northern Province', 'Eastern Province']
  },
  'Burundi': {
    cities: ['Bujumbura', 'Gitega', 'Muyinga', 'Ruyigi', 'Ngozi', 'Rutana'],
    states: ['Bujumbura Mairie', 'Bujumbura Rural', 'Gitega', 'Muyinga', 'Ngozi', 'Rutana']
  },
  'Ethiopia': {
    cities: ['Addis Ababa', 'Dire Dawa', 'Mekelle', 'Gondar', 'Awassa', 'Bahir Dar', 'Dessie', 'Jimma', 'Jijiga', 'Shashamane'],
    states: ['Addis Ababa', 'Dire Dawa', 'Tigray Region', 'Amhara Region', 'Oromia Region', 'Somali Region', 'Benishangul-Gumuz Region', 'Southern Nations Region', 'Gambela Region', 'Harari Region', 'Afar Region']
  },
  'Eritrea': {
    cities: ['Asmara', 'Assab', 'Massawa', 'Keren', 'Mendefera', 'Barentu'],
    states: ['Central Region', 'Southern Region', 'Northern Red Sea Region', 'Southern Red Sea Region', 'Anseba Region', 'Gash-Barka Region']
  },
  'Djibouti': {
    cities: ['Djibouti City', 'Ali Sabieh', 'Dikhil', 'Tadjourah', 'Obock'],
    states: ['Djibouti Region', 'Ali Sabieh Region', 'Dikhil Region', 'Tadjourah Region', 'Obock Region', 'Arta Region']
  },
  'Somalia': {
    cities: ['Mogadishu', 'Hargeisa', 'Bosaso', 'Kismayo', 'Galkayo', 'Berbera'],
    states: ['Banaadir', 'Woqooyi Galbeed', 'Bari', 'Jubbada Hoose', 'Mudug', 'Sahil']
  },
  'South Sudan': {
    cities: ['Juba', 'Wau', 'Malakal', 'Yei', 'Aweil', 'Bentiu'],
    states: ['Central Equatoria', 'Western Bahr el Ghazal', 'Upper Nile', 'Central Equatoria', 'Northern Bahr el Ghazal', 'Unity']
  },
  
  // North Africa
  'Egypt': {
    cities: ['Cairo', 'Alexandria', 'Giza', 'Shubra El Kheima', 'Port Said', 'Suez', 'Luxor', 'Mansoura', 'Tanta', 'Asyut'],
    states: ['Cairo Governorate', 'Alexandria Governorate', 'Giza Governorate', 'Qalyubia Governorate', 'Port Said Governorate', 'Suez Governorate', 'Luxor Governorate', 'Dakahlia Governorate', 'Gharbia Governorate', 'Asyut Governorate']
  },
  'Libya': {
    cities: ['Tripoli', 'Benghazi', 'Misrata', 'Tarhuna', 'Al Bayda', 'Zawiya'],
    states: ['Tripoli District', 'Benghazi District', 'Misrata District', 'Tarhuna District', 'Al Jabal al Akhdar District', 'Zawiya District']
  },
  'Tunisia': {
    cities: ['Tunis', 'Sfax', 'Sousse', 'Ettadhamen', 'Kairouan', 'Bizerte'],
    states: ['Tunis Governorate', 'Sfax Governorate', 'Sousse Governorate', 'Ariana Governorate', 'Kairouan Governorate', 'Bizerte Governorate']
  },
  'Algeria': {
    cities: ['Algiers', 'Oran', 'Constantine', 'Batna', 'Djelfa', 'Sétif'],
    states: ['Algiers Province', 'Oran Province', 'Constantine Province', 'Batna Province', 'Djelfa Province', 'Sétif Province']
  },
  'Morocco': {
    cities: ['Casablanca', 'Rabat', 'Fez', 'Marrakech', 'Agadir', 'Tangier'],
    states: ['Casablanca-Settat', 'Rabat-Salé-Kénitra', 'Fès-Meknès', 'Marrakech-Safi', 'Souss-Massa', 'Tanger-Tetouan-Al Hoceima']
  },
  'Sudan': {
    cities: ['Khartoum', 'Omdurman', 'Port Sudan', 'Kassala', 'Obeid', 'Nyala'],
    states: ['Khartoum State', 'Kassala State', 'Red Sea State', 'Kassala State', 'North Kordofan State', 'South Darfur State']
  },
  
  // West Africa
  'Nigeria': {
    cities: ['Lagos', 'Kano', 'Ibadan', 'Abuja', 'Port Harcourt', 'Benin City', 'Maiduguri', 'Zaria', 'Aba', 'Jos', 'Ilorin', 'Oyo', 'Enugu', 'Abeokuta'],
    states: ['Lagos State', 'Kano State', 'Oyo State', 'Federal Capital Territory', 'Rivers State', 'Edo State', 'Borno State', 'Kaduna State', 'Abia State', 'Plateau State', 'Kwara State', 'Enugu State', 'Ogun State']
  },
  'Ghana': {
    cities: ['Accra', 'Kumasi', 'Tamale', 'Takoradi', 'Cape Coast', 'Tema', 'Koforidua', 'Sunyani', 'Ho', 'Wa'],
    states: ['Greater Accra Region', 'Ashanti Region', 'Northern Region', 'Western Region', 'Central Region', 'Eastern Region', 'Brong-Ahafo Region', 'Volta Region', 'Upper West Region', 'Upper East Region']
  },
  'Senegal': {
    cities: ['Dakar', 'Touba', 'Thiès', 'Kaolack', 'Saint-Louis', 'Ziguinchor'],
    states: ['Dakar Region', 'Diourbel Region', 'Thiès Region', 'Kaolack Region', 'Saint-Louis Region', 'Ziguinchor Region']
  },
  'Mali': {
    cities: ['Bamako', 'Sikasso', 'Mopti', 'Koutiala', 'Ségou', 'Kayes'],
    states: ['Bamako Region', 'Sikasso Region', 'Mopti Region', 'Sikasso Region', 'Ségou Region', 'Kayes Region']
  },
  'Burkina Faso': {
    cities: ['Ouagadougou', 'Bobo-Dioulasso', 'Koudougou', 'Banfora', 'Ouahigouya', 'Pouytenga'],
    states: ['Centre Region', 'Hauts-Bassins Region', 'Centre-Ouest Region', 'Cascades Region', 'Nord Region', 'Centre-Est Region']
  },
  'Niger': {
    cities: ['Niamey', 'Zinder', 'Maradi', 'Agadez', 'Tahoua', 'Dosso'],
    states: ['Niamey Region', 'Zinder Region', 'Maradi Region', 'Agadez Region', 'Tahoua Region', 'Dosso Region']
  },
  'Guinea': {
    cities: ['Conakry', 'Nzérékoré', 'Kankan', 'Kindia', 'Labe', 'Mamou'],
    states: ['Conakry Region', 'Nzérékoré Region', 'Kankan Region', 'Kindia Region', 'Labé Region', 'Mamou Region']
  },
  'Sierra Leone': {
    cities: ['Freetown', 'Bo', 'Kenema', 'Koidu', 'Makeni', 'Waterloo'],
    states: ['Western Area', 'Southern Province', 'Eastern Province', 'Eastern Province', 'Northern Province', 'Western Area']
  },
  'Liberia': {
    cities: ['Monrovia', 'Gbarnga', 'Kakata', 'Bensonville', 'Harper', 'Voinjama'],
    states: ['Montserrado County', 'Bong County', 'Margibi County', 'Montserrado County', 'Maryland County', 'Lofa County']
  },
  'Ivory Coast': {
    cities: ['Abidjan', 'Bouaké', 'Daloa', 'Yamoussoukro', 'San-Pédro', 'Divo'],
    states: ['Lagunes District', 'Vallée du Bandama District', 'Haut-Sassandra District', 'Lacs District', 'Bas-Sassandra District', 'Lacs District']
  },
  'Togo': {
    cities: ['Lomé', 'Sokodé', 'Kara', 'Kpalimé', 'Atakpamé', 'Dapaong'],
    states: ['Maritime Region', 'Centrale Region', 'Kara Region', 'Plateaux Region', 'Plateaux Region', 'Savanes Region']
  },
  'Benin': {
    cities: ['Cotonou', 'Abomey-Calavi', 'Djougou', 'Porto-Novo', 'Parakou', 'Kandi'],
    states: ['Littoral Department', 'Atlantique Department', 'Donga Department', 'Ouémé Department', 'Borgou Department', 'Alibori Department']
  },
  'Mauritania': {
    cities: ['Nouakchott', 'Nouadhibou', 'Néma', 'Kaédi', 'Rosso', 'Zouérat'],
    states: ['Nouakchott-Ouest Region', 'Dakhlet Nouadhibou Region', 'Hodh ech Chargui Region', 'Gorgol Region', 'Trarza Region', 'Tiris Zemmour Region']
  },
  'Gambia': {
    cities: ['Banjul', 'Serekunda', 'Brikama', 'Bakau', 'Farafenni', 'Lamin'],
    states: ['Banjul Division', 'Kombo St. Mary Division', 'Western Division', 'Kombo St. Mary Division', 'North Bank Division', 'Kombo St. Mary Division']
  },
  'Guinea-Bissau': {
    cities: ['Bissau', 'Bafatá', 'Gabú', 'Bissorã', 'Bolama', 'Cacheu'],
    states: ['Bissau Region', 'Bafatá Region', 'Gabú Region', 'Oio Region', 'Bolama Region', 'Cacheu Region']
  },
  'Cape Verde': {
    cities: ['Praia', 'Mindelo', 'Santa Maria', 'Assomada', 'Porto Novo', 'Espargos'],
    states: ['Santiago Island', 'São Vicente Island', 'Sal Island', 'Santiago Island', 'Santo Antão Island', 'Sal Island']
  },
  
  // Central Africa
  'Chad': {
    cities: ['N\'Djamena', 'Moundou', 'Sarh', 'Abéché', 'Kelo', 'Koumra'],
    states: ['N\'Djamena Region', 'Logone Occidental Region', 'Moyen-Chari Region', 'Ouaddaï Region', 'Tandjilé Region', 'Logone Oriental Region']
  },
  'Cameroon': {
    cities: ['Douala', 'Yaoundé', 'Bamenda', 'Bafoussam', 'Garoua', 'Maroua'],
    states: ['Littoral Region', 'Centre Region', 'Northwest Region', 'West Region', 'North Region', 'Far North Region']
  },
  'Central African Republic': {
    cities: ['Bangui', 'Bimbo', 'Berbérati', 'Carnot', 'Bambari', 'Bouar'],
    states: ['Bangui Prefecture', 'Ombella-M\'Poko Prefecture', 'Mambéré-Kadéï Prefecture', 'Mambéré-Kadéï Prefecture', 'Ouaka Prefecture', 'Nana-Mambéré Prefecture']
  },
  'Democratic Republic of Congo': {
    cities: ['Kinshasa', 'Lubumbashi', 'Mbuji-Mayi', 'Kisangani', 'Masina', 'Kananga'],
    states: ['Kinshasa Province', 'Haut-Katanga Province', 'Kasaï-Oriental Province', 'Tshopo Province', 'Kinshasa Province', 'Kasaï-Central Province']
  },
  'Republic of Congo': {
    cities: ['Brazzaville', 'Pointe-Noire', 'Dolisie', 'Nkayi', 'Mossendjo', 'Ouesso'],
    states: ['Brazzaville Department', 'Pointe-Noire Department', 'Niari Department', 'Bouenza Department', 'Niari Department', 'Sangha Department']
  },
  'Gabon': {
    cities: ['Libreville', 'Port-Gentil', 'Franceville', 'Oyem', 'Moanda', 'Mouila'],
    states: ['Estuaire Province', 'Ogooué-Maritime Province', 'Haut-Ogooué Province', 'Woleu-Ntem Province', 'Haut-Ogooué Province', 'Ngounié Province']
  },
  'Equatorial Guinea': {
    cities: ['Malabo', 'Bata', 'Ebebiyin', 'Aconibe', 'Añisoc', 'Luba'],
    states: ['Bioko Norte Province', 'Litoral Province', 'Kié-Ntem Province', 'Wele-Nzas Province', 'Centro Sur Province', 'Bioko Sur Province']
  },
  'São Tomé and Príncipe': {
    cities: ['São Tomé', 'Trindade', 'Neves', 'Santana', 'Guadalupe', 'Santo António'],
    states: ['Água Grande District', 'Mé-Zóchi District', 'Lobata District', 'Cantagalo District', 'Água Grande District', 'Pagué District']
  },
  
  // Southern Africa
  'South Africa': {
    cities: ['Johannesburg', 'Cape Town', 'Durban', 'Pretoria', 'Port Elizabeth', 'Bloemfontein', 'East London', 'Nelspruit', 'Polokwane', 'Kimberley', 'Rustenburg'],
    states: ['Gauteng', 'Western Cape', 'KwaZulu-Natal', 'Gauteng', 'Eastern Cape', 'Free State', 'Eastern Cape', 'Mpumalanga', 'Limpopo', 'Northern Cape', 'North West']
  },
  'Zimbabwe': {
    cities: ['Harare', 'Bulawayo', 'Chitungwiza', 'Mutare', 'Epworth', 'Gweru'],
    states: ['Harare Province', 'Bulawayo Province', 'Harare Province', 'Manicaland Province', 'Harare Province', 'Midlands Province']
  },
  'Botswana': {
    cities: ['Gaborone', 'Francistown', 'Molepolole', 'Maun', 'Serowe', 'Selibe Phikwe'],
    states: ['South-East District', 'North-East District', 'Kweneng District', 'North-West District', 'Central District', 'Central District']
  },
  'Namibia': {
    cities: ['Windhoek', 'Rundu', 'Walvis Bay', 'Swakopmund', 'Oshakati', 'Rehoboth'],
    states: ['Khomas Region', 'Kavango East Region', 'Erongo Region', 'Erongo Region', 'Oshana Region', 'Hardap Region']
  },
  'Zambia': {
    cities: ['Lusaka', 'Kitwe', 'Ndola', 'Kabwe', 'Chingola', 'Mufulira'],
    states: ['Lusaka Province', 'Copperbelt Province', 'Copperbelt Province', 'Central Province', 'Copperbelt Province', 'Copperbelt Province']
  },
  'Malawi': {
    cities: ['Lilongwe', 'Blantyre', 'Mzuzu', 'Zomba', 'Kasungu', 'Mangochi'],
    states: ['Central Region', 'Southern Region', 'Northern Region', 'Southern Region', 'Central Region', 'Southern Region']
  },
  'Mozambique': {
    cities: ['Maputo', 'Matola', 'Beira', 'Nampula', 'Chimoio', 'Nacala'],
    states: ['Maputo City Province', 'Maputo Province', 'Sofala Province', 'Nampula Province', 'Manica Province', 'Nampula Province']
  },
  'Angola': {
    cities: ['Luanda', 'Huambo', 'Lobito', 'Benguela', 'Kuito', 'Lubango'],
    states: ['Luanda Province', 'Huambo Province', 'Benguela Province', 'Benguela Province', 'Bié Province', 'Huíla Province']
  },
  'Lesotho': {
    cities: ['Maseru', 'Teyateyaneng', 'Mafeteng', 'Hlotse', 'Mohale\'s Hoek', 'Maputsoe'],
    states: ['Maseru District', 'Berea District', 'Mafeteng District', 'Leribe District', 'Mohale\'s Hoek District', 'Leribe District']
  },
  'Eswatini': {
    cities: ['Mbabane', 'Manzini', 'Big Bend', 'Malkerns', 'Nhlangano', 'Siteki'],
    states: ['Hhohho Region', 'Manzini Region', 'Lubombo Region', 'Manzini Region', 'Shiselweni Region', 'Lubombo Region']
  },
  
  // Island Nations
  'Madagascar': {
    cities: ['Antananarivo', 'Toamasina', 'Antsirabe', 'Fianarantsoa', 'Mahajanga', 'Toliara'],
    states: ['Analamanga Region', 'Atsinanana Region', 'Vakinankaratra Region', 'Haute Matsiatra Region', 'Boeny Region', 'Atsimo-Andrefana Region']
  },
  'Mauritius': {
    cities: ['Port Louis', 'Beau Bassin-Rose Hill', 'Vacoas-Phoenix', 'Curepipe', 'Quatre Bornes', 'Triolet'],
    states: ['Port Louis District', 'Plaines Wilhems District', 'Plaines Wilhems District', 'Plaines Wilhems District', 'Plaines Wilhems District', 'Pamplemousses District']
  },
  'Seychelles': {
    cities: ['Victoria', 'Anse Boileau', 'Beau Vallon', 'Cascade', 'Anse Royale', 'Takamaka'],
    states: ['Mahé District', 'Mahé District', 'Mahé District', 'Mahé District', 'Mahé District', 'Mahé District']
  },
  'Comoros': {
    cities: ['Moroni', 'Mutsamudu', 'Fomboni', 'Domoni', 'Tsimbeo', 'Mramani'],
    states: ['Grande Comore', 'Anjouan', 'Mohéli', 'Anjouan', 'Grande Comore', 'Grande Comore']
  }
};

const AFRICAN_COUNTRIES = Object.keys(LOCATION_DATA);

// Harmonized onboarding with Section A, B, and C

interface FormData {
  // Basic Information
  name: string;
  legal_name: string;
  registration_number: string;
  tax_id: string;
  legal_structure: string;
  year_established: string;
  
  // Contact Information
  email: string;
  phone: string;
  website: string;
  primary_contact_name: string;
  primary_contact_title: string;
  primary_contact_email: string;
  primary_contact_phone: string;
  
  // Address Information
  address: string;
  city: string;
  state_province: string;
  postal_code: string;
  country: string;
  
  // Banking Information
  bank_name: string;
  bank_branch: string;
  account_name: string;
  account_number: string;
  swift_code: string;
  
  // Financial Assessment
  current_annual_budget_amount: string;
  current_annual_budget_year: string;
  next_year_budget_amount: string;
  next_year_budget_year: string;
  largest_grant_amount: string;
  largest_grant_year: string;
  current_donor_funding_amount: string;
  current_donor_funding_year: string;
  other_funds_amount: string;
  other_funds_year: string;
}

interface FileUpload {
  key: string;
  originalName: string;
  mime: string;
  size: number;
  sha256: string;
  uploadedAt: string;
  version: number;
}

interface DocumentResponse {
  available: 'yes' | 'na';
  naExplanation?: string;
  note?: string;
  files?: FileUpload[];
  lastSubmittedAt?: string;
}

interface DocumentRequirement {
  code: string;
  title: string;
  isOptional: boolean;
  sortOrder: number;
  response?: DocumentResponse;
}

const OnboardingMain: React.FC = () => {
  const navigate = useNavigate();
  const { user, organization, refreshSession } = useAuth();
  const [currentStep, setCurrentStep] = useState('section-a');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  const [formData, setFormData] = useState<FormData>({
    // Basic Information
    name: '',
    legal_name: '',
    registration_number: '',
    tax_id: '',
    legal_structure: '',
    year_established: '2020',
    
    // Contact Information
    email: '',
    phone: '',
    website: '',
    primary_contact_name: '',
    primary_contact_title: '',
    primary_contact_email: '',
    primary_contact_phone: '',
    
    // Address Information - African defaults
    address: '',
    city: 'Nairobi',
    state_province: 'Nairobi County',
    postal_code: '00100',
    country: 'Kenya',
    
    // Banking Information
    bank_name: '',
    bank_branch: '',
    account_name: '',
    account_number: '',
    swift_code: '',
    
    // Financial Assessment
    current_annual_budget_amount: '',
    current_annual_budget_year: new Date().getFullYear().toString(),
    next_year_budget_amount: '',
    next_year_budget_year: (new Date().getFullYear() + 1).toString(),
    largest_grant_amount: '',
    largest_grant_year: new Date().getFullYear().toString(),
    current_donor_funding_amount: '',
    current_donor_funding_year: new Date().getFullYear().toString(),
    other_funds_amount: '',
    other_funds_year: new Date().getFullYear().toString(),
  });
  const [errors, setErrors] = useState<Partial<FormData>>({});
  
  // Section C - Document Upload state
  const [documentResponses, setDocumentResponses] = useState<Record<string, DocumentResponse>>({});
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [documentRequirements, setDocumentRequirements] = useState<Record<string, DocumentRequirement[]>>({});
  const [documentCategories, setDocumentCategories] = useState<string[]>([]);

  // Helper function to determine completed steps based on organization status
  const getCompletedStepsFromStatus = (status: string): string[] => {
    const steps: string[] = [];
    
    // Section A completed if status is beyond a_pending
    if (status !== 'a_pending') {
      steps.push('section-a');
    }
    
    // Section B completed if status is beyond b_pending
    if (!['a_pending', 'b_pending'].includes(status)) {
      steps.push('section-b');
    }
    
    // Section C completed if status is beyond c_pending
    if (!['a_pending', 'b_pending', 'c_pending'].includes(status)) {
      steps.push('section-c');
    }
    
    // Review completed if status is finalized
    if (status === 'finalized') {
      steps.push('review');
    }
    
    return steps;
  };

  // Helper function to get the first incomplete step
  const getFirstIncompleteStep = (status: string): string => {
    if (status === 'a_pending') return 'section-a';
    if (status === 'b_pending') return 'section-b';
    if (status === 'c_pending') return 'section-c';
    if (status === 'under_review') return 'review';
    return 'section-a'; // Default fallback
  };

  // Smart routing logic - redirect to appropriate section based on organization status
  useEffect(() => {
    if (organization?.status) {
      const completedFromStatus = getCompletedStepsFromStatus(organization.status);
      setCompletedSteps(completedFromStatus);

      // Get current step from URL
      const path = window.location.pathname;
      const urlStep = path.includes('section-a') ? 'section-a' :
                    path.includes('section-b') ? 'section-b' :
                    path.includes('section-c') ? 'section-c' :
                    path.includes('review') ? 'review' : 'section-a';

      // Check if user is trying to access a section they haven't completed yet
      const isStepAccessible = urlStep === 'section-a' || completedFromStatus.includes(getStepPredecessor(urlStep));
      
      if (!isStepAccessible) {
        // Redirect to the first incomplete step
        const firstIncomplete = getFirstIncompleteStep(organization.status);
        console.log(`Redirecting from ${urlStep} to ${firstIncomplete} - section not yet accessible`);
        setCurrentStep(firstIncomplete);
        navigate(`/partner/onboarding/${firstIncomplete}`);
      } else {
        // Allow access to the requested step
        setCurrentStep(urlStep);
      }
    }
  }, [organization?.status, navigate]);

  // Helper function to get the predecessor step
  const getStepPredecessor = (step: string): string => {
    switch (step) {
      case 'section-b': return 'section-a';
      case 'section-c': return 'section-b';
      case 'review': return 'section-c';
      default: return '';
    }
  };

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (organization) {
      console.log('Loading organization data into form:', organization);
      setFormData(prev => ({
        ...prev,
        // Basic Information
        name: organization.name || '',
        legal_name: organization.legal_name || '',
        registration_number: organization.registration_number || '',
        tax_id: organization.tax_id || '',
        legal_structure: organization.legal_structure || '',
        year_established: organization.year_established?.toString() || '',
        email: organization.email || '',
        phone: organization.phone || '',
        website: organization.website || '',
        
        // Contact Information
        primary_contact_name: organization.primary_contact_name || '',
        primary_contact_title: organization.primary_contact_title || '',
        primary_contact_email: organization.primary_contact_email || '',
        primary_contact_phone: organization.primary_contact_phone || '',
        
        // Address Information
        address: organization.address || '',
        city: organization.city || '',
        state_province: organization.state_province || '',
        postal_code: organization.postal_code || '',
        country: organization.country || '',
        
        // Banking Information (if available)
        bank_name: organization.bank_name || '',
        bank_branch: organization.bank_branch || '',
        account_name: organization.account_name || '',
        account_number: organization.account_number || '',
        swift_code: organization.swift_code || '',
      }));
      
      // If country is loaded but city/state are empty, set defaults
      if (organization.country && !organization.city && !organization.state_province) {
        const countryData = LOCATION_DATA[organization.country as keyof typeof LOCATION_DATA];
        if (countryData) {
          setFormData(prev => ({
            ...prev,
            city: countryData.cities[0] || '',
            state_province: countryData.states[0] || ''
          }));
        }
      }
    }
  }, [organization, navigate]);

  // Separate useEffect for loading section-specific data
  useEffect(() => {
    if (organization) {
      if (currentStep === 'section-b') {
        loadSectionBData().catch(error => {
          console.error('Error loading Section B data:', error);
        });
      } else if (currentStep === 'section-c') {
        loadSectionCRequirements().catch(error => {
          console.error('Error loading Section C requirements:', error);
          
          // Check if it's an organization not found error
          if (error.message?.includes('Organization not found')) {
            console.log('No organization found - user needs to complete previous sections');
            // Set current step to section-a if no organization
            setCurrentStep('section-a');
          }
          
          // Set empty requirements to prevent UI issues
          setDocumentRequirements({});
          setDocumentCategories([]);
          setDocumentResponses({});
        });
      }
    }
  }, [organization, currentStep]);

  const loadSectionBData = async () => {
    try {
      // First try to load from organization data (from session)
      if (organization?.financial_assessment) {
        const assessment = organization.financial_assessment;
        console.log('Loading Section B data from organization:', assessment);
        setFormData(prev => ({
          ...prev,
          current_annual_budget_amount: assessment.currentAnnualBudget?.amountUsd?.toString() || '',
          current_annual_budget_year: assessment.currentAnnualBudget?.year?.toString() || '',
          next_year_budget_amount: assessment.nextYearAnnualBudgetEstimate?.amountUsd?.toString() || '',
          next_year_budget_year: assessment.nextYearAnnualBudgetEstimate?.year?.toString() || '',
          largest_grant_amount: assessment.largestGrantEverManaged?.amountUsd?.toString() || '',
          largest_grant_year: assessment.largestGrantEverManaged?.year?.toString() || '',
          current_donor_funding_amount: assessment.currentDonorFunding?.amountUsd?.toString() || '',
          current_donor_funding_year: assessment.currentDonorFunding?.year?.toString() || '',
          other_funds_amount: assessment.otherFunds?.amountUsd?.toString() || '',
          other_funds_year: assessment.otherFunds?.year?.toString() || '',
        }));
        return;
      }

      // Fallback: try to load from API endpoint
      const sectionData = await fetchWithAuth('/onboarding/section-b');
      
      if (sectionData.assessment) {
        const assessment = sectionData.assessment;
        console.log('Loading Section B data from API:', assessment);
        setFormData(prev => ({
          ...prev,
          current_annual_budget_amount: assessment.currentAnnualBudget?.amountUsd?.toString() || '',
          current_annual_budget_year: assessment.currentAnnualBudget?.year?.toString() || '',
          next_year_budget_amount: assessment.nextYearAnnualBudgetEstimate?.amountUsd?.toString() || '',
          next_year_budget_year: assessment.nextYearAnnualBudgetEstimate?.year?.toString() || '',
          largest_grant_amount: assessment.largestGrantEverManaged?.amountUsd?.toString() || '',
          largest_grant_year: assessment.largestGrantEverManaged?.year?.toString() || '',
          current_donor_funding_amount: assessment.currentDonorFunding?.amountUsd?.toString() || '',
          current_donor_funding_year: assessment.currentDonorFunding?.year?.toString() || '',
          other_funds_amount: assessment.otherFunds?.amountUsd?.toString() || '',
          other_funds_year: assessment.otherFunds?.year?.toString() || '',
        }));
      }
    } catch (error) {
      console.error('Failed to load Section B data:', error);
      // Don't throw error - just log it, as this might be the first time accessing Section B
    }
  };

  const loadSectionCRequirements = async () => {
    try {
      const sectionData = await fetchWithAuth('/onboarding/section-c');
      
      setDocumentRequirements(sectionData.requirements);
      setDocumentCategories(sectionData.categories);
      
      // Initialize responses from existing data
      const initialResponses: Record<string, DocumentResponse> = {};
      Object.values(sectionData.requirements).flat().forEach((req) => {
        const requirement = req as DocumentRequirement;
        if (requirement.response) {
          initialResponses[requirement.code] = requirement.response;
        } else {
          initialResponses[requirement.code] = {
            available: 'yes',
            naExplanation: '',
            note: '',
            files: []
          };
        }
      });
      setDocumentResponses(initialResponses);
    } catch (error) {
      console.error('Failed to load Section C requirements:', error);
      // Don't use fallback - let the error be handled properly
      throw error;
    }
  };

  const handleFieldChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCountryChange = (country: string) => {
    setFormData(prev => ({
      ...prev,
      country,
      // Reset city and state when country changes
      city: '',
      state_province: ''
    }));
  };

  // Get available cities and states based on selected country
  const getAvailableCities = () => {
    const countryData = LOCATION_DATA[formData.country as keyof typeof LOCATION_DATA];
    return countryData?.cities || [];
  };

  const getAvailableStates = () => {
    const countryData = LOCATION_DATA[formData.country as keyof typeof LOCATION_DATA];
    return countryData?.states || [];
  };

  const saveFormData = async (stepId: string): Promise<boolean> => {
    try {
      setIsSubmitting(true);
      
      let endpoint = '';
      let data = {};
      
      switch (stepId) {
        case 'section-a':
          endpoint = '/onboarding/section-a';
          data = {
            name: formData.name,
            legal_name: formData.legal_name,
            registration_number: formData.registration_number,
            tax_id: formData.tax_id,
            legal_structure: formData.legal_structure,
            year_established: formData.year_established,
            email: formData.email,
            phone: formData.phone,
            website: formData.website,
            primary_contact_name: formData.primary_contact_name,
            primary_contact_title: formData.primary_contact_title,
            primary_contact_email: formData.primary_contact_email,
            primary_contact_phone: formData.primary_contact_phone,
            address: formData.address,
            city: formData.city,
            state_province: formData.state_province,
            postal_code: formData.postal_code,
            country: formData.country,
            bank_name: formData.bank_name,
            bank_branch: formData.bank_branch,
            account_name: formData.account_name,
            account_number: formData.account_number,
            swift_code: formData.swift_code,
          };
          console.log('Saving Section A data:', data);
          break;
        case 'section-b':
          endpoint = '/onboarding/section-b-financial';
          data = {
            currentAnnualBudget: {
              amountUsd: parseFloat(formData.current_annual_budget_amount) || 0,
              year: parseInt(formData.current_annual_budget_year) || new Date().getFullYear()
            },
            nextYearAnnualBudgetEstimate: {
              amountUsd: parseFloat(formData.next_year_budget_amount) || 0,
              year: parseInt(formData.next_year_budget_year) || new Date().getFullYear() + 1
            },
            largestGrantEverManaged: {
              amountUsd: parseFloat(formData.largest_grant_amount) || 0,
              year: parseInt(formData.largest_grant_year) || new Date().getFullYear()
            },
            currentDonorFunding: {
              amountUsd: parseFloat(formData.current_donor_funding_amount) || 0,
              year: parseInt(formData.current_donor_funding_year) || new Date().getFullYear()
            },
            otherFunds: {
              amountUsd: parseFloat(formData.other_funds_amount) || 0,
              year: parseInt(formData.other_funds_year) || new Date().getFullYear()
            }
          };
          console.log('Saving Section B data:', data);
          break;
        case 'section-c':
          endpoint = '/onboarding/section-c/save';
          const documents = Object.entries(documentResponses).map(([code, response]) => ({
            requirementCode: code,
            ...response
          }));
          data = { documents };
          break;
        default:
          return false;
      }

      const response = await fetchWithAuth(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!completedSteps.includes(stepId)) {
        setCompletedSteps(prev => [...prev, stepId]);
      }

      await refreshSession();
      return true;
    } catch (error) {
      console.error('Error saving form data:', error);
      
      // For Section C, if endpoint doesn't exist yet, still allow progression for development
      if (stepId === 'section-c' && (error as Error).message?.includes('Route not found')) {
        console.log('Section C endpoint not available - allowing progression for development');
        if (!completedSteps.includes(stepId)) {
          setCompletedSteps(prev => [...prev, stepId]);
        }
        return true;
      }
      
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNext = async () => {
    const success = await saveFormData(currentStep);
    if (success) {
      if (currentStep === 'section-a') {
        setCurrentStep('section-b');
      } else if (currentStep === 'section-b') {
        setCurrentStep('section-c');
      } else if (currentStep === 'section-c') {
        setCurrentStep('review');
      }
    }
  };

  const handlePrevious = () => {
    if (currentStep === 'section-b') {
      setCurrentStep('section-a');
    } else if (currentStep === 'section-c') {
      setCurrentStep('section-b');
    } else if (currentStep === 'review') {
      setCurrentStep('section-c');
    }
  };

  const handleStepClick = (stepId: string) => {
    if (!organization?.status) return;
    
    const completedFromStatus = getCompletedStepsFromStatus(organization.status);
    const predecessorStep = getStepPredecessor(stepId);
    
    // Allow access to first step or any step whose predecessor is completed
    const isAccessible = stepId === 'section-a' || (predecessorStep && completedFromStatus.includes(predecessorStep));
    
    if (isAccessible) {
      setCurrentStep(stepId);
      navigate(`/partner/onboarding/${stepId}`);
    } else {
      // Redirect to the first incomplete step
      const firstIncomplete = getFirstIncompleteStep(organization.status);
      console.log(`Cannot access ${stepId} - redirecting to ${firstIncomplete}`);
      setCurrentStep(firstIncomplete);
      navigate(`/partner/onboarding/${firstIncomplete}`);
    }
  };

  // Section C specific handlers
  const handleDocumentResponseChange = (code: string, field: keyof DocumentResponse, value: any) => {
    setDocumentResponses(prev => ({
      ...prev,
      [code]: {
        ...prev[code],
        [field]: value
      }
    }));
  };

  const handleFileUpload = async (code: string, files: FileList) => {
    const file = files[0];
    if (!file) return;

    try {
      setUploadProgress(prev => ({ ...prev, [code]: 0 }));

      // Get presigned URL
      const presignResponse = await fetchWithAuth('/onboarding/section-c/presign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size
        })
      });

      const { url, fields, fileKey } = await presignResponse.json();

      // Simulate file upload progress
      const uploadInterval = setInterval(() => {
        setUploadProgress(prev => {
          const current = prev[code] || 0;
          if (current >= 100) {
            clearInterval(uploadInterval);
            return prev;
          }
          return { ...prev, [code]: current + 10 };
        });
      }, 100);

      // Simulate upload completion
      setTimeout(() => {
        clearInterval(uploadInterval);
        setUploadProgress(prev => ({ ...prev, [code]: 100 }));

        // Add file to response
        const newFile: FileUpload = {
          key: fileKey,
          originalName: file.name,
          mime: file.type,
          size: file.size,
          sha256: 'mock-hash-' + Date.now(),
          uploadedAt: new Date().toISOString(),
          version: 1
        };

        handleDocumentResponseChange(code, 'files', [...(documentResponses[code]?.files || []), newFile]);
        
        // Clear progress after a moment
        setTimeout(() => {
          setUploadProgress(prev => {
            const newProgress = { ...prev };
            delete newProgress[code];
            return newProgress;
          });
        }, 1000);
      }, 1500);

    } catch (error) {
      console.error('File upload failed:', error);
      setUploadProgress(prev => {
        const newProgress = { ...prev };
        delete newProgress[code];
        return newProgress;
      });
    }
  };

  const removeFile = (code: string, fileIndex: number) => {
    const currentFiles = documentResponses[code]?.files || [];
    const updatedFiles = currentFiles.filter((_, index) => index !== fileIndex);
    handleDocumentResponseChange(code, 'files', updatedFiles);
  };

  const getCategoryTitle = (category: string) => {
    const titles: Record<string, string> = {
      legal: 'Legal Documents',
      governance: 'Governance Documents',
      financial: 'Financial Documents',
      operational: 'Operational Documents',
      compliance: 'Compliance Documents',
      additional: 'Additional Documents'
    };
    return titles[category] || category;
  };

  const handleSaveDraft = async () => {
    setIsSaving(true);
    try {
      await saveFormData(currentStep);
      // You could add a toast notification here
      console.log('Draft saved successfully');
    } catch (error) {
      console.error('Failed to save draft:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      
      // Save all sections first
      await saveFormData('section-a');
      await saveFormData('section-b');
      await saveFormData('section-c');
      
      // Submit final application
      await fetchWithAuth('/partner/onboarding/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      
      await refreshSession();
      navigate('/partner/');
    } catch (error) {
      console.error('Error submitting application:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show loading if no organization
  if (!organization) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Define steps with the previous good Section A design plus banking
  const steps = [
    {
      id: 'section-a',
      title: 'Section A - Organization Profile',
      icon: '🏢',
      description: 'Complete organization information',
      component: (
        <div className="space-y-10">
          {/* Basic Information Section */}
          <div className="space-y-6">
            <div className="flex items-center space-x-3 pb-4 border-b border-slate-200 dark:border-slate-700">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Basic Information</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">Essential details about your organization</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <FormField
                label="Organization Name"
                name="name"
                value={formData.name}
                onChange={(value) => handleFieldChange('name', value)}
                error={errors.name}
                required
                placeholder="Enter your organization name"
              />
              <FormField
                label="Legal Name"
                name="legal_name"
                value={formData.legal_name}
                onChange={(value) => handleFieldChange('legal_name', value)}
                error={errors.legal_name}
                required
                placeholder="Enter legal name"
              />
              <FormField
                label="Registration Number"
                name="registration_number"
                value={formData.registration_number}
                onChange={(value) => handleFieldChange('registration_number', value)}
                error={errors.registration_number}
                required
                placeholder="Enter registration number"
              />
              <FormField
                label="Tax ID"
                name="tax_id"
                value={formData.tax_id}
                onChange={(value) => handleFieldChange('tax_id', value)}
                error={errors.tax_id}
                placeholder="Enter tax ID"
              />
              <FormField
                label="Legal Structure"
                name="legal_structure"
                value={formData.legal_structure}
                onChange={(value) => handleFieldChange('legal_structure', value)}
                error={errors.legal_structure}
                required
                type="select"
                options={[
                  { value: 'llc', label: 'Limited Liability Company (LLC)' },
                  { value: 'nonprofit', label: 'Non-Profit Organization' },
                  { value: 'corporation', label: 'Corporation' },
                  { value: 'partnership', label: 'Partnership' },
                  { value: 'sole_proprietor', label: 'Sole Proprietor' },
                  { value: 'other', label: 'Other' },
                ]}
                placeholder="Select legal structure"
              />
              <FormField
                label="Year Established"
                name="year_established"
                value={formData.year_established}
                onChange={(value) => handleFieldChange('year_established', value)}
                error={errors.year_established}
                required
                type="number"
                placeholder="Enter year established"
              />
            </div>
          </div>

          {/* Contact Information Section */}
          <div className="space-y-6">
            <div className="flex items-center space-x-3 pb-4 border-b border-slate-200 dark:border-slate-700">
              <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Contact Information</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">How we can reach your organization and key contacts</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <FormField
                label="Organization Email"
                name="email"
                type="email"
                value={formData.email}
                onChange={(value) => handleFieldChange('email', value)}
                error={errors.email}
                required
                placeholder="Enter organization email"
              />
              <FormField
                label="Phone Number"
                name="phone"
                value={formData.phone}
                onChange={(value) => handleFieldChange('phone', value)}
                error={errors.phone}
                required
                placeholder="Enter phone number"
              />
              <FormField
                label="Website"
                name="website"
                value={formData.website}
                onChange={(value) => handleFieldChange('website', value)}
                error={errors.website}
                placeholder="Enter website URL"
              />
              <FormField
                label="Primary Contact Name"
                name="primary_contact_name"
                value={formData.primary_contact_name}
                onChange={(value) => handleFieldChange('primary_contact_name', value)}
                error={errors.primary_contact_name}
                required
                placeholder="Enter primary contact name"
              />
              <FormField
                label="Primary Contact Title"
                name="primary_contact_title"
                value={formData.primary_contact_title}
                onChange={(value) => handleFieldChange('primary_contact_title', value)}
                error={errors.primary_contact_title}
                required
                placeholder="Enter primary contact title"
              />
              <FormField
                label="Primary Contact Email"
                name="primary_contact_email"
                type="email"
                value={formData.primary_contact_email}
                onChange={(value) => handleFieldChange('primary_contact_email', value)}
                error={errors.primary_contact_email}
                required
                placeholder="Enter primary contact email"
              />
              <FormField
                label="Primary Contact Phone"
                name="primary_contact_phone"
                value={formData.primary_contact_phone}
                onChange={(value) => handleFieldChange('primary_contact_phone', value)}
                error={errors.primary_contact_phone}
                required
                placeholder="Enter primary contact phone"
              />
            </div>
          </div>

          {/* Address Information Section */}
          <div className="space-y-6">
            <div className="flex items-center space-x-3 pb-4 border-b border-slate-200 dark:border-slate-700">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Organization Address</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">Physical location and mailing address</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="md:col-span-2">
                <FormField
                  label="Street Address"
                  name="address"
                  value={formData.address}
                  onChange={(value) => handleFieldChange('address', value)}
                  error={errors.address}
                  required
                  placeholder="Enter street address"
                />
              </div>
              
              {/* Country Dropdown - First */}
              <FormField
                label="Country"
                name="country"
                type="select"
                value={formData.country}
                onChange={handleCountryChange}
                error={errors.country}
                required
                options={AFRICAN_COUNTRIES.map(country => ({ value: country, label: country }))}
              />

              {/* City Dropdown - Second */}
              <div className="space-y-2">
                <FormField
                  label="City"
                  name="city"
                  type="select"
                  value={formData.city}
                  onChange={(value) => handleFieldChange('city', value)}
                  error={errors.city}
                  required
                  options={getAvailableCities().map(city => ({ value: city, label: city }))}
                />
                {!formData.country && <p className="mt-1 text-sm text-gray-500">Please select a country first</p>}
              </div>

              {/* State/Province Dropdown - Third */}
              <div className="space-y-2">
                <FormField
                  label="State/Province"
                  name="state_province"
                  type="select"
                  value={formData.state_province}
                  onChange={(value) => handleFieldChange('state_province', value)}
                  error={errors.state_province}
                  required
                  options={getAvailableStates().map(state => ({ value: state, label: state }))}
                />
                {!formData.country && <p className="mt-1 text-sm text-gray-500">Please select a country first</p>}
              </div>

              {/* Postal Code - Fourth */}
              <FormField
                label="Postal Code"
                name="postal_code"
                value={formData.postal_code}
                onChange={(value) => handleFieldChange('postal_code', value)}
                error={errors.postal_code}
                required
                placeholder="Enter postal code"
              />
            </div>
          </div>

          {/* Banking Information Section */}
          <div className="space-y-6">
            <div className="flex items-center space-x-3 pb-4 border-b border-slate-200 dark:border-slate-700">
              <div className="w-8 h-8 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Banking Information</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">Financial account details for disbursements</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <FormField
                label="Bank Name"
                name="bank_name"
                value={formData.bank_name}
                onChange={(value) => handleFieldChange('bank_name', value)}
                error={errors.bank_name}
                required
                placeholder="Enter bank name"
              />
              <FormField
                label="Bank Branch"
                name="bank_branch"
                value={formData.bank_branch}
                onChange={(value) => handleFieldChange('bank_branch', value)}
                error={errors.bank_branch}
                placeholder="Enter bank branch"
              />
              <FormField
                label="Account Name"
                name="account_name"
                value={formData.account_name}
                onChange={(value) => handleFieldChange('account_name', value)}
                error={errors.account_name}
                required
                placeholder="Enter account name"
              />
              <FormField
                label="Account Number"
                name="account_number"
                value={formData.account_number}
                onChange={(value) => handleFieldChange('account_number', value)}
                error={errors.account_number}
                required
                placeholder="Enter account number"
              />
              <FormField
                label="SWIFT Code"
                name="swift_code"
                value={formData.swift_code}
                onChange={(value) => handleFieldChange('swift_code', value)}
                error={errors.swift_code}
                placeholder="Enter SWIFT code (if applicable)"
              />
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'section-b',
      title: 'Section B - Financial Assessment',
      icon: '💰',
      description: 'Financial capacity and funding information',
      component: (
        <div className="space-y-10">
          {/* Financial Assessment Header */}
          <div className="space-y-6">
            <div className="flex items-center space-x-3 pb-4 border-b border-slate-200 dark:border-slate-700">
              <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Financial Assessment</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">Demonstrate your organization's financial capacity and experience</p>
              </div>
            </div>
            
            {/* Current Annual Budget Card */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl p-6 border border-blue-200 dark:border-blue-800">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-6 h-6 bg-blue-500 rounded-lg flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h4 className="text-lg font-bold text-slate-900 dark:text-white">Current Annual Budget</h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  label="Amount (USD)"
                  name="current_annual_budget_amount"
                  type="number"
                  value={formData.current_annual_budget_amount}
                  onChange={(value) => handleFieldChange('current_annual_budget_amount', value)}
                  error={errors.current_annual_budget_amount}
                  required
                  placeholder="Enter amount"
                />
                <FormField
                  label="Year"
                  name="current_annual_budget_year"
                  type="number"
                  value={formData.current_annual_budget_year}
                  onChange={(value) => handleFieldChange('current_annual_budget_year', value)}
                  error={errors.current_annual_budget_year}
                  required
                  placeholder="Enter year"
                />
              </div>
            </div>
            
            {/* Next Year Budget Estimate Card */}
            <div className="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-2xl p-6 border border-purple-200 dark:border-purple-800">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-6 h-6 bg-purple-500 rounded-lg flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
                <h4 className="text-lg font-bold text-slate-900 dark:text-white">Next Year Budget Estimate</h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  label="Amount (USD)"
                  name="next_year_budget_amount"
                  type="number"
                  value={formData.next_year_budget_amount}
                  onChange={(value) => handleFieldChange('next_year_budget_amount', value)}
                  error={errors.next_year_budget_amount}
                  required
                  placeholder="Enter estimated amount"
                />
                <FormField
                  label="Year"
                  name="next_year_budget_year"
                  type="number"
                  value={formData.next_year_budget_year}
                  onChange={(value) => handleFieldChange('next_year_budget_year', value)}
                  error={errors.next_year_budget_year}
                  required
                  placeholder="Enter year"
                />
              </div>
            </div>

            {/* Largest Grant Card */}
            <div className="bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 rounded-2xl p-6 border border-emerald-200 dark:border-emerald-800">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-6 h-6 bg-emerald-500 rounded-lg flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                  </svg>
                </div>
                <h4 className="text-lg font-bold text-slate-900 dark:text-white">Largest Grant Ever Managed</h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  label="Amount (USD)"
                  name="largest_grant_amount"
                  type="number"
                  value={formData.largest_grant_amount}
                  onChange={(value) => handleFieldChange('largest_grant_amount', value)}
                  error={errors.largest_grant_amount}
                  required
                  placeholder="Enter amount"
                />
                <FormField
                  label="Year"
                  name="largest_grant_year"
                  type="number"
                  value={formData.largest_grant_year}
                  onChange={(value) => handleFieldChange('largest_grant_year', value)}
                  error={errors.largest_grant_year}
                  required
                  placeholder="Enter year"
                />
              </div>
            </div>

            {/* Current Donor Funding Card */}
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-2xl p-6 border border-amber-200 dark:border-amber-800">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-6 h-6 bg-amber-500 rounded-lg flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h4 className="text-lg font-bold text-slate-900 dark:text-white">Current Donor Funding</h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  label="Amount (USD)"
                  name="current_donor_funding_amount"
                  type="number"
                  value={formData.current_donor_funding_amount}
                  onChange={(value) => handleFieldChange('current_donor_funding_amount', value)}
                  error={errors.current_donor_funding_amount}
                  required
                  placeholder="Enter amount"
                />
                <FormField
                  label="Year"
                  name="current_donor_funding_year"
                  type="number"
                  value={formData.current_donor_funding_year}
                  onChange={(value) => handleFieldChange('current_donor_funding_year', value)}
                  error={errors.current_donor_funding_year}
                  required
                  placeholder="Enter year"
                />
              </div>
            </div>

            {/* Other Funds Card */}
            <div className="bg-gradient-to-br from-rose-50 to-pink-50 dark:from-rose-900/20 dark:to-pink-900/20 rounded-2xl p-6 border border-rose-200 dark:border-rose-800">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-6 h-6 bg-rose-500 rounded-lg flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <h4 className="text-lg font-bold text-slate-900 dark:text-white">Other Funds Apart from Donor Funds</h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  label="Amount (USD)"
                  name="other_funds_amount"
                  type="number"
                  value={formData.other_funds_amount}
                  onChange={(value) => handleFieldChange('other_funds_amount', value)}
                  error={errors.other_funds_amount}
                  required
                  placeholder="Enter amount"
                />
                <FormField
                  label="Year"
                  name="other_funds_year"
                  type="number"
                  value={formData.other_funds_year}
                  onChange={(value) => handleFieldChange('other_funds_year', value)}
                  error={errors.other_funds_year}
                  required
                  placeholder="Enter year"
                />
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'section-c',
      title: 'Section C - Compliance Documents',
      icon: '📄',
      description: 'Required legal and compliance documentation',
      component: (
        <div className="space-y-10">
          {/* Document Upload Header */}
          <div className="space-y-6">
            <div className="flex items-center space-x-3 pb-4 border-b border-slate-200 dark:border-slate-700">
              <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Compliance Documents</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">Upload required documents or mark as not applicable with explanation</p>
              </div>
            </div>
            
            {/* Instructions Card */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl p-6 border border-blue-200 dark:border-blue-800">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Document Upload Instructions</h4>
                  <div className="text-sm text-slate-600 dark:text-slate-400 space-y-2">
                    <p>• Upload clear, readable copies of all required documents</p>
                    <p>• Accepted formats: PDF, DOC, DOCX, XLS, XLSX, JPG, PNG</p>
                    <p>• If a document doesn't apply to your organization, select "N/A" and provide an explanation</p>
                    <p>• Use the notes field for any additional context or clarifications</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Document Categories */}
            <div className="space-y-8">
              {documentCategories.length === 0 ? (
                <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-2xl p-6 border border-amber-200 dark:border-amber-800">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-amber-500 rounded-xl flex items-center justify-center flex-shrink-0">
                      <svg className="w-6 h-6 text-white" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-amber-900 dark:text-amber-100 mb-2">
                        Complete Previous Sections First
                      </h3>
                      <p className="text-amber-800 dark:text-amber-200 mb-4">
                        You need to complete Section A (Organization Profile) and Section B (Financial Assessment) before accessing the compliance documents section.
                      </p>
                      <button
                        onClick={() => setCurrentStep('section-a')}
                        className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-xl font-medium transition-colors duration-200 shadow-sm hover:shadow-md"
                      >
                        Go to Section A
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                documentCategories.map(category => {
                  const requirements = documentRequirements[category] || [];
                  if (requirements.length === 0) return null;

                return (
                  <div key={category} className="bg-gray-50 rounded-xl p-6">
                    <h4 className="text-xl font-semibold text-gray-900 mb-6">
                      {getCategoryTitle(category)}
                    </h4>
                    
                    <div className="space-y-6">
                      {requirements.map(req => {
                        const response = documentResponses[req.code];
                        const progress = uploadProgress[req.code];
                        
                        return (
                          <div key={req.code} className="bg-white rounded-lg border p-6">
                            <div className="grid grid-cols-12 gap-4 items-start">
                              {/* Document Title */}
                              <div className="col-span-5">
                                <h5 className="font-medium text-gray-900">{req.title}</h5>
                                {!req.isOptional && (
                                  <span className="inline-block mt-1 px-2 py-1 text-xs bg-red-100 text-red-800 rounded">
                                    Required
                                  </span>
                                )}
                              </div>

                              {/* Available Dropdown */}
                              <div className="col-span-2">
                                <select
                                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                  value={response?.available || 'yes'}
                                  onChange={(e) => handleDocumentResponseChange(req.code, 'available', e.target.value)}
                                >
                                  <option value="yes">Yes</option>
                                  <option value="na">N/A</option>
                                </select>
                              </div>

                              {/* Upload/Explanation Area */}
                              <div className="col-span-3">
                                {response?.available === 'yes' ? (
                                  <div>
                                    <input
                                      type="file"
                                      id={`file-${req.code}`}
                                      className="hidden"
                                      accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                                      onChange={(e) => e.target.files && handleFileUpload(req.code, e.target.files)}
                                    />
                                    <label
                                      htmlFor={`file-${req.code}`}
                                      className="cursor-pointer inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                    >
                                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                      </svg>
                                      Upload File
                                    </label>
                                    
                                    {progress !== undefined && (
                                      <div className="mt-2">
                                        <div className="bg-gray-200 rounded-full h-2">
                                          <div 
                                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                            style={{ width: `${progress}%` }}
                                          ></div>
                                        </div>
                                      </div>
                                    )}

                                    {/* File List */}
                                    {response?.files && response.files.length > 0 && (
                                      <div className="mt-3 space-y-2">
                                        {response.files.map((file, index) => (
                                          <div key={index} className="flex items-center justify-between bg-gray-50 rounded p-2">
                                            <span className="text-sm text-gray-700 truncate">{file.originalName}</span>
                                            <button
                                              onClick={() => removeFile(req.code, index)}
                                              className="text-red-600 hover:text-red-800"
                                            >
                                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                              </svg>
                                            </button>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <textarea
                                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                    rows={3}
                                    placeholder="Explain why this document is not available..."
                                    value={response?.naExplanation || ''}
                                    onChange={(e) => handleDocumentResponseChange(req.code, 'naExplanation', e.target.value)}
                                  />
                                )}
                              </div>

                              {/* Notes */}
                              <div className="col-span-2">
                                <input
                                  type="text"
                                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                  placeholder="Notes (optional)"
                                  value={response?.note || ''}
                                  onChange={(e) => handleDocumentResponseChange(req.code, 'note', e.target.value)}
                                />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })
              )}
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'review',
      title: 'Review & Submit',
      icon: '✅',
      description: 'Verify your information',
      component: (
        <div className="space-y-10">
          {/* Review Header */}
          <div className="space-y-6">
            <div className="flex items-center space-x-3 pb-4 border-b border-slate-200 dark:border-slate-700">
              <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Review & Submit</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">Verify all information before final submission</p>
              </div>
            </div>
            
            {/* Completion Status */}
            <div className="bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 rounded-2xl p-6 border border-emerald-200 dark:border-emerald-800">
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 bg-emerald-500 rounded-lg flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-emerald-900 dark:text-emerald-100">All Sections Completed</h4>
                  <p className="text-sm text-emerald-800 dark:text-emerald-200">Your onboarding information is ready for submission</p>
                </div>
              </div>
            </div>
          </div>

          {/* Organization Summary Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Organization Details Card */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl p-6 border border-blue-200 dark:border-blue-800">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-6 h-6 bg-blue-500 rounded-lg flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <h4 className="text-lg font-bold text-slate-900 dark:text-white">Organization Details</h4>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-blue-200/50 dark:border-blue-700/50">
                  <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Name:</span>
                  <span className="text-sm font-semibold text-slate-900 dark:text-white">{formData.name || 'Not provided'}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-blue-200/50 dark:border-blue-700/50">
                  <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Legal Name:</span>
                  <span className="text-sm font-semibold text-slate-900 dark:text-white">{formData.legal_name || 'Not provided'}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-blue-200/50 dark:border-blue-700/50">
                  <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Registration:</span>
                  <span className="text-sm font-semibold text-slate-900 dark:text-white">{formData.registration_number || 'Not provided'}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Tax ID:</span>
                  <span className="text-sm font-semibold text-slate-900 dark:text-white">{formData.tax_id || 'Not provided'}</span>
                </div>
              </div>
            </div>

            {/* Contact Information Card */}
            <div className="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-2xl p-6 border border-purple-200 dark:border-purple-800">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-6 h-6 bg-purple-500 rounded-lg flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <h4 className="text-lg font-bold text-slate-900 dark:text-white">Contact Information</h4>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-purple-200/50 dark:border-purple-700/50">
                  <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Email:</span>
                  <span className="text-sm font-semibold text-slate-900 dark:text-white">{formData.email || 'Not provided'}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-purple-200/50 dark:border-purple-700/50">
                  <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Phone:</span>
                  <span className="text-sm font-semibold text-slate-900 dark:text-white">{formData.phone || 'Not provided'}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Website:</span>
                  <span className="text-sm font-semibold text-slate-900 dark:text-white">{formData.website || 'Not provided'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Final Submission */}
          <div className="bg-gradient-to-br from-slate-50 to-gray-50 dark:from-slate-900/20 dark:to-gray-900/20 rounded-2xl p-8 border border-slate-200 dark:border-slate-800">
            <div className="text-center space-y-6">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </div>
              <div>
                <h4 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Ready to Submit</h4>
                <p className="text-slate-600 dark:text-slate-400 max-w-md mx-auto">
                  By submitting this application, you confirm that all information provided is accurate and complete. Your application will be reviewed by our team.
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
                <button
                  type="button"
                  onClick={() => navigate('/partner/onboarding/landing')}
                  className="px-6 py-3 border-2 border-slate-300 dark:border-slate-600 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  Back to Start
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="px-8 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-lg flex items-center space-x-2"
                >
                  {isSubmitting ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                      <span>Submit Application</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      ),
    }
  ];

  const currentStepId = currentStep;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-8">
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-gray-900">Partner Onboarding</h1>
              <p className="mt-2 text-gray-600">
                Complete your registration to unlock partnership opportunities
              </p>
            </div>

            <OnboardingWizard
              steps={steps}
              currentStepId={currentStepId}
              onStepComplete={handleNext}
              onPrevious={handlePrevious}
              onSaveDraft={handleSaveDraft}
              onStepClick={handleStepClick}
              completedSteps={completedSteps}
              isSubmitting={isSubmitting}
              isSaving={isSaving}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingMain;
