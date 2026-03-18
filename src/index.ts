#!/usr/bin/env node
/**
 * Lab Intelligence MCP Server
 *
 * Universal lab data normalizer and interpreter for functional medicine.
 * Ingests lab results from ANY source, normalizes to LOINC-coded FHIR
 * Observations, and applies functional medicine interpretation.
 *
 * INGESTION TOOLS (any source → standardized):
 *   - ingest_fhir          → From any FHIR R4 server (EHRs)
 *   - ingest_rupa           → From Rupa Health API
 *   - ingest_csv            → From CSV/TSV exports (Genova, DUTCH, etc.)
 *   - ingest_manual         → Direct value entry
 *   - ingest_raw_text       → LLM-parsed from unstructured text (PDFs, screenshots)
 *
 * ANALYSIS TOOLS:
 *   - normalize             → Map any lab names to LOINC codes, standardize units
 *   - interpret             → Apply functional medicine ranges + flag abnormals
 *   - detect_patterns       → Cross-biomarker clinical pattern recognition
 *   - trend                 → Compare results across time from any source mix
 *   - suggest_followup      → Recommend next tests based on findings
 *   - get_dictionary_info   → Look up any biomarker — aliases, ranges, related markers
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import {
  findMarkerByName,
  findMarkerByLoinc,
  getMarkersByCategory,
  convertUnit,
  getMapStats,
  LOINC_MAP,
  type LabMarkerDefinition,
  type LabCategory,
} from './loinc-map.js';
import { detectPatterns, type ClinicalPattern } from './patterns.js';
import { parseHL7v2, isHL7v2Message } from './parsers/hl7v2-parser.js';
import { parseCCDA, isCCDADocument } from './parsers/ccda-parser.js';
import { parseWearableData, isWearableData } from './parsers/wearable-parser.js';
import { parseGenomicData, isGenomicData } from './parsers/genomic-parser.js';
import { detectFormat, describeFormat } from './parsers/auto-detect.js';

const server = new McpServer({
  name: 'lab-intelligence',
  version: '1.0.0',
});

// ---------------------------------------------------------------------------
// Shared types
// ---------------------------------------------------------------------------

interface NormalizedResult {
  loinc: string;
  standardName: string;
  value: number;
  unit: string;
  originalName: string;
  originalUnit: string;
  originalSource: string;
  effectiveDate?: string;
  conventionalRange: { low?: number; high?: number };
  functionalRange: { low?: number; high?: number; notes?: string };
  conventionalFlag: 'normal' | 'low' | 'high';
  functionalFlag: 'optimal' | 'suboptimal_low' | 'suboptimal_high' | 'not_mapped';
  category: string;
  relatedMarkers: string[];
}

// ---------------------------------------------------------------------------
// INGESTION: FHIR R4
// ---------------------------------------------------------------------------
server.tool(
  'ingest_fhir',
  'Ingest lab results from any FHIR R4 server (Epic, Cerner, athena, etc.). Provide the FHIR server URL and patient ID. Returns normalized, LOINC-coded results with functional medicine interpretation.',
  {
    fhir_base_url: z.string().describe('FHIR server base URL'),
    patient_id: z.string().describe('FHIR Patient resource ID'),
    access_token: z.string().optional().describe('OAuth bearer token for the FHIR server'),
    date_from: z.string().optional().describe('ISO date — start of range'),
    date_to: z.string().optional().describe('ISO date — end of range'),
    category: z.string().optional().describe('FHIR category filter: laboratory, vital-signs'),
    _sharp: z.any().optional(),
  },
  async (args) => {
    const token = args.access_token || '';
    let url = `${args.fhir_base_url}/Observation?patient=${args.patient_id}&category=laboratory&_sort=-date&_count=200`;
    if (args.date_from) url += `&date=ge${args.date_from}`;
    if (args.date_to) url += `&date=le${args.date_to}`;

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/fhir+json' },
    });
    if (!res.ok) throw new Error(`FHIR server error ${res.status}: ${await res.text()}`);

    const bundle = await res.json();
    const observations = bundle.entry?.map((e: any) => e.resource) || [];

    const normalized = observations.map((obs: any) => normalizeObservation(obs, 'fhir')).filter(Boolean);

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          source: 'fhir',
          fhirServer: args.fhir_base_url,
          patientId: args.patient_id,
          totalRaw: observations.length,
          totalNormalized: normalized.length,
          results: normalized,
        }, null, 2),
      }],
    };
  }
);

// ---------------------------------------------------------------------------
// INGESTION: Rupa Health
// ---------------------------------------------------------------------------
server.tool(
  'ingest_rupa',
  'Ingest lab results from Rupa Health. Provide an order ID or patient email to pull results.',
  {
    order_id: z.string().optional(),
    patient_email: z.string().optional(),
    _sharp: z.any().optional(),
  },
  async (args) => {
    const apiKey = process.env.RUPA_API_KEY;
    if (!apiKey) throw new Error('RUPA_API_KEY not set');

    let endpoint = 'https://api.rupahealth.com/v1';
    if (args.order_id) {
      endpoint += `/orders/${args.order_id}/results`;
    } else if (args.patient_email) {
      endpoint += `/orders?patient_email=${encodeURIComponent(args.patient_email)}`;
    } else {
      return { content: [{ type: 'text', text: 'Error: Provide order_id or patient_email' }] };
    }

    const res = await fetch(endpoint, { headers: { Authorization: `Bearer ${apiKey}` } });
    if (!res.ok) throw new Error(`Rupa API ${res.status}`);
    const data = await res.json();

    const results = (data.results || data.orders || []).map((r: any) => ({
      name: r.biomarker_name || r.test_name,
      value: r.value,
      unit: r.unit,
      date: r.result_date,
      referenceRange: r.reference_range,
      labCompany: r.lab_company,
    }));

    const normalized = results.map((r: any) => normalizeRaw(r.name, r.value, r.unit, r.date, 'rupa')).filter(Boolean);

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({ source: 'rupa', totalRaw: results.length, totalNormalized: normalized.length, results: normalized }, null, 2),
      }],
    };
  }
);

// ---------------------------------------------------------------------------
// INGESTION: CSV
// ---------------------------------------------------------------------------
server.tool(
  'ingest_csv',
  'Ingest lab results from a CSV or TSV file. Handles exports from Genova Diagnostics, DUTCH, Vibrant Wellness, standard lab exports, etc. Specify which columns contain the test name, value, unit, and date.',
  {
    csv_content: z.string().describe('Raw CSV/TSV content'),
    delimiter: z.enum([',', '\t', '|']).optional().default(','),
    name_column: z.string().optional().default('Test Name').describe('Column header for test name'),
    value_column: z.string().optional().default('Result').describe('Column header for result value'),
    unit_column: z.string().optional().default('Units').describe('Column header for units'),
    date_column: z.string().optional().default('Date').describe('Column header for date'),
    source_lab: z.string().optional().describe('Lab company name (helps with name resolution)'),
  },
  async (args) => {
    const lines = args.csv_content.trim().split('\n');
    if (lines.length < 2) return { content: [{ type: 'text', text: 'Error: CSV must have header + at least 1 row' }] };

    const headers = lines[0].split(args.delimiter ?? ',').map(h => h.trim().replace(/^"|"$/g, ''));
    const nameIdx = headers.findIndex(h => h.toLowerCase().includes(args.name_column?.toLowerCase() || 'test'));
    const valueIdx = headers.findIndex(h => h.toLowerCase().includes(args.value_column?.toLowerCase() || 'result'));
    const unitIdx = headers.findIndex(h => h.toLowerCase().includes(args.unit_column?.toLowerCase() || 'unit'));
    const dateIdx = headers.findIndex(h => h.toLowerCase().includes(args.date_column?.toLowerCase() || 'date'));

    const results: NormalizedResult[] = [];
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(args.delimiter ?? ',').map(c => c.trim().replace(/^"|"$/g, ''));
      const name = nameIdx >= 0 ? cols[nameIdx] : null;
      const value = valueIdx >= 0 ? cols[valueIdx] : null;
      const unit = unitIdx >= 0 ? cols[unitIdx] : '';
      const date = dateIdx >= 0 ? cols[dateIdx] : undefined;

      if (name && value) {
        const n = normalizeRaw(name, value, unit, date, args.source_lab || 'csv');
        if (n) results.push(n);
      }
    }

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({ source: args.source_lab || 'csv', totalRows: lines.length - 1, totalNormalized: results.length, results }, null, 2),
      }],
    };
  }
);

// ---------------------------------------------------------------------------
// INGESTION: Manual entry
// ---------------------------------------------------------------------------
server.tool(
  'ingest_manual',
  'Manually enter lab results. Useful for phone-in results, patient-reported values, or quick lookups.',
  {
    results: z.array(z.object({
      name: z.string().describe('Test name (any format — will be normalized)'),
      value: z.number(),
      unit: z.string().optional(),
      date: z.string().optional(),
    })),
  },
  async (args) => {
    const normalized = args.results
      .map(r => normalizeRaw(r.name, r.value.toString(), r.unit || '', r.date, 'manual'))
      .filter(Boolean) as NormalizedResult[];

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({ source: 'manual', totalInput: args.results.length, totalNormalized: normalized.length, results: normalized }, null, 2),
      }],
    };
  }
);

// ---------------------------------------------------------------------------
// INGESTION: Raw text (LLM-assisted parsing)
// ---------------------------------------------------------------------------
server.tool(
  'ingest_raw_text',
  'Parse lab results from unstructured text — copied from a PDF, patient portal screenshot, faxed report, etc. Uses fuzzy matching to identify test names and values. Best effort — may need manual correction.',
  {
    text: z.string().describe('Raw text containing lab results'),
    source_description: z.string().optional().describe('Where this came from, e.g. "Quest Diagnostics PDF" or "patient portal screenshot"'),
  },
  async (args) => {
    // Parse "TestName   Value   Unit   Reference" patterns
    const lines = args.text.split('\n').map(l => l.trim()).filter(Boolean);
    const results: NormalizedResult[] = [];

    for (const line of lines) {
      // Try common patterns:
      // "TSH  2.45  mIU/L  0.4-4.5"
      // "Vitamin D, 25-OH: 42 ng/mL (30-100)"
      // "HbA1c    5.7%"
      const patterns = [
        /^(.+?)\s+([\d.]+)\s*([a-zA-Z%/^]+(?:\d+)?(?:\/[a-zA-Z]+)?)\s*/,  // name value unit
        /^(.+?):\s*([\d.]+)\s*([a-zA-Z%/^]+(?:\d+)?(?:\/[a-zA-Z]+)?)?/,    // name: value unit
        /^(.+?)\s+([\d.]+)\s*$/,                                              // name value (no unit)
      ];

      for (const pattern of patterns) {
        const match = line.match(pattern);
        if (match) {
          const [, name, value, unit] = match;
          const n = normalizeRaw(name.trim(), value, unit?.trim() || '', undefined, args.source_description || 'raw_text');
          if (n) {
            results.push(n);
            break;
          }
        }
      }
    }

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          source: args.source_description || 'raw_text',
          totalLines: lines.length,
          totalParsed: results.length,
          results,
          _note: 'Parsed via pattern matching. Review for accuracy.',
        }, null, 2),
      }],
    };
  }
);

