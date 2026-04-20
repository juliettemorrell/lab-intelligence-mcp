// Aggressive stress tests for edge cases and real-world robustness
import { normalizeMedName, normalizeMedList, medMatches } from '../src/normalizer.js';
import { findInteractions, findDuplicateTherapies } from '../src/drug-database.js';
import { checkPharmacogenomics } from '../src/pharmacogenomics.js';
import { checkBeersCriteria } from '../src/beers-criteria.js';
import { checkHighAlertMedications, calculateAnticholinergicBurden } from '../src/high-alert.js';
import { checkAllergies, generateSafetyReport, findDeprescribingCandidates } from '../src/safety-engine.js';
import { checkRenalDosing } from '../src/renal-hepatic.js';
import { checkFoodInteractions, checkTimingConflicts } from '../src/administration.js';
import { formatSafetyReport } from '../src/report-formatter.js';
import { PatientContext } from '../src/types.js';

let passed = 0;
let failed = 0;
const failures: string[] = [];

function assert(condition: boolean, testName: string) {
  if (condition) { console.log(`  ✓ ${testName}`); passed++; }
  else { console.log(`  ✗ FAILED: ${testName}`); failed++; failures.push(testName); }
}

console.log('\n=== PharmSafe Stress Test Suite ===\n');

// ============================================================
// 1. Normalizer edge cases
// ============================================================
console.log('1. Medication Name Normalizer:');

assert(normalizeMedName('') === '', 'Empty string returns empty');
assert(normalizeMedName('   ') === '', 'Whitespace returns empty');
assert(normalizeMedName(null as any) === '', 'Null returns empty');
assert(normalizeMedName(undefined as any) === '', 'Undefined returns empty');
assert(normalizeMedName(123 as any) === '', 'Number returns empty');

// Case insensitivity
assert(normalizeMedName('WARFARIN') === 'warfarin', 'Upper case → lower');
assert(normalizeMedName('Warfarin') === 'warfarin', 'Mixed case → lower');
assert(normalizeMedName('  warfarin  ') === 'warfarin', 'Whitespace trimmed');

// Brand names
assert(normalizeMedName('Coumadin') === 'warfarin', 'Coumadin → warfarin');
assert(normalizeMedName('COUMADIN') === 'warfarin', 'COUMADIN → warfarin');
assert(normalizeMedName('Lipitor') === 'atorvastatin', 'Lipitor → atorvastatin');
assert(normalizeMedName('Prilosec') === 'omeprazole', 'Prilosec → omeprazole');
assert(normalizeMedName('Xanax') === 'alprazolam', 'Xanax → alprazolam');
assert(normalizeMedName('Glucophage') === 'metformin', 'Glucophage → metformin');
assert(normalizeMedName('Norvasc') === 'amlodipine', 'Norvasc → amlodipine');

// Insulin brand consolidation
assert(normalizeMedName('Lantus') === 'insulin', 'Lantus → insulin');
assert(normalizeMedName('Humalog') === 'insulin', 'Humalog → insulin');
assert(normalizeMedName('Novolog') === 'insulin', 'Novolog → insulin');

// Doses stripped
assert(normalizeMedName('Warfarin 5mg') === 'warfarin', 'Warfarin 5mg → warfarin');
assert(normalizeMedName('warfarin 5 mg') === 'warfarin', 'warfarin 5 mg → warfarin');
assert(normalizeMedName('Metformin 1000mg BID') === 'metformin', 'Metformin 1000mg BID → metformin');
assert(normalizeMedName('lisinopril 10mg PO daily') === 'lisinopril', 'Full prescription string normalized');
assert(normalizeMedName('Omeprazole 20 mg capsule') === 'omeprazole', 'Dose and formulation stripped');

// Frequencies stripped
assert(normalizeMedName('atorvastatin qhs') === 'atorvastatin', 'qhs stripped');
assert(normalizeMedName('tramadol 50mg q6h PRN') === 'tramadol', 'q6h PRN stripped');
assert(normalizeMedName('amlodipine once daily') === 'amlodipine', 'once daily stripped');

// Multi-word known drugs
assert(normalizeMedName('calcium carbonate 1200mg') === 'calcium carbonate', 'Multi-word preserved');
assert(normalizeMedName('Potassium Chloride') === 'potassium chloride', 'Potassium chloride preserved');
assert(normalizeMedName('Ferrous Sulfate 325mg') === 'ferrous sulfate', 'Ferrous sulfate preserved');

