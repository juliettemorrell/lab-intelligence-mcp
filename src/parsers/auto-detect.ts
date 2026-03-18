/**
 * Auto-Detection Engine
 *
 * Detects the format of incoming health data and routes to the correct
 * parser. This is the "universal ingest" — throw anything at it and it
 * figures out what it is.
 *
 * Detection priority (deterministic, fast):
 *   1. HL7v2 message (starts with "MSH|")
 *   2. CCDA/CDA XML (contains "ClinicalDocument")
 *   3. Apple Health XML (contains "<HealthData")
 *   4. VCF genomic data (starts with "##fileformat=VCF")
 *   5. 23andMe/AncestryDNA (header with "rsid" + "chromosome")
 *   6. FHIR JSON (has "resourceType")
 *   7. Wearable JSON (known structures: Oura, Withings, Garmin, Fitbit, WHOOP, Dexcom)
 *   8. CSV/TSV (comma or tab delimited with header row)
 *   9. Raw text (unstructured — lab report, patient portal copy-paste)
 *
 * Design principle: ALL format detection is deterministic code.
 * NO LLM is used for format detection — only for raw text interpretation
 * when no structured format is detected.
 */

export type DetectedFormat =
  | { type: 'hl7v2'; confidence: number }
  | { type: 'ccda'; confidence: number }
  | { type: 'fhir_json'; confidence: number; resourceType: string }
  | { type: 'apple_health_xml'; confidence: number }
  | { type: 'vcf'; confidence: number }
  | { type: '23andme'; confidence: number }
  | { type: 'ancestrydna'; confidence: number }
  | { type: 'oura_json'; confidence: number }
  | { type: 'withings_json'; confidence: number }
  | { type: 'garmin_json'; confidence: number }
  | { type: 'fitbit_json'; confidence: number }
  | { type: 'whoop_json'; confidence: number }
  | { type: 'dexcom_json'; confidence: number }
  | { type: 'rupa_json'; confidence: number }
  | { type: 'csv'; confidence: number; delimiter: string; hasLabData: boolean; hasWearableData: boolean }
  | { type: 'raw_text'; confidence: number; hasLabValues: boolean; hasGenomicData: boolean }
  | { type: 'unknown'; confidence: 0 };

/**
 * Detect the format of incoming data. Returns the detected format with
 * a confidence score (0-1).
 *
 * This function is entirely deterministic — no LLM calls.
 */