// ---------------------------------------------------------------------------
// ANALYSIS: Normalize
// ---------------------------------------------------------------------------
server.tool(
  'normalize',
  'Take an array of lab results in any format and normalize them: map names to LOINC codes, standardize units, flag unknown markers. Use this as a preprocessing step before interpret or trend.',
  {
    results: z.array(z.object({
      name: z.string(),
      value: z.union([z.number(), z.string()]),
      unit: z.string().optional(),
      date: z.string().optional(),
      source: z.string().optional(),
    })),
  },
  async (args) => {
    const normalized = args.results.map(r =>
      normalizeRaw(r.name, r.value.toString(), r.unit || '', r.date, r.source || 'unknown')
    );
    const mapped = normalized.filter(Boolean) as NormalizedResult[];
    const unmapped = args.results.filter((r, i) => !normalized[i]).map(r => r.name);

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          totalInput: args.results.length,
          totalMapped: mapped.length,
          unmappedNames: unmapped,
          results: mapped,
        }, null, 2),
      }],
    };
  }
);

// ---------------------------------------------------------------------------
// ANALYSIS: Interpret
// ---------------------------------------------------------------------------
server.tool(
  'interpret',
  'Interpret normalized lab results through a functional medicine lens. Flags values that are "normal" conventionally but suboptimal functionally. Returns clinical significance for each marker.',
  {
    results: z.array(z.object({
      loinc: z.string().optional(),
      name: z.string(),
      value: z.number(),
      unit: z.string().optional(),
    })),
  },
  async (args) => {
    const interpreted = args.results.map(r => {
      const marker = r.loinc ? findMarkerByLoinc(r.loinc) : findMarkerByName(r.name);
      if (!marker) return { ...r, interpretation: 'Unknown marker — not in functional medicine dictionary' };

      let value = r.value;
      // Unit conversion if needed
      if (r.unit && r.unit !== marker.unit) {
        const converted = convertUnit(marker, r.value, r.unit, marker.unit);
        if (converted !== null) value = converted;
      }

      const convFlag = getConventionalFlag(value, marker);
      const funcFlag = getFunctionalFlag(value, marker);

      return {
        standardName: marker.standardName,
        loinc: marker.loinc,
        value,
        unit: marker.unit,
        category: marker.category,
        conventionalFlag: convFlag,
        functionalFlag: funcFlag,
        conventionalRange: marker.conventionalRange,
        functionalRange: marker.functionalRange,
        clinicalNote: funcFlag === 'suboptimal_low' || funcFlag === 'suboptimal_high'
          ? `${marker.standardName} is within conventional range but outside functional optimal. ${marker.functionalRange.notes || ''}`
          : undefined,
        relatedMarkers: marker.relatedMarkers.map(loinc => {
          const related = findMarkerByLoinc(loinc);
          return related ? related.standardName : loinc;
        }),
      };
    });

    return { content: [{ type: 'text', text: JSON.stringify(interpreted, null, 2) }] };
  }
);

