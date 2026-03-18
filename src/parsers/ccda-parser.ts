/**
 * CCDA (Consolidated Clinical Document Architecture) Parser
 *
 * Parses C-CDA XML documents — the standard format for clinical document
 * exchange in the US (used by every EHR for data portability under MU/MIPS).
 *
 * Extracts lab results from the "Results" section of C-CDA documents.
 * Also handles older CDA R2 and generic CDA documents.
 *
 * Common sources:
 *   - Patient portal "Download My Data" exports
 *   - EHR-to-EHR transfers (Direct messaging)
 *   - Health Information Exchanges (HIEs)
 *   - Blue Button 2.0 exports
 */

export interface CCDALabResult {
  testName: string;
  value: string;
  unit: string;
  referenceRange: string;
  date: string | null;
  loincCode: string | null;
  status: string;
  interpretation: string | null;
  specimenType: string | null;
  performer: string | null;
}

export interface CCDAParsedDocument {
  documentType: string;
  patientName: string | null;
  patientDob: string | null;
  patientSex: string | null;
  patientMRN: string | null;
  documentDate: string | null;
  authorOrg: string | null;
  results: CCDALabResult[];
}

/**
 * Parse a C-CDA XML string into structured lab results.
 * Uses regex-based parsing (no XML library dependency).
 */
export function parseCCDA(xml: string): CCDAParsedDocument {
  // Detect document type
  const docType = detectCCDAType(xml);

  // Extract patient demographics
  const patient = extractPatientInfo(xml);

  // Extract document metadata
  const docDate = extractTag(xml, 'effectiveTime', 'value') ||
    extractTag(xml, 'effectiveTime', null);
  const authorOrg = extractBetween(xml, '<representedOrganization>', '</representedOrganization>');
  const authorOrgName = authorOrg ? extractBetween(authorOrg, '<name>', '</name>') : null;

  // Extract lab results from Results section
  const results = extractLabResults(xml);

  return {
    documentType: docType,
    patientName: patient.name,
    patientDob: patient.dob,
    patientSex: patient.sex,
    patientMRN: patient.mrn,
    documentDate: formatCCDADate(docDate),
    authorOrg: authorOrgName,
    results,
  };
}

function detectCCDAType(xml: string): string {
  if (xml.includes('2.16.840.1.113883.10.20.22.1.1')) return 'CCD (Continuity of Care Document)';
  if (xml.includes('2.16.840.1.113883.10.20.22.1.2')) return 'C-CDA Consultation Note';
  if (xml.includes('2.16.840.1.113883.10.20.22.1.9')) return 'C-CDA Progress Note';
  if (xml.includes('transferSummary')) return 'Transfer Summary';
  if (xml.includes('ClinicalDocument')) return 'CDA R2 Document';
  return 'Unknown CDA';
}

function extractPatientInfo(xml: string) {
  const patientRole = extractBetween(xml, '<patientRole>', '</patientRole>') || '';
  const patient = extractBetween(patientRole, '<patient>', '</patient>') || '';

  // Name
  const nameBlock = extractBetween(patient, '<name>', '</name>') || '';
  const given = extractBetween(nameBlock, '<given>', '</given>');
  const family = extractBetween(nameBlock, '<family>', '</family>');
  const name = [given, family].filter(Boolean).join(' ') || null;

  // DOB
  const dobTag = extractBetween(patient, '<birthTime', '/>');
  const dob = dobTag ? extractAttr(dobTag, 'value') : null;

  // Sex
  const genderTag = extractBetween(patient, '<administrativeGenderCode', '/>');
  const sex = genderTag ? extractAttr(genderTag, 'code') : null;

  // MRN
  const idTag = extractBetween(patientRole, '<id', '/>');
  const mrn = idTag ? extractAttr(idTag, 'extension') : null;

  return {
    name,
    dob: formatCCDADate(dob),
    sex: sex === 'F' ? 'female' : sex === 'M' ? 'male' : sex,
    mrn,
  };
}

