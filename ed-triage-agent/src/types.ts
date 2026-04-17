export interface VitalSigns {
  heartRate?: number;
  systolicBP?: number;
  diastolicBP?: number;
  respiratoryRate?: number;
  temperature?: number;       // Fahrenheit
  temperatureC?: number;      // Celsius
  spO2?: number;              // percentage
  painScale?: number;         // 0-10
  glasgowComaScale?: number;  // 3-15
  weight?: number;            // kg
  glucose?: number;           // mg/dL
}

export type ESILevel = 1 | 2 | 3 | 4 | 5;

export interface ChiefComplaint {
  text: string;
  category: ChiefComplaintCategory;
  onsetMinutes?: number;
  severity?: 'mild' | 'moderate' | 'severe';
}

export type ChiefComplaintCategory =
  | 'chest_pain'
  | 'shortness_of_breath'
  | 'abdominal_pain'
  | 'altered_mental_status'
  | 'trauma'
  | 'headache'
  | 'stroke_symptoms'
  | 'fever_infection'
  | 'overdose_ingestion'
  | 'cardiac_arrest'
  | 'allergic_reaction'
  | 'seizure'
  | 'gi_bleed'
  | 'back_pain'
  | 'laceration_wound'
  | 'musculoskeletal'
  | 'urinary'
  | 'psychiatric'
  | 'eye_complaint'
  | 'ent'
  | 'skin_rash'
  | 'ob_gyn'
  | 'pediatric_fever'
  | 'syncope'
  | 'other';

export interface PatientDemographics {
  age: number;
  sex: 'male' | 'female' | 'other';
  weightKg?: number;
  pregnant?: boolean;
  pediatric?: boolean; // auto-set if age < 18
}

export interface PatientHistory {
  conditions: string[];
  medications: string[];
  allergies: string[];
  surgicalHistory: string[];
  socialHistory?: {
    smoking?: boolean;
    alcohol?: boolean;
    drugs?: boolean;
    ivDrugUse?: boolean;
  };
  immunocompromised?: boolean;
  anticoagulated?: boolean;
  diabetic?: boolean;
  recentSurgery?: boolean;   // within 4 weeks
  recentImmobilization?: boolean;
  cancerHistory?: boolean;
  previousDVTPE?: boolean;
}

export interface TriageInput {
  chiefComplaint: string;
  vitals: VitalSigns;
  demographics: PatientDemographics;
  history?: PatientHistory;
  symptoms?: string[];
  arrivalMode?: 'walk_in' | 'ambulance' | 'helicopter' | 'transfer';
  traumaMechanism?: string;
  lastMealTime?: string;
  lastMenstrualPeriod?: string;
}

export interface TriageResult {
  esiLevel: ESILevel;
  esiRationale: string[];
  chiefComplaint: ChiefComplaint;
  redFlags: RedFlag[];
  differential: DifferentialDiagnosis[];
  recommendedOrders: OrderSet;
  bedAssignment: BedAssignment;
  protocolActivations: ProtocolActivation[];
  resourceNeeds: ResourceAllocation;
  consultRecommendations: ConsultRecommendation[];
  reassessmentInterval: number; // minutes
  estimatedResources: number;   // for ESI resource prediction
  timestamp: string;
}

export interface RedFlag {
  condition: string;
  severity: 'critical' | 'urgent' | 'warning';
  indicators: string[];
  timeWindow?: string;
  action: string;
}

export interface DifferentialDiagnosis {
  diagnosis: string;
  icd10?: string;
  probability: 'high' | 'moderate' | 'low';
  confirmatoryTests: string[];
  mustNotMiss: boolean;
  timeToTreat?: string;
}

export type OrderCategory = 'lab' | 'imaging' | 'medication' | 'procedure' | 'monitoring' | 'nursing';
export type OrderPriority = 'stat' | 'urgent' | 'routine';

export interface ClinicalOrder {
  name: string;
  category: OrderCategory;
  priority: OrderPriority;
  rationale: string;
  loincCode?: string;
  cptCode?: string;
  details?: string;
}

export interface OrderSet {
  orders: ClinicalOrder[];
  ivAccess: boolean;
  ivAccessType?: 'peripheral' | 'central' | 'io';
  ivAccessCount?: number;
  fluidOrder?: string;
  dietStatus: 'npo' | 'clear_liquids' | 'regular' | 'diabetic';
  activityLevel: 'bedrest' | 'bedrest_with_bsc' | 'up_ad_lib' | 'fall_precautions';
  telemetry: boolean;
  continuousSpO2: boolean;
}

export type BedType =
  | 'resuscitation'
  | 'trauma_bay'
  | 'critical_care'
  | 'monitored'
  | 'general'
  | 'fast_track'
  | 'behavioral_health'
  | 'isolation'
  | 'observation'
  | 'pediatric'
  | 'ob_gyn';

export interface BedAssignment {
  bedType: BedType;
  rationale: string;
  isolationPrecautions?: IsolationPrecaution[];
  specialRequirements?: string[];
}

export type IsolationPrecaution = 'airborne' | 'droplet' | 'contact' | 'protective' | 'neutropenic';

export interface ProtocolActivation {
  protocol: string;
  criteria: string[];
  immediateActions: string[];
  teamNotifications: string[];
  timeTargets: { action: string; minutesFromActivation: number }[];
}

export interface ResourceAllocation {
  equipment: EquipmentNeed[];
  staffing: StaffingNeed[];
  supplies: SupplyNeed[];
}

export interface EquipmentNeed {
  item: string;
  priority: 'immediate' | 'standby' | 'available';
  location?: string;
}

export interface StaffingNeed {
  role: string;
  urgency: 'immediate' | 'within_15min' | 'within_30min' | 'routine';
  reason: string;
}

export interface SupplyNeed {
  item: string;
  quantity: number;
  priority: 'immediate' | 'standby';
}

export interface ConsultRecommendation {
  specialty: string;
  urgency: 'emergent' | 'urgent' | 'routine';
  reason: string;
  findings: string[];
}

export type ClinicalScoreType =
  | 'heart'
  | 'qsofa'
  | 'curb65'
  | 'wells_pe'
  | 'wells_dvt'
  | 'gcs'
  | 'nihss'
  | 'ottawa_ankle'
  | 'ottawa_knee'
  | 'canadian_cspine'
  | 'pecarn'
  | 'apgar'
  | 'sofa'
  | 'apache2'
  | 'timi'
  | 'chadsvasc'
  | 'hasbled'
  | 'abcd2';

export interface ClinicalScoreResult {
  scoreType: ClinicalScoreType;
  score: number;
  maxScore: number;
  interpretation: string;
  riskLevel: 'low' | 'moderate' | 'high' | 'critical';
  recommendation: string;
  components: { name: string; value: number; maxValue: number; description: string }[];
}

export interface FHIRConfig {
  serverUrl: string;
  accessToken?: string;
  patientId?: string;
}

export interface FHIRPatientSummary {
  id: string;
  name: string;
  birthDate: string;
  age: number;
  sex: string;
  vitals: VitalSigns;
  conditions: string[];
  medications: string[];
  allergies: string[];
  recentLabs: { name: string; value: string; date: string; abnormal: boolean }[];
  encounters: { type: string; date: string; reason: string }[];
}

export interface EDMetrics {
  doorTime: string;
  triageTime?: string;
  bedAssignmentTime?: string;
  firstProviderTime?: string;
  ordersPlacedTime?: string;
  resultsAvailableTime?: string;
  dispositionTime?: string;
  departureTime?: string;
  doorToDoc?: number;       // minutes
  doorToDisposition?: number;
  leftWithoutSeen: boolean;
}