// ---------------------------------------------------------------------------
// ANALYSIS: Pattern Detection
// ---------------------------------------------------------------------------
server.tool(
  'detect_patterns',
  'Analyze a set of lab results for clinical patterns. Identifies multi-biomarker signatures like thyroid conversion issues, insulin resistance, iron deficiency anemia, methylation problems, adrenal dysfunction, etc.',
  {
    results: z.array(z.object({
      loinc: z.string().optional(),
      name: z.string(),
      value: z.number(),
      unit: z.string().optional(),
    })),
  },
  async (args) => {
    // Normalize all results first
    const normalized: Map<string, number> = new Map();
    for (const r of args.results) {
      const marker = r.loinc ? findMarkerByLoinc(r.loinc) : findMarkerByName(r.name);
      if (marker) {
        let value = r.value;
        if (r.unit && r.unit !== marker.unit) {
          const converted = convertUnit(marker, r.value, r.unit, marker.unit);
          if (converted !== null) value = converted;
        }
        normalized.set(marker.loinc, value);
      }
    }

    const patterns = detectPatterns(normalized);

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          markersAnalyzed: normalized.size,
          patternsDetected: patterns.length,
          patterns,
        }, null, 2),
      }],
    };
  }
);

// ---------------------------------------------------------------------------
// ANALYSIS: Trend
// ---------------------------------------------------------------------------
server.tool(
  'trend',
  'Compare a biomarker across multiple time points, regardless of source. Handles mixed sources (e.g., one result from Quest via FHIR, another from Rupa, another manually entered).',
  {
    marker_name: z.string().describe('Biomarker name (any format)'),
    datapoints: z.array(z.object({
      value: z.number(),
      unit: z.string().optional(),
      date: z.string(),
      source: z.string().optional(),
    })),
  },
  async (args) => {
    const marker = findMarkerByName(args.marker_name);
    if (!marker) return { content: [{ type: 'text', text: `Unknown marker: ${args.marker_name}` }] };

    // Normalize all values to standard unit and sort by date
    const points = args.datapoints
      .map(d => {
        let value = d.value;
        if (d.unit && d.unit !== marker.unit) {
          const converted = convertUnit(marker, d.value, d.unit, marker.unit);
          if (converted !== null) value = converted;
        }
        return { value, unit: marker.unit, date: d.date, source: d.source || 'unknown' };
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Calculate trend
    const values = points.map(p => p.value);
    let direction = 'stable';
    if (values.length >= 2) {
      const first = values[0];
      const last = values[values.length - 1];
      const pctChange = ((last - first) / first) * 100;
      direction = pctChange > 5 ? 'increasing' : pctChange < -5 ? 'decreasing' : 'stable';
    }

    // Check if trending toward or away from functional optimal
    const lastValue = values[values.length - 1];
    const funcFlag = getFunctionalFlag(lastValue, marker);
    let clinicalTrend = 'stable';
    if (values.length >= 2) {
      const prevFlag = getFunctionalFlag(values[values.length - 2], marker);
      if (funcFlag === 'optimal' && prevFlag !== 'optimal') clinicalTrend = 'improving_to_optimal';
      else if (funcFlag !== 'optimal' && prevFlag === 'optimal') clinicalTrend = 'declining_from_optimal';
      else if (direction === 'increasing' && funcFlag === 'suboptimal_low') clinicalTrend = 'improving';
      else if (direction === 'decreasing' && funcFlag === 'suboptimal_high') clinicalTrend = 'improving';
    }

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          marker: marker.standardName,
          loinc: marker.loinc,
          unit: marker.unit,
          datapoints: points,
          trend: { direction, clinicalTrend },
          currentStatus: funcFlag,
          functionalRange: marker.functionalRange,
        }, null, 2),
      }],
    };
  }
);

