#!/usr/bin/env node
/**
 * Lab Intelligence MCP Server — HTTP Transport (Darena/Prompt Opinion Compatible)
 *
 * Full production server with ALL 20 tools registered.
 * Uses StreamableHTTPServerTransport over Express.
 * Deploy to Railway/Vercel/Render, register URL on Prompt Opinion.
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import express from 'express';
import { z } from 'zod';
import {
  findMarkerByName, findMarkerByLoinc, getMarkersByCategory,
  convertUnit, getMapStats, LOINC_MAP, type LabMarkerDefinition,
} from './loinc-map.js';
import { detectPatterns } from './patterns.js';
import { parseHL7v2 } from './parsers/hl7v2-parser.js';
import { parseCCDA } from './parsers/ccda-parser.js';
import { parseWearableData, isWearableData } from './parsers/wearable-parser.js';
import { parseGenomicData, isGenomicData } from './parsers/genomic-parser.js';
import { detectFormat, describeFormat } from './parsers/auto-detect.js';

const app = express();
const port = process.env.PORT ? parseInt(process.env.PORT) : 3000;

app.use(express.json({ limit: '10mb' }));

// Health check
app.get('/health', (_req, res) => {
  const stats = getMapStats();
  res.json({ status: 'ok', name: 'lab-intelligence-mcp', version: '1.0.0', ...stats });
});

app.get('/', (_req, res) => {
  res.json({ name: 'Lab Intelligence MCP', version: '1.0.0', endpoint: '/mcp', health: '/health' });
});

// MCP endpoint
app.post('/mcp', async (req, res) => {
  try {
    const server = new McpServer({ name: 'Lab Intelligence', version: '1.0.0' });

    // Extract FHIR context from Darena/SHARP headers
    const fhirUrl = (req.headers['x-fhir-server-url'] || req.headers['x-fhir-url'] || '') as string;
    const fhirToken = (req.headers['x-fhir-access-token'] || req.headers['x-fhir-token'] || '') as string;
    const patientId = (req.headers['x-patient-id'] || '') as string;

    // ===================================================================
    // Register ALL tools
    // ===================================================================

    // --- UNIVERSAL INGEST ---
    server.tool(
      'universal_ingest',
      'Auto-detect and ingest ANY health data format. Supports: HL7v2, FHIR, C-CDA, CSV, Apple Health, Oura, Withings, Garmin, Fitbit, WHOOP, Dexcom, 23andMe, VCF, Rupa Health, raw text.',
      {
        data: z.string().describe('Raw data in any format'),
        source_hint: z.string().optional().describe('e.g. "Quest PDF", "Oura export", "23andMe"'),
      },
      async (args) => {
        const format = detectFormat(args.data);
        const formatDesc = describeFormat(format);
        let result: any = { format: formatDesc };

        switch (format.type) {
          case 'hl7v2': {
            const parsed = parseHL7v2(args.data);
            const normalized = parsed.results.map(r => normalizeRaw(r.testName, r.value, r.unit, r.observationDate || undefined, `hl7v2:${parsed.sendingFacility}`)).filter(Boolean);
            result = { ...result, patient: parsed.patient, source: parsed.sendingFacility, totalRaw: parsed.results.length, totalNormalized: normalized.length, results: normalized };
            break;
          }
          case 'ccda': {
            const parsed = parseCCDA(args.data);
            const normalized = parsed.results.map(r => normalizeRaw(r.testName, r.value, r.unit, r.date || undefined, `ccda:${parsed.authorOrg || 'unknown'}`)).filter(Boolean);
            result = { ...result, patient: { name: parsed.patientName, dob: parsed.patientDob, sex: parsed.patientSex }, totalRaw: parsed.results.length, totalNormalized: normalized.length, results: normalized };
            break;
          }
          case 'apple_health_xml': case 'oura_json': case 'withings_json': case 'garmin_json':
          case 'fitbit_json': case 'whoop_json': case 'dexcom_json': {
            const parsed = parseWearableData(args.data, args.source_hint || format.type.replace('_json', '').replace('_xml', ''));
            result = { ...result, source: parsed.source, deviceType: parsed.deviceType, dateRange: parsed.dateRange, totalDataPoints: parsed.totalDataPoints, metricsAvailable: [...parsed.metrics.keys()], dailySummaries: parsed.dailySummaries.slice(0, 30) };
            break;
          }
          case 'vcf': case '23andme': case 'ancestrydna': {
            const parsed = parseGenomicData(args.data, format.type);
            result = { ...result, totalVariants: parsed.totalVariants, clinicallyRelevant: parsed.clinicallyRelevant, variants: parsed.variants, pharmacogenomics: parsed.pharmacogenomicSummary, methylationProfile: parsed.methylationStatus, suggestedLabTests: parsed.suggestedLabTests };
            break;
          }
          case 'fhir_json': {
            const parsed = JSON.parse(args.data);
            const observations = parsed.resourceType === 'Bundle'
              ? (parsed.entry?.map((e: any) => e.resource).filter((r: any) => r.resourceType === 'Observation') || [])
              : parsed.resourceType === 'Observation' ? [parsed] : [];
            const normalized = observations.map((obs: any) => normalizeObservation(obs, 'fhir')).filter(Boolean);
            result = { ...result, totalRaw: observations.length, totalNormalized: normalized.length, results: normalized };
            break;
          }
          case 'rupa_json': {
            const parsed = JSON.parse(args.data);
            const items = parsed.results || parsed.orders || [];
            const normalized = items.map((r: any) => normalizeRaw(r.biomarker_name || r.test_name || '', String(r.value || ''), r.unit || '', r.result_date, 'rupa')).filter(Boolean);
            result = { ...result, totalRaw: items.length, totalNormalized: normalized.length, results: normalized };
            break;
          }
          case 'csv': {
            const csvFormat = format as any;
            if (csvFormat.hasWearableData) {
              const parsed = parseWearableData(args.data, args.source_hint);
              result = { ...result, source: parsed.source, totalDataPoints: parsed.totalDataPoints, dailySummaries: parsed.dailySummaries };
            } else {
              const lines = args.data.trim().split('\n');
              const headers = lines[0].split(csvFormat.delimiter || ',').map((h: string) => h.trim().replace(/^"|"$/g, '').toLowerCase());
              const nameIdx = headers.findIndex((h: string) => /test|name|analyte|biomarker/.test(h));
              const valueIdx = headers.findIndex((h: string) => /result|value/.test(h));
              const unitIdx = headers.findIndex((h: string) => /unit/.test(h));
              const dateIdx = headers.findIndex((h: string) => /date/.test(h));
              const normalized: any[] = [];
              for (let i = 1; i < lines.length; i++) {
                const cols = lines[i].split(csvFormat.delimiter || ',').map((c: string) => c.trim().replace(/^"|"$/g, ''));
                const name = nameIdx >= 0 ? cols[nameIdx] : '';
                const value = valueIdx >= 0 ? cols[valueIdx] : '';
                if (name && value) { const n = normalizeRaw(name, value, unitIdx >= 0 ? cols[unitIdx] : '', dateIdx >= 0 ? cols[dateIdx] : undefined, args.source_hint || 'csv'); if (n) normalized.push(n); }
              }
              result = { ...result, totalRows: lines.length - 1, totalNormalized: normalized.length, results: normalized };
            }
            break;
          }
          default: {
            const lines = args.data.split('\n').map((l: string) => l.trim()).filter(Boolean);
            const normalized: any[] = [];
            const pats = [/^(.+?)\s+([\d.]+)\s*([a-zA-Z%/^]+(?:\d+)?(?:\/[a-zA-Z]+)?)\s*/, /^(.+?):\s*([\d.]+)\s*([a-zA-Z%/^]+(?:\d+)?(?:\/[a-zA-Z]+)?)?/, /^(.+?)\s+([\d.]+)\s*$/];
            for (const line of lines) { for (const pat of pats) { const m = line.match(pat); if (m) { const n = normalizeRaw(m[1].trim(), m[2], m[3]?.trim() || '', undefined, args.source_hint || 'raw_text'); if (n) { normalized.push(n); break; } } } }
            let genomicResults = null;
            if (isGenomicData(args.data)) { const g = parseGenomicData(args.data); if (g.clinicallyRelevant > 0) genomicResults = g; }
            result = { ...result, totalLines: lines.length, totalNormalized: normalized.length, results: normalized, genomicResults };
            break;
          }
        }
        return { content: [{ type: 'text', text: JSON.stringify({ detectedFormat: formatDesc, confidence: format.confidence, fhirContext: fhirUrl ? { url: fhirUrl, patientId } : null, ...result }, null, 2) }] };
      }
    );

    // --- FORMAT-SPECIFIC TOOLS ---
    server.tool('ingest_hl7v2', 'Parse HL7 v2.x lab message (ORU^R01).', { message: z.string() }, async (args) => {
      const p = parseHL7v2(args.message);
      const n = p.results.map(r => normalizeRaw(r.testName, r.value, r.unit, r.observationDate || undefined, `hl7v2:${p.sendingFacility}`)).filter(Boolean);
      return { content: [{ type: 'text', text: JSON.stringify({ ...p, normalizedResults: n }, null, 2) }] };
    });

    server.tool('ingest_ccda', 'Parse C-CDA/CDA clinical document (XML).', { document: z.string() }, async (args) => {
      const p = parseCCDA(args.document);
      const n = p.results.map(r => normalizeRaw(r.testName, r.value, r.unit, r.date || undefined, `ccda:${p.authorOrg || 'unknown'}`)).filter(Boolean);
      return { content: [{ type: 'text', text: JSON.stringify({ ...p, normalizedResults: n }, null, 2) }] };
    });

    server.tool('ingest_wearable', 'Parse wearable data (Apple Health, Oura, Withings, Garmin, Fitbit, WHOOP, Dexcom).', { data: z.string(), source: z.string().optional() }, async (args) => {
      const p = parseWearableData(args.data, args.source);
      return { content: [{ type: 'text', text: JSON.stringify({ source: p.source, deviceType: p.deviceType, dateRange: p.dateRange, totalDataPoints: p.totalDataPoints, metricsAvailable: [...p.metrics.keys()], dailySummaries: p.dailySummaries }, null, 2) }] };
    });

    server.tool('ingest_genomic', 'Parse genomic data (23andMe, AncestryDNA, VCF). Returns variants, pharmacogenomics, methylation profile.', { data: z.string(), source: z.string().optional() }, async (args) => {
      return { content: [{ type: 'text', text: JSON.stringify(parseGenomicData(args.data, args.source), null, 2) }] };
    });

    server.tool('detect_data_format', 'Detect format of health data without processing.', { data: z.string() }, async (args) => {
      const f = detectFormat(args.data);
      return { content: [{ type: 'text', text: JSON.stringify({ format: describeFormat(f), confidence: f.confidence, details: f }, null, 2) }] };
    });

    // --- FHIR INGESTION (uses SHARP context) ---
    server.tool('ingest_fhir', 'Pull lab results from any FHIR R4 server. Uses SHARP context headers for auth.', {
      fhir_base_url: z.string().optional().describe('FHIR server URL (uses SHARP context if omitted)'),
      patient_id: z.string().optional().describe('Patient ID (uses SHARP context if omitted)'),
      date_from: z.string().optional(), date_to: z.string().optional(),
    }, async (args) => {
      const url = args.fhir_base_url || fhirUrl;
      const pid = args.patient_id || patientId;
      const token = fhirToken;
      if (!url) return { content: [{ type: 'text', text: 'Error: No FHIR server URL. Provide fhir_base_url or ensure SHARP context is set.' }] };
      if (!pid) return { content: [{ type: 'text', text: 'Error: No patient ID.' }] };
      let endpoint = `${url}/Observation?patient=${pid}&category=laboratory&_sort=-date&_count=200`;
      if (args.date_from) endpoint += `&date=ge${args.date_from}`;
      if (args.date_to) endpoint += `&date=le${args.date_to}`;
      const resp = await fetch(endpoint, { headers: { Authorization: `Bearer ${token}`, Accept: 'application/fhir+json' } });
      if (!resp.ok) return { content: [{ type: 'text', text: `FHIR error ${resp.status}: ${await resp.text()}` }] };
      const bundle = await resp.json();
      const obs = bundle.entry?.map((e: any) => e.resource) || [];
      const normalized = obs.map((o: any) => normalizeObservation(o, 'fhir')).filter(Boolean);
      return { content: [{ type: 'text', text: JSON.stringify({ source: 'fhir', fhirServer: url, patientId: pid, totalRaw: obs.length, totalNormalized: normalized.length, results: normalized }, null, 2) }] };
    });

    // --- MANUAL ENTRY ---
    server.tool('ingest_manual', 'Manually enter lab results.', {
      results: z.array(z.object({ name: z.string(), value: z.number(), unit: z.string().optional(), date: z.string().optional() })),
    }, async (args) => {
      const normalized = args.results.map(r => normalizeRaw(r.name, r.value.toString(), r.unit || '', r.date, 'manual')).filter(Boolean);
      return { content: [{ type: 'text', text: JSON.stringify({ source: 'manual', totalInput: args.results.length, totalNormalized: normalized.length, results: normalized }, null, 2) }] };
    });

    // --- ANALYSIS TOOLS ---
    server.tool('normalize', 'Map lab names to LOINC codes and standardize units.', {
      results: z.array(z.object({ name: z.string(), value: z.union([z.number(), z.string()]), unit: z.string().optional(), date: z.string().optional(), source: z.string().optional() })),
    }, async (args) => {
      const normalized = args.results.map(r => normalizeRaw(r.name, r.value.toString(), r.unit || '', r.date, r.source || 'unknown'));
      const mapped = normalized.filter(Boolean);
      const unmapped = args.results.filter((_, i) => !normalized[i]).map(r => r.name);
      return { content: [{ type: 'text', text: JSON.stringify({ totalInput: args.results.length, totalMapped: mapped.length, unmappedNames: unmapped, results: mapped }, null, 2) }] };
    });

    server.tool('interpret', 'Interpret lab results with functional medicine ranges.', {
      results: z.array(z.object({ loinc: z.string().optional(), name: z.string(), value: z.number(), unit: z.string().optional() })),
    }, async (args) => {
      const interpreted = args.results.map(r => {
        const marker = r.loinc ? findMarkerByLoinc(r.loinc) : findMarkerByName(r.name);
        if (!marker) return { ...r, interpretation: 'Unknown marker' };
        let value = r.value;
        if (r.unit && r.unit !== marker.unit) { const c = convertUnit(marker, r.value, r.unit, marker.unit); if (c !== null) value = c; }
        return {
          standardName: marker.standardName, loinc: marker.loinc, value, unit: marker.unit, category: marker.category,
          conventionalFlag: getConvFlag(value, marker), functionalFlag: getFuncFlag(value, marker),
          conventionalRange: marker.conventionalRange, functionalRange: marker.functionalRange,
          relatedMarkers: marker.relatedMarkers.map(l => findMarkerByLoinc(l)?.standardName || l),
        };
      });
      return { content: [{ type: 'text', text: JSON.stringify(interpreted, null, 2) }] };
    });

    server.tool('detect_patterns', 'Detect multi-biomarker clinical patterns.', {
      results: z.array(z.object({ loinc: z.string().optional(), name: z.string(), value: z.number(), unit: z.string().optional() })),
    }, async (args) => {
      const normalized = new Map<string, number>();
      for (const r of args.results) {
        const marker = r.loinc ? findMarkerByLoinc(r.loinc) : findMarkerByName(r.name);
        if (marker) { let v = r.value; if (r.unit && r.unit !== marker.unit) { const c = convertUnit(marker, r.value, r.unit, marker.unit); if (c !== null) v = c; } normalized.set(marker.loinc, v); }
      }
      const patterns = detectPatterns(normalized);
      return { content: [{ type: 'text', text: JSON.stringify({ markersAnalyzed: normalized.size, patternsDetected: patterns.length, patterns }, null, 2) }] };
    });

    server.tool('trend', 'Track a biomarker over time across mixed sources.', {
      marker_name: z.string(), datapoints: z.array(z.object({ value: z.number(), unit: z.string().optional(), date: z.string(), source: z.string().optional() })),
    }, async (args) => {
      const marker = findMarkerByName(args.marker_name);
      if (!marker) return { content: [{ type: 'text', text: `Unknown marker: ${args.marker_name}` }] };
      const points = args.datapoints.map(d => {
        let v = d.value; if (d.unit && d.unit !== marker.unit) { const c = convertUnit(marker, d.value, d.unit, marker.unit); if (c !== null) v = c; }
        return { value: v, unit: marker.unit, date: d.date, source: d.source || 'unknown' };
      }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      const vals = points.map(p => p.value);
      let direction = 'stable';
      if (vals.length >= 2) { const pct = ((vals[vals.length - 1] - vals[0]) / vals[0]) * 100; direction = pct > 5 ? 'increasing' : pct < -5 ? 'decreasing' : 'stable'; }
      return { content: [{ type: 'text', text: JSON.stringify({ marker: marker.standardName, loinc: marker.loinc, unit: marker.unit, datapoints: points, trend: { direction }, currentStatus: getFuncFlag(vals[vals.length - 1], marker), functionalRange: marker.functionalRange }, null, 2) }] };
    });

    server.tool('suggest_followup', 'Suggest additional tests based on current results.', {
      results: z.array(z.object({ loinc: z.string().optional(), name: z.string(), value: z.number() })),
    }, async (args) => {
      const existing = new Set<string>();
      const suggestions: any[] = [];
      for (const r of args.results) { const m = r.loinc ? findMarkerByLoinc(r.loinc) : findMarkerByName(r.name); if (m) existing.add(m.loinc); }
      for (const r of args.results) {
        const m = r.loinc ? findMarkerByLoinc(r.loinc) : findMarkerByName(r.name);
        if (!m) continue;
        if (getFuncFlag(r.value, m) !== 'optimal') {
          for (const rl of m.relatedMarkers) {
            if (!existing.has(rl)) { const rm = findMarkerByLoinc(rl); if (rm) suggestions.push({ test: rm.standardName, loinc: rm.loinc, reason: `${m.standardName} is suboptimal — ${rm.standardName} helps complete the picture` }); }
          }
        }
      }
      const unique = [...new Map(suggestions.map((s: any) => [s.loinc, s])).values()];
      return { content: [{ type: 'text', text: JSON.stringify({ suggestedTests: unique }, null, 2) }] };
    });

    server.tool('get_dictionary_info', 'Look up any biomarker — aliases, ranges, related markers.', { query: z.string() }, async (args) => {
      let m = findMarkerByName(args.query); if (!m) m = findMarkerByLoinc(args.query);
      if (!m) return { content: [{ type: 'text', text: JSON.stringify({ found: false, query: args.query, stats: getMapStats() }, null, 2) }] };
      return { content: [{ type: 'text', text: JSON.stringify({ found: true, marker: m }, null, 2) }] };
    });

    server.tool('get_dictionary_stats', 'Dictionary coverage statistics.', {}, async () => {
      return { content: [{ type: 'text', text: JSON.stringify(getMapStats(), null, 2) }] };
    });

    // ===================================================================
    // Connect and handle
    // ===================================================================
    const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
    res.on('close', () => { transport.close(); server.close(); });
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);

  } catch (error) {
    console.error('MCP error:', error);
    if (!res.headersSent) {
      res.status(500).json({ jsonrpc: '2.0', error: { code: -32603, message: 'Internal server error' }, id: null });
    }
  }
});

