#!/usr/bin/env npx tsx
/**
 * Comprehensive test suite for Lab Intelligence MCP
 * Run: npx tsx tests/test-all.ts
 */

import { findMarkerByName, findMarkerByLoinc, convertUnit, getMapStats, getMarkersByCategory } from '../src/loinc-map.js';
import { detectPatterns } from '../src/patterns.js';
import { parseHL7v2 } from '../src/parsers/hl7v2-parser.js';
import { parseCCDA } from '../src/parsers/ccda-parser.js';
import { parseWearableData } from '../src/parsers/wearable-parser.js';
import { parseGenomicData } from '../src/parsers/genomic-parser.js';
import { detectFormat, describeFormat } from '../src/parsers/auto-detect.js';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    passed++;
    console.log(`  ✓ ${message}`);
  } else {
    failed++;
    console.log(`  ✗ FAIL: ${message}`);
  }
}

function section(name: string) {
  console.log(`\n═══ ${name} ═══`);
}

// =========================================================================
// 1. LOINC DICTIONARY
// =========================================================================
section('LOINC Dictionary — Stats');
{
  const stats = getMapStats();
  assert(stats.totalMarkers >= 100, `Has ${stats.totalMarkers} markers (expected >= 100)`);
  assert(stats.totalAliases >= 500, `Has ${stats.totalAliases} aliases (expected >= 500)`);
  assert(stats.totalCategories >= 20, `Has ${stats.totalCategories} categories (expected >= 20)`);
  assert(stats.languagesSupported.length >= 5, `Supports ${stats.languagesSupported.length} languages`);
  assert(stats.withFunctionalRanges >= 100, `${stats.withFunctionalRanges} markers have functional ranges`);
  assert(stats.withUnitConversions >= 30, `${stats.withUnitConversions} markers have unit conversions`);
}

section('LOINC Dictionary — Exact Name Matching');
{
  const tsh = findMarkerByName('TSH');
  assert(tsh !== null, 'Found TSH');
  assert(tsh?.loinc === '11580-8', `TSH LOINC = ${tsh?.loinc}`);
  assert(tsh?.functionalRange.low === 1.0, `TSH functional low = ${tsh?.functionalRange.low}`);
  assert(tsh?.functionalRange.high === 2.0, `TSH functional high = ${tsh?.functionalRange.high}`);

  const hdl = findMarkerByName('HDL Cholesterol');
  assert(hdl !== null, 'Found HDL Cholesterol');
  assert(hdl?.loinc === '2085-9', `HDL LOINC = ${hdl?.loinc}`);
}

section('LOINC Dictionary — Fuzzy Name Matching');
{
  // Lab-specific names that need fuzzy matching
  const tests: [string, string][] = [
    ['tsh 3rd generation', '11580-8'],
    ['TSH Ultra-Sensitive', '11580-8'],
    ['thyroid stimulating hormone', '11580-8'],
    ['Hemoglobin A1c', '4548-4'],
    ['HbA1c', '4548-4'],
    ['a1c', '4548-4'],
    ['25-oh vitamin d', '1989-3'],
    ['vitamin d 25 hydroxy', '1989-3'],
    ['vit d', '1989-3'],
    ['c-reactive protein high sensitivity', '30522-7'],
    ['hscrp', '30522-7'],
    ['crp hs', '30522-7'],
    ['free t3', '3051-0'],
    ['ft3', '3051-0'],
    ['ferritin', '2276-4'],
    ['serum ferritin', '2276-4'],
    ['iron saturation', '14800-7'],
    ['transferrin saturation', '14800-7'],
    ['tsat', '14800-7'],
    ['fasting glucose', '1558-6'],
    ['blood sugar fasting', '1558-6'],
    ['alt', '1742-6'],
    ['sgpt', '1742-6'],
    ['ggt', '2324-2'],
    ['gamma gt', '2324-2'],
  ];

  for (const [input, expectedLoinc] of tests) {
    const result = findMarkerByName(input);
    assert(result?.loinc === expectedLoinc, `"${input}" → ${result?.loinc || 'NOT FOUND'} (expected ${expectedLoinc})`);
  }
}