// ---------------------------------------------------------------------------
// ANALYSIS: Suggest Follow-up
// ---------------------------------------------------------------------------
server.tool(
  'suggest_followup',
  'Based on current results, suggest additional tests that should be ordered. Uses clinical logic — e.g., if TSH is off, suggest Free T3, Free T4, antibodies.',
  {
    results: z.array(z.object({
      loinc: z.string().optional(),
      name: z.string(),
      value: z.number(),
    })),
  },
  async (args) => {
    const existingLoincs = new Set<string>();
    const suggestions: Array<{ test: string; loinc: string; reason: string; priority: 'high' | 'medium' | 'low' }> = [];

    // Map what we have
    for (const r of args.results) {
      const marker = r.loinc ? findMarkerByLoinc(r.loinc) : findMarkerByName(r.name);
      if (marker) existingLoincs.add(marker.loinc);
    }

    // For each result, check if related markers are missing
    for (const r of args.results) {
      const marker = r.loinc ? findMarkerByLoinc(r.loinc) : findMarkerByName(r.name);
      if (!marker) continue;

      const funcFlag = getFunctionalFlag(r.value, marker);

      if (funcFlag !== 'optimal') {
        for (const relatedLoinc of marker.relatedMarkers) {
          if (!existingLoincs.has(relatedLoinc)) {
            const related = findMarkerByLoinc(relatedLoinc);
            if (related) {
              suggestions.push({
                test: related.standardName,
                loinc: related.loinc,
                reason: `${marker.standardName} is ${funcFlag} — ${related.standardName} helps complete the clinical picture`,
                priority: funcFlag === 'suboptimal_high' || funcFlag === 'suboptimal_low' ? 'high' : 'medium',
              });
            }
          }
        }
      }
    }

    // Deduplicate
    const unique = [...new Map(suggestions.map(s => [s.loinc, s])).values()];

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({ suggestedTests: unique.sort((a, b) => a.priority === 'high' ? -1 : 1) }, null, 2),
      }],
    };
  }
);

