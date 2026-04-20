# PharmSafe MCP

**Medication Safety & Pharmacogenomics Intelligence**

One MCP server that catches dangerous drug interactions, pharmacogenomic conflicts, inappropriate medications in elderly, dosing errors in organ impairment, and polypharmacy risks — before they reach the patient.

Built for the [Agents Assemble hackathon](https://agents-assemble.devpost.com/) on the Prompt Opinion platform.

## The Problem

Adverse drug events cause **~2 million hospitalizations** and **$528 billion** in costs annually in the US alone. A typical hospitalized patient is on 7+ medications. A busy clinician managing 20 patients can't mentally cross-reference every interaction, pharmacogenomic conflict, renal dosing adjustment, and Beers Criteria violation simultaneously.

Current EHR drug interaction alerts are noisy (>90% overridden) and miss the nuanced cases: pharmacogenomic metabolizer conflicts, cumulative anticholinergic burden, disease-drug interactions specific to geriatric patients, and deprescribing opportunities.

## The Solution

18 MCP tools that provide comprehensive medication safety analysis:

| Category | What it catches |
|----------|----------------|
| Drug interactions | 25+ clinically significant pairs with severity ranking and mechanisms |
| Pharmacogenomics | 14 drugs × 6 gene panels (CYP2D6, CYP2C19, CYP2C9, CYP3A5, DPYD, SLCO1B1) |
| Renal dosing | GFR-based adjustments for 8 high-risk drugs |
| Hepatic dosing | Child-Pugh-based adjustments for 6 drugs |
| Beers Criteria | 17 AGS 2023 inappropriate medications + 6 disease-drug interactions |
| High-alert (ISMP) | 14 high-alert medications with required safeguards |
| Anticholinergic burden | ACB scoring for 60+ medications |
| Duplicate therapies | 18 therapeutic classes |
| Allergy cross-reactivity | 13 drug class cross-reactivity maps |
| Deprescribing | 7 candidates with evidence-based taper schedules |
| Medication reconciliation | Cross-source discrepancy detection |
| Drug-food interactions | Grapefruit, dairy, vitamin K, tyramine, alcohol, potassium |
| Timing conflicts | Medications requiring temporal separation |
| Medication scheduling | Optimal daily timing with food/separation constraints |
| FHIR EHR pull | Direct medication/allergy/lab extraction from connected EHR |

## Architecture

| Layer | Method | Why |
|-------|--------|-----|
| Drug interaction detection | Deterministic matching | Known pairs, no ambiguity |
| Severity ranking | Lookup table | Evidence-based severity levels |
| PGx metabolizer impact | Lookup + rules | CPIC guidelines are deterministic |
| Renal dose calculation | Math (GFR → dose) | Pure computation |
| Beers Criteria matching | Rule-based | AGS guidelines are explicit |
| ACB scoring | Lookup + sum | Validated scoring scale |
| Cross-reactivity | Class graph traversal | Drug families are well-defined |
| Risk scoring | Weighted algorithm | Multi-factor risk integration |
| Clinical narrative | LLM (platform) | Natural language explanations |
| Treatment decisions | Clinician | Human-in-the-loop always |

## MCP Tools (20)

### Safety Checks
- `check_interactions` — Drug-drug interaction detection with severity and mechanisms
- `check_pharmacogenomics` — Cross-reference meds with patient CYP450/DPYD/SLCO1B1 genotype
- `check_renal_dosing` — GFR-based dose adjustment flagging
- `check_hepatic_dosing` — Child-Pugh-based dose adjustment flagging
- `check_duplicates` — Same-class duplicate therapy detection
- `check_allergies` — Direct + cross-reactivity allergy checking
- `check_beers_criteria` — AGS 2023 inappropriate medications in elderly
- `check_high_alert` — ISMP high-alert medication identification with safeguards

### Analysis
- `assess_polypharmacy` — Comprehensive multi-factor risk assessment
- `generate_safety_report` — All-in-one JSON scored safety report
- `generate_formatted_report` — 🎨 **Beautiful markdown report** with priority-grouped actions, risk scorecard, visual indicators
- `calculate_anticholinergic_burden` — ACB scoring with risk interpretation
- `deprescribing_opportunities` — Evidence-based deprescribing with taper schedules
- `medication_reconciliation` — Cross-source medication list comparison
- `normalize_medication_name` — Strip doses/frequencies, map brand→generic

### Administration & Scheduling
- `check_food_interactions` — Drug-food interaction detection (grapefruit, dairy, vitamin K, etc.)
- `check_timing_conflicts` — Temporal separation requirements between co-administered drugs
- `generate_timing_schedule` — Optimal daily medication schedule with all constraints resolved

### Reference & EHR
- `pgx_drug_lookup` — Look up drugs affected by a specific genotype result
- `pull_patient_medications` — FHIR R4 EHR integration via SHARP context

## Input Robustness

PharmSafe handles real-world medication inputs, not just clean generic names:

- **200+ brand→generic mappings** (Coumadin→warfarin, Lipitor→atorvastatin, Tums→calcium carbonate, etc.)
- **OTC brands** recognized (Advil, Aleve, Tums, Pepto-Bismol, Mucinex, Sudafed, Flonase, etc.)
- **Dose/frequency stripping** ("Metformin 1000mg BID" → "metformin")
- **Formulation removal** (XR, SR, ER, capsule, tablet, etc.)
- **Case insensitive** (WARFARIN, Warfarin, warfarin all work)
- **Word-boundary matching** prevents false positives (aspirin ≠ lisinopril)
- **Deduplication** across all checkers (same drug as brand+generic counted once)

## Clinical Evidence Base

- **Drug Interactions**: FDA safety communications, Lexicomp, CredibleMeds
- **Pharmacogenomics**: CPIC guidelines, PharmGKB evidence levels (1A/1B)
- **Beers Criteria**: AGS 2023 (American Geriatrics Society)
- **High-Alert**: ISMP (Institute for Safe Medication Practices)
- **Anticholinergic Burden**: ACB Scale (validated cognitive burden scoring)
- **Deprescribing**: Canadian Deprescribing Network, deprescribing.org, Beers 2023
- **Renal Dosing**: KDIGO guidelines, FDA labels
- **Cross-Reactivity**: Published immunological cross-reactivity data

## Quick Start

```bash
cd pharmsafe-mcp
npm install
npm run dev          # HTTP server on port 3001
npm run dev:stdio    # stdio transport for MCP clients
npm test             # Run 190 test assertions (59 unit + 21 integration + 110 stress)
```

## Deployment

```bash
# Docker
docker build -t pharmsafe-mcp .
docker run -p 3001:3001 pharmsafe-mcp

# Railway (one-click)
# Uses railway.json config — just connect repo and deploy
```

## Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/mcp` | POST | MCP protocol endpoint |
| `/health` | GET | Health check + tool list |
| `/.well-known/agent-card.json` | GET | Agent discovery |

## SHARP Context (EHR Integration)

When deployed on the Prompt Opinion platform, SHARP context headers enable direct EHR data access:

```
x-fhir-server-url: https://fhir.hospital.org/R4
x-fhir-access-token: <oauth2-token>
x-patient-id: <fhir-patient-id>
```

The `pull_patient_medications` tool uses these to fetch the patient's active medications, allergies, and relevant labs directly from the EHR.

## What Makes This Different

| Feature | EHR Alerts | Clinical Pharmacist | This MCP |
|---------|-----------|-------------------|----------|
| Drug interactions | Basic (high noise) | Comprehensive | Comprehensive + severity-ranked |
| Alert fatigue | Very high (>90% overridden) | N/A | Prioritized by risk score |
| Pharmacogenomics | Rarely integrated | If available | Built-in with CPIC guidance |
| Anticholinergic burden | Not calculated | Manual | Automated ACB scoring |
| Beers Criteria | Some EHRs | Expert knowledge | Systematic + disease-drug |
| Deprescribing plans | None | Time-intensive | Instant with taper schedules |
| Renal/hepatic dosing | Basic flags | Expert knowledge | GFR/Child-Pugh-specific guidance |
| Medication reconciliation | Manual process | Manual process | Automated comparison |
| Cost | $$$$ (EHR license) | $150+/hr | Free/Open |
| Availability | Office hours | Limited | 24/7 |

## Hackathon Submission

- **Track**: Option 1 — Superpower (MCP)
- **Platform**: Prompt Opinion
- **Judging Criteria**:
  - **AI Factor**: Pharmacogenomics reasoning, multi-factor risk scoring, pattern detection across drug/gene/organ/age interactions. Platform LLM provides clinical narrative.
  - **Potential Impact**: Every prescriber, pharmacist, and care team faces medication safety decisions daily. $528B problem.
  - **Feasibility**: Standard MCP protocol, FHIR R4 integration, evidence-based clinical data, production-deployable today.