// OTC brand names
assert(normalizeMedName('Tums') === 'calcium carbonate', 'Tums → calcium carbonate');
assert(normalizeMedName('Pepto-Bismol') === 'bismuth subsalicylate', 'Pepto-Bismol → bismuth subsalicylate');
assert(normalizeMedName('Miralax') === 'polyethylene glycol', 'Miralax → polyethylene glycol');
assert(normalizeMedName('Sudafed') === 'pseudoephedrine', 'Sudafed → pseudoephedrine');
assert(normalizeMedName('Mucinex 600mg') === 'guaifenesin', 'Mucinex 600mg → guaifenesin');
assert(normalizeMedName('Colace 100mg BID') === 'docusate', 'Colace 100mg BID → docusate');
assert(normalizeMedName('Flonase') === 'fluticasone', 'Flonase → fluticasone');
assert(normalizeMedName('Gas-X') === 'simethicone', 'Gas-X → simethicone');
assert(normalizeMedName('Dulcolax') === 'bisacodyl', 'Dulcolax → bisacodyl');
assert(normalizeMedName('Caltrate 600mg') === 'calcium carbonate', 'Caltrate 600mg → calcium carbonate');

// XL/SR/ER variants
assert(normalizeMedName('Wellbutrin XL') === 'bupropion', 'Wellbutrin XL → bupropion');
assert(normalizeMedName('Metoprolol XL 50mg') === 'metoprolol', 'Metoprolol XL → metoprolol');
assert(normalizeMedName('Effexor XR 75mg') === 'venlafaxine', 'Effexor XR → venlafaxine');

// Parenthetical
assert(normalizeMedName('Coumadin (warfarin) 5mg') === 'warfarin', 'Coumadin (warfarin) handled');

// ============================================================
// 2. medMatches word boundary correctness
// ============================================================
console.log('\n2. Medication Matching (Word Boundaries):');

// True positives
assert(medMatches('warfarin', 'warfarin'), 'Exact match');
assert(medMatches('Coumadin', 'warfarin'), 'Brand matches generic');
assert(medMatches('warfarin 5mg', 'warfarin'), 'Dose-suffixed matches');

// False positive prevention
assert(!medMatches('aspirin', 'lisinopril'), 'aspirin ≠ lisinopril');
assert(!medMatches('metformin', 'methotrexate'), 'metformin ≠ methotrexate');
assert(!medMatches('lithium', 'linezolid'), 'lithium ≠ linezolid');
assert(!medMatches('amoxicillin', 'amlodipine'), 'amoxicillin ≠ amlodipine');

// Empty guards
assert(!medMatches('', 'warfarin'), 'Empty query no match');
assert(!medMatches('warfarin', ''), 'Empty target no match');

// ============================================================
// 3. Interaction detection with real-world inputs
// ============================================================
console.log('\n3. Real-World Interaction Inputs:');

// Brand names trigger interactions
const brandInteractions = findInteractions(['Coumadin', 'Bactrim']);
assert(brandInteractions.length === 0, 'Brand names do not false-positive (no warfarin+TMP defined)');

const realPrescription = findInteractions([
  'Zocor 40mg PO nightly',
  'Biaxin 500mg BID x 7 days',
  'Coumadin 5mg daily'
]);
assert(realPrescription.length > 0, 'Realistic prescription strings detect interactions (simvastatin+clarithromycin)');

const mixedCase = findInteractions(['LISINOPRIL', 'Naproxen', 'aspirin']);
assert(mixedCase.some(i =>
  (i.drug1 === 'lisinopril' && i.drug2 === 'naproxen') ||
  (i.drug1 === 'naproxen' && i.drug2 === 'lisinopril')
), 'Mixed case detects lisinopril + naproxen');

// Warfarin + ibuprofen (critical real-world pair)
const warfIbu = findInteractions(['warfarin', 'ibuprofen']);
assert(warfIbu.length > 0, 'Warfarin + ibuprofen detected');
assert(warfIbu[0].severity === 'major', 'Warfarin + ibuprofen is major severity');

// Aspirin + ibuprofen (FDA advisory)
const aspIbu = findInteractions(['aspirin', 'ibuprofen']);
assert(aspIbu.length > 0, 'Aspirin + ibuprofen detected (FDA advisory)');

// Brand names: Coumadin + Advil
const brandWarfIbu = findInteractions(['Coumadin 5mg daily', 'Advil 400mg PRN']);
assert(brandWarfIbu.length > 0, 'Coumadin + Advil brand names detect warfarin+ibuprofen interaction');