app.listen(port, () => {
  console.log(`Lab Intelligence MCP — port ${port}`);
});

// ===================================================================
// Shared helpers (same as index.ts)
// ===================================================================

interface NormalizedResult {
  loinc: string; standardName: string; value: number; unit: string;
  originalName: string; originalUnit: string; originalSource: string;
  effectiveDate?: string;
  conventionalRange: { low?: number; high?: number };
  functionalRange: { low?: number; high?: number; notes?: string };
  conventionalFlag: string; functionalFlag: string; category: string;
  relatedMarkers: string[];
}

function normalizeObservation(obs: any, source: string): NormalizedResult | null {
  const loincCode = obs.code?.coding?.find((c: any) => c.system?.includes('loinc'))?.code;
  const displayName = obs.code?.text || obs.code?.coding?.[0]?.display || '';
  const marker = loincCode ? findMarkerByLoinc(loincCode) : findMarkerByName(displayName);
  if (!marker) return null;
  const rawValue = obs.valueQuantity?.value ?? (obs.valueString ? parseFloat(obs.valueString) : null);
  if (rawValue === null || isNaN(rawValue)) return null;
  let value = rawValue;
  const rawUnit = obs.valueQuantity?.unit || '';
  if (rawUnit && rawUnit !== marker.unit) { const c = convertUnit(marker, rawValue, rawUnit, marker.unit); if (c !== null) value = c; }
  return {
    loinc: marker.loinc, standardName: marker.standardName, value, unit: marker.unit,
    originalName: displayName, originalUnit: rawUnit, originalSource: source,
    effectiveDate: obs.effectiveDateTime,
    conventionalRange: marker.conventionalRange, functionalRange: marker.functionalRange,
    conventionalFlag: getConvFlag(value, marker), functionalFlag: getFuncFlag(value, marker),
    category: marker.category, relatedMarkers: marker.relatedMarkers,
  };
}

