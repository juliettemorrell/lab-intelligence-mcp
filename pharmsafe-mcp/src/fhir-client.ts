import { MedicationEntry, AllergyEntry, PatientGenotype, RenalFunction, HepaticFunction, FHIRConfig } from './types.js';

interface FHIRMedicationRequest {
  resourceType: 'MedicationRequest';
  status: string;
  medicationCodeableConcept?: { coding?: { system?: string; code?: string; display?: string }[]; text?: string };
  medicationReference?: { display?: string };
  dosageInstruction?: { text?: string; timing?: { code?: { text?: string } }; route?: { text?: string } }[];
  reasonCode?: { text?: string; coding?: { display?: string }[] }[];
  authoredOn?: string;
  requester?: { display?: string };
}

interface FHIRAllergyIntolerance {
  resourceType: 'AllergyIntolerance';
  code?: { coding?: { display?: string }[]; text?: string };
  reaction?: { manifestation?: { text?: string; coding?: { display?: string }[] }[]; severity?: string }[];
  type?: string;
  criticality?: string;
}

interface FHIRObservation {
  resourceType: 'Observation';
  code: { coding?: { system?: string; code?: string; display?: string }[]; text?: string };
  valueQuantity?: { value: number; unit?: string };
  effectiveDateTime?: string;
  status: string;
}

interface FHIRPatient {
  resourceType: 'Patient';
  gender?: string;
  birthDate?: string;
  extension?: { url: string; valueCodeableConcept?: { coding?: { code?: string }[] } }[];
}

const LOINC_GFR = ['33914-3', '48642-3', '48643-1', '62238-1', '77147-7'];
const LOINC_CREATININE = ['2160-0', '38483-4'];
const LOINC_ALT = ['1742-6', '1743-4'];
const LOINC_AST = ['1920-8', '30239-8'];
const LOINC_BILIRUBIN = ['1975-2'];
const LOINC_ALBUMIN = ['1751-7'];
const LOINC_INR = ['6301-6', '34714-6'];

export async function fetchPatientData(config: FHIRConfig): Promise<{
  medications: MedicationEntry[];
  allergies: AllergyEntry[];
  renalFunction: RenalFunction;
  hepaticFunction: HepaticFunction;
  age?: number;
  sex?: 'male' | 'female';
}> {
  const headers = {
    'Authorization': `Bearer ${config.accessToken}`,
    'Accept': 'application/fhir+json'
  };

  const [medsRes, allergyRes, labsRes, patientRes] = await Promise.all([
    fetchFHIR(`${config.serverUrl}/MedicationRequest?patient=${config.patientId}&status=active`, headers),
    fetchFHIR(`${config.serverUrl}/AllergyIntolerance?patient=${config.patientId}`, headers),
    fetchFHIR(`${config.serverUrl}/Observation?patient=${config.patientId}&category=laboratory&_sort=-date&_count=50`, headers),
    fetchFHIR(`${config.serverUrl}/Patient/${config.patientId}`, headers)
  ]);

  const medications = parseMedications(medsRes);
  const allergies = parseAllergies(allergyRes);
  const { renalFunction, hepaticFunction } = parseLabs(labsRes);
  const { age, sex } = parsePatient(patientRes);

  return { medications, allergies, renalFunction, hepaticFunction, age, sex };
}

async function fetchFHIR(url: string, headers: Record<string, string>): Promise<any> {
  const response = await fetch(url, { headers });
  if (!response.ok) {
    throw new Error(`FHIR request failed: ${response.status} ${response.statusText}`);
  }
  return response.json();
}

function parseMedications(bundle: any): MedicationEntry[] {
  if (!bundle?.entry) return [];

  return bundle.entry
    .map((e: any) => e.resource as FHIRMedicationRequest)
    .filter((r: FHIRMedicationRequest) => r.resourceType === 'MedicationRequest' && r.status === 'active')
    .map((r: FHIRMedicationRequest): MedicationEntry => {
      const name = r.medicationCodeableConcept?.text
        || r.medicationCodeableConcept?.coding?.[0]?.display
        || r.medicationReference?.display
        || 'Unknown medication';

      const dosage = r.dosageInstruction?.[0];

      return {
        name,
        genericName: r.medicationCodeableConcept?.coding?.[0]?.display,
        dose: dosage?.text,
        frequency: dosage?.timing?.code?.text,
        route: dosage?.route?.text,
        indication: r.reasonCode?.[0]?.text || r.reasonCode?.[0]?.coding?.[0]?.display,
        prescriber: r.requester?.display,
        startDate: r.authoredOn,
        rxcui: r.medicationCodeableConcept?.coding?.find(c => c.system?.includes('rxnorm'))?.code
      };
    });
}