section('LOINC Dictionary — Multi-language');
{
  const tests: [string, string][] = [
    ['hormona estimulante de la tiroides', '11580-8'],  // Spanish
    ['hormônio estimulante da tireoide', '11580-8'],    // Portuguese
    ['thyreoidea-stimulierendes hormon', '11580-8'],    // German
    ['glucosa en ayunas', '1558-6'],                     // Spanish
    ['colesterol total', '2093-3'],                      // Spanish
    ['vitamina d', '1989-3'],                            // Spanish/Portuguese
    ['ferritina', '2276-4'],                             // Spanish/Portuguese
  ];

  for (const [input, expectedLoinc] of tests) {
    const result = findMarkerByName(input);
    assert(result?.loinc === expectedLoinc, `"${input}" → ${result?.loinc || 'NOT FOUND'} (expected ${expectedLoinc})`);
  }
}

section('LOINC Dictionary — LOINC Code Lookup');
{
  const tests: [string, string][] = [
    ['11580-8', 'TSH'],
    ['4548-4', 'HbA1c'],
    ['2276-4', 'Ferritin'],
    ['30522-7', 'hs-CRP'],
    ['718-7', 'Hemoglobin'],
  ];

  for (const [loinc, expectedName] of tests) {
    const result = findMarkerByLoinc(loinc);
    assert(result?.standardName === expectedName, `LOINC ${loinc} → ${result?.standardName || 'NOT FOUND'} (expected ${expectedName})`);
  }
}

section('LOINC Dictionary — Unit Conversion');
{
  const tsh = findMarkerByName('TSH')!;
  const converted = convertUnit(tsh, 2.5, 'mIU/L', 'uIU/mL');
  assert(converted === 2.5, `TSH 2.5 mIU/L = ${converted} uIU/mL (same units)`);

  const glucose = findMarkerByName('Fasting Glucose')!;
  const glucoseMmol = convertUnit(glucose, 90, 'mg/dL', 'mmol/L');
  assert(glucoseMmol !== null && Math.abs(glucoseMmol - 4.995) < 0.01, `Glucose 90 mg/dL = ${glucoseMmol?.toFixed(3)} mmol/L`);

  const vitD = findMarkerByName('Vitamin D')!;
  const vitDNmol = convertUnit(vitD, 50, 'ng/mL', 'nmol/L');
  assert(vitDNmol !== null && Math.abs(vitDNmol - 124.8) < 0.1, `Vitamin D 50 ng/mL = ${vitDNmol?.toFixed(1)} nmol/L`);

  // Reverse conversion
  const vitDBack = convertUnit(vitD, 124.8, 'nmol/L', 'ng/mL');
  assert(vitDBack !== null && Math.abs(vitDBack - 50) < 0.1, `Vitamin D 124.8 nmol/L = ${vitDBack?.toFixed(1)} ng/mL (reverse)`);
}

section('LOINC Dictionary — Category Grouping');
{
  const thyroid = getMarkersByCategory('thyroid');
  assert(thyroid.length >= 6, `Thyroid category has ${thyroid.length} markers (expected >= 6)`);
  const lipids = getMarkersByCategory('lipids');
  assert(lipids.length >= 5, `Lipids category has ${lipids.length} markers (expected >= 5)`);
  const cbc = getMarkersByCategory('cbc');
  assert(cbc.length >= 8, `CBC category has ${cbc.length} markers (expected >= 8)`);
}

// =========================================================================
// 2. HL7v2 PARSER
// =========================================================================
section('HL7v2 Parser');
{
  const hl7 = readFileSync(join(__dirname, '../test-data/sample-hl7v2.txt'), 'utf-8');
  const parsed = parseHL7v2(hl7);

  assert(parsed.messageType !== '', `Message type detected: ${parsed.messageType}`);
  assert(parsed.sendingFacility === 'QUEST_LAB' || parsed.sendingFacility === 'QUEST', `Sending facility: ${parsed.sendingFacility}`);
  assert(parsed.patient.id === 'PAT12345', `Patient ID: ${parsed.patient.id}`);
  assert(parsed.patient.name?.includes('Sarah'), `Patient name: ${parsed.patient.name}`);
  assert(parsed.results.length >= 15, `Parsed ${parsed.results.length} results (expected >= 15)`);

  // Check specific results
  const tshResult = parsed.results.find(r => r.loincCode === '11580-8');
  assert(tshResult !== undefined, 'Found TSH result by LOINC code');
  assert(tshResult?.value === '3.8', `TSH value = ${tshResult?.value}`);
  assert(tshResult?.unit === 'mIU/L', `TSH unit = ${tshResult?.unit}`);

  const ferritinResult = parsed.results.find(r => r.loincCode === '2276-4');
  assert(ferritinResult !== undefined, 'Found Ferritin result');
  assert(ferritinResult?.value === '18', `Ferritin value = ${ferritinResult?.value}`);

  const hgbResult = parsed.results.find(r => r.loincCode === '718-7');
  assert(hgbResult !== undefined, 'Found Hemoglobin result');
  assert(hgbResult?.abnormalFlag === 'low', `Hemoglobin flag = ${hgbResult?.abnormalFlag}`);
}

