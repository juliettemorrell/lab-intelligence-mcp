/**
 * Clinical Pattern Detection Engine
 *
 * Identifies multi-biomarker patterns that indicate clinical conditions.
 * This is the "AI Factor" — no rule-based system does cross-biomarker
 * functional medicine pattern recognition.
 */

import { findMarkerByLoinc } from './loinc-map.js';

export interface ClinicalPattern {
  id: string;
  name: string;
  confidence: 'high' | 'moderate' | 'suggestive';
  markers_involved: string[];
  description: string;
  clinical_significance: string;
  suggested_actions: string[];
}

/**
 * Detect clinical patterns from a set of normalized lab values.
 * Input: Map of LOINC code → value (in standard units)
 */
export function detectPatterns(results: Map<string, number>): ClinicalPattern[] {
  const patterns: ClinicalPattern[] = [];

  // Helper to check if a value exists and meets a condition
  const has = (loinc: string) => results.has(loinc);
  const val = (loinc: string) => results.get(loinc)!;

  // ===== THYROID CONVERSION ISSUE =====
  // High/normal TSH + low Free T3 + normal/high Free T4 = T4→T3 conversion problem
  if (has('11580-8') && has('3051-0')) {
    const tsh = val('11580-8');
    const ft3 = val('3051-0');
    const ft4 = has('3016-3') ? val('3016-3') : null;
    const rt3 = has('33244-7') ? val('33244-7') : null;

    if (tsh > 2.0 && ft3 < 3.0) {
      const confidence = rt3 && rt3 > 15 ? 'high' : ft4 && ft4 > 1.1 ? 'moderate' : 'suggestive';
      patterns.push({
        id: 'thyroid_conversion',
        name: 'Thyroid Conversion Issue (T4→T3)',
        confidence,
        markers_involved: ['TSH', 'Free T3', ft4 ? 'Free T4' : '', rt3 ? 'Reverse T3' : ''].filter(Boolean),
        description: 'TSH is elevated with low Free T3, suggesting impaired conversion of T4 to active T3.' +
          (rt3 && rt3 > 15 ? ' Elevated Reverse T3 confirms preferential conversion to inactive rT3.' : ''),
        clinical_significance: 'Common in functional medicine patients with fatigue, weight gain, cold intolerance despite "normal" thyroid labs. Often driven by inflammation, iron deficiency, selenium deficiency, or chronic stress.',
        suggested_actions: [
          'Check iron panel (ferritin, iron, TIBC, iron saturation) — iron is required for T4→T3 conversion',
          'Check selenium status',
          'Evaluate hs-CRP for inflammation',
          'Consider Reverse T3 if not already tested',
          'Assess adrenal function (cortisol, DHEA-S) — cortisol impacts conversion',
        ],
      });
    }
  }

  // ===== HASHIMOTO'S PATTERN =====
  if (has('30152-4') || has('5765-2')) {
    const tpo = has('30152-4') ? val('30152-4') : 0;
    const tgab = has('5765-2') ? val('5765-2') : 0;

    if (tpo > 15 || tgab > 20) {
      patterns.push({
        id: 'hashimotos',
        name: 'Autoimmune Thyroid Pattern (Hashimoto\'s)',
        confidence: tpo > 35 || tgab > 40 ? 'high' : 'moderate',
        markers_involved: ['TPO Antibodies', 'Thyroglobulin Antibodies', 'TSH'].filter(Boolean),
        description: `Elevated thyroid antibodies (TPO: ${tpo}, TgAb: ${tgab}) indicate autoimmune thyroid process.`,
        clinical_significance: 'Hashimoto\'s is the most common cause of hypothyroidism. Antibody levels fluctuate — trend over time. Even with normal TSH, active autoimmunity warrants monitoring.',
        suggested_actions: [
          'Full thyroid panel if not complete (TSH, FT3, FT4, RT3)',
          'Screen for gluten sensitivity (associated with Hashimoto\'s)',
          'Check Vitamin D (immune modulator)',
          'Assess selenium status (reduces antibodies in studies)',
          'Monitor antibodies every 3-6 months to track trend',
        ],
      });
    }
  }

  // ===== INSULIN RESISTANCE =====
  if (has('20578-1') || has('1558-6') || has('4548-4')) {
    const insulin = has('20578-1') ? val('20578-1') : null;
    const glucose = has('1558-6') ? val('1558-6') : null;
    const a1c = has('4548-4') ? val('4548-4') : null;
    const trig = has('2571-8') ? val('2571-8') : null;
    const hdl = has('2085-9') ? val('2085-9') : null;

    const signs: string[] = [];
    if (insulin && insulin > 5) signs.push(`Fasting insulin ${insulin} (optimal <5)`);
    if (glucose && glucose > 86) signs.push(`Fasting glucose ${glucose} (functional optimal <86)`);
    if (a1c && a1c > 5.3) signs.push(`HbA1c ${a1c}% (functional optimal <5.3%)`);
    if (trig && hdl && trig / hdl > 2.0) signs.push(`TG/HDL ratio ${(trig / hdl).toFixed(1)} (optimal <2.0)`);

    if (signs.length >= 2) {
      patterns.push({
        id: 'insulin_resistance',
        name: 'Insulin Resistance Pattern',
        confidence: signs.length >= 3 ? 'high' : 'moderate',
        markers_involved: ['Fasting Insulin', 'Fasting Glucose', 'HbA1c', 'Triglycerides', 'HDL'].filter(Boolean),
        description: `Multiple markers suggest insulin resistance: ${signs.join('; ')}`,
        clinical_significance: 'Insulin resistance is the earliest detectable phase of metabolic dysfunction, often 10-15 years before diabetes diagnosis. Conventional labs miss this because they use wider reference ranges.',
        suggested_actions: [
          'Calculate HOMA-IR if fasting insulin and glucose are available',
          'Assess dietary sugar/refined carb intake',
          'Evaluate exercise patterns (especially resistance training)',
          'Check hs-CRP (inflammation worsens insulin resistance)',
          'Consider CGM (continuous glucose monitor) for real-time patterns',
          'Recheck in 90 days after lifestyle interventions',
        ],
      });
    }
  }

  // ===== IRON DEFICIENCY (with or without anemia) =====
  if (has('2276-4') || has('2498-4') || has('14800-7')) {
    const ferritin = has('2276-4') ? val('2276-4') : null;
    const iron = has('2498-4') ? val('2498-4') : null;
    const sat = has('14800-7') ? val('14800-7') : null;
    const hgb = has('718-7') ? val('718-7') : null;
    const mcv = has('787-2') ? val('787-2') : null;

    const signs: string[] = [];
    if (ferritin && ferritin < 40) signs.push(`Ferritin ${ferritin} (functional optimal >40)`);
    if (iron && iron < 60) signs.push(`Iron ${iron} (functional optimal >60)`);
    if (sat && sat < 25) signs.push(`Iron saturation ${sat}% (optimal >25%)`);

    if (signs.length >= 1) {
      const hasAnemia = hgb && hgb < 12;
      patterns.push({
        id: 'iron_deficiency',
        name: hasAnemia ? 'Iron Deficiency Anemia' : 'Iron Deficiency Without Anemia',
        confidence: signs.length >= 2 ? 'high' : 'moderate',
        markers_involved: ['Ferritin', 'Iron', 'Iron Saturation', 'Hemoglobin', 'MCV'].filter(Boolean),
        description: `${signs.join('; ')}. ${hasAnemia ? 'Hemoglobin confirms anemia.' : 'Hemoglobin is still normal — this is pre-anemic iron deficiency.'}`,
        clinical_significance: 'Iron deficiency without anemia is extremely common and underdiagnosed, especially in menstruating women. Causes fatigue, brain fog, hair loss, poor thyroid conversion, and exercise intolerance even with "normal" CBC.',
        suggested_actions: [
          'Check TIBC if not done (confirms iron deficiency vs. anemia of chronic disease)',
          'Assess for GI causes (celiac screen, stool occult blood)',
          'Evaluate menstrual history',
          'Consider iron supplementation (iron bisglycinate best tolerated)',
          'Recheck ferritin in 90 days — target >70 for symptom resolution',
          'Note: ferritin is also an acute phase reactant — check hs-CRP to rule out false elevation',
        ],
      });
    }
  }

  // ===== METHYLATION DYSFUNCTION =====
  if (has('10839-9') || has('2132-9') || has('2284-8')) {
    const homocysteine = has('10839-9') ? val('10839-9') : null;
    const b12 = has('2132-9') ? val('2132-9') : null;
    const folate = has('2284-8') ? val('2284-8') : null;

    const signs: string[] = [];
    if (homocysteine && homocysteine > 7) signs.push(`Homocysteine ${homocysteine} (optimal <7)`);
    if (b12 && b12 < 500) signs.push(`B12 ${b12} (functional optimal >500)`);
    if (folate && folate < 10) signs.push(`Folate ${folate} (functional optimal >10)`);

    if (signs.length >= 2) {
      patterns.push({
        id: 'methylation_dysfunction',
        name: 'Methylation Dysfunction Pattern',
        confidence: signs.length >= 3 ? 'high' : 'moderate',
        markers_involved: ['Homocysteine', 'Vitamin B12', 'Folate'].filter(Boolean),
        description: `${signs.join('; ')}`,
        clinical_significance: 'Impaired methylation affects detoxification, neurotransmitter production, DNA repair, and cardiovascular health. Common MTHFR variants make this worse. Elevated homocysteine is an independent cardiovascular risk factor.',
        suggested_actions: [
          'Consider MTHFR genetic testing',
          'If B12 low: use methylcobalamin or hydroxocobalamin (not cyanocobalamin)',
          'If folate low: use methylfolate (5-MTHF), not folic acid',
          'Add B6 (P5P form) — the third pillar of homocysteine metabolism',
          'Recheck homocysteine in 60-90 days after supplementation',
        ],
      });
    }
  }

  // ===== CHRONIC INFLAMMATION =====
  if (has('30522-7') || has('4537-7') || has('10839-9')) {
    const crp = has('30522-7') ? val('30522-7') : null;
    const esr = has('4537-7') ? val('4537-7') : null;
    const hcy = has('10839-9') ? val('10839-9') : null;

    const signs: string[] = [];
    if (crp && crp > 0.5) signs.push(`hs-CRP ${crp} (optimal <0.5)`);
    if (esr && esr > 10) signs.push(`ESR ${esr} (optimal <10)`);
    if (hcy && hcy > 7) signs.push(`Homocysteine ${hcy} (inflammatory above 7)`);

    if (signs.length >= 2) {
      patterns.push({
        id: 'chronic_inflammation',
        name: 'Chronic Low-Grade Inflammation',
        confidence: signs.length >= 3 ? 'high' : 'moderate',
        markers_involved: ['hs-CRP', 'ESR', 'Homocysteine'].filter(Boolean),
        description: `Multiple inflammatory markers elevated: ${signs.join('; ')}`,
        clinical_significance: 'Chronic inflammation is a root cause in functional medicine — drives insulin resistance, thyroid dysfunction, cardiovascular disease, and cognitive decline. Often caused by gut permeability, food sensitivities, chronic infections, or environmental toxins.',
        suggested_actions: [
          'Assess gut health (stool testing, food sensitivity panel)',
          'Evaluate omega-3 index (anti-inflammatory)',
          'Screen for hidden infections (dental, sinus, gut)',
          'Review diet for inflammatory triggers (processed foods, seed oils, sugar)',
          'Consider Vitamin D level (immune modulator)',
          'Check fasting insulin (inflammation and IR are bidirectional)',
        ],
      });
    }
  }

  // ===== ADRENAL DYSFUNCTION =====
  if (has('2143-6') && has('2191-5')) {
    const cortisol = val('2143-6');
    const dheas = val('2191-5');

    if ((cortisol < 10 || cortisol > 18) && dheas < 200) {
      patterns.push({
        id: 'adrenal_dysfunction',
        name: 'HPA Axis Dysregulation',
        confidence: 'moderate',
        markers_involved: ['Cortisol (AM)', 'DHEA-S'],
        description: `Cortisol ${cortisol} ug/dL with low DHEA-S ${dheas} ug/dL suggests HPA axis stress.`,
        clinical_significance: 'Often called "adrenal fatigue" in functional medicine (technically HPA axis dysregulation). Single AM cortisol is limited — diurnal cortisol curve (DUTCH or salivary 4-point) provides fuller picture.',
        suggested_actions: [
          'Order DUTCH Complete or 4-point salivary cortisol for diurnal pattern',
          'Assess sleep quality and stress load',
          'Check thyroid panel (thyroid and adrenal dysfunction often coexist)',
          'Evaluate blood sugar stability (cortisol spikes with hypoglycemia)',
          'Consider adaptogenic support (ashwagandha, rhodiola) after fuller workup',
        ],
      });
    }
  }

  // ===== PCOS PATTERN =====
  if (has('10501-5') && has('15067-2')) {
    const lh = val('10501-5');
    const fsh = val('15067-2');
    const testosterone = has('2986-8') ? val('2986-8') : null;
    const insulin = has('20578-1') ? val('20578-1') : null;
    const shbg = has('13967-5') ? val('13967-5') : null;
    const dheas = has('2191-5') ? val('2191-5') : null;

    const signs: string[] = [];
    if (lh / fsh > 2) signs.push(`LH/FSH ratio ${(lh / fsh).toFixed(1)} (classic PCOS when >2:1)`);
    if (testosterone && testosterone > 50) signs.push(`Testosterone ${testosterone} ng/dL (elevated for female)`);
    if (insulin && insulin > 5) signs.push(`Fasting insulin ${insulin} (insulin resistance component)`);
    if (shbg && shbg < 30) signs.push(`SHBG ${shbg} (low — driven by insulin resistance)`);
    if (dheas && dheas > 400) signs.push(`DHEA-S ${dheas} (adrenal androgen excess)`);

    if (signs.length >= 2) {
      patterns.push({
        id: 'pcos_pattern',
        name: 'Polycystic Ovary Syndrome (PCOS) Pattern',
        confidence: signs.length >= 3 ? 'high' : 'moderate',
        markers_involved: ['LH', 'FSH', 'Testosterone', 'Fasting Insulin', 'SHBG', 'DHEA-S'].filter(Boolean),
        description: `${signs.join('; ')}`,
        clinical_significance: 'PCOS affects 8-13% of reproductive-age women. Insulin resistance is the primary driver in most cases. Addressing insulin resistance often improves hormonal markers without direct hormone therapy.',
        suggested_actions: [
          'Confirm with ultrasound if not done',
          'Full metabolic panel: fasting insulin, glucose, HbA1c, lipids',
          'Check 17-OH progesterone to rule out late-onset CAH',
          'Address insulin resistance first: diet, exercise, consider inositol',
          'Monitor androgens every 3-6 months',
        ],
      });
    }
  }

  // ===== FULL METABOLIC SYNDROME =====
  {
    const trig = has('2571-8') ? val('2571-8') : null;
    const hdl = has('2085-9') ? val('2085-9') : null;
    const glucose = has('1558-6') ? val('1558-6') : null;
    const uricAcid = has('14959-1') ? val('14959-1') : null;
    const insulin = has('20578-1') ? val('20578-1') : null;
    const a1c = has('4548-4') ? val('4548-4') : null;
    const crp = has('30522-7') ? val('30522-7') : null;
    const ggt = has('2324-2') ? val('2324-2') : null;
    const alt = has('1742-6') ? val('1742-6') : null;

    const metSigns: string[] = [];
    if (trig && trig > 80) metSigns.push(`Triglycerides ${trig} (functional optimal <80)`);
    if (hdl && hdl < 55) metSigns.push(`HDL ${hdl} (functional optimal >55)`);
    if (trig && hdl && trig / hdl > 2) metSigns.push(`TG/HDL ratio ${(trig / hdl).toFixed(1)} (optimal <2.0)`);
    if (glucose && glucose > 86) metSigns.push(`Fasting glucose ${glucose} (functional optimal <86)`);
    if (insulin && insulin > 5) metSigns.push(`Fasting insulin ${insulin} (functional optimal <5)`);
    if (a1c && a1c > 5.3) metSigns.push(`HbA1c ${a1c}% (functional optimal <5.3%)`);
    if (uricAcid && uricAcid > 5.5) metSigns.push(`Uric acid ${uricAcid} (metabolic stress marker above 5.5)`);
    if (crp && crp > 1.0) metSigns.push(`hs-CRP ${crp} (metabolic inflammation above 1.0)`);
    if (ggt && ggt > 25) metSigns.push(`GGT ${ggt} (liver stress/oxidative stress above 25)`);
    if (alt && alt > 25) metSigns.push(`ALT ${alt} (possible NAFLD above 25)`);

    if (metSigns.length >= 4) {
      patterns.push({
        id: 'metabolic_syndrome_full',
        name: 'Metabolic Syndrome / Cardiometabolic Dysfunction',
        confidence: metSigns.length >= 6 ? 'high' : 'moderate',
        markers_involved: ['Triglycerides', 'HDL', 'Fasting Glucose', 'Fasting Insulin', 'HbA1c', 'Uric Acid', 'hs-CRP', 'GGT', 'ALT'],
        description: `${metSigns.length} metabolic dysfunction markers detected: ${metSigns.join('; ')}`,
        clinical_significance: 'Full metabolic syndrome picture. In functional medicine, this is treated as a reversible metabolic dysfunction rather than a collection of independent risk factors. Root cause is typically insulin resistance + chronic inflammation + hepatic lipogenesis.',
        suggested_actions: [
          'Comprehensive dietary overhaul — reduce refined carbs, increase fiber, healthy fats',
          'Calculate HOMA-IR for insulin resistance quantification',
          'Liver ultrasound if GGT/ALT elevated (rule out NAFLD)',
          'Check fasting insulin if not done — most sensitive early marker',
          'Consider CGM for 2 weeks to identify postprandial glucose spikes',
          'Uric acid > 5.5 responds to fructose restriction',
          'Exercise prescription: resistance training + zone 2 cardio',
          'Recheck full metabolic panel in 90 days',
        ],
      });
    }
  }

  // ===== ANEMIA DIFFERENTIAL =====
  if (has('718-7') && has('787-2')) {
    const hgb = val('718-7');
    const mcv = val('787-2');
    const ferritin = has('2276-4') ? val('2276-4') : null;
    const b12 = has('2132-9') ? val('2132-9') : null;
    const folate = has('2284-8') ? val('2284-8') : null;
    const rdw = has('788-0') ? val('788-0') : null;
    const retic = has('789-8') ? val('789-8') : null;

    if (hgb < 12.5) {
      let anemiaType = '';
      const markers: string[] = ['Hemoglobin', 'MCV'];
      const actions: string[] = [];

      if (mcv < 85) {
        anemiaType = 'Microcytic Anemia';
        if (ferritin && ferritin < 40) {
          anemiaType = 'Iron Deficiency Anemia (confirmed by low ferritin)';
          actions.push('Iron repletion: iron bisglycinate 25-50mg with vitamin C on empty stomach');
          actions.push('Investigate cause: menstrual losses, GI absorption, celiac screen');
        } else {
          actions.push('Consider thalassemia trait if ferritin is normal — check hemoglobin electrophoresis');
          actions.push('Check iron studies if not done (ferritin, iron, TIBC, iron saturation)');
        }
        markers.push('Ferritin');
      } else if (mcv > 95) {
        anemiaType = 'Macrocytic Anemia';
        if (b12 && b12 < 500) {
          anemiaType += ' — likely B12 deficiency';
          actions.push('B12 repletion: methylcobalamin 1000-5000 mcg daily or IM injections');
          actions.push('Check MMA (methylmalonic acid) for tissue-level B12 status');
          markers.push('Vitamin B12');
        }
        if (folate && folate < 10) {
          anemiaType += (anemiaType.includes('B12') ? ' + folate deficiency' : ' — likely folate deficiency');
          actions.push('Folate repletion: methylfolate 800-1000 mcg daily');
          markers.push('Folate');
        }
        if (!b12 && !folate) {
          actions.push('Order B12 and folate — most common causes of macrocytic anemia');
          actions.push('Check reticulocyte count, TSH, and liver function');
        }
      } else {
        anemiaType = 'Normocytic Anemia';
        actions.push('Check reticulocyte count to differentiate production vs. destruction');
        actions.push('Check CRP/ESR — anemia of chronic disease is common');
        actions.push('Check kidney function (eGFR) — renal anemia if impaired');
        actions.push('Check iron studies — early iron deficiency can be normocytic');
      }

      if (rdw && rdw > 13.5) {
        anemiaType += ' (elevated RDW suggests mixed deficiency or early iron depletion)';
        markers.push('RDW');
      }

      patterns.push({
        id: 'anemia_differential',
        name: anemiaType,
        confidence: 'high',
        markers_involved: markers,
        description: `Hemoglobin ${hgb} g/dL (low), MCV ${mcv} fL. ${anemiaType}.`,
        clinical_significance: 'Anemia classification by MCV guides workup: microcytic (iron, thalassemia), normocytic (chronic disease, renal, early iron), macrocytic (B12, folate, thyroid, liver). RDW > 14% often indicates mixed deficiency — both iron AND B12/folate.',
        suggested_actions: actions.length > 0 ? actions : ['Complete iron panel and B12/folate if not done'],
      });
    }
  }

  // ===== LIVER DYSFUNCTION PATTERN =====
  if (has('1742-6') || has('1920-8') || has('2324-2')) {
    const alt = has('1742-6') ? val('1742-6') : null;
    const ast = has('1920-8') ? val('1920-8') : null;
    const ggt = has('2324-2') ? val('2324-2') : null;
    const bili = has('1975-2') ? val('1975-2') : null;
    const alp = has('6768-6') ? val('6768-6') : null;
    const albumin = has('1751-7') ? val('1751-7') : null;

    const signs: string[] = [];
    if (alt && alt > 25) signs.push(`ALT ${alt} (functional optimal <25)`);
    if (ast && ast > 25) signs.push(`AST ${ast} (functional optimal <25)`);
    if (ggt && ggt > 25) signs.push(`GGT ${ggt} (functional optimal <25, oxidative stress marker)`);
    if (albumin && albumin < 4.0) signs.push(`Albumin ${albumin} (functional optimal >4.0)`);

    if (signs.length >= 2) {
      let subtype = 'General Hepatic Stress';
      const actions: string[] = [];

      if (ast && alt && ast > alt) {
        subtype = 'Hepatic Stress (AST > ALT pattern — consider alcohol, muscle damage, or cardiac source)';
        actions.push('Assess alcohol intake');
        actions.push('Check CK if muscle damage suspected');
      }
      if (ggt && ggt > 40 && alt && alt > 30) {
        subtype = 'Hepatic Stress with Oxidative Burden';
        actions.push('GGT elevation suggests glutathione depletion — consider NAC, liposomal glutathione');
        actions.push('Evaluate environmental toxin exposure');
      }
      if (alt && alt > 25 && has('2571-8') && val('2571-8') > 80 && has('20578-1') && val('20578-1') > 5) {
        subtype = 'Non-Alcoholic Fatty Liver Disease (NAFLD) Pattern';
        actions.push('Liver ultrasound recommended');
        actions.push('Address insulin resistance — primary driver of NAFLD');
        actions.push('Consider FIB-4 score calculation for fibrosis risk');
      }

      actions.push('Assess medication/supplement burden on liver');
      actions.push('Comprehensive toxin exposure history');
      actions.push('Support phase I/II detoxification: cruciferous vegetables, adequate protein, B vitamins');

      patterns.push({
        id: 'liver_dysfunction',
        name: subtype,
        confidence: signs.length >= 3 ? 'high' : 'moderate',
        markers_involved: ['ALT', 'AST', 'GGT', 'Albumin', 'Bilirubin'].filter(Boolean),
        description: `${signs.join('; ')}`,
        clinical_significance: 'In functional medicine, liver enzyme elevation even mildly above functional optimal ranges indicates the liver is under stress. GGT is the most sensitive marker and also reflects oxidative stress and glutathione status.',
        suggested_actions: actions,
      });
    }
  }

  // ===== GUT-IMMUNE AXIS =====
  if (has('50564-3') || has('13504-6') || has('5196-0')) {
    const calprotectin = has('50564-3') ? val('50564-3') : null;
    const zonulin = has('13504-6') ? val('13504-6') : null;
    const sIgA = has('5196-0') ? val('5196-0') : null;
    const crp = has('30522-7') ? val('30522-7') : null;
    const eosinophils = has('711-2') ? val('711-2') : null;

    const signs: string[] = [];
    if (calprotectin && calprotectin > 50) signs.push(`Calprotectin ${calprotectin} ug/g (gut inflammation above 50)`);
    if (zonulin && zonulin > 50) signs.push(`Zonulin ${zonulin} ng/mL (increased intestinal permeability above 50)`);
    if (sIgA && sIgA < 60) signs.push(`Secretory IgA ${sIgA} (low mucosal immunity below 60)`);
    if (sIgA && sIgA > 200) signs.push(`Secretory IgA ${sIgA} (elevated — active gut immune response above 200)`);
    if (crp && crp > 1.0) signs.push(`hs-CRP ${crp} (systemic inflammation may be gut-driven)`);
    if (eosinophils && eosinophils > 3) signs.push(`Eosinophils ${eosinophils}% (elevated — consider food allergies, parasites)`);

    if (signs.length >= 2) {
      patterns.push({
        id: 'gut_immune_axis',
        name: 'Gut-Immune Axis Dysfunction',
        confidence: signs.length >= 3 ? 'high' : 'moderate',
        markers_involved: ['Calprotectin', 'Zonulin', 'Secretory IgA', 'hs-CRP', 'Eosinophils'].filter(Boolean),
        description: `${signs.join('; ')}`,
        clinical_significance: '70-80% of the immune system resides in the gut. Intestinal permeability ("leaky gut") is a central mechanism in functional medicine linking gut health to systemic inflammation, autoimmunity, food sensitivities, and nutrient malabsorption.',
        suggested_actions: [
          'Comprehensive stool analysis (GI-MAP or equivalent) if not done',
          'Food sensitivity testing or elimination diet',
          'Assess for SIBO (lactulose breath test) if bloating/gas present',
          'Screen for celiac disease (tTG-IgA + total IgA)',
          'If calprotectin > 200: refer for colonoscopy to rule out IBD',
          'Support gut barrier: L-glutamine, zinc carnosine, bone broth',
          'Assess and remove potential triggers: gluten, dairy, NSAIDs, alcohol',
        ],
      });
    }
  }

  // ===== CARDIOVASCULAR RISK COMPOSITE =====
  {
    const apoB = has('2089-1') ? val('2089-1') : null;
    const lpa = has('43084-2') ? val('43084-2') : null;
    const oxLDL = has('13969-1') ? val('13969-1') : null;
    const crp = has('30522-7') ? val('30522-7') : null;
    const hcy = has('10839-9') ? val('10839-9') : null;
    const ldlP = has('86911-5') ? val('86911-5') : null;
    const fibrinogen = has('1798-8') ? val('1798-8') : null;

    const signs: string[] = [];
    if (apoB && apoB > 90) signs.push(`ApoB ${apoB} (optimal <90, atherogenic particle burden elevated)`);
    if (lpa && lpa > 30) signs.push(`Lp(a) ${lpa} nmol/L (genetic risk factor, elevated >30)`);
    if (oxLDL && oxLDL > 40) signs.push(`Oxidized LDL ${oxLDL} (truly atherogenic form, elevated >40)`);
    if (crp && crp > 1.0) signs.push(`hs-CRP ${crp} (vascular inflammation)`);
    if (hcy && hcy > 7) signs.push(`Homocysteine ${hcy} (independent CVD risk above 7)`);
    if (ldlP && ldlP > 1000) signs.push(`LDL particle number ${ldlP} (elevated atherogenic particles)`);
    if (fibrinogen && fibrinogen > 300) signs.push(`Fibrinogen ${fibrinogen} (clotting + inflammation risk)`);

    if (signs.length >= 3) {
      patterns.push({
        id: 'cardiovascular_risk',
        name: 'Advanced Cardiovascular Risk Pattern',
        confidence: signs.length >= 4 ? 'high' : 'moderate',
        markers_involved: ['ApoB', 'Lp(a)', 'Oxidized LDL', 'hs-CRP', 'Homocysteine', 'LDL-P', 'Fibrinogen'],
        description: `${signs.join('; ')}`,
        clinical_significance: 'Standard lipid panel misses significant CVD risk. ApoB and LDL-P are better predictors than LDL-C. Lp(a) is genetic and identifies patients needing aggressive prevention even with "normal" LDL. The combination of atherogenic particles + inflammation + thrombotic markers creates a high-risk profile.',
        suggested_actions: [
          'If Lp(a) elevated: genetic risk — consider PCSK9 inhibitor discussion, niacin for Lp(a) reduction',
          'Omega-3 index if not checked (target 8-12%)',
          'CIMT (carotid intima-media thickness) or coronary calcium score for direct atherosclerosis assessment',
          'Address inflammation: diet, omega-3s, manage insulin resistance',
          'If homocysteine elevated: methylation support (B12, folate, B6)',
          'Consider statin discussion if ApoB + Lp(a) both elevated',
          'Monitor every 6 months — track ApoB as primary target',
        ],
      });
    }
  }

  return patterns;
}