// ---------------------------------------------------------------------------
// UTILITY: Dictionary Lookup
// ---------------------------------------------------------------------------
server.tool(
  'get_dictionary_info',
  'Look up any biomarker in the dictionary. Returns LOINC code, all known aliases, conventional and functional ranges, related markers, and category. Useful for checking if a test name will be recognized.',
  {
    query: z.string().describe('Test name, alias, or LOINC code'),
  },
  async (args) => {
    let marker = findMarkerByName(args.query);
    if (!marker) marker = findMarkerByLoinc(args.query);

    if (!marker) {
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            found: false,
            query: args.query,
            suggestion: 'Not in dictionary. Use ingest_raw_text for LLM-assisted matching.',
            dictionaryStats: getMapStats(),
          }, null, 2),
        }],
      };
    }

    return {
      content: [{ type: 'text', text: JSON.stringify({ found: true, marker }, null, 2) }],
    };
  }
);

// ---------------------------------------------------------------------------
// UTILITY: Dictionary Stats
// ---------------------------------------------------------------------------
server.tool(
  'get_dictionary_stats',
  'Get statistics about the lab dictionary — total markers, categories covered, languages supported, total aliases.',
  {},
  async () => {
    return { content: [{ type: 'text', text: JSON.stringify(getMapStats(), null, 2) }] };
  }
);

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function normalizeObservation(obs: any, source: string): NormalizedResult | null {
  // Try LOINC code first, then display name
  const loincCode = obs.code?.coding?.find((c: any) => c.system?.includes('loinc'))?.code;
  const displayName = obs.code?.text || obs.code?.coding?.[0]?.display || '';

  const marker = loincCode ? findMarkerByLoinc(loincCode) : findMarkerByName(displayName);
  if (!marker) return null;

  const rawValue = obs.valueQuantity?.value ?? (obs.valueString ? parseFloat(obs.valueString) : null);
  if (rawValue === null || isNaN(rawValue)) return null;

  let value = rawValue;
  const rawUnit = obs.valueQuantity?.unit || '';
  if (rawUnit && rawUnit !== marker.unit) {
    const converted = convertUnit(marker, rawValue, rawUnit, marker.unit);
    if (converted !== null) value = converted;
  }

  return {
    loinc: marker.loinc,
    standardName: marker.standardName,
    value,
    unit: marker.unit,
    originalName: displayName,
    originalUnit: rawUnit,
    originalSource: source,
    effectiveDate: obs.effectiveDateTime,
    conventionalRange: marker.conventionalRange,
    functionalRange: marker.functionalRange,
    conventionalFlag: getConventionalFlag(value, marker),
    functionalFlag: getFunctionalFlag(value, marker),
    category: marker.category,
    relatedMarkers: marker.relatedMarkers,
  };
}