function parseAllergies(bundle: any): AllergyEntry[] {
  if (!bundle?.entry) return [];

  return bundle.entry
    .map((e: any) => e.resource as FHIRAllergyIntolerance)
    .filter((r: FHIRAllergyIntolerance) => r.resourceType === 'AllergyIntolerance')
    .map((r: FHIRAllergyIntolerance): AllergyEntry => {
      const substance = r.code?.text || r.code?.coding?.[0]?.display || 'Unknown';
      const reaction = r.reaction?.[0]?.manifestation?.[0]?.text
        || r.reaction?.[0]?.manifestation?.[0]?.coding?.[0]?.display;
      const fhirSeverity = r.reaction?.[0]?.severity || r.criticality;

      let severity: 'mild' | 'moderate' | 'severe' | 'life-threatening' | undefined;
      if (fhirSeverity === 'severe' || fhirSeverity === 'high') severity = 'severe';
      else if (fhirSeverity === 'moderate') severity = 'moderate';
      else if (fhirSeverity === 'mild' || fhirSeverity === 'low') severity = 'mild';

      let type: 'allergy' | 'intolerance' | 'adverse-reaction' | undefined;
      if (r.type === 'allergy') type = 'allergy';
      else if (r.type === 'intolerance') type = 'intolerance';

      return { substance, reaction, severity, type };
    });
}

function parseLabs(bundle: any): { renalFunction: RenalFunction; hepaticFunction: HepaticFunction } {
  const renal: RenalFunction = {};
  const hepatic: HepaticFunction = {};

  if (!bundle?.entry) return { renalFunction: renal, hepaticFunction: hepatic };

  const observations = bundle.entry
    .map((e: any) => e.resource as FHIRObservation)
    .filter((r: FHIRObservation) => r.resourceType === 'Observation' && r.status === 'final');

  for (const obs of observations) {
    const codes: string[] = obs.code.coding?.map((c: { code?: string }) => c.code).filter((c: string | undefined): c is string => !!c) || [];
    const value = obs.valueQuantity?.value;
    if (value === undefined) continue;

    if (codes.some((c: string) => LOINC_GFR.includes(c))) renal.gfr = renal.gfr ?? value;
    if (codes.some((c: string) => LOINC_CREATININE.includes(c))) renal.creatinine = renal.creatinine ?? value;
    if (codes.some((c: string) => LOINC_ALT.includes(c))) hepatic.alt = hepatic.alt ?? value;
    if (codes.some((c: string) => LOINC_AST.includes(c))) hepatic.ast = hepatic.ast ?? value;
    if (codes.some((c: string) => LOINC_BILIRUBIN.includes(c))) hepatic.totalBilirubin = hepatic.totalBilirubin ?? value;
    if (codes.some((c: string) => LOINC_ALBUMIN.includes(c))) hepatic.albumin = hepatic.albumin ?? value;
    if (codes.some((c: string) => LOINC_INR.includes(c))) hepatic.inr = hepatic.inr ?? value;
  }

  return { renalFunction: renal, hepaticFunction: hepatic };
}

function parsePatient(resource: any): { age?: number; sex?: 'male' | 'female' } {
  if (!resource || resource.resourceType !== 'Patient') return {};

  let age: number | undefined;
  if (resource.birthDate) {
    const birth = new Date(resource.birthDate);
    const now = new Date();
    age = Math.floor((now.getTime() - birth.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
  }

  let sex: 'male' | 'female' | undefined;
  if (resource.gender === 'male' || resource.gender === 'female') {
    sex = resource.gender;
  }

  return { age, sex };
}
