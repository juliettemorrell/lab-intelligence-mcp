// ─── Vital Signs ───────────────────────────────────────────────────────────

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
  etCO2?: number;             // mmHg (end-tidal CO2)
}

export type ESILevel = 1 | 2 | 3 | 4 | 5;

// ─── Chief Complaint ──────────────────────────────────────────────────────

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
  | 'trauma_blunt'
  | 'trauma_penetrating'
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

// ─── Patient Data ─────────────────────────────────────────────────────────

export interface PatientDemographics {
  age: number;
  sex: 'male' | 'female' | 'other';
  weightKg?: number;
  pregnant?: boolean;
  pediatric?: boolean;
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
  recentSurgery?: boolean;
  recentImmobilization?: boolean;
  cancerHistory?: boolean;
  previousDVTPE?: boolean;
  hypertension?: boolean;
  hyperlipidemia?: boolean;
  obesity?: boolean;
  familyHistoryCAD?: boolean;
  knownCAD?: boolean;
  heartFailure?: boolean;
  atrialFibrillation?: boolean;
  priorStrokeTIA?: boolean;
  vascularDisease?: boolean;
  liverDisease?: boolean;
  renalDisease?: boolean;
  priorMajorBleed?: boolean;
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
  ecgFindings?: string;
  troponinValue?: number;
  troponinUpperLimit?: number;
  lactateValue?: number;
}

// ─── Approval Workflow ────────────────────────────────────────────────────

export type ApprovalStatus =
  | 'pending'
  | 'approved'
  | 'modified'
  | 'rejected'
  | 'auto_acknowledged';

export interface Approvable {
  id: string;
  status: ApprovalStatus;
  recommendedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  modificationNotes?: string;
}

export interface ApprovalGate {
  gateId: string;
  gateName: string;
  description: string;
  items: ApprovableItem[];
  urgency: 'immediate' | 'urgent' | 'routine';
  expiresInMinutes?: number;
}

export interface ApprovableItem extends Approvable {
  category: 'order' | 'bed' | 'protocol' | 'consult' | 'resource' | 'medication';
  summary: string;
  details: Record<string, unknown>;
  clinicalRationale: string;
  alternativeOptions?: string[];
  requiresPhysicianApproval: boolean;
}

// ─── Triage Result ────────────────────────────────────────────────────────

