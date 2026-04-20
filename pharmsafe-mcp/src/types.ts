export type SeverityLevel = 'contraindicated' | 'major' | 'moderate' | 'minor' | 'info';

export type InteractionMechanism =
  | 'pharmacokinetic-cyp-inhibition'
  | 'pharmacokinetic-cyp-induction'
  | 'pharmacodynamic-additive'
  | 'pharmacodynamic-antagonistic'
  | 'pharmacodynamic-synergistic'
  | 'absorption-alteration'
  | 'renal-competition'
  | 'protein-binding-displacement'
  | 'qt-prolongation-additive'
  | 'serotonergic-additive'
  | 'bleeding-risk-additive'
  | 'cns-depression-additive'
  | 'nephrotoxicity-additive'
  | 'hepatotoxicity-additive'
  | 'electrolyte-depletion'
  | 'other';

export interface DrugInteraction {
  drug1: string;
  drug2: string;
  severity: SeverityLevel;
  mechanism: InteractionMechanism;
  clinicalEffect: string;
  recommendation: string;
  evidenceLevel: 'established' | 'probable' | 'suspected' | 'possible';
  references: string[];
}

export type MetabolizerStatus = 'ultra-rapid' | 'rapid' | 'normal' | 'intermediate' | 'poor';

export interface CypEnzyme {
  gene: string;
  enzyme: string;
  commonVariants: string[];
}

export interface PgxDrugEntry {
  drug: string;
  gene: string;
  enzyme: string;
  metabolizerImpact: Record<MetabolizerStatus, {
    effect: string;
    recommendation: string;
    dosingGuidance: string;
  } | null>;
  evidenceLevel: 'PharmGKB-1A' | 'PharmGKB-1B' | 'PharmGKB-2A' | 'PharmGKB-2B' | 'PharmGKB-3';
  cpicGuideline: boolean;
}

export interface PatientGenotype {
  gene: string;
  diplotype?: string;
  metabolizerStatus: MetabolizerStatus;
}

export interface MedicationEntry {
  name: string;
  genericName?: string;
  dose?: string;
  frequency?: string;
  route?: string;
  indication?: string;
  prescriber?: string;
  startDate?: string;
  rxcui?: string;
  ndc?: string;
}

export interface AllergyEntry {
  substance: string;
  reaction?: string;
  severity?: 'mild' | 'moderate' | 'severe' | 'life-threatening';
  type?: 'allergy' | 'intolerance' | 'adverse-reaction';
}

export interface RenalFunction {
  creatinine?: number;
  bun?: number;
  gfr?: number;
  gfrStage?: 'G1' | 'G2' | 'G3a' | 'G3b' | 'G4' | 'G5';
}

export interface HepaticFunction {
  alt?: number;
  ast?: number;
  totalBilirubin?: number;
  albumin?: number;
  inr?: number;
  childPughScore?: number;
  childPughClass?: 'A' | 'B' | 'C';
}

export interface PatientContext {
  age?: number;
  sex?: 'male' | 'female';
  weight?: number;
  medications: MedicationEntry[];
  allergies?: AllergyEntry[];
  genotypes?: PatientGenotype[];
  renalFunction?: RenalFunction;
  hepaticFunction?: HepaticFunction;
  conditions?: string[];
}

export interface InteractionResult {
  pair: [string, string];
  severity: SeverityLevel;
  mechanism: InteractionMechanism;
  clinicalEffect: string;
  recommendation: string;
  evidenceLevel: string;
}

export interface PgxResult {
  drug: string;
  gene: string;
  metabolizerStatus: MetabolizerStatus;
  effect: string;
  recommendation: string;
  dosingGuidance: string;
  evidenceLevel: string;
}

export interface DuplicateTherapyResult {
  drugs: string[];
  therapeuticClass: string;
  risk: string;
  recommendation: string;
}

export interface RenalDosingResult {
  drug: string;
  gfr: number;
  gfrStage: string;
  standardDose: string;
  adjustedDose: string;
  recommendation: string;
  monitoringRequired: string[];
}

export interface HepaticDosingResult {
  drug: string;
  childPughClass: string;
  standardDose: string;
  adjustedDose: string;
  recommendation: string;
}

export interface DeprescribingCandidate {
  drug: string;
  reason: string;
  strategy: string;
  taperSchedule?: string;
  monitoringPlan: string;
  evidenceLevel: string;
}

export interface AllergyCheckResult {
  drug: string;
  allergen: string;
  crossReactivity: boolean;
  severity: string;
  recommendation: string;
}

export interface SafetyReport {
  timestamp: string;
  patientSummary: {
    medicationCount: number;
    isPolypharmacy: boolean;
    hasRenalImpairment: boolean;
    hasHepaticImpairment: boolean;
    hasGenotyping: boolean;
  };
  interactions: InteractionResult[];
  pgxAlerts: PgxResult[];
  duplicates: DuplicateTherapyResult[];
  renalAlerts: RenalDosingResult[];
  hepaticAlerts: HepaticDosingResult[];
  allergyAlerts: AllergyCheckResult[];
  deprescribingCandidates: DeprescribingCandidate[];
  riskScore: {
    overall: 'low' | 'moderate' | 'high' | 'critical';
    interactionRisk: number;
    polypharmacyRisk: number;
    pgxRisk: number;
    organImpairmentRisk: number;
  };
  disclaimer: string;
}

export interface FHIRConfig {
  serverUrl: string;
  accessToken: string;
  patientId: string;
}

export const CLINICAL_DISCLAIMER =
  'This medication safety analysis is clinical decision support only. ' +
  'All recommendations require clinician review and approval before any medication changes. ' +
  'Drug interaction data may not be exhaustive. Always consult current prescribing information ' +
  'and clinical pharmacology resources for complete safety data.';
