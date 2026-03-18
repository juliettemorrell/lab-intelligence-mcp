/**
 * HL7v2 Message Parser
 *
 * Parses HL7 v2.x messages (ORU^R01 — Observation Result) into normalized
 * lab results. HL7v2 is still the dominant format in healthcare — most lab
 * interfaces (Quest, LabCorp, hospital labs) send results as HL7v2 pipe-delimited messages.
 *
 * Handles:
 *   - ORU^R01 (Unsolicited Observation Result)
 *   - OUL^R22 (Unsolicited Lab Observation)
 *   - Standard segments: MSH, PID, OBR, OBX, NTE
 *   - Encoding characters: |^~\&
 *   - Repeated fields and components
 *   - LOINC codes in OBX-3
 *   - Reference ranges in OBX-7
 *   - Abnormal flags in OBX-8
 */

export interface HL7ParsedResult {
  testName: string;
  value: string;
  unit: string;
  referenceRange: string;
  abnormalFlag: string;
  loincCode: string | null;
  observationDate: string | null;
  status: string;
  producerId: string | null;
  specimenType: string | null;
  orderingProvider: string | null;
  patientId: string | null;
  patientName: string | null;
  notes: string[];
}

export interface HL7ParsedMessage {
  messageType: string;
  sendingFacility: string;
  receivingFacility: string;
  messageDateTime: string;
  patient: {
    id: string | null;
    name: string | null;
    dob: string | null;
    sex: string | null;
  };
  results: HL7ParsedResult[];
  rawSegmentCount: number;
}

/**
 * Parse an HL7v2 message string into structured lab results.
 */
export function parseHL7v2(message: string): HL7ParsedMessage {
  // Normalize line endings
  const lines = message.replace(/\r\n/g, '\r').replace(/\n/g, '\r').split('\r').filter(l => l.trim());

  const segments = lines.map(line => parseSegment(line));

  // Extract header info
  const msh = segments.find(s => s.name === 'MSH');
  const pid = segments.find(s => s.name === 'PID');

  const messageType = msh ? getField(msh, 9) : 'UNKNOWN';
  const sendingFacility = msh ? getComponent(getField(msh, 4), 1) : '';
  const receivingFacility = msh ? getComponent(getField(msh, 6), 1) : '';
  const messageDateTime = msh ? getField(msh, 7) : '';

  // Extract patient info from PID
  const patient = {
    id: pid ? getComponent(getField(pid, 3), 1) : null,
    name: pid ? formatHL7Name(getField(pid, 5)) : null,
    dob: pid ? formatHL7Date(getField(pid, 7)) : null,
    sex: pid ? getField(pid, 8) : null,
  };

  // Extract results from OBX segments
  const results: HL7ParsedResult[] = [];
  let currentNotes: string[] = [];
  let currentOBR: ParsedSegment | null = null;

  for (const seg of segments) {
    if (seg.name === 'OBR') {
      currentOBR = seg;
      currentNotes = [];
    }

    if (seg.name === 'OBX') {
      const result = parseOBX(seg, currentOBR, patient);
      if (result) {
        // Attach any preceding NTE notes
        result.notes = [...currentNotes];
        currentNotes = [];
        results.push(result);
      }
    }

    if (seg.name === 'NTE') {
      const noteText = getField(seg, 3);
      if (noteText) currentNotes.push(noteText);
      // Attach to last result if we already have one
      if (results.length > 0 && seg.name === 'NTE') {
        results[results.length - 1].notes.push(noteText);
      }
    }
  }

  return {
    messageType,
    sendingFacility,
    receivingFacility,
    messageDateTime: formatHL7Date(messageDateTime) || messageDateTime,
    patient,
    results,
    rawSegmentCount: segments.length,
  };
}

// ---------------------------------------------------------------------------
// Segment parsing
// ---------------------------------------------------------------------------

interface ParsedSegment {
  name: string;
  fields: string[];
}

function parseSegment(line: string): ParsedSegment {
  const fields = line.split('|');
  return {
    name: fields[0] || '',
    fields,
  };
}

function getField(segment: ParsedSegment, index: number): string {
  // MSH is special — field 1 is the separator '|' itself, which is NOT in the split array.
  // So MSH field 2 (encoding chars) is at array index 1, field 3 at index 2, etc.
  // For MSH: array index = field number - 1
  if (segment.name === 'MSH') {
    if (index === 1) return '|';
    return segment.fields[index - 1] || '';
  }
  return segment.fields[index] || '';
}

function getComponent(field: string, componentIndex: number): string {
  const components = field.split('^');
  return components[componentIndex - 1] || '';
}

function getRepetitions(field: string): string[] {
  return field.split('~');
}

// ---------------------------------------------------------------------------
// OBX parsing (the meat — lab results live here)
// ---------------------------------------------------------------------------