function normalizeRaw(name: string, value: string, unit: string, date: string | undefined, source: string): NormalizedResult | null {
  const marker = findMarkerByName(name);
  if (!marker) return null;

  const numValue = parseFloat(value);
  if (isNaN(numValue)) return null;

  let finalValue = numValue;
  if (unit && unit !== marker.unit) {
    const converted = convertUnit(marker, numValue, unit, marker.unit);
    if (converted !== null) finalValue = converted;
  }

  return {
    loinc: marker.loinc,
    standardName: marker.standardName,
    value: finalValue,
    unit: marker.unit,
    originalName: name,
    originalUnit: unit,
    originalSource: source,
    effectiveDate: date,
    conventionalRange: marker.conventionalRange,
    functionalRange: marker.functionalRange,
    conventionalFlag: getConventionalFlag(finalValue, marker),
    functionalFlag: getFunctionalFlag(finalValue, marker),
    category: marker.category,
    relatedMarkers: marker.relatedMarkers,
  };
}

function getConventionalFlag(value: number, marker: LabMarkerDefinition): 'normal' | 'low' | 'high' {
  if (marker.conventionalRange.low !== undefined && value < marker.conventionalRange.low) return 'low';
  if (marker.conventionalRange.high !== undefined && value > marker.conventionalRange.high) return 'high';
  return 'normal';
}

function getFunctionalFlag(value: number, marker: LabMarkerDefinition): 'optimal' | 'suboptimal_low' | 'suboptimal_high' | 'not_mapped' {
  if (!marker.functionalRange.low && !marker.functionalRange.high) return 'not_mapped';
  if (marker.functionalRange.low !== undefined && value < marker.functionalRange.low) return 'suboptimal_low';
  if (marker.functionalRange.high !== undefined && value > marker.functionalRange.high) return 'suboptimal_high';
  return 'optimal';
}

