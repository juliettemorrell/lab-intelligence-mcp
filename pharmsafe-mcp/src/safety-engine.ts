import {
  PatientContext, SafetyReport, InteractionResult, DuplicateTherapyResult,
  DeprescribingCandidate, AllergyCheckResult, CLINICAL_DISCLAIMER
} from './types.js';
import { findInteractions, findDuplicateTherapies, getDrugClasses } from './drug-database.js';
import { checkPharmacogenomics } from './pharmacogenomics.js';
import { checkRenalDosing, checkHepaticDosing } from './renal-hepatic.js';

const ALLERGY_CROSS_REACTIVITY: Record<string, string[]> = {
  'penicillin': ['amoxicillin', 'ampicillin', 'piperacillin', 'nafcillin', 'oxacillin', 'dicloxacillin'],
  'amoxicillin': ['penicillin', 'ampicillin', 'piperacillin'],
  'cephalosporin': ['cefazolin', 'cephalexin', 'ceftriaxone', 'cefepime', 'cefdinir', 'cefuroxime'],
  'sulfa': ['sulfamethoxazole', 'trimethoprim-sulfamethoxazole', 'sulfasalazine', 'dapsone', 'sulfadiazine'],
  'nsaid': ['ibuprofen', 'naproxen', 'diclofenac', 'meloxicam', 'ketorolac', 'indomethacin', 'celecoxib', 'aspirin'],
  'aspirin': ['ibuprofen', 'naproxen', 'diclofenac', 'ketorolac', 'indomethacin'],
  'codeine': ['morphine', 'hydromorphone', 'oxymorphone'],
  'morphine': ['codeine', 'hydromorphone', 'oxymorphone'],
  'ace inhibitor': ['lisinopril', 'enalapril', 'ramipril', 'benazepril', 'captopril'],
  'statin': ['atorvastatin', 'rosuvastatin', 'simvastatin', 'pravastatin', 'lovastatin'],
  'fluoroquinolone': ['ciprofloxacin', 'levofloxacin', 'moxifloxacin'],
  'tetracycline': ['doxycycline', 'minocycline', 'tetracycline'],
  'macrolide': ['azithromycin', 'clarithromycin', 'erythromycin']
};

const DEPRESCRIBING_CANDIDATES: Record<string, { reason: string; strategy: string; taperSchedule: string; monitoringPlan: string; evidenceLevel: string }> = {
  'omeprazole': {
    reason: 'Long-term PPI use >8 weeks without clear indication increases risk of C. diff, fractures, hypomagnesemia, B12 deficiency',
    strategy: 'Step-down to H2 blocker or taper PPI dose over 2-4 weeks. Assess if original indication still present.',
    taperSchedule: 'Week 1-2: reduce to half dose daily. Week 3-4: every other day. Then discontinue. PRN antacid for rebound.',
    monitoringPlan: 'Monitor for rebound GERD symptoms. Reassess after 4 weeks off therapy.',
    evidenceLevel: 'Canadian Deprescribing Network — evidence-based guideline'
  },
  'pantoprazole': {
    reason: 'Same as omeprazole — long-term PPI risks',
    strategy: 'Step-down taper. Reassess indication.',
    taperSchedule: 'Reduce to 20mg x 2 weeks, then 20mg every other day x 2 weeks, then stop.',
    monitoringPlan: 'GERD symptom assessment at 2 and 4 weeks post-discontinuation.',
    evidenceLevel: 'Canadian Deprescribing Network'
  },
  'alprazolam': {
    reason: 'Benzodiazepines in elderly: falls, cognitive impairment, dependence, paradoxical agitation. Beers Criteria inappropriate.',
    strategy: 'Gradual taper over 4-12 weeks (never abrupt cessation). Switch to longer-acting BZD first if on short-acting. Consider CBT-I for insomnia.',
    taperSchedule: 'Convert to equivalent diazepam dose. Reduce by 10-25% every 1-2 weeks. Slower taper if on >6 months.',
    monitoringPlan: 'Weekly anxiety/insomnia assessment. Watch for withdrawal (seizure risk if rapid taper). CIWA-B scoring.',
    evidenceLevel: 'Beers Criteria 2023, deprescribing.org'
  },
  'lorazepam': {
    reason: 'Same as alprazolam — benzodiazepine deprescribing indicated especially in elderly (>65)',
    strategy: 'Gradual 10-25% dose reduction every 1-2 weeks. CBT referral for underlying anxiety/insomnia.',
    taperSchedule: 'Reduce by 0.25mg every 1-2 weeks. Final reduction slowest (0.25mg → 0mg may take 2-4 weeks).',
    monitoringPlan: 'Weekly check-ins. GAD-7 for anxiety. PHQ-9 for depression emergence.',
    evidenceLevel: 'Beers Criteria 2023'
  },
  'oxybutynin': {
    reason: 'High anticholinergic burden — cognitive decline, confusion, dry mouth, constipation, falls. Especially harmful in elderly/dementia.',
    strategy: 'Switch to mirabegron (beta-3 agonist, no anticholinergic load) or behavioral interventions (bladder training, pelvic floor exercises).',
    taperSchedule: 'Can often discontinue directly. If on extended-release, step down to IR then stop.',
    monitoringPlan: 'Bladder diary. Assess cognitive function (MoCA) before and 3 months after.',
    evidenceLevel: 'Beers Criteria 2023, STOPP/START'
  },
  'glyburide': {
    reason: 'Sulfonylurea with highest hypoglycemia risk, especially in elderly/renal impairment. Beers Criteria avoid in >65.',
    strategy: 'Switch to shorter-acting sulfonylurea (glipizide) or discontinue if A1c allows. Metformin preferred if tolerated.',
    taperSchedule: 'Can switch directly to glipizide (equivalent dose). Or reduce by 50% and reassess A1c in 3 months.',
    monitoringPlan: 'Frequent glucose monitoring during transition (BID). A1c at 3 months. Hypoglycemia education.',
    evidenceLevel: 'Beers Criteria 2023, ADA Standards of Care'
  },
  'zolpidem': {
    reason: 'Sedative-hypnotic in elderly: falls, next-day impairment, complex sleep behaviors, dependence. Beers Criteria avoid.',
    strategy: 'Gradual dose reduction. Implement sleep hygiene + CBT-I (first-line for chronic insomnia). Melatonin 0.5-2mg may bridge.',
    taperSchedule: 'Reduce by 25% every 1-2 weeks. 10mg → 7.5mg → 5mg → 2.5mg → 0. Slower if used >3 months.',
    monitoringPlan: 'Sleep diary. ISI (Insomnia Severity Index). Watch for rebound insomnia (common first 1-2 nights).',
    evidenceLevel: 'Beers Criteria 2023, AASM guidelines'
  }
};