function parseOBX(seg: ParsedSegment, obr: ParsedSegment | null, patient: any): HL7ParsedResult | null {
  // OBX structure:
  // OBX|1|NM|2093-3^Total Cholesterol^LN||195|mg/dL|125-200|N|||F
  // OBX|SetID|ValueType|ObservationID|ObsSub|Value|Units|RefRange|AbnFlag|Prob|Nature|Status

  const valueType = getField(seg, 2);  // NM (numeric), ST (string), TX (text), CE (coded)
  const observationId = getField(seg, 3);
  const value = getField(seg, 5);
  const units = getField(seg, 6);
  const refRange = getField(seg, 7);
  const abnormalFlag = getField(seg, 8);
  const status = getField(seg, 11);

  // Skip non-result OBX (headers, comments coded as OBX)
  if (!value && valueType !== 'TX') return null;

  // Parse observation ID — can be LOINC code^Display Name^Coding System
  const testCode = getComponent(observationId, 1);
  const testName = getComponent(observationId, 2) || testCode;
  const codingSystem = getComponent(observationId, 3);

  // Determine if this is a LOINC code
  const isLoinc = codingSystem === 'LN' || codingSystem === 'LOINC' ||
    /^\d{4,5}-\d$/.test(testCode); // LOINC format: NNNNN-N

  // Parse units — can be coded (CE) or plain text
  const unitText = getComponent(units, 1) || units;

  // Get observation date from OBR-7 or OBR-22
  let obsDate: string | null = null;
  if (obr) {
    obsDate = formatHL7Date(getField(obr, 7)) || formatHL7Date(getField(obr, 22));
  }

  // Get producer/performing lab from OBX-15 or OBR-32
  let producerId: string | null = null;
  const obxProducer = getField(seg, 15);
  if (obxProducer) producerId = getComponent(obxProducer, 1);
  else if (obr) {
    const obrProducer = getField(obr, 32);
    if (obrProducer) producerId = getComponent(obrProducer, 1);
  }

  // Get ordering provider from OBR-16
  let orderingProvider: string | null = null;
  if (obr) {
    const provider = getField(obr, 16);
    if (provider) orderingProvider = `${getComponent(provider, 2)} ${getComponent(provider, 3)}`.trim() || getComponent(provider, 1);
  }

  // Get specimen from OBR-15
  let specimenType: string | null = null;
  if (obr) {
    const specimen = getField(obr, 15);
    if (specimen) specimenType = getComponent(specimen, 2) || getComponent(specimen, 1);
  }

  return {
    testName: testName.trim(),
    value: value.trim(),
    unit: unitText.trim(),
    referenceRange: refRange.trim(),
    abnormalFlag: mapAbnormalFlag(abnormalFlag),
    loincCode: isLoinc ? testCode : null,
    observationDate: obsDate,
    status: mapResultStatus(status),
    producerId,
    specimenType,
    orderingProvider,
    patientId: patient.id,
    patientName: patient.name,
    notes: [],
  };
}

// ---------------------------------------------------------------------------
// HL7 date/name formatting
// ---------------------------------------------------------------------------

function formatHL7Date(hl7Date: string): string | null {
  if (!hl7Date || hl7Date.length < 8) return null;
  // HL7 dates: YYYYMMDD or YYYYMMDDHHmmss
  const year = hl7Date.substring(0, 4);
  const month = hl7Date.substring(4, 6);
  const day = hl7Date.substring(6, 8);
  if (hl7Date.length >= 12) {
    const hour = hl7Date.substring(8, 10);
    const min = hl7Date.substring(10, 12);
    return `${year}-${month}-${day}T${hour}:${min}:00`;
  }
  return `${year}-${month}-${day}`;
}

function formatHL7Name(nameField: string): string {
  // HL7 name: LastName^FirstName^MiddleName^Suffix^Prefix
  const last = getComponent(nameField, 1);
  const first = getComponent(nameField, 2);
  const middle = getComponent(nameField, 3);
  return [first, middle, last].filter(Boolean).join(' ');
}

function mapAbnormalFlag(flag: string): string {
  const flagMap: Record<string, string> = {
    'L': 'low', 'LL': 'critically_low', 'H': 'high', 'HH': 'critically_high',
    'N': 'normal', 'A': 'abnormal', 'AA': 'critically_abnormal',
    '<': 'below_threshold', '>': 'above_threshold', 'D': 'significant_change_down',
    'U': 'significant_change_up', 'W': 'worse', 'B': 'better',
  };
  return flagMap[flag.toUpperCase()] || flag || 'unknown';
}

function mapResultStatus(status: string): string {
  const statusMap: Record<string, string> = {
    'F': 'final', 'P': 'preliminary', 'C': 'corrected', 'R': 'entered',
    'I': 'pending', 'S': 'partial', 'X': 'cancelled', 'D': 'deleted',
  };
  return statusMap[status.toUpperCase()] || status || 'unknown';
}

/**
 * Detect if a string looks like an HL7v2 message
 */
export function isHL7v2Message(text: string): boolean {
  const trimmed = text.trim();
  return trimmed.startsWith('MSH|') || trimmed.includes('\rMSH|') || trimmed.includes('\nMSH|');
}
