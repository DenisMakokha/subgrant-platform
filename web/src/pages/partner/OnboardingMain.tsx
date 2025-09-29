import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { fetchWithAuth } from '../../services/api';
import { toast } from 'react-toastify';
import OnboardingWizard from '../../components/onboarding/OnboardingWizard';
import FormField from '../../components/onboarding/FormField';
import { Country, State, City, type ICountry, type IState, type ICity } from 'country-state-city';

// Dynamic Africa location helpers (54 countries)
const AFRICAN_ISO2 = [
  'DZ','AO','BJ','BW','BF','BI','CM','CV','CF','TD','KM','CI','CD','CG','DJ','EG','GQ','ER','ET','GA','GM','GH','GN','GW','KE','LS','LR','LY','MG','MW','ML','MR','MU','MA','MZ','NA','NE','NG','RW','ST','SN','SC','SL','SO','ZA','SS','SD','SZ','TZ','TG','TN','UG','ZM','ZW'
];

const getAfricanCountryNames = (): string[] => {
  return AFRICAN_ISO2
    .map((code: string) => Country.getCountryByCode(code)?.name)
    .filter((n): n is string => !!n)
    .sort((a, b) => a.localeCompare(b));
};

const getCountryCodeByName = (name?: string): string | undefined => {
  if (!name) return undefined;
  const byName = Country.getAllCountries().find((c: ICountry) => c.name === name);
  if (byName) return byName.isoCode;
  const byCode = Country.getAllCountries().find((c: ICountry) => c.isoCode === name);
  return byCode?.isoCode;
};

const getStateNames = (countryName?: string): string[] => {
  const code = getCountryCodeByName(countryName);
  if (!code) return [];
  return State.getStatesOfCountry(code).map((s: IState) => s.name);
};

const getCityNames = (countryName?: string, stateName?: string): string[] => {
  const code = getCountryCodeByName(countryName);
  if (!code) return [];
  if (stateName) {
    const st = State.getStatesOfCountry(code).find((s: IState) => s.name === stateName || s.isoCode === stateName);
    if (st) return (City.getCitiesOfState(code, st.isoCode) ?? []).map((c: ICity) => c.name);
  }
  return (City.getCitiesOfCountry(code) ?? []).map((c: ICity) => c.name);
};

// Normalize a stored country value (may be ISO2 like "KE" or display name like "Kenya") to a display name
const normalizeCountryName = (value?: string): string => {
  if (!value) return '';
  // If it's a 2-letter ISO code, convert to name
  if (/^[A-Z]{2}$/i.test(value)) {
    const byCode = Country.getCountryByCode(value.toUpperCase());
    return byCode?.name || value;
  }
  // If it's already a known name, keep it
  const byName = Country.getAllCountries().find((c: ICountry) => c.name === value);
  return byName?.name || value;
};

// All African Countries and their major cities/states (legacy fallback sample; dynamic source is used instead)
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

const AFRICAN_COUNTRIES = getAfricanCountryNames();

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

const deriveStepFromPath = (path: string): string => {
  if (path.includes('section-a')) return 'section-a';
  if (path.includes('section-b')) return 'section-b';
  if (path.includes('section-c')) return 'section-c';
  if (path.includes('review')) return 'review';
  return 'section-a';
};