export function detectFormat(data: string): DetectedFormat {
  const trimmed = data.trim();
  const first500 = trimmed.substring(0, 500).toLowerCase();

  // 1. HL7v2
  if (trimmed.startsWith('MSH|') || trimmed.includes('\nMSH|') || trimmed.includes('\rMSH|')) {
    return { type: 'hl7v2', confidence: 0.99 };
  }

  // 2. XML-based formats
  if (trimmed.startsWith('<?xml') || trimmed.startsWith('<')) {
    if (trimmed.includes('ClinicalDocument') || trimmed.includes('urn:hl7-org:v3')) {
      return { type: 'ccda', confidence: 0.95 };
    }
    if (trimmed.includes('<HealthData') || trimmed.includes('HKQuantityTypeIdentifier')) {
      return { type: 'apple_health_xml', confidence: 0.95 };
    }
  }

  // 3. VCF
  if (trimmed.startsWith('##fileformat=VCF') || (first500.includes('#chrom') && first500.includes('pos') && first500.includes('ref'))) {
    return { type: 'vcf', confidence: 0.98 };
  }

  // 4. 23andMe / AncestryDNA
  if (first500.includes('23andme') || (first500.includes('rsid') && first500.includes('chromosome') && first500.includes('genotype'))) {
    return { type: '23andme', confidence: 0.95 };
  }
  if (first500.includes('ancestrydna') || first500.includes('ancestry')) {
    return { type: 'ancestrydna', confidence: 0.90 };
  }

  // 5. JSON-based formats
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    try {
      const parsed = JSON.parse(trimmed);

      // FHIR
      if (parsed.resourceType) {
        return { type: 'fhir_json', confidence: 0.95, resourceType: parsed.resourceType };
      }
      if (parsed.entry?.[0]?.resource?.resourceType) {
        return { type: 'fhir_json', confidence: 0.95, resourceType: 'Bundle' };
      }

      // Oura
      if (parsed.data?.[0]?.day && (parsed.data[0].average_hrv !== undefined || parsed.data[0].efficiency !== undefined)) {
        return { type: 'oura_json', confidence: 0.90 };
      }

      // Withings
      if (parsed.body?.measuregrps) {
        return { type: 'withings_json', confidence: 0.95 };
      }

      // Garmin
      if (parsed.dailies || parsed.activities?.[0]?.calendarDate) {
        return { type: 'garmin_json', confidence: 0.85 };
      }

      // Fitbit
      if (parsed.sleep?.[0]?.dateOfSleep || parsed['activities-heart']) {
        return { type: 'fitbit_json', confidence: 0.90 };
      }

      // WHOOP
      if (parsed.records?.[0]?.recovery?.hrv_rmssd_milli !== undefined) {
        return { type: 'whoop_json', confidence: 0.90 };
      }

      // Dexcom
      if (parsed.egvs || parsed.records?.[0]?.glucoseValue !== undefined || parsed.glucoseValues) {
        return { type: 'dexcom_json', confidence: 0.90 };
      }

      // Rupa Health
      if (parsed.results?.[0]?.biomarker_name || parsed.orders?.[0]?.test_name) {
        return { type: 'rupa_json', confidence: 0.85 };
      }

    } catch {
      // Not valid JSON — continue to other checks
    }
  }

  // 6. CSV/TSV
  const lines = trimmed.split('\n');
  if (lines.length >= 2) {
    const firstLine = lines[0];
    let delimiter = ',';
    if (firstLine.split('\t').length > firstLine.split(',').length) delimiter = '\t';

    const headers = firstLine.toLowerCase().split(delimiter).map(h => h.trim());

    // Lab CSV
    const labHeaders = ['test', 'result', 'value', 'unit', 'reference', 'range', 'analyte', 'biomarker', 'loinc'];
    const hasLabHeaders = labHeaders.some(lh => headers.some(h => h.includes(lh)));

    // Wearable CSV
    const wearableHeaders = ['heart', 'hrv', 'sleep', 'steps', 'calories', 'spo2', 'glucose', 'readiness'];
    const hasWearableHeaders = wearableHeaders.some(wh => headers.some(h => h.includes(wh)));

    if (hasLabHeaders || hasWearableHeaders) {
      return { type: 'csv', confidence: 0.80, delimiter, hasLabData: hasLabHeaders, hasWearableData: hasWearableHeaders };
    }

    // Generic CSV with numbers
    const secondLine = lines[1];
    const hasNumbers = /\d+\.?\d*/.test(secondLine);
    if (headers.length >= 2 && hasNumbers) {
      return { type: 'csv', confidence: 0.50, delimiter, hasLabData: false, hasWearableData: false };
    }
  }

  // 7. Raw text with lab values
  const labPatterns = [
    /\b(tsh|hba1c|glucose|cholesterol|ldl|hdl|ferritin|vitamin d|b12|crp|hemoglobin|hematocrit|wbc|rbc|platelets)\b/i,
    /\d+\.?\d*\s*(mg\/dL|mmol\/L|ng\/mL|pg\/mL|mIU\/L|U\/L|g\/dL|%)/i,
    /reference\s*range|normal\s*range|ref\s*range/i,
  ];
  const hasLabValues = labPatterns.filter(p => p.test(trimmed)).length >= 2;

  const hasGenomicData = /rs\d+\s+[ACGT]{2}/i.test(trimmed);

  if (hasLabValues || hasGenomicData) {
    return { type: 'raw_text', confidence: 0.60, hasLabValues, hasGenomicData };
  }

  return { type: 'unknown', confidence: 0 };
}

/**
 * Get a human-readable description of the detected format.
 */
export function describeFormat(format: DetectedFormat): string {
  switch (format.type) {
    case 'hl7v2': return 'HL7 v2.x lab result message (pipe-delimited)';
    case 'ccda': return 'C-CDA/CDA clinical document (XML)';
    case 'fhir_json': return `FHIR R4 ${(format as any).resourceType} (JSON)`;
    case 'apple_health_xml': return 'Apple Health export (XML)';
    case 'vcf': return 'VCF genomic variant file';
    case '23andme': return '23andMe raw data export';
    case 'ancestrydna': return 'AncestryDNA raw data export';
    case 'oura_json': return 'Oura Ring API response (JSON)';
    case 'withings_json': return 'Withings API response (JSON)';
    case 'garmin_json': return 'Garmin Connect API response (JSON)';
    case 'fitbit_json': return 'Fitbit API response (JSON)';
    case 'whoop_json': return 'WHOOP API response (JSON)';
    case 'dexcom_json': return 'Dexcom CGM data (JSON)';
    case 'rupa_json': return 'Rupa Health lab results (JSON)';
    case 'csv': return `CSV/TSV file (${(format as any).hasLabData ? 'lab data' : (format as any).hasWearableData ? 'wearable data' : 'generic'})`;
    case 'raw_text': return `Unstructured text (${(format as any).hasLabValues ? 'contains lab values' : 'no lab values detected'})`;
    default: return 'Unknown format';
  }
}
