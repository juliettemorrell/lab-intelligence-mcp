# PharmSafe MCP — Medication Safety & Pharmacogenomics Intelligence

> **Hackathon submission for [Agents Assemble](https://agents-assemble.devpost.com/) on the Prompt Opinion platform.**

One MCP server that catches dangerous drug interactions, pharmacogenomic conflicts, inappropriate medications in elderly, dosing errors in organ impairment, and polypharmacy risks — before they reach the patient.

## The Problem

Adverse drug events cause **~2 million hospitalizations** and **$528 billion** in costs annually in the US alone. Current EHR alerts are noisy (>90% overridden) and miss pharmacogenomic conflicts, cumulative anticholinergic burden, and deprescribing opportunities.

## The Solution

**20 MCP tools** providing comprehensive medication safety analysis:

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
| Drug-food interactions | Grapefruit, dairy, vitamin K, tyramine, alcohol, potassium |
| Medication scheduling | Optimal daily timing with food/separation constraints |
| FHIR EHR pull | Direct medication/allergy/lab extraction via SHARP context |

## Input Robustness

PharmSafe handles real-world medication inputs — not just clean generic names:

- **200+ brand→generic mappings** (Coumadin→warfarin, Lipitor→atorvastatin, Tums→calcium carbonate)
- **OTC brands** recognized (Advil, Aleve, Tums, Pepto-Bismol, Mucinex, Sudafed, Flonase, etc.)
- **Dose/frequency stripping** ("Metformin 1000mg BID" → "metformin")
- **Formulation removal** (XR, SR, ER, capsule, tablet, etc.)
- **Case insensitive** matching with word-boundary false-positive prevention
- **Deduplication** across all checkers (same drug as brand+generic counted once)

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
# Docker (from repo root — deploys PharmSafe)
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

## Architecture: Code vs. LLM

| Layer | Method | Why |
|-------|--------|-----|
| Drug interaction detection | Deterministic matching | Known pairs, no ambiguity |
| PGx metabolizer impact | Lookup + rules | CPIC guidelines are deterministic |
| Renal dose calculation | Math (GFR → dose) | Pure computation |
| Beers Criteria matching | Rule-based | AGS guidelines are explicit |
| ACB scoring | Lookup + sum | Validated scoring scale |
| Cross-reactivity | Class graph traversal | Drug families are well-defined |
| Risk scoring | Weighted algorithm | Multi-factor risk integration |
| Clinical narrative | LLM (platform) | Natural language explanations |
| Treatment decisions | Clinician | Human-in-the-loop always |

## Clinical Evidence Base

- **Drug Interactions**: FDA safety communications, Lexicomp, CredibleMeds
- **Pharmacogenomics**: CPIC guidelines, PharmGKB evidence levels (1A/1B)
- **Beers Criteria**: AGS 2023 (American Geriatrics Society)
- **High-Alert**: ISMP (Institute for Safe Medication Practices)
- **Anticholinergic Burden**: ACB Scale (validated cognitive burden scoring)
- **Deprescribing**: Canadian Deprescribing Network, deprescribing.org, Beers 2023
- **Renal Dosing**: KDIGO guidelines, FDA labels
- **Cross-Reactivity**: Published immunological cross-reactivity data

## Hackathon Submission

- **Track**: Option 1 — Superpower (MCP)
- **Platform**: Prompt Opinion
- **Judging Criteria**:
  - **AI Factor**: Pharmacogenomics reasoning, multi-factor risk scoring, pattern detection across drug/gene/organ/age interactions. Platform LLM provides clinical narrative.
  - **Potential Impact**: Every prescriber, pharmacist, and care team faces medication safety decisions daily. $528B problem.
  - **Feasibility**: Standard MCP protocol, FHIR R4 integration, evidence-based clinical data, production-deployable today.

---

*See [`pharmsafe-mcp/README.md`](pharmsafe-mcp/README.md) for the full PharmSafe documentation including all 20 tool descriptions and comparison table.*
