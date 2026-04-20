import { PgxDrugEntry, PatientGenotype, PgxResult, MetabolizerStatus } from './types.js';

export const PGX_DATABASE: PgxDrugEntry[] = [
  // CYP2D6 substrates
  {
    drug: 'codeine', gene: 'CYP2D6', enzyme: 'CYP2D6',
    metabolizerImpact: {
      'ultra-rapid': { effect: 'Rapid conversion to morphine — toxicity/respiratory depression risk', recommendation: 'AVOID codeine. Use non-codeine analgesic.', dosingGuidance: 'Contraindicated' },
      'rapid': { effect: 'Increased morphine formation — enhanced opioid effects', recommendation: 'Use alternative analgesic or reduce dose by 50%', dosingGuidance: 'Reduce dose 50%' },
      'normal': { effect: 'Normal codeine metabolism', recommendation: 'Standard dosing appropriate', dosingGuidance: 'Standard dose' },
      'intermediate': { effect: 'Reduced morphine formation — diminished analgesic effect', recommendation: 'Consider alternative analgesic. Higher doses unlikely to help.', dosingGuidance: 'Use alternative' },
      'poor': { effect: 'Minimal morphine formation — essentially no analgesic effect from codeine', recommendation: 'Use alternative analgesic (morphine, oxycodone, non-opioid)', dosingGuidance: 'Use alternative' }
    },
    evidenceLevel: 'PharmGKB-1A', cpicGuideline: true
  },
  {
    drug: 'tramadol', gene: 'CYP2D6', enzyme: 'CYP2D6',
    metabolizerImpact: {
      'ultra-rapid': { effect: 'Rapid O-desmethyltramadol formation — respiratory depression risk', recommendation: 'AVOID tramadol. Use non-tramadol analgesic.', dosingGuidance: 'Contraindicated' },
      'rapid': { effect: 'Increased active metabolite — enhanced opioid effects', recommendation: 'Reduce dose or use alternative', dosingGuidance: 'Reduce dose 25-50%' },
      'normal': { effect: 'Normal metabolism', recommendation: 'Standard dosing', dosingGuidance: 'Standard dose' },
      'intermediate': { effect: 'Reduced efficacy', recommendation: 'Consider alternative analgesic', dosingGuidance: 'Use alternative' },
      'poor': { effect: 'Markedly reduced efficacy — minimal opioid effect', recommendation: 'Use alternative analgesic', dosingGuidance: 'Use alternative' }
    },
    evidenceLevel: 'PharmGKB-1A', cpicGuideline: true
  },
  {
    drug: 'tamoxifen', gene: 'CYP2D6', enzyme: 'CYP2D6',
    metabolizerImpact: {
      'ultra-rapid': { effect: 'Increased endoxifen formation — potentially enhanced efficacy', recommendation: 'Standard dosing. Monitor for side effects.', dosingGuidance: 'Standard dose' },
      'rapid': null,
      'normal': { effect: 'Normal endoxifen levels — expected efficacy', recommendation: 'Standard dosing', dosingGuidance: 'Standard dose (20mg)' },
      'intermediate': { effect: 'Reduced endoxifen — potentially reduced efficacy (30-50% lower levels)', recommendation: 'Consider increased dose (40mg) or alternative (aromatase inhibitor if postmenopausal)', dosingGuidance: 'Consider 40mg or alternative' },
      'poor': { effect: 'Very low endoxifen — significantly reduced efficacy', recommendation: 'Use alternative agent (aromatase inhibitor). If premenopausal, consider ovarian suppression + AI.', dosingGuidance: 'Use alternative' }
    },
    evidenceLevel: 'PharmGKB-1A', cpicGuideline: true
  },
  {
    drug: 'metoprolol', gene: 'CYP2D6', enzyme: 'CYP2D6',
    metabolizerImpact: {
      'ultra-rapid': { effect: 'Rapid clearance — subtherapeutic levels, poor BP/HR control', recommendation: 'May need higher doses or switch to atenolol/bisoprolol (not CYP2D6 dependent)', dosingGuidance: 'Increase dose or use alternative' },
      'rapid': null,
      'normal': { effect: 'Normal metabolism', recommendation: 'Standard dosing', dosingGuidance: 'Standard dose' },
      'intermediate': { effect: 'Moderately elevated levels — enhanced beta-blockade', recommendation: 'Start at lower dose. Monitor HR and BP.', dosingGuidance: 'Start low, titrate carefully' },
      'poor': { effect: '5x higher AUC — excessive beta-blockade, bradycardia, hypotension', recommendation: 'Reduce dose by 50-75% or use bisoprolol/atenolol', dosingGuidance: 'Reduce 50-75%' }
    },
    evidenceLevel: 'PharmGKB-1B', cpicGuideline: false
  },
  // CYP2C19 substrates
  {
    drug: 'clopidogrel', gene: 'CYP2C19', enzyme: 'CYP2C19',
    metabolizerImpact: {
      'ultra-rapid': { effect: 'Enhanced active metabolite — increased antiplatelet effect, slightly higher bleeding risk', recommendation: 'Standard dose acceptable. Monitor for bleeding.', dosingGuidance: 'Standard dose' },
      'rapid': { effect: 'Slightly enhanced activation', recommendation: 'Standard dosing', dosingGuidance: 'Standard dose' },
      'normal': { effect: 'Normal prodrug activation', recommendation: 'Standard dosing (75mg)', dosingGuidance: 'Standard dose (75mg)' },
      'intermediate': { effect: 'Reduced active metabolite (~30% lower) — diminished antiplatelet effect', recommendation: 'Use prasugrel or ticagrelor (not CYP2C19 dependent)', dosingGuidance: 'Use alternative P2Y12 inhibitor' },
      'poor': { effect: 'Minimal activation — treatment failure, increased MACE risk', recommendation: 'AVOID clopidogrel. Use prasugrel or ticagrelor.', dosingGuidance: 'Contraindicated — use alternative' }
    },
    evidenceLevel: 'PharmGKB-1A', cpicGuideline: true
  },
  {
    drug: 'omeprazole', gene: 'CYP2C19', enzyme: 'CYP2C19',
    metabolizerImpact: {
      'ultra-rapid': { effect: 'Rapid clearance — subtherapeutic acid suppression', recommendation: 'Increase dose (40mg BID) or switch to rabeprazole (less CYP2C19 dependent)', dosingGuidance: 'Double dose or use alternative' },
      'rapid': { effect: 'Faster clearance — may need dose increase', recommendation: 'Consider 40mg daily', dosingGuidance: 'Increase to 40mg' },
      'normal': { effect: 'Normal metabolism', recommendation: 'Standard dosing (20mg)', dosingGuidance: 'Standard dose' },
      'intermediate': { effect: 'Slower clearance — enhanced acid suppression', recommendation: 'Standard dose likely adequate. May consider 10mg for maintenance.', dosingGuidance: 'Standard or reduced dose' },
      'poor': { effect: '5-12x higher AUC — prolonged acid suppression, potential overexposure', recommendation: 'Reduce dose by 50% for chronic use. 10mg may be adequate.', dosingGuidance: 'Reduce to 10mg' }
    },
    evidenceLevel: 'PharmGKB-1A', cpicGuideline: true
  },
  {
    drug: 'escitalopram', gene: 'CYP2C19', enzyme: 'CYP2C19',
    metabolizerImpact: {
      'ultra-rapid': { effect: 'Rapid clearance — may have reduced efficacy at standard doses', recommendation: 'Consider alternative SSRI or increased dose (max 20mg)', dosingGuidance: 'Consider dose increase' },
      'rapid': null,
      'normal': { effect: 'Normal metabolism', recommendation: 'Standard dosing (10-20mg)', dosingGuidance: 'Standard dose' },
      'intermediate': { effect: 'Moderately elevated levels', recommendation: 'Standard starting dose. Titrate cautiously.', dosingGuidance: 'Standard dose, cautious titration' },
      'poor': { effect: '2x higher levels — increased side effect risk (QT prolongation, serotonergic effects)', recommendation: 'Reduce dose by 50%. Max 10mg/day.', dosingGuidance: 'Max 10mg/day' }
    },
    evidenceLevel: 'PharmGKB-1A', cpicGuideline: true
  },
  {
    drug: 'voriconazole', gene: 'CYP2C19', enzyme: 'CYP2C19',
    metabolizerImpact: {
      'ultra-rapid': { effect: 'Subtherapeutic levels — antifungal treatment failure, breakthrough infections', recommendation: 'Use higher doses or alternative antifungal. TDM strongly recommended.', dosingGuidance: 'Higher dose + TDM' },
      'rapid': { effect: 'Lower trough levels', recommendation: 'Monitor trough levels (TDM). Adjust as needed.', dosingGuidance: 'TDM-guided dosing' },
      'normal': { effect: 'Normal metabolism', recommendation: 'Standard dosing with TDM', dosingGuidance: 'Standard dose' },
      'intermediate': { effect: 'Elevated levels — increased hepatotoxicity and neurotoxicity risk', recommendation: 'Standard starting dose with early TDM. Reduce if trough >5.5', dosingGuidance: 'Standard dose + early TDM' },
      'poor': { effect: '4x higher AUC — significant toxicity risk', recommendation: 'Reduce dose by 50%. Mandatory TDM. Consider alternative antifungal.', dosingGuidance: 'Reduce 50% + mandatory TDM' }
    },
    evidenceLevel: 'PharmGKB-1A', cpicGuideline: true
  },
  // CYP2C9 substrates
  {
    drug: 'warfarin', gene: 'CYP2C9', enzyme: 'CYP2C9',
    metabolizerImpact: {
      'ultra-rapid': null,
      'rapid': null,
      'normal': { effect: 'Normal S-warfarin clearance', recommendation: 'Standard dosing algorithm', dosingGuidance: 'Use clinical dosing algorithm' },
      'intermediate': { effect: 'Reduced clearance — lower dose requirements (~20-30% reduction)', recommendation: 'Start at reduced dose. More frequent INR monitoring during initiation.', dosingGuidance: 'Reduce initial dose 20-30%' },
      'poor': { effect: 'Markedly reduced clearance — much lower dose needed. High bleeding risk at standard doses.', recommendation: 'Start at 50-70% of calculated dose. Very frequent INR monitoring. Consider DOAC alternative.', dosingGuidance: 'Reduce 50-70%' }
    },
    evidenceLevel: 'PharmGKB-1A', cpicGuideline: true
  },
  {
    drug: 'celecoxib', gene: 'CYP2C9', enzyme: 'CYP2C9',
    metabolizerImpact: {
      'ultra-rapid': null,
      'rapid': null,
      'normal': { effect: 'Normal metabolism', recommendation: 'Standard dosing', dosingGuidance: 'Standard dose' },
      'intermediate': { effect: 'Elevated levels — increased GI and CV risk', recommendation: 'Reduce dose by 50%. Start with 100mg daily.', dosingGuidance: 'Reduce 50%' },
      'poor': { effect: '3-7x higher AUC — significant toxicity risk', recommendation: 'Avoid or use lowest dose (100mg every other day). Consider alternative analgesic.', dosingGuidance: 'Avoid or minimum dose' }
    },
    evidenceLevel: 'PharmGKB-1A', cpicGuideline: true
  },
  // CYP3A5
  {
    drug: 'tacrolimus', gene: 'CYP3A5', enzyme: 'CYP3A5',
    metabolizerImpact: {
      'ultra-rapid': null,
      'rapid': null,
      'normal': { effect: 'CYP3A5 expresser — rapid tacrolimus clearance, higher doses needed', recommendation: 'Start at 1.5-2x standard dose. Early TDM critical.', dosingGuidance: '0.3 mg/kg/day starting dose' },
      'intermediate': { effect: 'Heterozygous expresser — moderately increased clearance', recommendation: 'Start at standard-to-high dose. TDM within 3 days.', dosingGuidance: '0.25 mg/kg/day' },
      'poor': { effect: 'CYP3A5 non-expresser — standard clearance (most common in Caucasians)', recommendation: 'Standard dosing', dosingGuidance: '0.2 mg/kg/day' }
    },
    evidenceLevel: 'PharmGKB-1A', cpicGuideline: true
  },
  // DPYD
  {
    drug: 'fluorouracil', gene: 'DPYD', enzyme: 'DPD',
    metabolizerImpact: {
      'ultra-rapid': null,
      'rapid': null,
      'normal': { effect: 'Normal DPD activity', recommendation: 'Standard dosing', dosingGuidance: 'Standard dose' },
      'intermediate': { effect: 'Reduced DPD activity — elevated 5-FU levels, increased toxicity', recommendation: 'Reduce dose by 50%. Monitor for severe mucositis, myelosuppression.', dosingGuidance: 'Reduce 50%' },
      'poor': { effect: 'Absent/near-absent DPD — potentially fatal toxicity at standard doses', recommendation: 'AVOID fluoropyrimidines. Use alternative chemotherapy regimen.', dosingGuidance: 'Contraindicated' }
    },
    evidenceLevel: 'PharmGKB-1A', cpicGuideline: true
  },
  {
    drug: 'capecitabine', gene: 'DPYD', enzyme: 'DPD',
    metabolizerImpact: {
      'ultra-rapid': null,
      'rapid': null,
      'normal': { effect: 'Normal DPD activity', recommendation: 'Standard dosing', dosingGuidance: 'Standard dose' },
      'intermediate': { effect: 'Reduced DPD — increased capecitabine toxicity', recommendation: 'Reduce dose by 50%', dosingGuidance: 'Reduce 50%' },
      'poor': { effect: 'Potentially fatal toxicity', recommendation: 'CONTRAINDICATED', dosingGuidance: 'Contraindicated' }
    },
    evidenceLevel: 'PharmGKB-1A', cpicGuideline: true
  },
  // SLCO1B1
  {
    drug: 'simvastatin', gene: 'SLCO1B1', enzyme: 'OATP1B1',
    metabolizerImpact: {
      'ultra-rapid': null,
      'rapid': null,
      'normal': { effect: 'Normal hepatic uptake', recommendation: 'Standard dosing', dosingGuidance: 'Up to 40mg' },
      'intermediate': { effect: 'Reduced hepatic uptake — higher systemic statin levels, increased myopathy risk', recommendation: 'Limit to simvastatin 20mg. Consider pravastatin or rosuvastatin.', dosingGuidance: 'Max 20mg' },
      'poor': { effect: 'Markedly impaired uptake — high myopathy/rhabdomyolysis risk', recommendation: 'Avoid simvastatin. Use pravastatin or rosuvastatin (lower SLCO1B1 dependence).', dosingGuidance: 'Contraindicated — use alternative statin' }
    },
    evidenceLevel: 'PharmGKB-1A', cpicGuideline: true
  }
];