export interface TriageResult {
  patientId?: string;
  encounterId?: string;
  esiLevel: ESILevel;
  esiRationale: string[];
  chiefComplaint: ChiefComplaint;
  redFlags: RedFlag[];
  differential: DifferentialDiagnosis[];
  recommendedOrders: OrderSet;
  bedRecommendation: BedRecommendation;
  protocolActivations: ProtocolActivation[];
  resourceNeeds: ResourceAllocation;
  consultRecommendations: ConsultRecommendation[];
  reassessmentInterval: number;
  estimatedResources: number;
  approvalGates: ApprovalGate[];
  clinicalDisclaimer: string;
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

// ─── Orders ───────────────────────────────────────────────────────────────

export type OrderCategory = 'lab' | 'imaging' | 'medication' | 'procedure' | 'monitoring' | 'nursing' | 'iv_access' | 'diet' | 'activity';
export type OrderPriority = 'stat' | 'urgent' | 'routine';

export interface ClinicalOrder extends Approvable {
  name: string;
  category: OrderCategory;
  priority: OrderPriority;
  rationale: string;
  loincCode?: string;
  cptCode?: string;
  snomedCode?: string;
  rxNormCode?: string;
  details?: string;
  dose?: string;
  route?: string;
  frequency?: string;
  duration?: string;
  fhirServiceRequest?: FHIRServiceRequestTemplate;
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

// ─── Bed Management ───────────────────────────────────────────────────────

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

export type IsolationPrecaution = 'airborne' | 'droplet' | 'contact' | 'protective' | 'neutropenic';

export interface BedRecommendation extends Approvable {
  bedType: BedType;
  rationale: string;
  isolationPrecautions: IsolationPrecaution[];
  specialRequirements: string[];
  alternativeBedTypes: BedType[];
  fhirLocationRequest?: FHIRLocationTemplate;
  adtMessage?: ADTMessageTemplate;
}

// ─── Protocols ────────────────────────────────────────────────────────────

export interface ProtocolActivation extends Approvable {
  protocol: string;
  protocolCode?: string;
  criteria: string[];
  immediateActions: string[];
  teamNotifications: string[];
  timeTargets: { action: string; minutesFromActivation: number }[];
  requiresPhysicianAcknowledgment: boolean;
}

// ─── Resources ────────────────────────────────────────────────────────────

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

export interface ConsultRecommendation extends Approvable {
  specialty: string;
  urgency: 'emergent' | 'urgent' | 'routine';
  reason: string;
  findings: string[];
  fhirServiceRequest?: FHIRServiceRequestTemplate;
}

// ─── Clinical Scores ──────────────────────────────────────────────────────

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
  | 'timi'
  | 'chadsvasc'
  | 'hasbled'
  | 'abcd2';

export interface ClinicalScoreInput {
  scoreType: ClinicalScoreType;
  vitals?: VitalSigns;
  demographics?: PatientDemographics;
  history?: PatientHistory;
  // Score-specific inputs
  heartHistory?: 'slightly_suspicious' | 'moderately_suspicious' | 'highly_suspicious';
  ecgFindings?: 'normal' | 'nonspecific_changes' | 'significant_st_deviation';
  troponinRatio?: number; // value / upper limit of normal
  confusionPresent?: boolean;
  bunValue?: number;
  clinicalDVTSigns?: boolean;
  peMostLikely?: boolean;
  hemoptysis?: boolean;
  eyeOpening?: 1 | 2 | 3 | 4;
  verbalResponse?: 1 | 2 | 3 | 4 | 5;
  motorResponse?: 1 | 2 | 3 | 4 | 5 | 6;
  nihssComponents?: Record<string, number>;
  ankleExam?: { bonyTendernessMalleolar?: boolean; bonyTendernessMetatarsal?: boolean; bonyTendernessNavicular?: boolean; canBearWeight?: boolean };
  kneeExam?: { patellarTenderness?: boolean; fibularHeadTenderness?: boolean; canFlex90?: boolean; canBearWeight?: boolean };
  cspineExam?: { dangerousMechanism?: boolean; paresthesias?: boolean; simpleRearEnd?: boolean; sittingInED?: boolean; ambulatory?: boolean; delayedPainOnset?: boolean; midlineTenderness?: boolean; canRotateNeck45?: boolean };
  pecarnExam?: { alteredMentalStatus?: boolean; scalpHematoma?: boolean; scalpHematomaLocation?: 'frontal' | 'non_frontal'; lossOfConsciousness?: boolean; locDurationSeconds?: number; severeMechanism?: boolean; palpableSkullFracture?: boolean; vomiting?: boolean; severeHeadache?: boolean; basilarSkullFractureSigns?: boolean; actingNormally?: boolean };
  apgarComponents?: { appearance?: 0 | 1 | 2; pulse?: 0 | 1 | 2; grimace?: 0 | 1 | 2; activity?: 0 | 1 | 2; respiration?: 0 | 1 | 2 };
  anginalEpisodes24h?: number;
  aspirinUse7d?: boolean;
  tiaWeakness?: boolean;
  tiaSpeechOnly?: boolean;
  tiaDurationMinutes?: number;
  labilINR?: boolean;
  alcoholExcess?: boolean;
  antiplateletOrNSAID?: boolean;
}

export interface ClinicalScoreResult {
  scoreType: ClinicalScoreType;
  score: number;
  maxScore: number;
  interpretation: string;
  riskLevel: 'low' | 'moderate' | 'high' | 'critical';
  recommendation: string;
  components: { name: string; value: number; maxValue: number; description: string }[];
  actionRequired: boolean;
  imagingRequired?: boolean;
}

// ─── FHIR Interoperability ────────────────────────────────────────────────

export interface FHIRConfig {
  serverUrl: string;
  accessToken?: string;
  patientId?: string;
  encounterId?: string;
}

export interface FHIRPatientSummary {
  id: string;
  name: string;
  birthDate: string;
  age: number;
  sex: string;
  mrn?: string;
  vitals: VitalSigns;
  conditions: { display: string; code: string; system: string; onset?: string }[];
  medications: { display: string; code?: string; dosage?: string; status: string }[];
  allergies: { substance: string; criticality: string; reactions: string[] }[];
  recentLabs: { name: string; value: number | string; unit: string; date: string; loincCode: string; abnormal: boolean }[];
  encounters: { id: string; type: string; date: string; reason: string; status: string }[];
}

export interface FHIRServiceRequestTemplate {
  resourceType: 'ServiceRequest';
  status: 'draft';
  intent: 'order';
  priority: 'stat' | 'urgent' | 'asap' | 'routine';
  category: { system: string; code: string; display: string }[];
  code: { system: string; code: string; display: string }[];
  reasonCode?: { system: string; code: string; display: string; text: string }[];
  note?: string;
}

export interface FHIRLocationTemplate {
  resourceType: 'Location';
  status: 'active';
  name: string;
  type: { system: string; code: string; display: string }[];
  physicalType: { system: string; code: string; display: string };
}

// ─── HL7 ADT Interoperability (Bed Management Systems) ────────────────────

export interface ADTMessageTemplate {
  messageType: 'ADT^A01' | 'ADT^A02' | 'ADT^A03' | 'ADT^A08';
  description: string;
  patientClass: 'E';  // Emergency
  assignedLocation: {
    pointOfCare: string;    // Unit (e.g., "ED")
    room: string;
    bed: string;
    facility: string;
    locationType: string;
  };
  admitReason?: string;
  isolationPrecautions?: IsolationPrecaution[];
}

// ─── ED Metrics ───────────────────────────────────────────────────────────

export interface EDMetrics {
  doorTime: string;
  triageTime?: string;
  triageCompleteTime?: string;
  bedAssignmentTime?: string;
  bedAssignmentApprovedTime?: string;
  firstProviderTime?: string;
  ordersRecommendedTime?: string;
  ordersApprovedTime?: string;
  ordersPlacedTime?: string;
  resultsAvailableTime?: string;
  dispositionTime?: string;
  departureTime?: string;
  doorToDoc?: number;
  doorToTriageComplete?: number;
  doorToOrdersPlaced?: number;
  doorToDisposition?: number;
  leftWithoutSeen: boolean;
  triageToOrdersMinutes?: number;
}

// ─── Utility ──────────────────────────────────────────────────────────────

export const CLINICAL_DISCLAIMER =
  'This is clinical decision support only. All recommendations require review and approval by a licensed clinician before execution. ' +
  'This system does not autonomously place orders, assign beds, or activate protocols. ' +
  'All actions are recommendations pending human authorization. ' +
  'Clinical judgment must always supersede algorithmic output.';

let nextId = 0;
export function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${++nextId}`;
}

export function celsiusToFahrenheit(c: number): number {
  return c * 9 / 5 + 32;
}

export function fahrenheitToCelsius(f: number): number {
  return (f - 32) * 5 / 9;
}

export function normalizeTemperature(vitals: VitalSigns): { f: number; c: number } | null {
  if (vitals.temperature != null) {
    return { f: vitals.temperature, c: fahrenheitToCelsius(vitals.temperature) };
  }
  if (vitals.temperatureC != null) {
    return { f: celsiusToFahrenheit(vitals.temperatureC), c: vitals.temperatureC };
  }
  return null;
}