// No duplicate interactions
const dupeCheck = findInteractions(['warfarin 5mg', 'Coumadin 5mg']);
assert(dupeCheck.length === 0, 'Same drug twice (different names) no spurious interaction');

// Empty input
const emptyInt = findInteractions([]);
assert(emptyInt.length === 0, 'Empty list returns empty');

const singleInt = findInteractions(['warfarin']);
assert(singleInt.length === 0, 'Single drug returns empty');

// Whitespace / bad input
const badInput = findInteractions(['', '  ', 'warfarin']);
assert(badInput.length === 0, 'Empty/whitespace entries ignored');

// ============================================================
// 4. PGx with brand names
// ============================================================
console.log('\n4. Pharmacogenomics with Brand Names:');

const brandPgx = checkPharmacogenomics(
  ['Plavix'],
  [{ gene: 'CYP2C19', metabolizerStatus: 'poor' }]
);
assert(brandPgx.length > 0, 'Plavix (brand) flagged for CYP2C19 poor');
assert(brandPgx[0].drug === 'clopidogrel', 'Returns generic name in result');

const brandPgx2 = checkPharmacogenomics(
  ['Prilosec 20mg daily'],
  [{ gene: 'CYP2C19', metabolizerStatus: 'ultra-rapid' }]
);
assert(brandPgx2.length > 0, 'Prilosec with dose triggers CYP2C19 alert');

// No false positive for unrelated gene
const wrongGene = checkPharmacogenomics(
  ['metformin'],
  [{ gene: 'CYP2D6', metabolizerStatus: 'poor' }]
);
assert(wrongGene.length === 0, 'Metformin (not CYP-dependent) no false PGx alert');

// Normal metabolizer = no alert
const normalMetab = checkPharmacogenomics(
  ['codeine'],
  [{ gene: 'CYP2D6', metabolizerStatus: 'normal' }]
);
assert(normalMetab.length === 0, 'Normal metabolizer generates no alert');

// ============================================================
// 5. Duplicate therapy detection
// ============================================================
console.log('\n5. Duplicate Therapy Detection:');

const brandDupes = findDuplicateTherapies(['Lipitor', 'Crestor']);
assert(brandDupes.length === 1, 'Two brand statins detected as duplicate');
assert(brandDupes[0].therapeuticClass.name === 'Statins', 'Correct class');

const mixedDupes = findDuplicateTherapies(['Prilosec 20mg', 'pantoprazole 40mg daily']);
assert(mixedDupes.length === 1, 'Brand + generic duplicate detected');

// Intentional DAPT not flagged as interaction (both antiplatelets ≠ bad)
const dapt = findDuplicateTherapies(['aspirin', 'clopidogrel']);
assert(dapt.length === 1 && dapt[0].therapeuticClass.name === 'Antiplatelets', 'DAPT detected (for review, may be intentional)');

// ============================================================
// 6. Beers Criteria edge cases
// ============================================================
console.log('\n6. Beers Criteria Edge Cases:');

// Exactly age 65
const atThreshold = checkBeersCriteria(['alprazolam'], 65);
assert(atThreshold.avoidList.length === 1, 'Age 65 = Beers applies');

// Age 64
const belowThreshold = checkBeersCriteria(['alprazolam'], 64);
assert(belowThreshold.avoidList.length === 0, 'Age 64 = Beers does not apply');

// Brand names
const beersBrand = checkBeersCriteria(['Xanax', 'Benadryl'], 75);
assert(beersBrand.avoidList.length === 2, 'Brand names trigger Beers');

// No conditions array
const noCond = checkBeersCriteria(['alprazolam'], 75);
assert(noCond.diseaseDrug.length === 0, 'No conditions = no disease-drug alerts');

// Condition-drug interaction
const diseaseDrug = checkBeersCriteria(['ibuprofen'], 75, ['heart failure']);
assert(diseaseDrug.diseaseDrug.length > 0, 'Ibuprofen + HF disease-drug alert');

// ============================================================
// 7. Anticholinergic burden
// ============================================================
console.log('\n7. Anticholinergic Burden Edge Cases:');

// Empty list
const emptyACB = calculateAnticholinergicBurden([]);
assert(emptyACB.totalScore === 0 && emptyACB.riskLevel === 'low', 'Empty list = score 0, low');

// Brand names
const brandACB = calculateAnticholinergicBurden(['Benadryl', 'Ditropan', 'Elavil']);
assert(brandACB.totalScore === 9, `Brand names all score 3 (total 9), got ${brandACB.totalScore}`);

