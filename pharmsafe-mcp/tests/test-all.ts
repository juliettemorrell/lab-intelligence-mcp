import { findInteractions, findDuplicateTherapies } from '../src/drug-database.js';
import { checkPharmacogenomics } from '../src/pharmacogenomics.js';
import { checkRenalDosing, checkHepaticDosing } from '../src/renal-hepatic.js';
import { checkAllergies, findDeprescribingCandidates, generateSafetyReport } from '../src/safety-engine.js';
import { checkBeersCriteria } from '../src/beers-criteria.js';
import { checkHighAlertMedications, calculateAnticholinergicBurden } from '../src/high-alert.js';
import { PatientContext, PatientGenotype } from '../src/types.js';

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string) {
  if (condition) {
    console.log(`  ✓ ${testName}`);
    passed++;
  } else {
    console.log(`  ✗ FAILED: ${testName}`);
    failed++;
  }
}

console.log('\n=== PharmSafe MCP Test Suite ===\n');

// Drug Interactions
console.log('Drug Interactions:');
const interactions1 = findInteractions(['sertraline', 'tramadol']);
assert(interactions1.length > 0, 'Detects sertraline + tramadol serotonin syndrome risk');
assert(interactions1[0].severity === 'major', 'Correct severity for SSRI + tramadol');

const interactions2 = findInteractions(['simvastatin', 'clarithromycin']);
assert(interactions2.length > 0, 'Detects statin + macrolide CYP3A4 interaction');
assert(interactions2[0].severity === 'contraindicated', 'Simvastatin + clarithromycin is contraindicated');

const interactions3 = findInteractions(['lisinopril', 'ibuprofen']);
assert(interactions3.length > 0, 'Detects ACE inhibitor + NSAID nephrotoxicity');

const interactions4 = findInteractions(['oxycodone', 'alprazolam']);
assert(interactions4.length > 0, 'Detects opioid + benzodiazepine CNS depression');

const noInteractions = findInteractions(['metformin', 'lisinopril']);
assert(noInteractions.length === 0, 'No false positive for metformin + lisinopril');

// Duplicate Therapies
console.log('\nDuplicate Therapies:');
const dupes1 = findDuplicateTherapies(['lisinopril', 'enalapril', 'metformin']);
assert(dupes1.length === 1, 'Detects dual ACE inhibitor');
assert(dupes1[0].therapeuticClass.name === 'ACE Inhibitors', 'Correct class identification');

const dupes2 = findDuplicateTherapies(['omeprazole', 'pantoprazole']);
assert(dupes2.length === 1, 'Detects dual PPI');

const noDupes = findDuplicateTherapies(['lisinopril', 'metformin', 'atorvastatin']);
assert(noDupes.length === 0, 'No false positive for different classes');

// Pharmacogenomics
console.log('\nPharmacogenomics:');
const genotypes: PatientGenotype[] = [
  { gene: 'CYP2D6', metabolizerStatus: 'poor' },
  { gene: 'CYP2C19', metabolizerStatus: 'ultra-rapid' }
];

const pgx1 = checkPharmacogenomics(['codeine', 'metformin'], genotypes);
assert(pgx1.length > 0, 'Detects codeine issue with CYP2D6 poor metabolizer');
assert(pgx1.some(a => a.drug === 'codeine' && a.metabolizerStatus === 'poor'), 'Correct PGx alert for codeine');

const pgx2 = checkPharmacogenomics(['omeprazole'], [{ gene: 'CYP2C19', metabolizerStatus: 'ultra-rapid' }]);
assert(pgx2.length > 0, 'Detects omeprazole issue with CYP2C19 ultra-rapid');

const pgx3 = checkPharmacogenomics(['metformin'], genotypes);
assert(pgx3.length === 0, 'No PGx alert for metformin (not CYP-dependent)');

// Renal Dosing
console.log('\nRenal Dosing:');
const renal1 = checkRenalDosing(['metformin', 'lisinopril'], { gfr: 25 });
assert(renal1.length > 0, 'Flags metformin at GFR 25');
assert(renal1.some(r => r.drug === 'metformin' && r.adjustedDose.includes('DISCONTINUE')), 'Metformin contraindicated at GFR 25');

const renal2 = checkRenalDosing(['gabapentin'], { gfr: 35 });
assert(renal2.length > 0, 'Flags gabapentin dose adjustment at GFR 35');

const renalOk = checkRenalDosing(['metformin', 'gabapentin'], { gfr: 90 });
assert(renalOk.length === 0, 'No alerts at normal GFR');

// Hepatic Dosing
console.log('\nHepatic Dosing:');
const hepatic1 = checkHepaticDosing(['acetaminophen', 'duloxetine'], { childPughClass: 'B' });
assert(hepatic1.length >= 2, 'Flags both drugs in Child-Pugh B');
assert(hepatic1.some(h => h.drug === 'duloxetine' && h.adjustedDose === 'AVOID'), 'Duloxetine avoided in Child-Pugh B');

// Allergies
console.log('\nAllergy Checking:');
const allergy1 = checkAllergies(['amoxicillin', 'metformin'], [{ substance: 'penicillin', severity: 'severe' }]);
assert(allergy1.length > 0, 'Detects penicillin → amoxicillin cross-reactivity');
assert(allergy1[0].crossReactivity === true, 'Correctly marked as cross-reactivity');

const allergy2 = checkAllergies(['ibuprofen'], [{ substance: 'ibuprofen', reaction: 'anaphylaxis', severity: 'life-threatening' }]);
assert(allergy2.length > 0, 'Detects direct allergy match');
assert(allergy2[0].crossReactivity === false, 'Correctly marked as direct match');

