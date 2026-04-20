import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import {
  PatientContext, MedicationEntry, AllergyEntry, PatientGenotype,
  RenalFunction, HepaticFunction, CLINICAL_DISCLAIMER
} from './types.js';
import { findInteractions, findDuplicateTherapies } from './drug-database.js';
import { checkPharmacogenomics, getAffectedDrugs } from './pharmacogenomics.js';
import { checkRenalDosing, checkHepaticDosing } from './renal-hepatic.js';
import { checkAllergies, findDeprescribingCandidates, generateSafetyReport } from './safety-engine.js';
import { checkBeersCriteria } from './beers-criteria.js';
import { checkHighAlertMedications, calculateAnticholinergicBurden } from './high-alert.js';
import { fetchPatientData } from './fhir-client.js';
import { checkTimingConflicts, checkFoodInteractions, getAdministrationGuidance, generateTimingSchedule } from './administration.js';
import { formatSafetyReport } from './report-formatter.js';
import { normalizeMedName, normalizeMedList } from './normalizer.js';

const MedicationSchema = z.object({
  name: z.string(),
  genericName: z.string().optional(),
  dose: z.string().optional(),
  frequency: z.string().optional(),
  route: z.string().optional(),
  indication: z.string().optional(),
  startDate: z.string().optional()
});

const AllergySchema = z.object({
  substance: z.string(),
  reaction: z.string().optional(),
  severity: z.enum(['mild', 'moderate', 'severe', 'life-threatening']).optional(),
  type: z.enum(['allergy', 'intolerance', 'adverse-reaction']).optional()
});

const GenotypeSchema = z.object({
  gene: z.string(),
  diplotype: z.string().optional(),
  metabolizerStatus: z.enum(['ultra-rapid', 'rapid', 'normal', 'intermediate', 'poor'])
});

const RenalSchema = z.object({
  creatinine: z.number().optional(),
  bun: z.number().optional(),
  gfr: z.number().optional(),
  gfrStage: z.enum(['G1', 'G2', 'G3a', 'G3b', 'G4', 'G5']).optional()
});

const HepaticSchema = z.object({
  alt: z.number().optional(),
  ast: z.number().optional(),
  totalBilirubin: z.number().optional(),
  albumin: z.number().optional(),
  inr: z.number().optional(),
  childPughScore: z.number().optional(),
  childPughClass: z.enum(['A', 'B', 'C']).optional()
});