// No duplicate scoring
const dupeACB = calculateAnticholinergicBurden(['oxybutynin', 'Ditropan']);
assert(dupeACB.totalScore === 3, `Same drug twice counted once, got ${dupeACB.totalScore}`);

// ============================================================
// 8. High-alert brands
// ============================================================
console.log('\n8. High-Alert Medications (Brands):');

const brandHA = checkHighAlertMedications(['Coumadin', 'Lantus', 'OxyContin']);
assert(brandHA.length === 3, `Three brand high-alerts detected, got ${brandHA.length}`);

const anyInsulin = checkHighAlertMedications(['Humalog 10 units BID']);
assert(anyInsulin.some(h => h.drug === 'insulin'), 'Any insulin variant → high-alert');

// ============================================================
// 9. Allergy cross-reactivity edge cases
// ============================================================
console.log('\n9. Allergy Edge Cases:');

// Empty allergies
const noAllergies = checkAllergies(['amoxicillin'], []);
assert(noAllergies.length === 0, 'No allergies = no alerts');

// Brand names in prescription
const brandAllergy = checkAllergies(['Augmentin'], [{ substance: 'penicillin', severity: 'severe' }]);
assert(brandAllergy.length > 0, 'Augmentin triggers penicillin allergy');

// Case-insensitive allergy name
const caseAllergy = checkAllergies(['ibuprofen'], [{ substance: 'NSAID', severity: 'moderate' }]);
assert(caseAllergy.length > 0, 'Uppercase allergen matches');

// ============================================================
// 10. Renal dosing edge cases
// ============================================================
console.log('\n10. Renal Dosing Edge Cases:');

// GFR = 0 (dialysis)
const dialysis = checkRenalDosing(['metformin'], { gfr: 5 });
assert(dialysis.length > 0 && dialysis[0].adjustedDose.includes('DISCONTINUE'), 'GFR 5 = metformin contraindicated');

// No renal function data
const noRenal = checkRenalDosing(['metformin'], {});
assert(noRenal.length === 0, 'No renal data = no alerts');

// Estimated from creatinine when GFR missing
const estimated = checkRenalDosing(['metformin'], { creatinine: 3.0 });
assert(estimated.length > 0, 'GFR estimated from creatinine');

// GFR 80+ no alerts
const normalRenal = checkRenalDosing(['metformin', 'gabapentin'], { gfr: 90 });
assert(normalRenal.length === 0, 'Normal GFR = no alerts');

// Brand names
const brandRenal = checkRenalDosing(['Glucophage 1000mg BID', 'Neurontin'], { gfr: 25 });
assert(brandRenal.length >= 1, 'Brand names trigger renal dose alerts');

// ============================================================
// 11. Food interactions
// ============================================================
console.log('\n11. Food Interactions:');

const brandFood = checkFoodInteractions(['Zocor', 'Coumadin']);
assert(brandFood.some(f => f.food.includes('grapefruit')), 'Zocor → grapefruit alert');
assert(brandFood.some(f => f.food.includes('vitamin K')), 'Coumadin → vitamin K alert');

// No duplicate food alerts
const uniqueFood = checkFoodInteractions(['simvastatin', 'Zocor']);
assert(uniqueFood.filter(f => f.food.includes('grapefruit')).length === 1, 'No duplicate grapefruit alert for same drug');

// ============================================================
// 12. Timing conflicts
// ============================================================
console.log('\n12. Timing Conflicts:');

const brandTiming = checkTimingConflicts(['Synthroid 100mcg', 'Tums 500mg']);
assert(brandTiming.length > 0, 'Synthroid + Tums (OTC brand) timing conflict detected');

const timingStd = checkTimingConflicts(['Synthroid', 'calcium carbonate']);
assert(timingStd.length > 0, 'Synthroid + calcium timing conflict detected');

// Same drug twice shouldn't conflict with itself
const selfTiming = checkTimingConflicts(['levothyroxine', 'levothyroxine']);
assert(selfTiming.length === 0, 'Same drug twice no self-conflict');

// ============================================================
// 13. Deprescribing edge cases
// ============================================================
console.log('\n13. Deprescribing:');

// Age exactly 65
const depresc65 = findDeprescribingCandidates(['alprazolam'], 65);
assert(depresc65.length === 1, 'Age 65 triggers age-gated deprescribing');

// No age = all candidates returned
const noDepresc = findDeprescribingCandidates(['omeprazole']);
assert(noDepresc.length === 1, 'No age = returns PPI (not age-gated)');

// Brand names
const brandDepresc = findDeprescribingCandidates(['Xanax', 'Prilosec'], 75);
assert(brandDepresc.length >= 2, 'Brand names trigger deprescribing');