// Deprescribing
console.log('\nDeprescribing:');
const depresc1 = findDeprescribingCandidates(['omeprazole', 'metformin', 'alprazolam'], 72);
assert(depresc1.length >= 2, 'Identifies PPI + benzo as deprescribing candidates in elderly');

const depresc2 = findDeprescribingCandidates(['alprazolam'], 40);
assert(depresc2.length === 0, 'Does not flag benzo deprescribing for young patient');

// Full Safety Report
console.log('\nFull Safety Report:');
const complexPatient: PatientContext = {
  age: 75,
  sex: 'female',
  medications: [
    { name: 'Warfarin', genericName: 'warfarin', dose: '5mg', frequency: 'daily' },
    { name: 'Omeprazole', genericName: 'omeprazole', dose: '20mg', frequency: 'daily' },
    { name: 'Sertraline', genericName: 'sertraline', dose: '100mg', frequency: 'daily' },
    { name: 'Tramadol', genericName: 'tramadol', dose: '50mg', frequency: 'q6h PRN' },
    { name: 'Lisinopril', genericName: 'lisinopril', dose: '10mg', frequency: 'daily' },
    { name: 'Ibuprofen', genericName: 'ibuprofen', dose: '400mg', frequency: 'TID' },
    { name: 'Alprazolam', genericName: 'alprazolam', dose: '0.5mg', frequency: 'BID' },
    { name: 'Simvastatin', genericName: 'simvastatin', dose: '40mg', frequency: 'nightly' }
  ],
  allergies: [{ substance: 'penicillin', severity: 'moderate' }],
  genotypes: [
    { gene: 'CYP2D6', metabolizerStatus: 'poor' },
    { gene: 'CYP2C19', metabolizerStatus: 'intermediate' }
  ],
  renalFunction: { gfr: 42, creatinine: 1.4 },
  conditions: ['atrial fibrillation', 'osteoarthritis', 'anxiety', 'hyperlipidemia']
};

const report = generateSafetyReport(complexPatient);
assert(report.interactions.length > 0, 'Complex patient has interactions');
assert(report.pgxAlerts.length > 0, 'Complex patient has PGx alerts');
assert(report.deprescribingCandidates.length > 0, 'Complex patient has deprescribing candidates');
assert(report.riskScore.overall === 'critical' || report.riskScore.overall === 'high', 'Complex patient flagged as high/critical risk');
assert(report.patientSummary.isPolypharmacy === true, 'Correctly identified as polypharmacy');
assert(report.disclaimer.length > 0, 'Report includes disclaimer');

console.log(`\n  Risk Score: ${report.riskScore.overall}`);
console.log(`  Interactions: ${report.interactions.length}`);
console.log(`  PGx Alerts: ${report.pgxAlerts.length}`);
console.log(`  Renal Alerts: ${report.renalAlerts.length}`);
console.log(`  Deprescribing: ${report.deprescribingCandidates.length}`);

// Beers Criteria
console.log('\nBeers Criteria:');
const beers1 = checkBeersCriteria(['alprazolam', 'diphenhydramine', 'metformin'], 72);
assert(beers1.avoidList.length >= 2, 'Flags alprazolam + diphenhydramine as Beers inappropriate');
assert(beers1.avoidList.some(e => e.drug === 'alprazolam'), 'Identifies alprazolam by name');
assert(beers1.avoidList.some(e => e.alternatives.length > 0), 'Provides alternatives for Beers drugs');

const beers2 = checkBeersCriteria(['alprazolam', 'metformin'], 50);
assert(beers2.avoidList.length === 0, 'Does not flag Beers for patients <65');

const beers3 = checkBeersCriteria(['ibuprofen', 'oxybutynin'], 78, ['dementia', 'heart failure']);
assert(beers3.diseaseDrug.length > 0, 'Detects disease-drug interaction: oxybutynin + dementia');

// High-Alert Medications
console.log('\nHigh-Alert Medications (ISMP):');
const highAlert1 = checkHighAlertMedications(['warfarin', 'metformin', 'oxycodone']);
assert(highAlert1.length === 3, 'Identifies all 3 high-alert meds');
assert(highAlert1.every(h => h.safeguards.length > 0), 'All high-alert meds have safeguards');
assert(highAlert1.every(h => h.monitoringRequired.length > 0), 'All have monitoring requirements');

const highAlert2 = checkHighAlertMedications(['lisinopril', 'amlodipine']);
assert(highAlert2.length === 0, 'Does not flag non-high-alert meds');

const highAlert3 = checkHighAlertMedications(['lantus']);
assert(highAlert3.length > 0, 'Detects insulin brand name (Lantus) as high-alert');

// Anticholinergic Burden
console.log('\nAnticholinergic Burden (ACB):');
const acb1 = calculateAnticholinergicBurden(['oxybutynin', 'amitriptyline', 'diphenhydramine']);
assert(acb1.totalScore >= 9, 'Three score-3 drugs = ACB ≥9');
assert(acb1.riskLevel === 'high', 'Triple anticholinergic = high risk');

const acb2 = calculateAnticholinergicBurden(['metformin', 'lisinopril']);
assert(acb2.totalScore <= 2, 'Low-burden meds have low ACB');
assert(acb2.riskLevel === 'low', 'Low ACB = low risk level');

const acb3 = calculateAnticholinergicBurden(['paroxetine', 'sertraline', 'furosemide']);
assert(acb3.totalScore > 0, 'Paroxetine (3) + sertraline (1) + furosemide (1) detected');
assert(acb3.breakdown.length >= 3, 'All 3 meds in breakdown');

// Summary
console.log(`\n=== Results: ${passed} passed, ${failed} failed ===\n`);
process.exit(failed > 0 ? 1 : 0);