function normalizeRaw(name: string, value: string, unit: string, date: string | undefined, source: string): NormalizedResult | null {
  const marker = findMarkerByName(name);
  if (!marker) return null;
  const numValue = parseFloat(value);
  if (isNaN(numValue)) return null;
  let finalValue = numValue;
  if (unit && unit !== marker.unit) { const c = convertUnit(marker, numValue, unit, marker.unit); if (c !== null) finalValue = c; }
  return {
    loinc: marker.loinc, standardName: marker.standardName, value: finalValue, unit: marker.unit,
    originalName: name, originalUnit: unit, originalSource: source, effectiveDate: date,
    conventionalRange: marker.conventionalRange, functionalRange: marker.functionalRange,
    conventionalFlag: getConvFlag(finalValue, marker), functionalFlag: getFuncFlag(finalValue, marker),
    category: marker.category, relatedMarkers: marker.relatedMarkers,
  };
}

function getConvFlag(value: number, marker: LabMarkerDefinition): string {
  if (marker.conventionalRange.low !== undefined && value < marker.conventionalRange.low) return 'low';
  if (marker.conventionalRange.high !== undefined && value > marker.conventionalRange.high) return 'high';
  return 'normal';
}

function getFuncFlag(value: number, marker: LabMarkerDefinition): string {
  if (!marker.functionalRange.low && !marker.functionalRange.high) return 'not_mapped';
  if (marker.functionalRange.low !== undefined && value < marker.functionalRange.low) return 'suboptimal_low';
  if (marker.functionalRange.high !== undefined && value > marker.functionalRange.high) return 'suboptimal_high';
  return 'optimal';
}
