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
}