function extractLabResults(xml: string): CCDALabResult[] {
  const results: CCDALabResult[] = [];

  // Find the Results section by templateId or title
  const resultsSection = findSection(xml, '2.16.840.1.113883.10.20.22.2.3') ||  // Results section templateId
    findSectionByTitle(xml, 'Results') ||
    findSectionByTitle(xml, 'Laboratory') ||
    findSectionByTitle(xml, 'Lab Results');

  if (!resultsSection) return results;

  // Extract all observation entries
  const observations = extractAllBetween(resultsSection, '<observation', '</observation>');

  for (const obs of observations) {
    // Skip non-lab observations
    const classCode = extractAttr(obs, 'classCode');
    if (classCode && classCode !== 'OBS') continue;

    // Test name and LOINC from <code>
    const codeTag = extractBetween(obs, '<code', '/>') || extractBetween(obs, '<code', '</code>');
    let testName = '';
    let loincCode: string | null = null;

    if (codeTag) {
      const displayName = extractAttr(codeTag, 'displayName');
      const code = extractAttr(codeTag, 'code');
      const codeSystem = extractAttr(codeTag, 'codeSystem');

      testName = displayName || '';
      if (codeSystem === '2.16.840.1.113883.6.1' || codeTag.includes('LOINC')) {
        loincCode = code;
      }

      // Also check translation elements for LOINC
      if (!loincCode) {
        const translation = extractBetween(obs, '<translation', '/>');
        if (translation) {
          const transSystem = extractAttr(translation, 'codeSystem');
          if (transSystem === '2.16.840.1.113883.6.1') {
            loincCode = extractAttr(translation, 'code');
          }
        }
      }
    }

    // Value from <value>
    const valueTag = extractBetween(obs, '<value', '/>') || extractBetween(obs, '<value', '</value>');
    let value = '';
    let unit = '';

    if (valueTag) {
      const xsiType = extractAttr(valueTag, 'xsi:type') || extractAttr(valueTag, 'type');
      if (xsiType === 'PQ') { // Physical Quantity
        value = extractAttr(valueTag, 'value') || '';
        unit = extractAttr(valueTag, 'unit') || '';
      } else if (xsiType === 'ST' || xsiType === 'ED') { // String/Text
        value = valueTag.replace(/<[^>]+>/g, '').trim();
      } else {
        value = extractAttr(valueTag, 'value') || valueTag.replace(/<[^>]+>/g, '').trim();
        unit = extractAttr(valueTag, 'unit') || '';
      }
    }

    // Reference range from <referenceRange>
    const refRange = extractBetween(obs, '<referenceRange>', '</referenceRange>') || '';
    const refText = extractBetween(refRange, '<text>', '</text>') || '';
    const refLow = extractBetween(refRange, '<low', '/>');
    const refHigh = extractBetween(refRange, '<high', '/>');
    let referenceRange = refText;
    if (!referenceRange && refLow && refHigh) {
      const low = extractAttr(refLow, 'value');
      const high = extractAttr(refHigh, 'value');
      referenceRange = `${low || ''}-${high || ''}`;
    }

    // Date from <effectiveTime>
    const effectiveTime = extractBetween(obs, '<effectiveTime', '/>');
    const date = effectiveTime ? extractAttr(effectiveTime, 'value') : null;

    // Status
    const statusTag = extractBetween(obs, '<statusCode', '/>');
    const status = (statusTag ? extractAttr(statusTag, 'code') : null) || 'completed';

    // Interpretation
    const interpTag = extractBetween(obs, '<interpretationCode', '/>');
    const interp = interpTag ? extractAttr(interpTag, 'code') : null;

    if (testName || loincCode) {
      results.push({
        testName,
        value,
        unit,
        referenceRange,
        date: formatCCDADate(date),
        loincCode,
        status,
        interpretation: interp,
        specimenType: null,
        performer: null,
      });
    }
  }

  return results;
}