export function checkPharmacogenomics(
  medications: string[],
  genotypes: PatientGenotype[]
): PgxResult[] {
  const results: PgxResult[] = [];
  const normalizedMeds = medications.map(m => m.toLowerCase().trim());

  for (const med of normalizedMeds) {
    for (const entry of PGX_DATABASE) {
      if (!med.includes(entry.drug.toLowerCase()) && !entry.drug.toLowerCase().includes(med)) continue;

      const matchingGenotype = genotypes.find(g =>
        g.gene.toUpperCase() === entry.gene.toUpperCase()
      );

      if (!matchingGenotype) continue;

      const impact = entry.metabolizerImpact[matchingGenotype.metabolizerStatus];
      if (!impact) continue;

      if (matchingGenotype.metabolizerStatus === 'normal') continue;

      results.push({
        drug: entry.drug,
        gene: entry.gene,
        metabolizerStatus: matchingGenotype.metabolizerStatus,
        effect: impact.effect,
        recommendation: impact.recommendation,
        dosingGuidance: impact.dosingGuidance,
        evidenceLevel: entry.evidenceLevel
      });
    }
  }

  return results;
}

export function getAffectedDrugs(genotype: PatientGenotype): PgxDrugEntry[] {
  return PGX_DATABASE.filter(entry =>
    entry.gene.toUpperCase() === genotype.gene.toUpperCase() &&
    entry.metabolizerImpact[genotype.metabolizerStatus] !== null
  );
}