// =========================================================================
// 3. WEARABLE PARSER (Oura)
// =========================================================================
section('Wearable Parser — Oura JSON');
{
  const ouraData = readFileSync(join(__dirname, '../test-data/sample-oura-sleep.json'), 'utf-8');
  const parsed = parseWearableData(ouraData, 'oura');

  assert(parsed.source === 'oura', `Source: ${parsed.source}`);
  assert(parsed.dailySummaries.length === 7, `${parsed.dailySummaries.length} daily summaries (expected 7)`);
  assert(parsed.totalDataPoints > 0, `${parsed.totalDataPoints} data points`);

  const firstDay = parsed.dailySummaries[0];
  assert(firstDay.avgHrv !== undefined, `First day HRV: ${firstDay.avgHrv}`);
  assert(firstDay.restingHeartRate !== undefined, `First day resting HR: ${firstDay.restingHeartRate}`);
  assert(firstDay.sleepMinutes !== undefined, `First day sleep: ${firstDay.sleepMinutes} min`);
  assert(firstDay.sleepEfficiency !== undefined, `First day efficiency: ${firstDay.sleepEfficiency}%`);
}

// =========================================================================
// 4. GENOMIC PARSER (23andMe)
// =========================================================================
section('Genomic Parser — 23andMe');
{
  const genomicData = readFileSync(join(__dirname, '../test-data/sample-23andme-snippet.txt'), 'utf-8');
  const parsed = parseGenomicData(genomicData, '23andme');

  assert(parsed.source === '23andme', `Source: ${parsed.source}`);
  assert(parsed.clinicallyRelevant >= 15, `${parsed.clinicallyRelevant} clinically relevant variants (expected >= 15)`);

  // Check MTHFR
  const mthfr677 = parsed.variants.find(v => v.rsid === 'rs1801133');
  assert(mthfr677 !== undefined, 'Found MTHFR C677T');
  assert(mthfr677?.riskLevel === 'heterozygous', `MTHFR C677T risk: ${mthfr677?.riskLevel} (CT genotype)`);
  assert(mthfr677?.gene === 'MTHFR', `MTHFR gene: ${mthfr677?.gene}`);

  // Check COMT
  const comt = parsed.variants.find(v => v.rsid === 'rs4680');
  assert(comt !== undefined, 'Found COMT');
  assert(comt?.riskLevel === 'heterozygous', `COMT risk: ${comt?.riskLevel} (AG genotype)`);

  // Check methylation profile
  assert(parsed.methylationStatus !== null, 'Methylation profile generated');
  assert(parsed.methylationStatus?.mthfrC677T === 'heterozygous', `MTHFR C677T: ${parsed.methylationStatus?.mthfrC677T}`);
  assert(parsed.methylationStatus?.mthfrA1298C === 'heterozygous', `MTHFR A1298C: ${parsed.methylationStatus?.mthfrA1298C}`);
  assert(
    parsed.methylationStatus?.overallStatus !== 'normal',
    `Methylation status: ${parsed.methylationStatus?.overallStatus} (compound heterozygote — expected impaired)`
  );

  // Check pharmacogenomics
  assert(parsed.pharmacogenomicSummary.length >= 1, `${parsed.pharmacogenomicSummary.length} pharm summaries`);
  const cyp2d6 = parsed.pharmacogenomicSummary.find(p => p.gene === 'CYP2D6');
  assert(cyp2d6 !== undefined, 'Found CYP2D6 pharm summary');

  // Check suggested labs
  assert(parsed.suggestedLabTests.length >= 3, `${parsed.suggestedLabTests.length} suggested lab tests`);
  const homocysteineSuggested = parsed.suggestedLabTests.find(t => t.loinc === '10839-9');
  assert(homocysteineSuggested !== undefined, 'Suggested homocysteine test (based on MTHFR)');
}