// ============================================================
// 14. Complete realistic scenario
// ============================================================
console.log('\n14. Realistic Real-World Patient:');

const realWorldPatient: PatientContext = {
  age: 82,
  sex: 'female',
  conditions: ['atrial fibrillation', 'heart failure', 'type 2 diabetes', 'anxiety', 'GERD', 'overactive bladder'],
  medications: [
    { name: 'Coumadin', dose: '5mg', frequency: 'daily' },
    { name: 'Metoprolol Tartrate', dose: '25mg', frequency: 'BID' },
    { name: 'Lasix', dose: '40mg', frequency: 'daily' },
    { name: 'Lantus', dose: '20 units', frequency: 'bedtime' },
    { name: 'Prilosec OTC', dose: '20mg', frequency: 'daily' },
    { name: 'Xanax', dose: '0.25mg', frequency: 'TID PRN' },
    { name: 'Ditropan XL', dose: '10mg', frequency: 'daily' },
    { name: 'Advil', dose: '400mg', frequency: 'q6h PRN' },
    { name: 'Lipitor', dose: '40mg', frequency: 'QHS' },
    { name: 'Aspirin', dose: '81mg', frequency: 'daily' }
  ],
  allergies: [{ substance: 'sulfa', severity: 'severe', reaction: 'Stevens-Johnson syndrome' }],
  renalFunction: { gfr: 34, creatinine: 1.8 }
};

const realReport = generateSafetyReport(realWorldPatient);
assert(realReport.interactions.length > 0, 'Real-world patient has interactions');
assert(realReport.patientSummary.isPolypharmacy, 'Polypharmacy detected');
assert(realReport.patientSummary.hasRenalImpairment, 'Renal impairment detected');
assert(realReport.riskScore.overall === 'critical' || realReport.riskScore.overall === 'high',
  `Risk: ${realReport.riskScore.overall} (expected high/critical)`);

// Formatted report
const formatted = formatSafetyReport(realWorldPatient, realReport);
assert(formatted.markdown.includes('# 💊'), 'Markdown report has title');
assert(formatted.markdown.includes('## 📊 Risk Scorecard'), 'Report has risk scorecard');
assert(formatted.summary.totalFindings > 0, 'Summary has findings count');
assert(formatted.priorityActions.critical.length + formatted.priorityActions.high.length > 0,
  'Real patient has priority actions');

// Report should not truncate food names to just "vitamin"
assert(!formatted.markdown.includes('avoid vitamin.'), 'Food interactions not truncated to just "vitamin"');
// Verify the full food category appears (not just first word)
const hasFullFoodName = formatted.markdown.includes('vitamin K-rich foods') || formatted.markdown.includes('grapefruit');
assert(hasFullFoodName, 'Food categories display full name (not truncated)');

console.log(`\n  Real-world patient: ${formatted.summary.totalFindings} findings, ${formatted.summary.criticalActions} critical`);
console.log(`  Risk: ${formatted.summary.riskLevel}`);

// ============================================================
// 15. Pathological inputs (don't crash)
// ============================================================
console.log('\n15. Pathological Inputs (No Crashes):');

let crashCount = 0;
try {
  findInteractions([]);
} catch { crashCount++; }
try {
  checkPharmacogenomics([], []);
} catch { crashCount++; }
try {
  generateSafetyReport({ medications: [] });
} catch { crashCount++; }
try {
  findInteractions(['', '   ', null as any, undefined as any, 'warfarin']);
} catch { crashCount++; }
try {
  checkBeersCriteria([], 0);
} catch { crashCount++; }
try {
  calculateAnticholinergicBurden(['', null as any, undefined as any]);
} catch { crashCount++; }
try {
  formatSafetyReport({ medications: [] }, generateSafetyReport({ medications: [] }));
} catch (e: any) { crashCount++; console.log(`  Crash: ${e.message}`); }

assert(crashCount === 0, `No crashes on pathological inputs (got ${crashCount})`);

// Output the markdown from the real-world patient for visual inspection
console.log('\n\n=== SAMPLE FORMATTED REPORT (Real-World Patient) ===\n');
console.log(formatted.markdown);
console.log('\n=== END SAMPLE ===\n');

// ============================================================
console.log(`\n=== Stress Test Results: ${passed} passed, ${failed} failed ===\n`);
if (failures.length > 0) {
  console.log('Failed tests:');
  failures.forEach(f => console.log(`  - ${f}`));
}
process.exit(failed > 0 ? 1 : 0);