export function checkAllergies(
  medications: string[],
  allergies: { substance: string; reaction?: string; severity?: string }[]
): AllergyCheckResult[] {
  if (!allergies || allergies.length === 0) return [];

  const results: AllergyCheckResult[] = [];
  const normalizedMeds = medications.map(m => m.toLowerCase().trim());

  for (const allergy of allergies) {
    const allergen = allergy.substance.toLowerCase().trim();

    for (const med of normalizedMeds) {
      if (med.includes(allergen) || allergen.includes(med)) {
        results.push({
          drug: med,
          allergen: allergy.substance,
          crossReactivity: false,
          severity: allergy.severity || 'unknown',
          recommendation: `DIRECT ALLERGY MATCH: Patient has documented ${allergy.severity || ''} allergy to ${allergy.substance}. ${allergy.reaction ? `Previous reaction: ${allergy.reaction}.` : ''} DO NOT administer.`
        });
        continue;
      }

      for (const [classKey, members] of Object.entries(ALLERGY_CROSS_REACTIVITY)) {
        const allergenInClass = classKey === allergen || members.some(m => m === allergen || allergen.includes(m));
        const medInClass = members.some(m => med.includes(m) || m.includes(med));

        if (allergenInClass && medInClass) {
          results.push({
            drug: med,
            allergen: allergy.substance,
            crossReactivity: true,
            severity: allergy.severity || 'unknown',
            recommendation: `CROSS-REACTIVITY: Patient allergic to ${allergy.substance} (${classKey} class). ${med} may cross-react. Assess risk-benefit. Consider allergy testing or alternative.`
          });
        }
      }
    }
  }

  return results;
}

export function findDeprescribingCandidates(
  medications: string[],
  patientAge?: number
): DeprescribingCandidate[] {
  const normalizedMeds = medications.map(m => m.toLowerCase().trim());
  const results: DeprescribingCandidate[] = [];

  for (const med of normalizedMeds) {
    for (const [drug, info] of Object.entries(DEPRESCRIBING_CANDIDATES)) {
      if (med.includes(drug) || drug.includes(med)) {
        if (patientAge && patientAge < 65 && (drug === 'alprazolam' || drug === 'lorazepam' || drug === 'zolpidem' || drug === 'oxybutynin' || drug === 'glyburide')) {
          continue;
        }
        results.push({
          drug,
          ...info
        });
      }
    }
  }

  return results;
}