// =========================================================================
// 5. AUTO-DETECT FORMAT
// =========================================================================
section('Auto-Detect Format');
{
  // HL7v2
  const hl7 = 'MSH|^~\\&|QUEST|LAB|||20260310||ORU^R01|MSG001|P|2.5\nPID|1||123';
  const hl7Format = detectFormat(hl7);
  assert(hl7Format.type === 'hl7v2', `HL7v2 detected: ${hl7Format.type} (confidence: ${hl7Format.confidence})`);

  // CCDA
  const ccda = '<?xml version="1.0"?><ClinicalDocument xmlns="urn:hl7-org:v3"><templateId root="2.16.840.1.113883.10.20.22.1.1"/></ClinicalDocument>';
  const ccdaFormat = detectFormat(ccda);
  assert(ccdaFormat.type === 'ccda', `CCDA detected: ${ccdaFormat.type}`);

  // FHIR JSON
  const fhir = '{"resourceType":"Bundle","type":"searchset","entry":[{"resource":{"resourceType":"Observation"}}]}';
  const fhirFormat = detectFormat(fhir);
  assert(fhirFormat.type === 'fhir_json', `FHIR detected: ${fhirFormat.type}`);

  // Oura JSON
  const oura = '{"data":[{"day":"2026-03-01","average_hrv":35,"efficiency":82}]}';
  const ouraFormat = detectFormat(oura);
  assert(ouraFormat.type === 'oura_json', `Oura detected: ${ouraFormat.type}`);

  // 23andMe
  const genData = '# 23andMe raw data\n# rsid\tchromosome\tposition\tgenotype\nrs1801133\t1\t11856378\tCT';
  const genFormat = detectFormat(genData);
  assert(genFormat.type === '23andme', `23andMe detected: ${genFormat.type}`);

  // VCF
  const vcf = '##fileformat=VCFv4.2\n#CHROM\tPOS\tID\tREF\tALT\tQUAL';
  const vcfFormat = detectFormat(vcf);
  assert(vcfFormat.type === 'vcf', `VCF detected: ${vcfFormat.type}`);

  // Dexcom JSON
  const dexcom = '{"egvs":[{"systemTime":"2026-03-01T08:00:00","value":105}]}';
  const dexcomFormat = detectFormat(dexcom);
  assert(dexcomFormat.type === 'dexcom_json', `Dexcom detected: ${dexcomFormat.type}`);

  // Withings JSON
  const withings = '{"body":{"measuregrps":[{"date":1709312400,"measures":[]}]}}';
  const withingsFormat = detectFormat(withings);
  assert(withingsFormat.type === 'withings_json', `Withings detected: ${withingsFormat.type}`);

  // Raw text with lab values
  const rawLab = 'TSH  3.8  mIU/L  0.4-4.5\nFree T4  1.2  ng/dL  0.8-1.8\nFerritin  18  ng/mL  12-150';
  const rawFormat = detectFormat(rawLab);
  assert(rawFormat.type === 'raw_text', `Raw text detected: ${rawFormat.type}`);
}

// =========================================================================
// 6. PATTERN DETECTION
// =========================================================================
section('Pattern Detection — Thyroid Conversion');
{
  const results = new Map<string, number>();
  results.set('11580-8', 3.8);  // TSH
  results.set('3051-0', 2.4);   // Free T3
  results.set('3016-3', 1.2);   // Free T4

  const patterns = detectPatterns(results);
  const thyroid = patterns.find(p => p.id === 'thyroid_conversion');
  assert(thyroid !== undefined, 'Detected thyroid conversion pattern');
  assert(thyroid?.markers_involved.includes('TSH'), 'TSH in markers');
  assert(thyroid?.markers_involved.includes('Free T3'), 'Free T3 in markers');
}

section('Pattern Detection — Insulin Resistance');
{
  const results = new Map<string, number>();
  results.set('20578-1', 12.8);  // Fasting insulin
  results.set('1558-6', 92);     // Fasting glucose
  results.set('4548-4', 5.5);    // HbA1c
  results.set('2571-8', 125);    // Triglycerides
  results.set('2085-9', 48);     // HDL

  const patterns = detectPatterns(results);
  const ir = patterns.find(p => p.id === 'insulin_resistance');
  assert(ir !== undefined, 'Detected insulin resistance pattern');
  assert(ir?.confidence === 'high', `IR confidence: ${ir?.confidence}`);
}

section('Pattern Detection — Iron Deficiency');
{
  const results = new Map<string, number>();
  results.set('2276-4', 18);     // Ferritin
  results.set('2498-4', 52);     // Iron
  results.set('14800-7', 13);    // Iron saturation
  results.set('718-7', 11.8);    // Hemoglobin
  results.set('787-2', 86.6);    // MCV

  const patterns = detectPatterns(results);
  const iron = patterns.find(p => p.id === 'iron_deficiency');
  assert(iron !== undefined, 'Detected iron deficiency pattern');

  const anemia = patterns.find(p => p.id === 'anemia_differential');
  assert(anemia !== undefined, 'Detected anemia differential');
  assert(anemia?.name.includes('Normocytic'), `Anemia type: ${anemia?.name} (MCV 86.6 = normocytic)`);
}

