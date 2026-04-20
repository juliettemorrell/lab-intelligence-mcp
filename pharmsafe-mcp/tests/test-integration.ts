import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { generateSafetyReport } from '../src/safety-engine.js';
import { checkBeersCriteria } from '../src/beers-criteria.js';
import { checkHighAlertMedications, calculateAnticholinergicBurden } from '../src/high-alert.js';
import { findInteractions } from '../src/drug-database.js';
import { checkPharmacogenomics } from '../src/pharmacogenomics.js';
import { checkRenalDosing } from '../src/renal-hepatic.js';
import { PatientContext } from '../src/types.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

console.log('\n=== PharmSafe Integration Test: Complex Elderly Patient ===\n');

// Load sample patient
const sampleData = JSON.parse(
  readFileSync(resolve(__dirname, '../test-data/sample-patient-elderly.json'), 'utf-8')
);
const patient = sampleData.patient;

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string) {
  if (condition) { console.log(`  ✓ ${testName}`); passed++; }
  else { console.log(`  ✗ FAILED: ${testName}`); failed++; }
}

// Build PatientContext
const context: PatientContext = {
  age: patient.age,
  sex: patient.sex,
  medications: patient.medications,
  allergies: patient.allergies,
  genotypes: patient.genotypes,
  renalFunction: patient.renalFunction,
  hepaticFunction: patient.hepaticFunction,
  conditions: patient.conditions
};

// 1. Full Safety Report
console.log('1. Comprehensive Safety Report:');
const report = generateSafetyReport(context);
assert(report.riskScore.overall === 'critical', `Risk score: ${report.riskScore.overall} (expected critical)`);
assert(report.interactions.length >= 2, `Interactions found: ${report.interactions.length}`);
assert(report.pgxAlerts.length >= 2, `PGx alerts: ${report.pgxAlerts.length}`);
assert(report.renalAlerts.length >= 1, `Renal alerts: ${report.renalAlerts.length}`);
assert(report.patientSummary.isPolypharmacy === true, `Polypharmacy: ${report.patientSummary.medicationCount} meds`);
assert(report.patientSummary.hasRenalImpairment === true, 'Renal impairment detected');

console.log(`\n  Summary: ${report.interactions.length} interactions, ${report.pgxAlerts.length} PGx, ${report.renalAlerts.length} renal, ${report.deprescribingCandidates.length} deprescribing`);

// 2. Drug Interactions Detail
console.log('\n2. Drug Interactions:');
const medNames = patient.medications.map((m: any) => m.genericName || m.name);
const interactions = findInteractions(medNames);
assert(interactions.some(i =>
  (i.drug1 === 'lisinopril' || i.drug2 === 'lisinopril') &&
  (i.drug1 === 'naproxen' || i.drug2 === 'naproxen')
), 'Detects ACE inhibitor + NSAID');
assert(interactions.some(i => i.drug1 === 'amlodipine' || i.drug2 === 'amlodipine'), 'Detects amlodipine + simvastatin');

for (const i of interactions) {
  console.log(`  → ${i.drug1} + ${i.drug2}: ${i.severity} (${i.mechanism})`);
}

// 3. Beers Criteria
console.log('\n3. Beers Criteria (Age 78):');
const beers = checkBeersCriteria(medNames, patient.age, patient.conditions);
assert(beers.avoidList.length >= 3, `Inappropriate medications: ${beers.avoidList.length}`);
assert(beers.avoidList.some(e => e.drug === 'alprazolam'), 'Alprazolam flagged (BZD in elderly)');
assert(beers.avoidList.some(e => e.drug === 'zolpidem'), 'Zolpidem flagged (sedative-hypnotic)');
assert(beers.avoidList.some(e => e.drug === 'glyburide'), 'Glyburide flagged (hypoglycemia risk)');
assert(beers.avoidList.some(e => e.drug === 'oxybutynin'), 'Oxybutynin flagged (anticholinergic)');

console.log(`  Disease-drug conflicts: ${beers.diseaseDrug.length}`);
for (const dd of beers.diseaseDrug) {
  console.log(`  → ${dd.drug} contraindicated with ${dd.condition}`);
}