// ---------------------------------------------------------------------------
// UNIVERSAL INGEST — the hero tool
// ---------------------------------------------------------------------------
server.tool(
  'universal_ingest',
  'Auto-detect and ingest ANY health data format. Throw anything at this tool — HL7v2 messages, CCDA XML, FHIR JSON, Apple Health exports, Oura/Withings/Garmin/Fitbit/WHOOP/Dexcom data, Rupa Health results, 23andMe/AncestryDNA genomic files, VCF files, CSV exports from any lab, or raw text from a PDF/screenshot. The tool auto-detects the format and routes to the correct parser. Returns normalized, LOINC-coded results with functional medicine interpretation.',
  {
    data: z.string().describe('The raw data in any format — paste it all in'),
    source_hint: z.string().optional().describe('Optional hint about the source (e.g., "Quest PDF", "Oura export", "23andMe raw data")'),
    _sharp: z.any().optional(),
  },
  async (args) => {
    const format = detectFormat(args.data);
    const formatDesc = describeFormat(format);

    let result: any;

    switch (format.type) {
      case 'hl7v2': {
        const parsed = parseHL7v2(args.data);
        const normalized = parsed.results.map(r =>
          normalizeRaw(r.testName, r.value, r.unit, r.observationDate || undefined, `hl7v2:${parsed.sendingFacility}`)
        ).filter(Boolean);
        result = {
          format: formatDesc,
          patient: parsed.patient,
          source: parsed.sendingFacility,
          totalRaw: parsed.results.length,
          totalNormalized: normalized.length,
          results: normalized,
        };
        break;
      }

      case 'ccda': {
        const parsed = parseCCDA(args.data);
        const normalized = parsed.results.map(r =>
          normalizeRaw(r.testName, r.value, r.unit, r.date || undefined, `ccda:${parsed.authorOrg || 'unknown'}`)
        ).filter(Boolean);
        result = {
          format: formatDesc,
          patient: { name: parsed.patientName, dob: parsed.patientDob, sex: parsed.patientSex, mrn: parsed.patientMRN },
          documentDate: parsed.documentDate,
          totalRaw: parsed.results.length,
          totalNormalized: normalized.length,
          results: normalized,
        };
        break;
      }

      case 'apple_health_xml':
      case 'oura_json':
      case 'withings_json':
      case 'garmin_json':
      case 'fitbit_json':
      case 'whoop_json':
      case 'dexcom_json': {
        const parsed = parseWearableData(args.data, args.source_hint || format.type.replace('_json', '').replace('_xml', ''));
        result = {
          format: formatDesc,
          source: parsed.source,
          deviceType: parsed.deviceType,
          dateRange: parsed.dateRange,
          totalDataPoints: parsed.totalDataPoints,
          metricsAvailable: [...parsed.metrics.keys()],
          dailySummaries: parsed.dailySummaries.slice(0, 30), // Cap at 30 days for response size
          _note: parsed.dailySummaries.length > 30 ? `Showing 30 of ${parsed.dailySummaries.length} days` : undefined,
        };
        break;
      }

      case 'vcf':
      case '23andme':
      case 'ancestrydna': {
        const parsed = parseGenomicData(args.data, format.type);
        result = {
          format: formatDesc,
          totalVariantsAnalyzed: parsed.totalVariants,
          clinicallyRelevant: parsed.clinicallyRelevant,
          variants: parsed.variants,
          pharmacogenomics: parsed.pharmacogenomicSummary,
          methylationProfile: parsed.methylationStatus,
          suggestedLabTests: parsed.suggestedLabTests,
        };
        break;
      }

      case 'fhir_json': {
        // Parse FHIR Bundle or individual Observations
        const parsed = JSON.parse(args.data);
        const observations = parsed.resourceType === 'Bundle'
          ? (parsed.entry?.map((e: any) => e.resource).filter((r: any) => r.resourceType === 'Observation') || [])
          : parsed.resourceType === 'Observation' ? [parsed] : [];

        const normalized = observations.map((obs: any) => normalizeObservation(obs, 'fhir')).filter(Boolean);
        result = {
          format: formatDesc,
          resourceType: (format as any).resourceType,
          totalRaw: observations.length,
          totalNormalized: normalized.length,
          results: normalized,
        };
        break;
      }

      case 'rupa_json': {
        const parsed = JSON.parse(args.data);
        const items = parsed.results || parsed.orders || [];
        const normalized = items.map((r: any) =>
          normalizeRaw(r.biomarker_name || r.test_name || '', String(r.value || ''), r.unit || '', r.result_date, 'rupa')
        ).filter(Boolean);
        result = {
          format: formatDesc,
          totalRaw: items.length,
          totalNormalized: normalized.length,
          results: normalized,
        };
        break;
      }

      case 'csv': {
        const csvFormat = format as Extract<typeof format, { type: 'csv' }>;
        if (csvFormat.hasWearableData) {
          const parsed = parseWearableData(args.data, args.source_hint);
          result = {
            format: formatDesc,
            source: parsed.source,
            totalDataPoints: parsed.totalDataPoints,
            dailySummaries: parsed.dailySummaries,
          };
        } else {
          // Lab CSV
          const lines = args.data.trim().split('\n');
          const headers = lines[0].split(csvFormat.delimiter).map((h: string) => h.trim().replace(/^"|"$/g, '').toLowerCase());
          const nameIdx = headers.findIndex((h: string) => /test|name|analyte|biomarker/.test(h));
          const valueIdx = headers.findIndex((h: string) => /result|value/.test(h));
          const unitIdx = headers.findIndex((h: string) => /unit/.test(h));
          const dateIdx = headers.findIndex((h: string) => /date/.test(h));

          const normalized = [];
          for (let i = 1; i < lines.length; i++) {
            const cols = lines[i].split(csvFormat.delimiter).map((c: string) => c.trim().replace(/^"|"$/g, ''));
            const name = nameIdx >= 0 ? cols[nameIdx] : '';
            const value = valueIdx >= 0 ? cols[valueIdx] : '';
            const unit = unitIdx >= 0 ? cols[unitIdx] : '';
            const date = dateIdx >= 0 ? cols[dateIdx] : undefined;
            if (name && value) {
              const n = normalizeRaw(name, value, unit, date, args.source_hint || 'csv');
              if (n) normalized.push(n);
            }
          }
          result = {
            format: formatDesc,
            totalRows: lines.length - 1,
            totalNormalized: normalized.length,
            results: normalized,
          };
        }
        break;
      }

      case 'raw_text':
      default: {
        // Raw text parsing — regex patterns for lab values
        const lines = args.data.split('\n').map((l: string) => l.trim()).filter(Boolean);
        const normalized = [];
        const patterns = [
          /^(.+?)\s+([\d.]+)\s*([a-zA-Z%/^]+(?:\d+)?(?:\/[a-zA-Z]+)?)\s*/,
          /^(.+?):\s*([\d.]+)\s*([a-zA-Z%/^]+(?:\d+)?(?:\/[a-zA-Z]+)?)?/,
          /^(.+?)\s+([\d.]+)\s*$/,
        ];

        for (const line of lines) {
          for (const pattern of patterns) {
            const match = line.match(pattern);
            if (match) {
              const n = normalizeRaw(match[1].trim(), match[2], match[3]?.trim() || '', undefined, args.source_hint || 'raw_text');
              if (n) { normalized.push(n); break; }
            }
          }
        }

        // Also check for genomic data in raw text
        let genomicResults = null;
        if ((format as any).hasGenomicData || isGenomicData(args.data)) {
          const genomic = parseGenomicData(args.data);
          if (genomic.clinicallyRelevant > 0) genomicResults = genomic;
        }

        result = {
          format: formatDesc,
          totalLines: lines.length,
          totalNormalized: normalized.length,
          results: normalized,
          genomicResults,
          _note: 'Parsed via pattern matching from raw text. Review for accuracy. For best results, use structured formats (HL7v2, FHIR, CSV).',
        };
        break;
      }
    }

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          detectedFormat: formatDesc,
          confidence: format.confidence,
          ...result,
        }, null, 2),
      }],
    };
  }
);