section('Pattern Detection — Methylation');
{
  const results = new Map<string, number>();
  results.set('10839-9', 11.4);  // Homocysteine
  results.set('2132-9', 310);    // B12
  results.set('2284-8', 6.8);    // Folate

  const patterns = detectPatterns(results);
  const meth = patterns.find(p => p.id === 'methylation_dysfunction');
  assert(meth !== undefined, 'Detected methylation dysfunction');
  assert(meth?.confidence === 'high', `Methylation confidence: ${meth?.confidence}`);
}

section('Pattern Detection — Metabolic Syndrome');
{
  const results = new Map<string, number>();
  results.set('2571-8', 125);    // Triglycerides
  results.set('2085-9', 48);     // HDL
  results.set('1558-6', 92);     // Glucose
  results.set('20578-1', 12.8);  // Insulin
  results.set('4548-4', 5.5);    // HbA1c
  results.set('2324-2', 48);     // GGT
  results.set('1742-6', 38);     // ALT

  const patterns = detectPatterns(results);
  const metSyn = patterns.find(p => p.id === 'metabolic_syndrome_full');
  assert(metSyn !== undefined, 'Detected metabolic syndrome');
}

section('Pattern Detection — Liver Dysfunction');
{
  const results = new Map<string, number>();
  results.set('1742-6', 38);     // ALT
  results.set('1920-8', 32);     // AST
  results.set('2324-2', 48);     // GGT

  const patterns = detectPatterns(results);
  const liver = patterns.find(p => p.id === 'liver_dysfunction');
  assert(liver !== undefined, 'Detected liver dysfunction');
}

section('Pattern Detection — Full Sarah Case (all data combined)');
{
  // This is the full sample-quest-labs.txt case
  const results = new Map<string, number>();
  results.set('11580-8', 3.8);   // TSH
  results.set('3016-3', 1.2);    // Free T4
  results.set('3051-0', 2.4);    // Free T3
  results.set('2571-8', 125);    // Triglycerides
  results.set('2085-9', 48);     // HDL
  results.set('13457-7', 142);   // LDL
  results.set('2093-3', 215);    // Total cholesterol
  results.set('2498-4', 52);     // Iron
  results.set('2276-4', 18);     // Ferritin
  results.set('14800-7', 13);    // Iron saturation
  results.set('2500-7', 410);    // TIBC
  results.set('30522-7', 2.1);   // hs-CRP
  results.set('10839-9', 11.4);  // Homocysteine
  results.set('4537-7', 18);     // ESR
  results.set('4548-4', 5.5);    // HbA1c
  results.set('20578-1', 12.8);  // Fasting insulin
  results.set('1558-6', 92);     // Glucose
  results.set('1989-3', 28);     // Vitamin D
  results.set('2132-9', 310);    // B12
  results.set('2284-8', 6.8);    // Folate
  results.set('718-7', 11.8);    // Hemoglobin
  results.set('787-2', 86.6);    // MCV
  results.set('788-0', 14.8);    // RDW
  results.set('1742-6', 38);     // ALT
  results.set('1920-8', 32);     // AST
  results.set('2324-2', 48);     // GGT
  results.set('1751-7', 3.8);    // Albumin

  const patterns = detectPatterns(results);

  console.log(`  Total patterns detected: ${patterns.length}`);
  for (const p of patterns) {
    console.log(`  → ${p.name} (${p.confidence})`);
  }

  assert(patterns.length >= 5, `Detected ${patterns.length} patterns (expected >= 5 for this comprehensive case)`);

  // Should find at least these:
  const expectedPatterns = ['thyroid_conversion', 'insulin_resistance', 'iron_deficiency', 'methylation_dysfunction', 'chronic_inflammation'];
  for (const expected of expectedPatterns) {
    const found = patterns.find(p => p.id === expected);
    assert(found !== undefined, `Found expected pattern: ${expected}`);
  }
}

// =========================================================================
// SUMMARY
// =========================================================================
console.log(`\n${'═'.repeat(50)}`);
console.log(`RESULTS: ${passed} passed, ${failed} failed, ${passed + failed} total`);
console.log(`${'═'.repeat(50)}`);

if (failed > 0) {
  process.exit(1);
}