export function calculateRiskScore(report: Partial<SafetyReport>): SafetyReport['riskScore'] {
  let interactionRisk = 0;
  let polypharmacyRisk = 0;
  let pgxRisk = 0;
  let organRisk = 0;

  if (report.interactions) {
    for (const i of report.interactions) {
      if (i.severity === 'contraindicated') interactionRisk += 4;
      else if (i.severity === 'major') interactionRisk += 3;
      else if (i.severity === 'moderate') interactionRisk += 1.5;
      else if (i.severity === 'minor') interactionRisk += 0.5;
    }
  }

  if (report.patientSummary) {
    const medCount = report.patientSummary.medicationCount;
    if (medCount >= 10) polypharmacyRisk = 4;
    else if (medCount >= 7) polypharmacyRisk = 3;
    else if (medCount >= 5) polypharmacyRisk = 2;
    else polypharmacyRisk = 0.5;
  }

  if (report.duplicates && report.duplicates.length > 0) {
    polypharmacyRisk += report.duplicates.length * 1.5;
  }

  if (report.pgxAlerts) {
    for (const a of report.pgxAlerts) {
      if (a.dosingGuidance.toLowerCase().includes('contraindicated')) pgxRisk += 4;
      else if (a.metabolizerStatus === 'poor' || a.metabolizerStatus === 'ultra-rapid') pgxRisk += 3;
      else pgxRisk += 1.5;
    }
  }

  if (report.renalAlerts) {
    for (const r of report.renalAlerts) {
      if (r.adjustedDose.toUpperCase().includes('DISCONTINUE') || r.adjustedDose.toUpperCase().includes('CONTRAINDICATED')) organRisk += 4;
      else organRisk += 2;
    }
  }

  if (report.hepaticAlerts) {
    for (const h of report.hepaticAlerts) {
      if (h.adjustedDose.toUpperCase().includes('AVOID') || h.adjustedDose.toUpperCase().includes('CONTRAINDICATED')) organRisk += 4;
      else organRisk += 2;
    }
  }

  const maxScore = Math.max(interactionRisk, polypharmacyRisk, pgxRisk, organRisk);
  let overall: 'low' | 'moderate' | 'high' | 'critical';
  if (maxScore >= 4) overall = 'critical';
  else if (maxScore >= 3) overall = 'high';
  else if (maxScore >= 1.5) overall = 'moderate';
  else overall = 'low';

  return {
    overall,
    interactionRisk: Math.min(Math.round(interactionRisk * 10) / 10, 10),
    polypharmacyRisk: Math.min(Math.round(polypharmacyRisk * 10) / 10, 10),
    pgxRisk: Math.min(Math.round(pgxRisk * 10) / 10, 10),
    organImpairmentRisk: Math.min(Math.round(organRisk * 10) / 10, 10)
  };
}

export function generateSafetyReport(patient: PatientContext): SafetyReport {
  const medNames = patient.medications.map(m => m.genericName || m.name);

  const interactions = findInteractions(medNames).map(i => ({
    pair: [i.drug1, i.drug2] as [string, string],
    severity: i.severity,
    mechanism: i.mechanism,
    clinicalEffect: i.clinicalEffect,
    recommendation: i.recommendation,
    evidenceLevel: i.evidenceLevel
  }));

  const duplicatesRaw = findDuplicateTherapies(medNames);
  const duplicates: DuplicateTherapyResult[] = duplicatesRaw.map(d => ({
    drugs: d.drugs,
    therapeuticClass: d.therapeuticClass.name,
    risk: d.therapeuticClass.duplicateRisk,
    recommendation: `Review necessity of multiple ${d.therapeuticClass.name}. Consider consolidating to single agent.`
  }));

  const pgxAlerts = patient.genotypes
    ? checkPharmacogenomics(medNames, patient.genotypes)
    : [];

  const renalAlerts = patient.renalFunction
    ? checkRenalDosing(medNames, patient.renalFunction)
    : [];

  const hepaticAlerts = patient.hepaticFunction
    ? checkHepaticDosing(medNames, patient.hepaticFunction)
    : [];

  const allergyAlerts = patient.allergies
    ? checkAllergies(medNames, patient.allergies)
    : [];

  const deprescribingCandidates = findDeprescribingCandidates(medNames, patient.age);

  const partialReport = {
    patientSummary: {
      medicationCount: patient.medications.length,
      isPolypharmacy: patient.medications.length >= 5,
      hasRenalImpairment: !!patient.renalFunction && (patient.renalFunction.gfr !== undefined && patient.renalFunction.gfr < 60),
      hasHepaticImpairment: !!patient.hepaticFunction && !!patient.hepaticFunction.childPughClass,
      hasGenotyping: !!patient.genotypes && patient.genotypes.length > 0
    },
    interactions,
    pgxAlerts,
    duplicates,
    renalAlerts,
    hepaticAlerts,
    allergyAlerts,
    deprescribingCandidates
  };

  const riskScore = calculateRiskScore(partialReport);

  return {
    timestamp: new Date().toISOString(),
    ...partialReport,
    riskScore,
    disclaimer: CLINICAL_DISCLAIMER
  };
}
