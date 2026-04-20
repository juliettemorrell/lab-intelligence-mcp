import { SafetyReport, PatientContext } from './types.js';
import { checkBeersCriteria } from './beers-criteria.js';
import { checkHighAlertMedications, calculateAnticholinergicBurden } from './high-alert.js';
import { checkFoodInteractions, checkTimingConflicts } from './administration.js';
import { normalizeMedList } from './normalizer.js';

const SEVERITY_BADGE: Record<string, string> = {
  'contraindicated': '🚫 CONTRAINDICATED',
  'major': '🔴 MAJOR',
  'moderate': '🟠 MODERATE',
  'minor': '🟡 MINOR',
  'info': 'ℹ️ INFO'
};

const RISK_BADGE: Record<string, string> = {
  'critical': '🚨 CRITICAL',
  'high': '🔴 HIGH',
  'moderate': '🟠 MODERATE',
  'low': '🟢 LOW'
};

export interface FormattedSafetyReport {
  markdown: string;
  summary: {
    riskLevel: string;
    totalFindings: number;
    criticalActions: number;
    patient: { age?: number; sex?: string; medicationCount: number };
  };
  priorityActions: {
    critical: string[];
    high: string[];
    moderate: string[];
    informational: string[];
  };
}

export function formatSafetyReport(patient: PatientContext, report: SafetyReport): FormattedSafetyReport {
  const medNames = patient.medications.map(m => m.genericName || m.name);
  const normMeds = normalizeMedList(medNames);

  // Extra analyses not in base report
  const beers = patient.age !== undefined
    ? checkBeersCriteria(medNames, patient.age, patient.conditions)
    : { avoidList: [], diseaseDrug: [] };

  const highAlert = checkHighAlertMedications(medNames);
  const acb = calculateAnticholinergicBurden(medNames);
  const foodInteractions = checkFoodInteractions(medNames);
  const timingConflicts = checkTimingConflicts(medNames);

  // Priority actions
  const critical: string[] = [];
  const high: string[] = [];
  const moderate: string[] = [];
  const informational: string[] = [];

  for (const i of report.interactions) {
    const action = `**${i.pair[0]} + ${i.pair[1]}** — ${i.clinicalEffect.split('.')[0]}. ${i.recommendation.split('.')[0]}.`;
    if (i.severity === 'contraindicated') critical.push(action);
    else if (i.severity === 'major') high.push(action);
    else if (i.severity === 'moderate') moderate.push(action);
    else informational.push(action);
  }

  for (const a of report.allergyAlerts) {
    if (!a.crossReactivity) {
      critical.push(`**ALLERGY**: ${a.drug} — ${a.recommendation.split('.')[0]}.`);
    } else {
      high.push(`**CROSS-REACTIVITY**: ${a.drug} (${a.allergen} class) — assess risk/benefit.`);
    }
  }

  for (const r of report.renalAlerts) {
    if (r.adjustedDose.toUpperCase().includes('DISCONTINUE') || r.adjustedDose.toUpperCase().includes('CONTRAINDICATED')) {
      critical.push(`**DISCONTINUE**: ${r.drug} at GFR ${r.gfr} — ${r.adjustedDose}.`);
    } else {
      high.push(`**RENAL DOSE**: ${r.drug} → ${r.adjustedDose}.`);
    }
  }

  for (const h of report.hepaticAlerts) {
    if (h.adjustedDose.toUpperCase().includes('AVOID') || h.adjustedDose.toUpperCase().includes('CONTRAINDICATED')) {
      critical.push(`**AVOID**: ${h.drug} in Child-Pugh ${h.childPughClass} — ${h.adjustedDose}.`);
    } else {
      high.push(`**HEPATIC DOSE**: ${h.drug} → ${h.adjustedDose}.`);
    }
  }

  for (const a of report.pgxAlerts) {
    if (a.dosingGuidance.toLowerCase().includes('contraindicated')) {
      critical.push(`**PGx CONTRAINDICATED**: ${a.drug} (${a.gene} ${a.metabolizerStatus}) — ${a.recommendation.split('.')[0]}.`);
    } else if (a.metabolizerStatus === 'poor' || a.metabolizerStatus === 'ultra-rapid') {
      high.push(`**PGx ADJUSTMENT**: ${a.drug} (${a.gene} ${a.metabolizerStatus}) — ${a.dosingGuidance}.`);
    } else {
      moderate.push(`**PGx**: ${a.drug} (${a.gene} ${a.metabolizerStatus}) — ${a.dosingGuidance}.`);
    }
  }

  for (const b of beers.avoidList) {
    high.push(`**BEERS**: Avoid ${b.drug} (${b.category}) → alternative: ${b.alternatives[0] || 'see recommendation'}.`);
  }
  for (const dd of beers.diseaseDrug) {
    critical.push(`**DISEASE-DRUG**: ${dd.drug} contraindicated with ${dd.condition} — ${dd.recommendation}.`);
  }

  for (const d of report.duplicates) {
    high.push(`**DUPLICATE**: ${d.drugs.join(' + ')} (${d.therapeuticClass}) — ${d.risk}.`);
  }

  for (const fi of foodInteractions) {
    if (fi.severity === 'major') {
      high.push(`**FOOD**: ${fi.drug} — avoid ${fi.food.split(' ')[0]}.`);
    } else {
      moderate.push(`**FOOD**: ${fi.drug} + ${fi.food.split(',')[0]} — ${fi.recommendation.split('.')[0]}.`);
    }
  }

  for (const tc of timingConflicts) {
    moderate.push(`**TIMING**: Separate ${tc.drug1} and ${tc.drug2} by ${tc.separationRequired}.`);
  }

  for (const d of report.deprescribingCandidates) {
    informational.push(`**DEPRESCRIBE**: ${d.drug} — ${d.reason.split('.')[0]}.`);
  }

  if (acb.riskLevel === 'high') {
    high.push(`**ANTICHOLINERGIC BURDEN**: ACB=${acb.totalScore} (high). ${acb.interpretation.split('.')[0]}.`);
  } else if (acb.riskLevel === 'moderate') {
    moderate.push(`**ANTICHOLINERGIC BURDEN**: ACB=${acb.totalScore} (moderate).`);
  }

  // Build markdown
  const lines: string[] = [];

  lines.push(`# 💊 Medication Safety Report`);
  lines.push('');
  lines.push(`**Generated**: ${new Date(report.timestamp).toLocaleString()}  `);
  lines.push(`**Overall Risk**: ${RISK_BADGE[report.riskScore.overall]}`);
  lines.push('');

  // Patient snapshot
  lines.push(`## 👤 Patient Snapshot`);
  lines.push('');
  const snapshot: string[] = [];
  if (patient.age !== undefined) snapshot.push(`**Age**: ${patient.age}${patient.age >= 65 ? ' (geriatric)' : ''}`);
  if (patient.sex) snapshot.push(`**Sex**: ${patient.sex}`);
  snapshot.push(`**Medications**: ${patient.medications.length}${report.patientSummary.isPolypharmacy ? ' ⚠️ polypharmacy' : ''}`);
  if (report.patientSummary.hasRenalImpairment) snapshot.push(`**Renal**: impaired (GFR ${patient.renalFunction?.gfr})`);
  if (report.patientSummary.hasHepaticImpairment) snapshot.push(`**Hepatic**: Child-Pugh ${patient.hepaticFunction?.childPughClass}`);
  if (report.patientSummary.hasGenotyping) snapshot.push(`**PGx**: ${patient.genotypes?.length} genes typed`);
  lines.push(snapshot.join(' · '));
  lines.push('');

  // Risk scorecard
  lines.push(`## 📊 Risk Scorecard`);
  lines.push('');
  lines.push(`| Dimension | Score |`);
  lines.push(`|-----------|-------|`);
  lines.push(`| Drug Interactions | ${bar(report.riskScore.interactionRisk)} ${report.riskScore.interactionRisk.toFixed(1)}/10 |`);
  lines.push(`| Polypharmacy | ${bar(report.riskScore.polypharmacyRisk)} ${report.riskScore.polypharmacyRisk.toFixed(1)}/10 |`);
  lines.push(`| Pharmacogenomics | ${bar(report.riskScore.pgxRisk)} ${report.riskScore.pgxRisk.toFixed(1)}/10 |`);
  lines.push(`| Organ Impairment | ${bar(report.riskScore.organImpairmentRisk)} ${report.riskScore.organImpairmentRisk.toFixed(1)}/10 |`);
  lines.push('');

  // Priority actions
  if (critical.length > 0) {
    lines.push(`## 🚨 Critical Actions (${critical.length})`);
    lines.push('');
    critical.forEach((a, i) => lines.push(`${i + 1}. ${a}`));
    lines.push('');
  }

  if (high.length > 0) {
    lines.push(`## 🔴 High Priority (${high.length})`);
    lines.push('');
    high.forEach((a, i) => lines.push(`${i + 1}. ${a}`));
    lines.push('');
  }

  if (moderate.length > 0) {
    lines.push(`## 🟠 Moderate Priority (${moderate.length})`);
    lines.push('');
    moderate.forEach((a, i) => lines.push(`${i + 1}. ${a}`));
    lines.push('');
  }

  // High-alert medications (always highlight)
  if (highAlert.length > 0) {
    lines.push(`## ⚠️ High-Alert Medications in Regimen`);
    lines.push('');
    for (const h of highAlert) {
      lines.push(`**${h.drug}** (${h.category})`);
      lines.push(`- Monitor: ${h.monitoringRequired.join(', ')}`);
      lines.push('');
    }
  }

  // Informational
  if (informational.length > 0) {
    lines.push(`## 💡 Optimization Opportunities (${informational.length})`);
    lines.push('');
    informational.forEach((a, i) => lines.push(`${i + 1}. ${a}`));
    lines.push('');
  }

  // All clear sections
  if (critical.length === 0 && high.length === 0 && moderate.length === 0 && informational.length === 0) {
    lines.push(`## ✅ No Significant Issues Detected`);
    lines.push('');
    lines.push(`Current medication regimen shows no interactions, duplicates, PGx conflicts, or dosing concerns based on provided data.`);
    lines.push('');
  }

  // Medication list
  lines.push(`## 📋 Medication List`);
  lines.push('');
  for (const m of patient.medications) {
    const parts = [m.name];
    if (m.dose) parts.push(m.dose);
    if (m.frequency) parts.push(m.frequency);
    const line = parts.join(' ');
    lines.push(`- ${line}${m.indication ? ` _(${m.indication})_` : ''}`);
  }
  lines.push('');

  // Footer disclaimer
  lines.push(`---`);
  lines.push(`> ⚕️ _${report.disclaimer}_`);

  return {
    markdown: lines.join('\n'),
    summary: {
      riskLevel: report.riskScore.overall,
      totalFindings: critical.length + high.length + moderate.length + informational.length,
      criticalActions: critical.length,
      patient: {
        age: patient.age,
        sex: patient.sex,
        medicationCount: patient.medications.length
      }
    },
    priorityActions: { critical, high, moderate, informational }
  };
}

function bar(score: number): string {
  const filled = Math.round(score);
  const empty = 10 - filled;
  return '█'.repeat(filled) + '░'.repeat(empty);
}