export function registerTools(server: McpServer): void {

  server.tool(
    'check_interactions',
    'Check drug-drug interactions for a medication list. Returns severity-ranked interactions with clinical effects and recommendations.',
    { medications: z.array(z.string()).describe('List of medication names (generic preferred)') },
    async ({ medications }) => {
      const interactions = findInteractions(medications);
      const sorted = interactions.sort((a, b) => {
        const order = { contraindicated: 0, major: 1, moderate: 2, minor: 3, info: 4 };
        return order[a.severity] - order[b.severity];
      });

      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({
            medicationCount: medications.length,
            interactionsFound: sorted.length,
            interactions: sorted.map(i => ({
              drugs: [i.drug1, i.drug2],
              severity: i.severity,
              mechanism: i.mechanism,
              clinicalEffect: i.clinicalEffect,
              recommendation: i.recommendation,
              evidence: i.evidenceLevel
            })),
            disclaimer: CLINICAL_DISCLAIMER
          }, null, 2)
        }]
      };
    }
  );

  server.tool(
    'check_pharmacogenomics',
    'Cross-reference medications with patient pharmacogenomic data. Identifies drugs requiring dose adjustment or avoidance based on metabolizer status.',
    {
      medications: z.array(z.string()).describe('List of medication names'),
      genotypes: z.array(GenotypeSchema).describe('Patient genotype data with metabolizer status')
    },
    async ({ medications, genotypes }) => {
      const alerts = checkPharmacogenomics(medications, genotypes as PatientGenotype[]);

      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({
            medicationsChecked: medications.length,
            genotypesProvided: genotypes.length,
            alertsFound: alerts.length,
            alerts: alerts.map(a => ({
              drug: a.drug,
              gene: a.gene,
            metabolizerStatus: a.metabolizerStatus,
              effect: a.effect,
              recommendation: a.recommendation,
              dosingGuidance: a.dosingGuidance,
              evidenceLevel: a.evidenceLevel
            })),
            disclaimer: CLINICAL_DISCLAIMER
          }, null, 2)
        }]
      };
    }
  );

  server.tool(
    'check_renal_dosing',
    'Check medications for renal dose adjustments based on GFR/creatinine. Flags drugs needing reduction or discontinuation.',
    {
      medications: z.array(z.string()).describe('List of medication names'),
      renalFunction: RenalSchema.describe('Patient renal function labs')
    },
    async ({ medications, renalFunction }) => {
      const alerts = checkRenalDosing(medications, renalFunction as RenalFunction);

      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({
            medicationsChecked: medications.length,
            gfr: renalFunction.gfr,
            alertsFound: alerts.length,
            alerts,
            disclaimer: CLINICAL_DISCLAIMER
          }, null, 2)
        }]
      };
    }
  );

  server.tool(
    'check_hepatic_dosing',
    'Check medications for hepatic dose adjustments based on Child-Pugh class or liver labs.',
    {
      medications: z.array(z.string()).describe('List of medication names'),
      hepaticFunction: HepaticSchema.describe('Patient hepatic function data')
    },
    async ({ medications, hepaticFunction }) => {
      const alerts = checkHepaticDosing(medications, hepaticFunction as HepaticFunction);

      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({
            medicationsChecked: medications.length,
            childPughClass: hepaticFunction.childPughClass,
            alertsFound: alerts.length,
            alerts,
            disclaimer: CLINICAL_DISCLAIMER
          }, null, 2)
        }]
      };
    }
  );

  server.tool(
    'check_duplicates',
    'Identify duplicate or overlapping therapies within the same therapeutic class.',
    { medications: z.array(z.string()).describe('List of medication names') },
    async ({ medications }) => {
      const duplicates = findDuplicateTherapies(medications);

      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({
            medicationsChecked: medications.length,
            duplicatesFound: duplicates.length,
            duplicates: duplicates.map(d => ({
              drugs: d.drugs,
              therapeuticClass: d.therapeuticClass.name,
              risk: d.therapeuticClass.duplicateRisk,
              recommendation: `Review necessity of multiple ${d.therapeuticClass.name}. Consider consolidating to single agent.`
            })),
            disclaimer: CLINICAL_DISCLAIMER
          }, null, 2)
        }]
      };
    }
  );

  server.tool(
    'check_allergies',
    'Cross-reference medications against patient allergy list including cross-reactivity checking.',
    {
      medications: z.array(z.string()).describe('List of medication names'),
      allergies: z.array(AllergySchema).describe('Patient allergy list')
    },
    async ({ medications, allergies }) => {
      const alerts = checkAllergies(medications, allergies as AllergyEntry[]);

      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({
            medicationsChecked: medications.length,
            allergiesChecked: allergies.length,
            alertsFound: alerts.length,
            alerts,
            disclaimer: CLINICAL_DISCLAIMER
          }, null, 2)
        }]
      };
    }
  );

  server.tool(
    'deprescribing_opportunities',
    'Identify medications that are candidates for deprescribing with taper schedules and monitoring plans. Uses Beers Criteria and evidence-based deprescribing guidelines.',
    {
      medications: z.array(z.string()).describe('List of medication names'),
      patientAge: z.number().optional().describe('Patient age (deprescribing criteria are age-specific)')
    },
    async ({ medications, patientAge }) => {
      const candidates = findDeprescribingCandidates(medications, patientAge);

      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({
            medicationsChecked: medications.length,
            patientAge: patientAge ?? 'not provided',
            candidatesFound: candidates.length,
            candidates,
            disclaimer: CLINICAL_DISCLAIMER
          }, null, 2)
        }]
      };
    }
  );

  server.tool(
    'assess_polypharmacy',
    'Comprehensive polypharmacy risk assessment combining interactions, duplicates, PGx, organ function, allergies, and deprescribing into a single safety report with risk scoring.',
    {
      medications: z.array(MedicationSchema).describe('Full medication list with details'),
      allergies: z.array(AllergySchema).optional().describe('Patient allergy list'),
      genotypes: z.array(GenotypeSchema).optional().describe('Pharmacogenomic data'),
      renalFunction: RenalSchema.optional().describe('Renal function labs'),
      hepaticFunction: HepaticSchema.optional().describe('Hepatic function labs'),
      age: z.number().optional().describe('Patient age'),
      sex: z.enum(['male', 'female']).optional().describe('Patient sex'),
      conditions: z.array(z.string()).optional().describe('Active diagnoses/conditions')
    },
    async ({ medications, allergies, genotypes, renalFunction, hepaticFunction, age, sex, conditions }) => {
      const context: PatientContext = {
        medications: medications as MedicationEntry[],
        allergies: allergies as AllergyEntry[] | undefined,
        genotypes: genotypes as PatientGenotype[] | undefined,
        renalFunction: renalFunction as RenalFunction | undefined,
        hepaticFunction: hepaticFunction as HepaticFunction | undefined,
        age,
        sex,
        conditions
      };

      const report = generateSafetyReport(context);

      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify(report, null, 2)
        }]
      };
    }
  );

  server.tool(
    'medication_reconciliation',
    'Reconcile two medication lists (e.g., admission vs. discharge, PCP vs. specialist) and identify discrepancies.',
    {
      listA: z.object({
        source: z.string().describe('Source of list A (e.g., "PCP", "Admission", "Patient-reported")'),
        medications: z.array(MedicationSchema)
      }),
      listB: z.object({
        source: z.string().describe('Source of list B (e.g., "Specialist", "Discharge", "Pharmacy")'),
        medications: z.array(MedicationSchema)
      })
    },
    async ({ listA, listB }) => {
      const normalize = (m: z.infer<typeof MedicationSchema>) =>
        (m.genericName || m.name).toLowerCase().trim();

      const namesA = new Set(listA.medications.map(normalize));
      const namesB = new Set(listB.medications.map(normalize));

      const onlyInA = listA.medications.filter(m => !namesB.has(normalize(m)));
      const onlyInB = listB.medications.filter(m => !namesA.has(normalize(m)));
      const inBoth = listA.medications.filter(m => namesB.has(normalize(m)));

      const doseDiscrepancies = inBoth.map(medA => {
        const medB = listB.medications.find(m => normalize(m) === normalize(medA));
        if (medB && medA.dose && medB.dose && medA.dose !== medB.dose) {
          return { drug: medA.name, doseInA: medA.dose, doseInB: medB.dose, sourceA: listA.source, sourceB: listB.source };
        }
        return null;
      }).filter(Boolean);

      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({
            summary: {
              totalInA: listA.medications.length,
              totalInB: listB.medications.length,
              onlyInA: onlyInA.length,
              onlyInB: onlyInB.length,
              inBoth: inBoth.length,
              doseDiscrepancies: doseDiscrepancies.length
            },
            discrepancies: {
              onlyIn: { [listA.source]: onlyInA.map(m => ({ name: m.name, dose: m.dose, indication: m.indication })) },
              onlyInB: { [listB.source]: onlyInB.map(m => ({ name: m.name, dose: m.dose, indication: m.indication })) },
              doseConflicts: doseDiscrepancies
            },
            reconciliationActions: [
              ...onlyInA.map(m => `VERIFY: ${m.name} found in ${listA.source} but not ${listB.source} — was it intentionally discontinued?`),
              ...onlyInB.map(m => `VERIFY: ${m.name} found in ${listB.source} but not ${listA.source} — is this a new addition?`),
              ...doseDiscrepancies.map((d: any) => `RESOLVE: ${d.drug} has different doses — ${d.doseInA} (${listA.source}) vs ${d.doseInB} (${listB.source})`)
            ],
            disclaimer: CLINICAL_DISCLAIMER
          }, null, 2)
        }]
      };
    }
  );

  server.tool(
    'generate_safety_report',
    'Generate a comprehensive medication safety report with risk scoring. Combines all checks (interactions, PGx, renal, hepatic, allergies, duplicates, deprescribing) into one structured report.',
    {
      medications: z.array(MedicationSchema).describe('Full medication list'),
      allergies: z.array(AllergySchema).optional(),
      genotypes: z.array(GenotypeSchema).optional(),
      renalFunction: RenalSchema.optional(),
      hepaticFunction: HepaticSchema.optional(),
      age: z.number().optional(),
      sex: z.enum(['male', 'female']).optional(),
      conditions: z.array(z.string()).optional()
    },
    async ({ medications, allergies, genotypes, renalFunction, hepaticFunction, age, sex, conditions }) => {
      const context: PatientContext = {
        medications: medications as MedicationEntry[],
        allergies: allergies as AllergyEntry[] | undefined,
        genotypes: genotypes as PatientGenotype[] | undefined,
        renalFunction: renalFunction as RenalFunction | undefined,
        hepaticFunction: hepaticFunction as HepaticFunction | undefined,
        age,
        sex,
        conditions
      };

      const report = generateSafetyReport(context);

      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify(report, null, 2)
        }]
      };
    }
  );

  server.tool(
    'pgx_drug_lookup',
    'Look up which drugs are affected by a specific pharmacogenomic result (e.g., CYP2D6 poor metabolizer).',
    {
      gene: z.string().describe('Gene name (e.g., CYP2D6, CYP2C19, DPYD)'),
      metabolizerStatus: z.enum(['ultra-rapid', 'rapid', 'normal', 'intermediate', 'poor'])
    },
    async ({ gene, metabolizerStatus }) => {
      const genotype: PatientGenotype = { gene, metabolizerStatus };
      const affected = getAffectedDrugs(genotype);

      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({
            gene,
            metabolizerStatus,
            affectedDrugsCount: affected.length,
            drugs: affected.map(d => {
              const impact = d.metabolizerImpact[metabolizerStatus];
              return {
                drug: d.drug,
                effect: impact?.effect,
                recommendation: impact?.recommendation,
                dosingGuidance: impact?.dosingGuidance,
                evidenceLevel: d.evidenceLevel,
                cpicGuideline: d.cpicGuideline
              };
            }),
            disclaimer: CLINICAL_DISCLAIMER
          }, null, 2)
        }]
      };
    }
  );

  server.tool(
    'check_beers_criteria',
    'Check medications against AGS Beers Criteria 2023 for potentially inappropriate medications in older adults (≥65). Includes disease-drug interactions specific to geriatric conditions.',
    {
      medications: z.array(z.string()).describe('List of medication names'),
      age: z.number().describe('Patient age (Beers applies to ≥65)'),
      conditions: z.array(z.string()).optional().describe('Active conditions (dementia, falls history, heart failure, CKD, etc.)')
    },
    async ({ medications, age, conditions }) => {
      const results = checkBeersCriteria(medications, age, conditions);

      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({
            patientAge: age,
            beersApplicable: age >= 65,
            inappropriateMedications: results.avoidList.length,
            diseaseDrugConflicts: results.diseaseDrug.length,
            avoidList: results.avoidList.map(e => ({
              drug: e.drug,
              category: e.category,
              rationale: e.rationale,
              recommendation: e.recommendation,
              alternatives: e.alternatives,
              evidenceQuality: e.qualityOfEvidence,
              recommendationStrength: e.strengthOfRecommendation
            })),
            diseaseDrugInteractions: results.diseaseDrug,
            disclaimer: CLINICAL_DISCLAIMER
          }, null, 2)
        }]
      };
    }
  );

  server.tool(
    'check_high_alert',
    'Identify ISMP high-alert medications that require extra safeguards. Returns required monitoring, safety protocols, and risk factors.',
    { medications: z.array(z.string()).describe('List of medication names') },
    async ({ medications }) => {
      const results = checkHighAlertMedications(medications);

      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({
            medicationsChecked: medications.length,
            highAlertFound: results.length,
            medications: results.map(r => ({
              drug: r.drug,
              category: r.category,
              risks: r.risks,
              requiredSafeguards: r.safeguards,
              monitoringRequired: r.monitoringRequired
            })),
            disclaimer: CLINICAL_DISCLAIMER
          }, null, 2)
        }]
      };
    }
  );

  server.tool(
    'calculate_anticholinergic_burden',
    'Calculate total Anticholinergic Cognitive Burden (ACB) score for a medication list. High ACB (≥3) is associated with cognitive decline and delirium in elderly.',
    { medications: z.array(z.string()).describe('List of medication names') },
    async ({ medications }) => {
      const result = calculateAnticholinergicBurden(medications);

      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({
            totalACBScore: result.totalScore,
            riskLevel: result.riskLevel,
            interpretation: result.interpretation,
            breakdown: result.breakdown.sort((a, b) => b.score - a.score),
            disclaimer: CLINICAL_DISCLAIMER
          }, null, 2)
        }]
      };
    }
  );

  server.tool(
    'pull_patient_medications',
    'Pull patient medication list, allergies, and relevant labs from a connected FHIR EHR server. Requires SHARP context (FHIR server URL, access token, patient ID).',
    {
      fhirServerUrl: z.string().describe('FHIR R4 server base URL'),
      accessToken: z.string().describe('OAuth2 access token for FHIR server'),
      patientId: z.string().describe('FHIR Patient resource ID')
    },
    async ({ fhirServerUrl, accessToken, patientId }) => {
      try {
        const data = await fetchPatientData({ serverUrl: fhirServerUrl, accessToken, patientId });

        return {
          content: [{
            type: 'text' as const,
            text: JSON.stringify({
              source: 'FHIR EHR',
              fhirServer: fhirServerUrl,
              patientId,
              patientAge: data.age,
              patientSex: data.sex,
              medicationCount: data.medications.length,
              medications: data.medications,
              allergyCount: data.allergies.length,
              allergies: data.allergies,
              renalFunction: data.renalFunction,
              hepaticFunction: data.hepaticFunction,
              note: 'Use this data with other PharmSafe tools (check_interactions, assess_polypharmacy, etc.) for comprehensive safety analysis.'
            }, null, 2)
          }]
        };
      } catch (error: any) {
        return {
          content: [{
            type: 'text' as const,
            text: JSON.stringify({
              error: 'Failed to fetch patient data from FHIR server',
              details: error.message,
              troubleshooting: [
                'Verify FHIR server URL is correct and accessible',
                'Check that access token is valid and not expired',
                'Confirm patient ID exists on the server',
                'Ensure token has read access to MedicationRequest, AllergyIntolerance, Observation, Patient'
              ]
            }, null, 2)
          }]
        };
      }
    }
  );

  server.tool(
    'check_food_interactions',
    'Identify drug-food interactions including grapefruit, dairy, vitamin K, tyramine, alcohol, and high-potassium foods.',
    { medications: z.array(z.string()).describe('List of medication names') },
    async ({ medications }) => {
      const interactions = checkFoodInteractions(medications);

      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({
            medicationsChecked: medications.length,
            foodInteractionsFound: interactions.length,
            interactions: interactions.sort((a, b) => {
              const order = { major: 0, moderate: 1, minor: 2 };
              return order[a.severity] - order[b.severity];
            }),
            disclaimer: CLINICAL_DISCLAIMER
          }, null, 2)
        }]
      };
    }
  );

  server.tool(
    'check_timing_conflicts',
    'Identify medications that must be separated in time (e.g., levothyroxine + calcium, ciprofloxacin + iron) with required separation intervals.',
    { medications: z.array(z.string()).describe('List of medication names') },
    async ({ medications }) => {
      const conflicts = checkTimingConflicts(medications);
      const guidance = getAdministrationGuidance(medications);

      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({
            medicationsChecked: medications.length,
            timingConflicts: conflicts.length,
            conflicts: conflicts.map(c => ({
              drugs: [c.drug1, c.drug2],
              conflict: c.conflict,
              separationRequired: c.separationRequired,
              recommendation: c.recommendation
            })),
            administrationGuidance: guidance.map(g => ({
              drug: g.drug,
              bestTiming: g.timing,
              foodRequirement: g.withFood,
              specialInstructions: g.specialInstructions
            })),
            disclaimer: CLINICAL_DISCLAIMER
          }, null, 2)
        }]
      };
    }
  );

  server.tool(
    'generate_timing_schedule',
    'Generate an optimal daily medication timing schedule accounting for food requirements, drug separations, and administration constraints.',
    { medications: z.array(z.string()).describe('List of medication names') },
    async ({ medications }) => {
      const schedule = generateTimingSchedule(medications);
      const foodInteractions = checkFoodInteractions(medications);

      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({
            schedule: {
              'early_morning_empty_stomach': schedule.morning_empty.length > 0 ? schedule.morning_empty : undefined,
              'morning_with_breakfast': schedule.morning_with_food.length > 0 ? schedule.morning_with_food : undefined,
              'with_meals': schedule.with_meals.length > 0 ? schedule.with_meals : undefined,
              'evening': schedule.evening.length > 0 ? schedule.evening : undefined,
              'flexible_timing': schedule.anytime.length > 0 ? schedule.anytime : undefined
            },
            separationNotes: schedule.separationNotes,
            foodWarnings: foodInteractions.filter(f => f.severity === 'major').map(f => `${f.drug}: ${f.recommendation}`),
            disclaimer: CLINICAL_DISCLAIMER
          }, null, 2)
        }]
      };
    }
  );

  server.tool(
    'generate_formatted_report',
    'Generate a beautifully formatted markdown medication safety report with priority-grouped actions, risk scorecard, and visual indicators. Perfect for clinical presentation.',
    {
      medications: z.array(MedicationSchema).describe('Full medication list'),
      allergies: z.array(AllergySchema).optional(),
      genotypes: z.array(GenotypeSchema).optional(),
      renalFunction: RenalSchema.optional(),
      hepaticFunction: HepaticSchema.optional(),
      age: z.number().optional(),
      sex: z.enum(['male', 'female']).optional(),
      conditions: z.array(z.string()).optional()
    },
    async ({ medications, allergies, genotypes, renalFunction, hepaticFunction, age, sex, conditions }) => {
      const context: PatientContext = {
        medications: medications as MedicationEntry[],
        allergies: allergies as AllergyEntry[] | undefined,
        genotypes: genotypes as PatientGenotype[] | undefined,
        renalFunction: renalFunction as RenalFunction | undefined,
        hepaticFunction: hepaticFunction as HepaticFunction | undefined,
        age,
        sex,
        conditions
      };

      const report = generateSafetyReport(context);
      const formatted = formatSafetyReport(context, report);

      return {
        content: [{
          type: 'text' as const,
          text: formatted.markdown
        }]
      };
    }
  );

  server.tool(
    'normalize_medication_name',
    'Normalize a medication name: strips doses/frequencies, maps brand names to generic. Useful for preprocessing patient-reported or free-text medication lists.',
    {
      medicationName: z.string().describe('Raw medication name (may include brand, dose, frequency, route)')
    },
    async ({ medicationName }) => {
      const normalized = normalizeMedName(medicationName);
      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({
            input: medicationName,
            normalized: normalized || null,
            wasRecognized: normalized.length > 0
          }, null, 2)
        }]
      };
    }
  );
}