const OnboardingMain: React.FC = () => {
  const navigate = useNavigate();
  const { user, organization, refreshSession, updateOrganization } = useAuth();
  const [currentStep, setCurrentStep] = useState<string>(() => deriveStepFromPath(window.location.pathname));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  const isFinalized = organization?.status === 'finalized';
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

  // Auto-backup Section C responses locally on any change to prevent data loss
  useEffect(() => {
    try {
      localStorage.setItem('sectionC_documentResponses', JSON.stringify(documentResponses));
    } catch (e) {
      console.warn('Failed to auto-backup Section C documentResponses:', e);
    }
  }, [documentResponses]);

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
    
    // Review completed if submitted for review or finalized
    if (['under_review', 'under_review_gm', 'under_review_coo', 'finalized'].includes(status)) {
      steps.push('review');
    }
    
    return steps;
  };

  // Helper function to get the first incomplete step
  const getFirstIncompleteStep = (status: string): string => {
    if (status === 'a_pending') return 'section-a';
    if (status === 'b_pending') return 'section-b';
    if (status === 'c_pending') return 'section-c';
    if (['under_review', 'under_review_gm', 'under_review_coo'].includes(status)) return 'review';
    return 'section-a'; // Default fallback
  };

  // Smart routing logic - derive step from URL on first load and enforce access rules
  useEffect(() => {
    if (organization?.status) {
      const completedFromStatus = getCompletedStepsFromStatus(organization.status);
      // Merge with locally persisted completed steps if any
      let localCompleted: string[] = [];
      try {
        const raw = localStorage.getItem('completedSteps');
        if (raw) localCompleted = JSON.parse(raw);
      } catch {}
      // Only update completed steps if we don't have more completed steps already
      // This prevents progress from going backwards when updating completed sections
      // Get current step from URL
      const path = window.location.pathname;
      const urlStep = deriveStepFromPath(path);

      setCompletedSteps(prev => {
        let combined = [...prev, ...completedFromStatus, ...localCompleted];
        // Heuristic: If on section-c and status is c_pending, consider section-c completed for progress
        if (organization.status === 'c_pending' && urlStep === 'section-c') {
          combined.push('section-c');
        }
        // Also, if local backup of Section C exists, treat as completed
        try {
          const rawDocs = localStorage.getItem('sectionC_documentResponses');
          const docs = rawDocs ? JSON.parse(rawDocs) : {};
          if (docs && Object.keys(docs).length > 0) {
            combined.push('section-c');
          }
        } catch {}
        const newCompleted = Array.from(new Set(combined));
        return newCompleted;
      });

      // Check if user is trying to access a section they haven't completed yet
      const allCompleted = Array.from(new Set([...completedFromStatus, ...localCompleted, ...completedSteps]));
      const isStepAccessible = urlStep === 'section-a' || allCompleted.includes(getStepPredecessor(urlStep));
      
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
  }, [organization?.status, navigate, completedSteps]);

  // When organization status changes, merge status-derived completion with locally persisted completed steps
  useEffect(() => {
    if (organization?.status) {
      const completedFromStatus = getCompletedStepsFromStatus(organization.status);
      let localCompleted: string[] = [];
      try {
        const raw = localStorage.getItem('completedSteps');
        if (raw) localCompleted = JSON.parse(raw);
      } catch {}
      setCompletedSteps(prev => {
        const combined = [...prev, ...completedFromStatus, ...localCompleted];
        const newCompleted = Array.from(new Set(combined));
        return newCompleted;
      });
    }
  }, [organization?.status]);

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
      // Use universal loading method
      loadOrganizationData(organization);
      
      // If country is loaded but city/state are empty, set defaults using dynamic dataset
      if (organization.country && !organization.city && !organization.state_province) {
        const states = getStateNames(organization.country);
        const cities = getCityNames(organization.country, states[0]);
        setFormData(prev => ({
          ...prev,
          state_province: states[0] || '',
          city: cities[0] || ''
        }));
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
          // Keep user on the current step; do not redirect
        });
      } else if (currentStep === 'review') {
        // Ensure latest data from all sections are loaded for confirmation view
        loadSectionBData().catch(error => {
          console.error('Error loading Section B data for review:', error);
        });
        loadSectionCRequirements().catch(error => {
          console.error('Error loading Section C requirements for review:', error);
          // Keep user on review; do not redirect
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
      const envelopeOrData = await fetchWithAuth('/onboarding/section-c');
      const sectionData = envelopeOrData?.data ?? envelopeOrData; // SSoT envelope support
      
      setDocumentRequirements(sectionData.requirements || {});
      setDocumentCategories(sectionData.categories || []);
      
      // Initialize responses from existing data, preserving any local changes
      setDocumentResponses(prev => {
        // Start with previous state and local backup
        let merged: Record<string, DocumentResponse> = { ...prev };
        try {
          const localBackup = localStorage.getItem('sectionC_documentResponses');
          if (localBackup) {
            const backupData = JSON.parse(localBackup);
            console.log('📁 Loading Section C data from localStorage backup:', backupData);
            merged = { ...backupData, ...merged }; // keep in-memory over backup
          }
        } catch (error) {
          console.warn('Failed to load localStorage backup:', error);
        }

        // Now apply server responses with priority over any local/client state
        Object.values(sectionData.requirements).flat().forEach((req) => {
          const requirement = req as DocumentRequirement;
          if (requirement.response) {
            merged[requirement.code] = requirement.response; // server wins
          } else if (!merged[requirement.code]) {
            merged[requirement.code] = {
              available: 'yes',
              naExplanation: '',
              note: '',
              files: []
            };
          }
        });
        return merged;
      });
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

  // Get available cities and states based on selected country (dynamic dataset)
  const getAvailableCities = () => {
    return getCityNames(formData.country, formData.state_province) || [];
  };

  const getAvailableStates = () => {
    return getStateNames(formData.country) || [];
  };

  // Universal data loading method - loads complete organization data reliably
  const loadOrganizationData = (orgData: any) => {
    if (!orgData) return;
    
    console.log('📥 Loading organization data:', orgData);
    console.log('🏦 Bank details from server:', {
      bank_name: orgData.bank_name,
      bank_branch: orgData.bank_branch,
      account_name: orgData.account_name,
      account_number: orgData.account_number,
      swift_code: orgData.swift_code,
      year_established: orgData.year_established
    });
    
    setFormData({
      // Basic Information
      name: orgData.name || '',
      legal_name: orgData.legal_name || '',
      registration_number: orgData.registration_number || '',
      tax_id: orgData.tax_id || '',
      legal_structure: orgData.legal_structure || '',
      year_established: orgData.year_established?.toString() || '',
      email: orgData.email || '',
      phone: orgData.phone || '',
      website: orgData.website || '',
      
      // Contact Information
      primary_contact_name: orgData.primary_contact_name || '',
      primary_contact_title: orgData.primary_contact_title || '',
      primary_contact_email: orgData.primary_contact_email || '',
      primary_contact_phone: orgData.primary_contact_phone || '',
      
      // Address Information
      address: orgData.address || '',
      city: orgData.city || '',
      state_province: orgData.state_province || '',
      postal_code: orgData.postal_code || '',
      country: normalizeCountryName(orgData.country) || '',
      
      // Banking Information
      bank_name: orgData.bank_name || '',
      bank_branch: orgData.bank_branch || '',
      account_name: orgData.account_name || '',
      account_number: orgData.account_number || '',
      swift_code: orgData.swift_code || '',
      
      // Section B fields (if available)
      current_annual_budget_amount: orgData.financial_assessment?.currentAnnualBudget?.amountUsd?.toString() || '',
      current_annual_budget_year: orgData.financial_assessment?.currentAnnualBudget?.year?.toString() || '',
      next_year_budget_amount: orgData.financial_assessment?.nextYearAnnualBudgetEstimate?.amountUsd?.toString() || '',
      next_year_budget_year: orgData.financial_assessment?.nextYearAnnualBudgetEstimate?.year?.toString() || '',
      largest_grant_amount: orgData.financial_assessment?.largestGrantEverManaged?.amountUsd?.toString() || '',
      largest_grant_year: orgData.financial_assessment?.largestGrantEverManaged?.year?.toString() || '',
      current_donor_funding_amount: orgData.financial_assessment?.currentDonorFunding?.amountUsd?.toString() || '',
      current_donor_funding_year: orgData.financial_assessment?.currentDonorFunding?.year?.toString() || '',
      other_funds_amount: orgData.financial_assessment?.otherFunds?.amountUsd?.toString() || '',
      other_funds_year: orgData.financial_assessment?.otherFunds?.year?.toString() || '',
    });
  };

  // SSoT Universal data saving method - handles any form field consistently
  const saveOrganizationData = async (data: any, section: string): Promise<boolean> => {
    try {
      setIsSubmitting(true);
      
      console.log(`💾 SSoT Saving ${section} data:`, data);
      console.log(`📊 Current form data for debugging:`, formData);
      
      // Use SSoT envelope format
      const envelope = {
        data: data,
        meta: {
          etag: organization?.version || 0,
          timestamp: new Date().toISOString()
        }
      };
      
      console.log(`📦 SSoT Envelope being sent:`, envelope);
      
      const response = await fetchWithAuth(`/onboarding/${section}`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'If-Match': String(organization?.version || 0)
        },
        body: JSON.stringify(envelope),
      });

      console.log(`✅ SSoT Successfully saved ${section}:`, response);
      
      // Update local organization data from response
      if (response.data) {
        console.log('🔄 Updating local organization data from SSoT response');
        // The response should contain the updated organization
        // This will trigger the loadOrganizationData through the useEffect
      }
      
      // Refresh session to get updated organization data
      await refreshSession();
      console.log(`🔄 Session refreshed after saving ${section}`);
      
      return true;
    } catch (error: any) {
      console.error(`❌ SSoT Error saving ${section} data:`, error);
      
      if (error?.status === 409) {
        console.error('🔄 Conflict detected - data was modified elsewhere');
        // Could show conflict resolution UI here
      } else if (error?.status === 400) {
        console.error('📋 Validation errors:', error?.errors);
        // Could show field-level errors here
      }
      
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const saveFormData = async (stepId: string, submissionStatus: 'draft' | 'submitted' = 'draft'): Promise<boolean> => {
    try {
      setIsSubmitting(true);
      
      console.log('🚀 saveFormData called with stepId:', stepId);
      console.log('📋 Current formData state:', formData);
      console.log('🏢 Current organization state:', organization);
      
      let endpoint = '';
      let data = {};
      
      switch (stepId) {
        case 'section-a':
          // Use universal save method for Section A
          const sectionAData = {
            // Basic Information
            name: formData.name || '',
            legal_name: formData.legal_name || '',
            registration_number: formData.registration_number || '',
            tax_id: formData.tax_id || '',
            legal_structure: formData.legal_structure || 'nonprofit',
            year_established: parseInt(formData.year_established) || null,
            email: formData.email || '',
            phone: formData.phone || '',
            website: formData.website || '',
            
            // Contact Information
            primary_contact_name: formData.primary_contact_name || '',
            primary_contact_title: formData.primary_contact_title || '',
            primary_contact_email: formData.primary_contact_email || '',
            primary_contact_phone: formData.primary_contact_phone || '',
            
            // Address Information
            address: formData.address || '',
            city: formData.city || '',
            state_province: formData.state_province || '',
            postal_code: formData.postal_code || '',
            country: formData.country || null,
            
            // Banking Information - ensure these are properly formatted
            bank_name: formData.bank_name || null,
            bank_branch: formData.bank_branch || null,
            account_name: formData.account_name || null,
            account_number: formData.account_number || null,
            swift_code: formData.swift_code || null,
          };
          
          console.log('🔍 Section A data being prepared:', sectionAData);
          
          // Validate required fields before sending
          if (!sectionAData.name || !sectionAData.legal_name || !sectionAData.email) {
            console.error('❌ Missing required fields:', {
              name: sectionAData.name,
              legal_name: sectionAData.legal_name,
              email: sectionAData.email
            });
            return false;
          }
          
          return await saveOrganizationData(sectionAData, 'section-a');
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
          endpoint = '/onboarding/section-c';
          const documents = Object.entries(documentResponses).map(([code, response]) => ({
            requirementCode: code,
            available: response.available || 'yes',
            naExplanation: response.naExplanation || '',
            note: response.note || '',
            files: response.files || []
          }));
          const envelopeC = {
            data: { 
              documents,
              status: submissionStatus
            },
            meta: {
              etag: organization?.version || 0,
              timestamp: new Date().toISOString(),
            }
          };
          data = envelopeC;
          console.log('Saving Section C data (SSoT envelope):', envelopeC);
          break;
        default:
          return false;
      }

      // For other sections, use the existing approach for now
      console.log(`Attempting to save ${stepId} to ${endpoint}:`, data);
      
      // Build headers with concurrency controls for Section C saves
      const commonHeaders: Record<string, string> = { 'Content-Type': 'application/json' };
      if (stepId === 'section-c' && organization?.version !== undefined) {
        commonHeaders['If-Match'] = String(organization.version);
        commonHeaders['Idempotency-Key'] = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      }

      const response = await fetchWithAuth(endpoint, {
        method: 'POST',
        headers: commonHeaders,
        body: JSON.stringify(data),
      });

      console.log(`Successfully saved ${stepId}:`, response);

      // Optimistically update local organization version/status from SSoT envelope
      // to ensure next OCC If-Match uses the latest version without waiting for refresh
      try {
        const envelope: any = response;
        const newVersion = envelope?.meta?.etag ?? envelope?.data?.version;
        const newStatus = envelope?.data?.status ?? envelope?.status;
        if (stepId === 'section-c') {
          if (newVersion !== undefined) updateOrganization({ version: Number(newVersion) });
          if (newStatus) updateOrganization({ status: newStatus });
        }
      } catch (e) {
        console.warn('Could not optimistically update organization from save response:', e);
      }

      // Persist a local backup of Section C files after successful save
      if (stepId === 'section-c') {
        try {
          localStorage.setItem('sectionC_documentResponses', JSON.stringify(documentResponses));
          console.log('💾 Section C document responses backed up locally after save');
        } catch (localError) {
          console.warn('Failed to persist local backup for Section C:', localError);
        }
      }

      if (!completedSteps.includes(stepId)) {
        setCompletedSteps(prev => {
          const next = Array.from(new Set([...prev, stepId]));
          try { localStorage.setItem('completedSteps', JSON.stringify(next)); } catch {}
          return next;
        });
      } else {
        try { localStorage.setItem('completedSteps', JSON.stringify(completedSteps)); } catch {}
      }

      // Refresh session to get updated data
      await refreshSession();
      console.log(`🔄 Session refreshed after saving ${stepId}`);
      
      console.log(`✅ ${stepId} data saved successfully`);
      return true;
    } catch (error) {
      console.error(`❌ Error saving ${stepId} data:`, error);
      
      // Log detailed error information
      if (error instanceof Error) {
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
      }
      
      // For Section C, handle API issues gracefully
      if (stepId === 'section-c') {
        const errorMessage = (error as Error).message?.toLowerCase() || '';
        if (errorMessage.includes('route not found') || 
            errorMessage.includes('404') || 
            errorMessage.includes('not implemented')) {
          console.log('⚠️ Section C endpoint not fully implemented - saving locally for now');
          
          // Save to localStorage as backup
          try {
            localStorage.setItem('sectionC_documentResponses', JSON.stringify(documentResponses));
            console.log('✅ Section C data saved to localStorage as backup');
          } catch (localError) {
            console.error('Failed to save to localStorage:', localError);
          }
          
          if (!completedSteps.includes(stepId)) {
            setCompletedSteps(prev => {
              const next = Array.from(new Set([...prev, stepId]));
              try { localStorage.setItem('completedSteps', JSON.stringify(next)); } catch {}
              return next;
            });
          } else {
            // ensure persistence even if already in state
            try { localStorage.setItem('completedSteps', JSON.stringify(completedSteps)); } catch {}
          }
          return true;
        }
      }
      
      // Show error feedback
      console.error(`❌ Failed to save ${stepId} data. Please try again.`);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNext = async () => {

    // Determine next step
    const nextStep = currentStep === 'section-a' ? 'section-b' :
                    currentStep === 'section-b' ? 'section-c' :
                    currentStep === 'section-c' ? 'review' : currentStep;

    // For Section C, try save first, but still proceed to Review even if it fails
    if (currentStep === 'section-c') {
      const ok = await saveFormData('section-c');
      if (!ok) {
        console.warn('⚠️ Could not save Section C before navigating to Review; proceeding with in-memory data');
        // Mark step as completed locally so gating allows Review
        setCompletedSteps(prev => {
          const next = Array.from(new Set([...prev, 'section-c']));
          try { localStorage.setItem('completedSteps', JSON.stringify(next)); } catch {}
          return next;
        });
        toast.warn('Section C could not be saved to the server. Proceeding to Review with current data.');
      }
    }

    if (nextStep !== currentStep) {
      // Update URL after any required saves
      navigate(`/partner/onboarding/${nextStep}`, { replace: true });
      setCurrentStep(nextStep);

      // Save previous step in background for other transitions
      const previousStep = currentStep !== 'section-c' ? currentStep : null;
      if (previousStep) {
        saveFormData(previousStep).then(success => {
          if (success) {
            console.log(`✅ Successfully saved ${previousStep} data`);
          } else {
            console.error(`❌ Failed to save ${previousStep} data`);
          }
        }).catch(error => {
          console.error(`❌ Error saving ${previousStep} data:`, error);
        });
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
    const combined = Array.from(new Set([...completedFromStatus, ...completedSteps]));
    const predecessorStep = getStepPredecessor(stepId);
    const isAccessible = stepId === 'section-a' || (predecessorStep && combined.includes(predecessorStep));
    if (isAccessible) {
      setCurrentStep(stepId);
      navigate(`/partner/onboarding/${stepId}`);
    } else {
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

    console.log(`📁 Starting file upload for ${code}:`, file.name);

    try {
      setUploadProgress(prev => ({ ...prev, [code]: 0 }));

      // Try to get presigned URL from API
      let fileKey = `documents/${code}/${Date.now()}-${file.name}`;
      
      try {
        console.log('🔗 Requesting presigned URL...');
        const presignData = await fetchWithAuth('/onboarding/section-c/presign', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileName: file.name,
            fileType: file.type,
            fileSize: file.size
          })
        });
        console.log('✅ Presigned URL received:', presignData);
        fileKey = presignData.fileKey || fileKey;
        
        // TODO: Implement actual file upload to S3/storage here
        // For now, we'll simulate the upload
        
      } catch (apiError) {
        console.warn('⚠️ Presign API not available, using mock upload:', apiError);
        // Continue with mock upload
      }

      // Animate file upload progress with smoother increments
      const uploadInterval = setInterval(() => {
        setUploadProgress(prev => {
          const current = prev[code] || 0;
          if (current >= 95) {
            clearInterval(uploadInterval);
            return prev;
          }
          // Smoother progress increments
          const increment = current < 50 ? 8 : current < 80 ? 5 : 2;
          return { ...prev, [code]: Math.min(current + increment, 95) };
        });
      }, 150);

      // Complete upload with final animation
      setTimeout(async () => {
        clearInterval(uploadInterval);
        setUploadProgress(prev => ({ ...prev, [code]: 100 }));

        // Generate a realistic file hash (in production, this would come from the server)
        const generateFileHash = async (file: File): Promise<string> => {
          try {
            const buffer = await file.arrayBuffer();
            const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
          } catch (error) {
            // Fallback to timestamp-based hash if crypto is not available
            return `file-${Date.now()}-${Math.random().toString(36).substring(2)}`;
          }
        };

        // Add file to response with proper state update
        const newFile: FileUpload = {
          key: fileKey,
          originalName: file.name,
          mime: file.type,
          size: file.size,
          sha256: await generateFileHash(file),
          uploadedAt: new Date().toISOString(),
          version: 1
        };

        console.log(`✅ File upload completed for ${code}:`, newFile);

        // Update document responses properly
        setDocumentResponses(prev => {
          const updated = {
            ...prev,
            [code]: {
              ...prev[code],
              files: [...(prev[code]?.files || []), newFile]
            }
          };
          console.log('📋 Updated document responses:', updated);
          return updated;
        });
        
        // Clear progress with fade out animation
        setTimeout(() => {
          setUploadProgress(prev => {
            const newProgress = { ...prev };
            delete newProgress[code];
            return newProgress;
          });
        }, 1500);
      }, 1500);

    } catch (error) {
      console.error('❌ File upload failed:', error);
      setUploadProgress(prev => {
        const newProgress = { ...prev };
        delete newProgress[code];
        return newProgress;
      });
    }
  };

  const removeFile = (code: string, fileIndex: number) => {
    setDocumentResponses(prev => ({
      ...prev,
      [code]: {
        ...prev[code],
        files: (prev[code]?.files || []).filter((_, index) => index !== fileIndex)
      }
    }));
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
    console.log('🎯 handleSaveDraft called, currentStep:', currentStep);
    if (isFinalized) {
      toast.info('Onboarding is complete. This application is read-only.');
      return;
    }
    setIsSaving(true);
    try {
      const success = await saveFormData(currentStep);
      if (success) {
        console.log('✅ Draft saved successfully');
      } else {
        console.error('❌ Failed to save draft');
      }
    } catch (error) {
      console.error('❌ Error saving draft:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmit = async () => {
    if (isFinalized) {
      toast.info('Onboarding is complete. This application is read-only.');
      return;
    }
    try {
      setIsSubmitting(true);
      
      // Save all sections first, then submit Section C via SSoT
      await saveFormData('section-a');
      await saveFormData('section-b');
      const submittedOk = await saveFormData('section-c', 'submitted');
      if (!submittedOk) {
        console.error('❌ Section C submission failed');
        return;
      }

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
                disabled={isFinalized}
              />
              <FormField
                label="Legal Name"
                name="legal_name"
                value={formData.legal_name}
                onChange={(value) => handleFieldChange('legal_name', value)}
                error={errors.legal_name}
                required
                placeholder="Enter legal name"
                disabled={isFinalized}
              />
              <FormField
                label="Registration Number"
                name="registration_number"
                value={formData.registration_number}
                onChange={(value) => handleFieldChange('registration_number', value)}
                error={errors.registration_number}
                required
                placeholder="Enter registration number"
                disabled={isFinalized}
              />
              <FormField
                label="Tax ID"
                name="tax_id"
                value={formData.tax_id}
                onChange={(value) => handleFieldChange('tax_id', value)}
                error={errors.tax_id}
                placeholder="Enter tax ID"
                disabled={isFinalized}
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
                disabled={isFinalized}
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
                disabled={isFinalized}
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
                disabled={isFinalized}
              />
              <FormField
                label="Phone Number"
                name="phone"
                value={formData.phone}
                onChange={(value) => handleFieldChange('phone', value)}
                error={errors.phone}
                required
                placeholder="Enter phone number"
                disabled={isFinalized}
              />
              <FormField
                label="Website"
                name="website"
                value={formData.website}
                onChange={(value) => handleFieldChange('website', value)}
                error={errors.website}
                placeholder="Enter website URL"
                disabled={isFinalized}
              />
              <FormField
                label="Primary Contact Name"
                name="primary_contact_name"
                value={formData.primary_contact_name}
                onChange={(value) => handleFieldChange('primary_contact_name', value)}
                error={errors.primary_contact_name}
                required
                placeholder="Enter primary contact name"
                disabled={isFinalized}
              />
              <FormField
                label="Primary Contact Title"
                name="primary_contact_title"
                value={formData.primary_contact_title}
                onChange={(value) => handleFieldChange('primary_contact_title', value)}
                error={errors.primary_contact_title}
                required
                placeholder="Enter primary contact title"
                disabled={isFinalized}
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
                disabled={isFinalized}
              />
              <FormField
                label="Primary Contact Phone"
                name="primary_contact_phone"
                value={formData.primary_contact_phone}
                onChange={(value) => handleFieldChange('primary_contact_phone', value)}
                error={errors.primary_contact_phone}
                required
                placeholder="Enter primary contact phone"
                disabled={isFinalized}
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
                    disabled={isFinalized}
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
                  options={AFRICAN_COUNTRIES.map((country) => ({ value: country, label: country }))}
                  disabled={isFinalized}
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
                    options={getAvailableCities().map((city) => ({ value: city, label: city }))}
                    disabled={isFinalized}
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
                    options={getAvailableStates().map((state) => ({ value: state, label: state }))}
                    disabled={isFinalized}
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
                  disabled={isFinalized}
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
                disabled={isFinalized}
              />
              <FormField
                label="Bank Branch"
                name="bank_branch"
                value={formData.bank_branch}
                onChange={(value) => handleFieldChange('bank_branch', value)}
                error={errors.bank_branch}
                placeholder="Enter bank branch"
                disabled={isFinalized}
              />
              <FormField
                label="Account Name"
                name="account_name"
                value={formData.account_name}
                onChange={(value) => handleFieldChange('account_name', value)}
                error={errors.account_name}
                required
                placeholder="Enter account name"
                disabled={isFinalized}
              />
              <FormField
                label="Account Number"
                name="account_number"
                value={formData.account_number}
                onChange={(value) => handleFieldChange('account_number', value)}
                error={errors.account_number}
                required
                placeholder="Enter account number"
                disabled={isFinalized}
              />
              <FormField
                label="SWIFT Code"
                name="swift_code"
                value={formData.swift_code}
                onChange={(value) => handleFieldChange('swift_code', value)}
                error={errors.swift_code}
                placeholder="Enter SWIFT code (if applicable)"
                disabled={isFinalized}
              />
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'section-b',
      title: 'Section B - Financial Assessment',
      icon: '',
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
                  disabled={isFinalized}
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
                  disabled={isFinalized}
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
                  disabled={isFinalized}
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
                  disabled={isFinalized}
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
                  disabled={isFinalized}
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
                  disabled={isFinalized}
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
                  disabled={isFinalized}
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
                  disabled={isFinalized}
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
                  disabled={isFinalized}
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
                  disabled={isFinalized}
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
                    <div className="flex items-center space-x-3 mb-6">
                      <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                      </div>
                      <h4 className="text-xl font-semibold text-gray-900">
                        {getCategoryTitle(category)}
                      </h4>
                    </div>
                    
                    <div className="space-y-6">
                      {requirements.map(req => {
                        const response = documentResponses[req.code];
                        const progress = uploadProgress[req.code];
                        
                        return (
                          <div key={req.code} className="bg-white rounded-lg border p-6">
                            <div className="grid grid-cols-12 gap-4 items-start">
                              {/* Document Title */}
                              <div className="col-span-5">
                                <div className="flex items-start space-x-3">
                                  <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                  </div>
                                  <div className="flex-1">
                                    <p className="text-sm font-medium text-gray-800 leading-tight mb-1">{req.title}</p>
                                    {!req.isOptional && (
                                      <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-red-50 text-red-700 rounded-full border border-red-200">
                                        <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                        </svg>
                                        Required
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Available Dropdown */}
                              <div className="col-span-1">
                                <select
                                  className={`w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm py-2.5 ${isFinalized ? 'bg-gray-100 cursor-not-allowed opacity-60' : ''}`}
                                  value={response?.available || 'yes'}
                                  onChange={(e) => handleDocumentResponseChange(req.code, 'available', e.target.value)}
                                  disabled={isFinalized}
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
                                      disabled={isFinalized}
                                    />
                                    <label
                                      htmlFor={`file-${req.code}`}
                                      className={`inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${isFinalized ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer hover:bg-gray-50'}`}
                                      aria-disabled={isFinalized}
                                    >
                                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                      </svg>
                                      Upload File
                                    </label>
                                    
                                    {progress !== undefined && (
                                      <div className="mt-3 space-y-2">
                                        <div className="bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden">
                                          <div 
                                            className="bg-gradient-to-r from-blue-500 to-indigo-600 h-2.5 rounded-full transition-all duration-500 ease-out shadow-sm"
                                            style={{ width: `${progress}%` }}
                                          ></div>
                                        </div>
                                        <div className="flex items-center justify-between text-xs">
                                          <span className="text-blue-600 font-medium animate-pulse">Uploading...</span>
                                          <span className="text-gray-600 font-semibold">{progress}%</span>
                                        </div>
                                      </div>
                                    )}

                                    {/* File List */}
                                    {(() => {
                                      console.log(`🔍 Checking files for ${req.code}:`, response?.files);
                                      return response?.files && response.files.length > 0 ? (
                                        <div className="mt-3 space-y-2">
                                          <p className="text-xs text-gray-500 mb-2">📎 Uploaded files ({response.files.length}):</p>
                                          {response.files.map((file, index) => (
                                            <div key={index} className="flex items-center justify-between bg-gray-50 rounded p-2">
                                              <span className="text-sm text-gray-700 truncate">{file.originalName}</span>
                                              {!isFinalized && (
                                                <button
                                                  onClick={() => removeFile(req.code, index)}
                                                  className="text-red-600 hover:text-red-800"
                                                >
                                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                  </svg>
                                                </button>
                                              )}
                                            </div>
                                          ))}
                                        </div>
                                      ) : (
                                        <div className="mt-3">
                                          <p className="text-xs text-gray-400">📁 No files uploaded yet</p>
                                        </div>
                                      );
                                    })()}
                                  </div>
                                ) : (
                                  <textarea
                                  className={`w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 ${isFinalized ? 'bg-gray-100 cursor-not-allowed opacity-60' : ''}`}
                                  rows={3}
                                  placeholder="Explain why this document is not available..."
                                  value={response?.naExplanation || ''}
                                  onChange={(e) => handleDocumentResponseChange(req.code, 'naExplanation', e.target.value)}
                                  disabled={isFinalized}
                                />  
                                )}
                              </div>

                              {/* Notes */}
                              <div className="col-span-3">
                                <textarea
                                  className={`w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm resize-none ${isFinalized ? 'bg-gray-100 cursor-not-allowed opacity-60' : ''}`}
                                  placeholder="Notes (optional)"
                                  rows={2}
                                  value={response?.note || ''}
                                  onChange={(e) => handleDocumentResponseChange(req.code, 'note', e.target.value)}
                                  disabled={isFinalized}
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
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Legal Structure:</span>
                  <span className="text-sm font-semibold text-slate-900 dark:text-white">{formData.legal_structure || 'Not provided'}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Year Established:</span>
                  <span className="text-sm font-semibold text-slate-900 dark:text-white">{formData.year_established || 'Not provided'}</span>
                </div>
              </div>
            </div>

            {/* Contact Information Card */}
            <div className="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-2xl p-6 border border-purple-200 dark:border-purple-800">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-6 h-6 bg-purple-500 rounded-lg flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2z" />
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
                <div className="flex justify-between items-center py-2 border-b border-purple-200/50 dark:border-purple-700/50">
                  <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Website:</span>
                  <span className="text-sm font-semibold text-slate-900 dark:text-white">{formData.website || 'Not provided'}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-purple-200/50 dark:border-purple-700/50">
                  <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Primary Contact Name:</span>
                  <span className="text-sm font-semibold text-slate-900 dark:text-white">{formData.primary_contact_name || 'Not provided'}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-purple-200/50 dark:border-purple-700/50">
                  <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Primary Contact Title:</span>
                  <span className="text-sm font-semibold text-slate-900 dark:text-white">{formData.primary_contact_title || 'Not provided'}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-purple-200/50 dark:border-purple-700/50">
                  <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Primary Contact Email:</span>
                  <span className="text-sm font-semibold text-slate-900 dark:text-white">{formData.primary_contact_email || 'Not provided'}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Primary Contact Phone:</span>
                  <span className="text-sm font-semibold text-slate-900 dark:text-white">{formData.primary_contact_phone || 'Not provided'}</span>
                </div>
              </div>
            </div>

            {/* Address Information Card */}
            <div className="bg-gradient-to-br from-teal-50 to-emerald-50 dark:from-teal-900/20 dark:to-emerald-900/20 rounded-2xl p-6 border border-teal-200 dark:border-teal-800">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-6 h-6 bg-teal-500 rounded-lg flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 12.414a4 4 0 10-5.657 5.657l4.243 4.243a8 8 0 1011.314-11.314l-4.243 4.243z" />
                  </svg>
                </div>
                <h4 className="text-lg font-bold text-slate-900 dark:text-white">Address Information</h4>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-teal-200/50 dark:border-teal-700/50">
                  <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Address:</span>
                  <span className="text-sm font-semibold text-slate-900 dark:text-white">{formData.address || 'Not provided'}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-teal-200/50 dark:border-teal-700/50">
                  <span className="text-sm font-medium text-slate-600 dark:text-slate-400">City:</span>
                  <span className="text-sm font-semibold text-slate-900 dark:text-white">{formData.city || 'Not provided'}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-teal-200/50 dark:border-teal-700/50">
                  <span className="text-sm font-medium text-slate-600 dark:text-slate-400">State/Province:</span>
                  <span className="text-sm font-semibold text-slate-900 dark:text-white">{formData.state_province || 'Not provided'}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-teal-200/50 dark:border-teal-700/50">
                  <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Postal Code:</span>
                  <span className="text-sm font-semibold text-slate-900 dark:text-white">{formData.postal_code || 'Not provided'}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Country:</span>
                  <span className="text-sm font-semibold text-slate-900 dark:text-white">{formData.country || 'Not provided'}</span>
                </div>
              </div>
            </div>

            {/* Banking Information Card */}
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-2xl p-6 border border-amber-200 dark:border-amber-800">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-6 h-6 bg-amber-500 rounded-lg flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h4 className="text-lg font-bold text-slate-900 dark:text-white">Banking Information</h4>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-amber-200/50 dark:border-amber-700/50">
                  <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Bank Name:</span>
                  <span className="text-sm font-semibold text-slate-900 dark:text-white">{formData.bank_name || 'Not provided'}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-amber-200/50 dark:border-amber-700/50">
                  <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Bank Branch:</span>
                  <span className="text-sm font-semibold text-slate-900 dark:text-white">{formData.bank_branch || 'Not provided'}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-amber-200/50 dark:border-amber-700/50">
                  <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Account Name:</span>
                  <span className="text-sm font-semibold text-slate-900 dark:text-white">{formData.account_name || 'Not provided'}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-amber-200/50 dark:border-amber-700/50">
                  <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Account Number:</span>
                  <span className="text-sm font-semibold text-slate-900 dark:text-white">{formData.account_number || 'Not provided'}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm font-medium text-slate-600 dark:text-slate-400">SWIFT Code:</span>
                  <span className="text-sm font-semibold text-slate-900 dark:text-white">{formData.swift_code || 'Not provided'}</span>
                </div>
              </div>
            </div>

            {/* Financial Assessment Summary Card */}
            <div className="bg-gradient-to-br from-rose-50 to-pink-50 dark:from-rose-900/20 dark:to-pink-900/20 rounded-2xl p-6 border border-rose-200 dark:border-rose-800">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-6 h-6 bg-rose-500 rounded-lg flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h4 className="text-lg font-bold text-slate-900 dark:text-white">Financial Assessment</h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex justify-between items-center py-2 border-b border-rose-200/50 dark:border-rose-700/50">
                  <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Current Budget (USD / Year):</span>
                  <span className="text-sm font-semibold text-slate-900 dark:text-white">{formData.current_annual_budget_amount || '—'} / {formData.current_annual_budget_year || '—'}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-rose-200/50 dark:border-rose-700/50">
                  <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Next Year Estimate (USD / Year):</span>
                  <span className="text-sm font-semibold text-slate-900 dark:text-white">{formData.next_year_budget_amount || '—'} / {formData.next_year_budget_year || '—'}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-rose-200/50 dark:border-rose-700/50">
                  <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Largest Grant (USD / Year):</span>
                  <span className="text-sm font-semibold text-slate-900 dark:text-white">{formData.largest_grant_amount || '—'} / {formData.largest_grant_year || '—'}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Current Donor Funding (USD / Year):</span>
                  <span className="text-sm font-semibold text-slate-900 dark:text-white">{formData.current_donor_funding_amount || '—'} / {formData.current_donor_funding_year || '—'}</span>
                </div>
                <div className="flex justify-between items-center py-2 md:col-span-2">
                  <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Other Funds (USD / Year):</span>
                  <span className="text-sm font-semibold text-slate-900 dark:text-white">{formData.other_funds_amount || '—'} / {formData.other_funds_year || '—'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Compliance Documents Summary */}
          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-2xl p-6 border border-indigo-200 dark:border-indigo-800">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-6 h-6 bg-indigo-500 rounded-lg flex items-center justify-center">
                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h4 className="text-lg font-bold text-slate-900 dark:text-white">Compliance Documents Summary</h4>
            </div>

            {documentCategories.length === 0 ? (
              <p className="text-sm text-slate-600 dark:text-slate-400">No compliance data available yet. Complete previous sections to see document summary.</p>
            ) : (
              <div className="space-y-6">
                {/* Overall counts */}
                {(() => {
                  const allReqs = documentCategories.flatMap(cat => (documentRequirements[cat] || []));
                  const requiredCount = allReqs.filter(r => !r.isOptional).length;
                  const naCount = allReqs.filter(r => documentResponses[r.code]?.available === 'na').length;
                  const uploadedCount = allReqs.filter(r => (documentResponses[r.code]?.available !== 'na') && (documentResponses[r.code]?.files?.length || 0) > 0).length;
                  const missingCount = Math.max(requiredCount - (uploadedCount + naCount), 0);
                  return (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-indigo-200/60 dark:border-indigo-800/60">
                        <p className="text-xs text-slate-500">Required</p>
                        <p className="text-xl font-bold text-slate-900 dark:text-white">{requiredCount}</p>
                      </div>
                      <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-indigo-200/60 dark:border-indigo-800/60">
                        <p className="text-xs text-slate-500">Uploaded</p>
                        <p className="text-xl font-bold text-slate-900 dark:text-white">{uploadedCount}</p>
                      </div>
                      <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-indigo-200/60 dark:border-indigo-800/60">
                        <p className="text-xs text-slate-500">Marked N/A</p>
                        <p className="text-xl font-bold text-slate-900 dark:text-white">{naCount}</p>
                      </div>
                      <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-indigo-200/60 dark:border-indigo-800/60">
                        <p className="text-xs text-slate-500">Missing</p>
                        <p className="text-xl font-bold text-slate-900 dark:text-white">{missingCount}</p>
                      </div>
                    </div>
                  );
                })()}

                {/* Per-category breakdown */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {documentCategories.map((category) => {
                    const reqs = documentRequirements[category] || [];
                    const reqRequired = reqs.filter(r => !r.isOptional);
                    const reqNa = reqs.filter(r => documentResponses[r.code]?.available === 'na');
                    const reqUploaded = reqs.filter(r => (documentResponses[r.code]?.available !== 'na') && (documentResponses[r.code]?.files?.length || 0) > 0);
                    const reqMissing = Math.max(reqRequired.length - (reqNa.length + reqUploaded.length), 0);
                    return (
                      <div key={category} className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-indigo-200/60 dark:border-indigo-800/60">
                        <div className="flex items-center justify-between mb-2">
                          <h5 className="text-sm font-semibold text-slate-900 dark:text-white">{getCategoryTitle(category)}</h5>
                          <span className="text-xs text-slate-500">{reqs.length} items</span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-slate-600 dark:text-slate-300">
                          <span className="inline-flex items-center px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">Uploaded: {reqUploaded.length}</span>
                          <span className="inline-flex items-center px-2 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">N/A: {reqNa.length}</span>
                          <span className="inline-flex items-center px-2 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200">Missing: {reqMissing}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
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
                {!isFinalized && (
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
                )}
              </div>
            </div>
          </div>
        </div>
      ),
    },
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
              {isFinalized && (
                <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-emerald-800">
                  Onboarding is complete. This application is read-only.
                </div>
              )}
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
              readOnly={isFinalized}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingMain;
