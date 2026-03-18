# Lab Intelligence MCP

**Universal health data normalizer and interpreter for functional medicine.**

One MCP server that ingests health data from any source — lab results, wearable devices, genomic data — normalizes everything to standard codes (LOINC, FHIR), and interprets through a functional medicine lens.

Built for the [Agents Assemble hackathon](https://agents-assemble.devpost.com/) on the Prompt Opinion platform.

## The Problem

A functional medicine practitioner receives patient data from 5+ sources in 10+ formats. Lab results arrive as HL7v2 messages, CCDA documents, PDFs, CSV exports, FHIR resources, or patient screenshots. Wearable data comes from Oura, Withings, Garmin, Fitbit, WHOOP, or Apple Health. Genomic data from 23andMe or clinical VCF files. None of it talks to each other. The practitioner manually re-interprets every result against functional medicine ranges — which are tighter than conventional ranges and catch dysfunction earlier.

## The Solution

One `universal_ingest` tool. Throw any data at it. It auto-detects the format, parses deterministically (no LLM needed for structured data), normalizes to LOINC codes, standardizes units, and returns interpreted results with both conventional and functional medicine reference ranges, cross-biomarker pattern detection, and suggested follow-up tests.

## Architecture: Code vs. LLM

This MCP is designed for the Prompt Opinion platform where the MCP provides data tools and the platform's LLM does the reasoning.

| Layer | Method | Why |
|-------|--------|-----|
| Format detection | Deterministic code | Fast, reliable, no hallucination risk |
| HL7v2/CCDA/XML parsing | Deterministic code | Rigid formats, regex is perfect |
| JSON parsing (FHIR, wearables) | Deterministic code | Structured schemas |
| VCF/23andMe parsing | Deterministic code | Tab-delimited, no ambiguity |
| CSV parsing | Deterministic code | Structured with header mapping |
| LOINC code lookup (when code present) | Dictionary lookup | O(1) lookup, no ambiguity |
| Lab name fuzzy matching | Multi-pass string matching | Handles "TSH 3rd Gen Ultra-Sensitive" → TSH |
| Unit conversion | Math | Pure computation |
| Reference range flagging | Math | Comparison against known ranges |
| Pattern detection | Rule-based engine | Clinical patterns are well-defined |
| Raw text extraction | Regex + LLM fallback | LLM only when no structure detected |
| Clinical narrative | LLM (platform) | Natural language interpretation |
| Treatment suggestions | LLM (platform) | Requires clinical reasoning |

## Supported Input Formats (15+)

### Lab Data
| Format | Source | Parser |
|--------|--------|--------|
| FHIR R4 JSON | Any EHR (Epic, Cerner, athena, etc.) | Deterministic |
| HL7 v2.x (ORU^R01) | Quest, LabCorp, hospital lab interfaces | Deterministic |
| C-CDA / CDA XML | Patient portal exports, Blue Button, HIE | Deterministic |
| Rupa Health JSON | Rupa Health API | Deterministic |
| CSV / TSV | Genova, DUTCH, Vibrant Wellness, any lab export | Deterministic |
| Raw text | PDF copy-paste, screenshots, faxes | Regex + LLM assist |
| Manual entry | Phone-in results, patient-reported | Structured input |

### Wearable Data
| Format | Devices | Parser |
|--------|---------|--------|
| Apple Health XML | Apple Watch, iPhone | Deterministic |
| Oura JSON | Oura Ring | Deterministic |
| Withings JSON | Withings Scale, BPM, Sleep | Deterministic |
| Garmin JSON | Garmin watches | Deterministic |
| Fitbit JSON | Fitbit devices | Deterministic |
| WHOOP JSON | WHOOP Band | Deterministic |
| Dexcom JSON | Dexcom G6/G7 CGM | Deterministic |
| Generic CSV | Any wearable export | Deterministic |

### Genomic Data
| Format | Source | Parser |
|--------|--------|--------|
| 23andMe raw data | 23andMe download | Deterministic |
| AncestryDNA raw data | AncestryDNA download | Deterministic |
| VCF | Clinical sequencing | Deterministic |
| Generic SNP list | Any rsID + genotype | Deterministic |

## LOINC Dictionary

120+ biomarkers across 30 clinical categories with 800+ aliases in 5 languages (English, Spanish, Portuguese, German, French).

### Categories
Thyroid (8), Diabetes/Metabolic (6), Lipids + Advanced (8), Inflammation (6), Iron Panel (5), Nutrients & Minerals (12), Liver (7), Kidney (5), CBC (10), CBC Differential (5), Adrenal/HPA (4), Sex Hormones (10), Gut Health (4), Cardiac (3), Autoimmune (3), Pancreatic (2), Bone (2), Coagulation (2), Oxidative Stress (2), Environmental Toxins (2)

### Features
- Sex-specific reference ranges where applicable
- Multi-unit support with bidirectional conversion
- Functional medicine optimal ranges (tighter than conventional)
- Related marker cross-references for clinical context

## Clinical Pattern Detection

7 pattern detectors that identify multi-biomarker signatures:

1. **Thyroid Conversion Issue** — TSH + Free T3 + Free T4 + Reverse T3
2. **Hashimoto's / Autoimmune Thyroid** — TPO Ab + Thyroglobulin Ab + TSH
3. **Insulin Resistance** — Fasting insulin + glucose + HbA1c + TG/HDL ratio
4. **Iron Deficiency ± Anemia** — Ferritin + iron + TIBC + iron saturation + hemoglobin
5. **Methylation Dysfunction** — Homocysteine + B12 + folate
6. **Chronic Inflammation** — hs-CRP + ESR + homocysteine
7. **HPA Axis Dysregulation** — AM cortisol + DHEA-S

## Genomic Analysis

30+ clinically relevant SNPs across functional medicine categories:

- **Methylation**: MTHFR C677T, A1298C, COMT, CBS, MTR, MTRR
- **Pharmacogenomics**: CYP2D6, CYP2C19, CYP2C9, CYP3A5 (with PharmGKB evidence levels)
- **Detoxification**: GSTP1, SOD2, CYP1A1
- **Nutrient Metabolism**: VDR, BCMO1, FUT2, HFE
- **Cardiovascular**: Factor V Leiden, APOE E2/E4
- **Inflammation**: TNF-alpha, IL-6
- **Thyroid**: FOXE1, DIO2

Includes methylation profile scoring, pharmacogenomics metabolizer status, and automatic lab test suggestions based on detected variants.

## MCP Tools (20 tools)

### Universal
- `universal_ingest` — Auto-detect format and parse any health data
- `detect_data_format` — Identify format without processing

### Format-Specific Ingestion
- `ingest_fhir` — FHIR R4 server (any EHR)
- `ingest_hl7v2` — HL7 v2.x messages
- `ingest_ccda` — C-CDA/CDA XML documents
- `ingest_rupa` — Rupa Health API
- `ingest_csv` — CSV/TSV from any lab
- `ingest_manual` — Direct value entry
- `ingest_raw_text` — Unstructured text parsing
- `ingest_wearable` — Any wearable device data
- `ingest_genomic` — Genomic data (23andMe, VCF, etc.)

### Analysis
- `normalize` — Map names to LOINC, standardize units
- `interpret` — Functional medicine range analysis
- `detect_patterns` — Cross-biomarker clinical patterns
- `trend` — Track biomarkers over time across mixed sources
- `suggest_followup` — Recommend additional tests

### Reference
- `get_dictionary_info` — Look up any biomarker
- `get_dictionary_stats` — Dictionary coverage statistics

## What Makes This Different

| Feature | OptimalDx | LabDx | Health Gorilla | This MCP |
|---------|-----------|-------|----------------|----------|
| Open source | No | No | No | Yes |
| API/MCP interface | No | No | Proprietary | MCP standard |
| Functional medicine ranges | Yes (proprietary) | Yes (proprietary) | No | Yes (open) |
| Multi-format ingestion | Manual only | Manual only | HL7/FHIR only | 15+ formats |
| Wearable data | No | No | No | 8 devices |
| Genomic data | No | No | No | 23andMe, VCF |
| Pattern detection | Limited | Limited | No | 7 patterns |
| Multi-language | No | No | No | 5 languages |
| Cross-source trending | No | No | Limited | Yes |
| Customizable ranges | No | No | N/A | Yes |
| Price | $99+/mo | $49+/mo | Enterprise | Free/Open |

## Quick Start

```bash
npm install
npm run dev
# Server running on stdio — connect via MCP client

# Or with environment variables for API integrations:
export RUPA_API_KEY=your_key
npm run dev
```

## Hackathon Submission

- **Track**: Option 1 — Superpower (MCP)
- **Platform**: Prompt Opinion
- **Judging Criteria**:
  - AI Factor: Fuzzy name matching + pattern detection + genomic interpretation require AI. PDF/raw text parsing is LLM-assisted. Structured formats use deterministic code for reliability.
  - Potential Impact: Every functional medicine practitioner manually re-interprets labs daily. This eliminates that.
  - Feasibility: Standard MCP protocol, FHIR R4 output, HIPAA-aware design. Production-deployable.