// ---------------------------------------------------------------------------
// XML helpers (no dependency parsing)
// ---------------------------------------------------------------------------

function extractBetween(xml: string, startTag: string, endTag: string): string | null {
  const startIdx = xml.indexOf(startTag);
  if (startIdx === -1) return null;
  const contentStart = xml.indexOf('>', startIdx) + 1;
  if (endTag === '/>') {
    const closeIdx = xml.indexOf('/>', startIdx);
    if (closeIdx === -1) return null;
    return xml.substring(startIdx, closeIdx + 2);
  }
  const endIdx = xml.indexOf(endTag, contentStart);
  if (endIdx === -1) return null;
  return xml.substring(contentStart, endIdx);
}

function extractAllBetween(xml: string, startTag: string, endTag: string): string[] {
  const results: string[] = [];
  let searchFrom = 0;
  while (true) {
    const startIdx = xml.indexOf(startTag, searchFrom);
    if (startIdx === -1) break;
    const endIdx = xml.indexOf(endTag, startIdx);
    if (endIdx === -1) break;
    results.push(xml.substring(startIdx, endIdx + endTag.length));
    searchFrom = endIdx + endTag.length;
  }
  return results;
}

function extractAttr(tagContent: string, attrName: string): string | null {
  const patterns = [
    new RegExp(`${attrName}="([^"]*)"`, 'i'),
    new RegExp(`${attrName}='([^']*)'`, 'i'),
  ];
  for (const pattern of patterns) {
    const match = tagContent.match(pattern);
    if (match) return match[1];
  }
  return null;
}

function extractTag(xml: string, tagName: string, attrName: string | null): string | null {
  const tagStart = xml.indexOf(`<${tagName}`);
  if (tagStart === -1) return null;
  const tagEnd = xml.indexOf('>', tagStart);
  if (tagEnd === -1) return null;
  const tagContent = xml.substring(tagStart, tagEnd + 1);

  if (attrName) return extractAttr(tagContent, attrName);
  return extractBetween(xml, `<${tagName}>`, `</${tagName}>`);
}

function findSection(xml: string, templateId: string): string | null {
  const idx = xml.indexOf(templateId);
  if (idx === -1) return null;
  // Walk back to find the containing <section> or <component>
  const sectionStart = xml.lastIndexOf('<section', idx);
  if (sectionStart === -1) return null;
  const sectionEnd = xml.indexOf('</section>', idx);
  if (sectionEnd === -1) return null;
  return xml.substring(sectionStart, sectionEnd + '</section>'.length);
}

function findSectionByTitle(xml: string, title: string): string | null {
  const titlePattern = new RegExp(`<title[^>]*>${title}[^<]*</title>`, 'i');
  const match = xml.match(titlePattern);
  if (!match) return null;
  const titleIdx = xml.indexOf(match[0]);
  const sectionStart = xml.lastIndexOf('<section', titleIdx);
  if (sectionStart === -1) return null;
  const sectionEnd = xml.indexOf('</section>', titleIdx);
  if (sectionEnd === -1) return null;
  return xml.substring(sectionStart, sectionEnd + '</section>'.length);
}

function formatCCDADate(date: string | null): string | null {
  if (!date) return null;
  // CCDA dates: YYYYMMDD or YYYYMMDDHHmmss+timezone
  const clean = date.replace(/[^\d]/g, '').substring(0, 14);
  if (clean.length < 8) return null;
  const year = clean.substring(0, 4);
  const month = clean.substring(4, 6);
  const day = clean.substring(6, 8);
  return `${year}-${month}-${day}`;
}

/**
 * Detect if a string looks like a C-CDA or CDA document
 */
export function isCCDADocument(text: string): boolean {
  const trimmed = text.trim();
  return trimmed.includes('ClinicalDocument') ||
    trimmed.includes('urn:hl7-org:v3') ||
    trimmed.includes('2.16.840.1.113883');
}