// 4. Pharmacogenomics
console.log('\n4. Pharmacogenomics:');
const pgx = checkPharmacogenomics(medNames, patient.genotypes);
assert(pgx.some(a => a.drug === 'warfarin' && a.gene === 'CYP2C9'), 'Warfarin + CYP2C9 intermediate flagged');
assert(pgx.some(a => a.drug === 'omeprazole'), 'Omeprazole + CYP2C19 poor flagged');
assert(pgx.some(a => a.drug === 'simvastatin' && a.gene === 'SLCO1B1'), 'Simvastatin + SLCO1B1 flagged');

for (const a of pgx) {
  console.log(`  → ${a.drug} (${a.gene} ${a.metabolizerStatus}): ${a.dosingGuidance}`);
}

// 5. Renal Dosing
console.log('\n5. Renal Dosing (GFR 38):');
const renal = checkRenalDosing(medNames, patient.renalFunction);
assert(renal.some(r => r.drug === 'metformin'), 'Metformin flagged at GFR 38');

for (const r of renal) {
  console.log(`  → ${r.drug}: ${r.standardDose} → ${r.adjustedDose}`);
}

// 6. High-Alert Medications
console.log('\n6. ISMP High-Alert:');
const highAlert = checkHighAlertMedications(medNames);
assert(highAlert.some(h => h.drug === 'warfarin'), 'Warfarin identified as high-alert');
assert(highAlert.some(h => h.drug === 'metformin'), 'Metformin identified as high-alert');

for (const h of highAlert) {
  console.log(`  → ${h.drug} (${h.category}): ${h.monitoringRequired.join(', ')}`);
}

// 7. Anticholinergic Burden
console.log('\n7. Anticholinergic Cognitive Burden:');
const acb = calculateAnticholinergicBurden(medNames);
assert(acb.totalScore >= 3, `ACB score: ${acb.totalScore} (threshold ≥3 for concern)`);
assert(acb.breakdown.some(b => b.drug === 'oxybutynin' && b.score === 3), 'Oxybutynin scored 3');

console.log(`  Total ACB: ${acb.totalScore} (${acb.riskLevel})`);
for (const b of acb.breakdown.sort((a, b) => b.score - a.score)) {
  console.log(`  → ${b.drug}: ${b.score}`);
}

// 8. Clinical Action Summary
console.log('\n8. Clinical Action Summary:');
const criticalActions = [
  ...interactions.filter(i => i.severity === 'contraindicated').map(i => `STOP: ${i.drug1} + ${i.drug2} (${i.severity})`),
  ...pgx.filter(a => a.dosingGuidance.toLowerCase().includes('contraindicated')).map(a => `PGx CONTRAINDICATED: ${a.drug}`),
  ...renal.filter(r => r.adjustedDose.includes('DISCONTINUE')).map(r => `DISCONTINUE: ${r.drug} (renal)`)
];
const majorActions = [
  ...interactions.filter(i => i.severity === 'major').map(i => `REVIEW: ${i.drug1} + ${i.drug2}`),
  ...pgx.filter(a => !a.dosingGuidance.toLowerCase().includes('contraindicated')).map(a => `ADJUST: ${a.drug} (${a.dosingGuidance})`),
  ...beers.avoidList.map(e => `BEERS AVOID: ${e.drug} → ${e.alternatives[0]}`)
];

console.log(`  Critical actions: ${criticalActions.length}`);
for (const a of criticalActions) console.log(`    🚨 ${a}`);
console.log(`  Major actions: ${majorActions.length}`);
for (const a of majorActions.slice(0, 8)) console.log(`    ⚠️  ${a}`);

// Final
console.log(`\n=== Integration Results: ${passed} passed, ${failed} failed ===`);
console.log(`\nThis patient has ${report.interactions.length + report.pgxAlerts.length + report.renalAlerts.length + beers.avoidList.length + beers.diseaseDrug.length + highAlert.length} total safety findings.`);
console.log(`Risk classification: ${report.riskScore.overall.toUpperCase()}\n`);

process.exit(failed > 0 ? 1 : 0);