// ---------------------------------------------------------------------------
// FORMAT-SPECIFIC TOOLS (for when you know what you have)
// ---------------------------------------------------------------------------

server.tool(
  'ingest_hl7v2',
  'Parse an HL7 v2.x message (ORU^R01). Used when receiving lab results via traditional healthcare interfaces from Quest, LabCorp, hospital labs, etc.',
  { message: z.string().describe('Raw HL7v2 message (pipe-delimited, starting with MSH|)') },
  async (args) => {
    const parsed = parseHL7v2(args.message);
    const normalized = parsed.results.map(r =>
      normalizeRaw(r.testName, r.value, r.unit, r.observationDate || undefined, `hl7v2:${parsed.sendingFacility}`)
    ).filter(Boolean);
    return { content: [{ type: 'text', text: JSON.stringify({ ...parsed, normalizedResults: normalized }, null, 2) }] };
  }
);

server.tool(
  'ingest_ccda',
  'Parse a C-CDA or CDA clinical document (XML). Used for patient portal exports, Blue Button data, EHR-to-EHR transfers.',
  { document: z.string().describe('C-CDA XML document content') },
  async (args) => {
    const parsed = parseCCDA(args.document);
    const normalized = parsed.results.map(r =>
      normalizeRaw(r.testName, r.value, r.unit, r.date || undefined, `ccda:${parsed.authorOrg || 'unknown'}`)
    ).filter(Boolean);
    return { content: [{ type: 'text', text: JSON.stringify({ ...parsed, normalizedResults: normalized }, null, 2) }] };
  }
);

server.tool(
  'ingest_wearable',
  'Parse wearable device data. Supports Apple Health XML, Oura, Withings, Garmin, Fitbit, WHOOP, Dexcom JSON/CSV.',
  {
    data: z.string().describe('Raw wearable data (JSON, XML, or CSV)'),
    source: z.string().optional().describe('Device/source hint: oura, withings, garmin, fitbit, whoop, dexcom, apple_health'),
  },
  async (args) => {
    const parsed = parseWearableData(args.data, args.source);
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          source: parsed.source,
          deviceType: parsed.deviceType,
          dateRange: parsed.dateRange,
          totalDataPoints: parsed.totalDataPoints,
          metricsAvailable: [...parsed.metrics.keys()],
          dailySummaries: parsed.dailySummaries,
        }, null, 2),
      }],
    };
  }
);

server.tool(
  'ingest_genomic',
  'Parse genomic data — 23andMe raw data, AncestryDNA export, VCF files, or generic SNP lists. Returns clinically relevant variants with pharmacogenomics, methylation profile, and suggested lab tests.',
  {
    data: z.string().describe('Raw genomic data (23andMe txt, AncestryDNA txt, VCF, or rsID list)'),
    source: z.string().optional().describe('Source hint: 23andme, ancestrydna, vcf'),
  },
  async (args) => {
    const parsed = parseGenomicData(args.data, args.source);
    return { content: [{ type: 'text', text: JSON.stringify(parsed, null, 2) }] };
  }
);

server.tool(
  'detect_data_format',
  'Detect what format a piece of health data is in without processing it. Useful for routing decisions.',
  { data: z.string().describe('First 1000 characters of the data to identify') },
  async (args) => {
    const format = detectFormat(args.data);
    return { content: [{ type: 'text', text: JSON.stringify({ format: describeFormat(format), confidence: format.confidence, details: format }, null, 2) }] };
  }
);

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Lab Intelligence MCP Server v1.0.0 — 120+ markers, 15+ input formats, 5 languages');
}

main().catch(console.error);
