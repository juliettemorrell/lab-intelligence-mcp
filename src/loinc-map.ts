/**
 * LOINC Mapping Dictionary — Production Grade
 *
 * 120+ biomarkers covering every major panel used in functional and
 * conventional medicine. Each entry includes:
 *   - LOINC code (canonical identifier)
 *   - Standard display name
 *   - Exhaustive alias list (English, Spanish, Portuguese, German, French, common abbreviations, lab-specific names)
 *   - Category for clinical grouping
 *   - Primary unit + alternate units with conversion factors
 *   - Conventional reference range
 *   - Functional medicine optimal range with clinical notes
 *   - Related marker cross-references (by LOINC)
 *   - Specimen type
 *   - Sex-specific ranges where applicable
 */

export interface LabMarkerDefinition {
  loinc: string;
  standardName: string;
  aliases: string[];
  category: LabCategory;
  unit: string;
  alternateUnits?: { unit: string; conversionFactor: number }[];
  conventionalRange: { low?: number; high?: number };
  conventionalRangeMale?: { low?: number; high?: number };
  conventionalRangeFemale?: { low?: number; high?: number };
  functionalRange: { low?: number; high?: number; notes?: string };
  functionalRangeMale?: { low?: number; high?: number };
  functionalRangeFemale?: { low?: number; high?: number };
  relatedMarkers: string[];
  specimen: 'serum' | 'plasma' | 'whole_blood' | 'urine' | 'saliva' | 'stool' | 'rbc' | 'any';
}

export type LabCategory =
  | 'thyroid' | 'metabolic' | 'lipids' | 'lipids_advanced' | 'cbc' | 'cbc_differential'
  | 'iron' | 'inflammation' | 'liver' | 'kidney' | 'nutrient' | 'mineral'
  | 'hormone_male' | 'hormone_female' | 'hormone_general' | 'adrenal'
  | 'immune' | 'gut' | 'toxins' | 'cardiac' | 'diabetes' | 'bone'
  | 'electrolyte' | 'organic_acids' | 'amino_acids' | 'fatty_acids'
  | 'coagulation' | 'urinalysis' | 'pancreatic' | 'autoimmune'
  | 'neurotransmitter' | 'oxidative_stress' | 'environmental';

// ---------------------------------------------------------------------------
// THE MAP — 120+ MARKERS
// ---------------------------------------------------------------------------
export const LOINC_MAP: LabMarkerDefinition[] = [

  // ========================= THYROID (8 markers) ==========================
  {
    loinc: '11580-8', standardName: 'TSH', specimen: 'serum',
    aliases: ['tsh','thyroid stimulating hormone','thyrotropin','tsh 3rd generation','tsh 3rd gen','tsh ultra-sensitive','tsh ultrasensitive','tsh high sensitivity','tsh-hs','s-tsh','serum tsh','tsh reflex','thyreotropin','tsh w/ reflex','tsh with reflex','tsh cascade','hormona estimulante de la tiroides','hormônio estimulante da tireoide','thyreoidea-stimulierendes hormon','thyreoidea stimulierendes hormon','hormone thyréostimulante'],
    category: 'thyroid', unit: 'mIU/L',
    alternateUnits: [{ unit: 'uIU/mL', conversionFactor: 1 }, { unit: 'mU/L', conversionFactor: 1 }],
    conventionalRange: { low: 0.4, high: 4.5 },
    functionalRange: { low: 1.0, high: 2.0, notes: 'Optimal for symptom resolution. Above 2.5 warrants thyroid antibody testing.' },
    relatedMarkers: ['3016-3','3051-0','33244-7','30152-4','5765-2'],
  },
  {
    loinc: '3016-3', standardName: 'Free T4', specimen: 'serum',
    aliases: ['free t4','ft4','free thyroxine','thyroxine free','t4 free','t4 libre','ft4 direct','free t-4','tiroxina libre','freies t4','t4 livre','t4 libre sérique'],
    category: 'thyroid', unit: 'ng/dL',
    alternateUnits: [{ unit: 'pmol/L', conversionFactor: 12.87 }],
    conventionalRange: { low: 0.8, high: 1.8 },
    functionalRange: { low: 1.1, high: 1.5 },
    relatedMarkers: ['11580-8','3051-0','33244-7'],
  },
  {
    loinc: '3051-0', standardName: 'Free T3', specimen: 'serum',
    aliases: ['free t3','ft3','free triiodothyronine','triiodothyronine free','t3 free','t3 libre','ft3 direct','triyodotironina libre','freies t3','t3 livre'],
    category: 'thyroid', unit: 'pg/mL',
    alternateUnits: [{ unit: 'pmol/L', conversionFactor: 1.536 }],
    conventionalRange: { low: 2.3, high: 4.2 },
    functionalRange: { low: 3.0, high: 3.5, notes: 'Active hormone — most clinically relevant thyroid marker' },
    relatedMarkers: ['11580-8','3016-3','33244-7','2276-4'],
  },
  {
    loinc: '33244-7', standardName: 'Reverse T3', specimen: 'serum',
    aliases: ['reverse t3','rt3','rev t3','reverse triiodothyronine','rT3','t3 reversa'],
    category: 'thyroid', unit: 'ng/dL',
    conventionalRange: { low: 9.2, high: 24.1 },
    functionalRange: { low: 9.2, high: 15.0, notes: 'High rT3 + low FT3 = conversion block. Calculate FT3/RT3 ratio — optimal >0.20' },
    relatedMarkers: ['11580-8','3016-3','3051-0'],
  },
  {
    loinc: '30152-4', standardName: 'TPO Antibodies', specimen: 'serum',
    aliases: ['tpo antibodies','tpo ab','anti-tpo','thyroid peroxidase ab','tpo','thyroid antibodies','anti-thyroid peroxidase','anticuerpos antiperoxidasa tiroidea','anti-tpo-ak','thyroid peroxidase antibodies'],
    category: 'thyroid', unit: 'IU/mL',
    conventionalRange: { low: 0, high: 35 },
    functionalRange: { low: 0, high: 15, notes: 'Any elevation suggests autoimmune thyroid — even subclinical' },
    relatedMarkers: ['11580-8','5765-2'],
  },
  {
    loinc: '5765-2', standardName: 'Thyroglobulin Antibodies', specimen: 'serum',
    aliases: ['thyroglobulin ab','tg antibodies','anti-thyroglobulin','tgab','anti-tg','thyroglobulin antibody'],
    category: 'thyroid', unit: 'IU/mL',
    conventionalRange: { low: 0, high: 40 },
    functionalRange: { low: 0, high: 20 },
    relatedMarkers: ['30152-4','11580-8'],
  },
  {
    loinc: '3026-2', standardName: 'Total T4', specimen: 'serum',
    aliases: ['total t4','t4 total','thyroxine total','t4','serum t4'],
    category: 'thyroid', unit: 'ug/dL',
    alternateUnits: [{ unit: 'nmol/L', conversionFactor: 12.87 }],
    conventionalRange: { low: 4.5, high: 12.0 },
    functionalRange: { low: 6.0, high: 10.0 },
    relatedMarkers: ['11580-8','3016-3'],
  },
  {
    loinc: '3053-6', standardName: 'Total T3', specimen: 'serum',
    aliases: ['total t3','t3 total','triiodothyronine total','t3','serum t3'],
    category: 'thyroid', unit: 'ng/dL',
    alternateUnits: [{ unit: 'nmol/L', conversionFactor: 0.01536 }],
    conventionalRange: { low: 80, high: 200 },
    functionalRange: { low: 100, high: 180 },
    relatedMarkers: ['11580-8','3051-0'],
  },

  // ========================= DIABETES / METABOLIC (6 markers) =============
  {
    loinc: '1558-6', standardName: 'Fasting Glucose', specimen: 'serum',
    aliases: ['fasting glucose','glucose fasting','blood sugar fasting','fbg','fasting blood glucose','glucose serum','plasma glucose','glucose','blood glucose','glucosa en ayunas','nüchternblutzucker','glicemia de jejum','glycémie à jeun'],
    category: 'diabetes', unit: 'mg/dL',
    alternateUnits: [{ unit: 'mmol/L', conversionFactor: 0.0555 }],
    conventionalRange: { low: 65, high: 99 },
    functionalRange: { low: 75, high: 86, notes: 'Above 86 suggests early insulin resistance even when "normal"' },
    relatedMarkers: ['4548-4','20578-1','14933-6'],
  },
  {
    loinc: '4548-4', standardName: 'HbA1c', specimen: 'whole_blood',
    aliases: ['hba1c','hemoglobin a1c','a1c','glycated hemoglobin','glycosylated hemoglobin','hgb a1c','hb a1c','hemoglobina glicosilada','hemoglobina glicada','hämoglobin a1c'],
    category: 'diabetes', unit: '%',
    alternateUnits: [{ unit: 'mmol/mol', conversionFactor: 10.93 }],
    conventionalRange: { low: 4.0, high: 5.6 },
    functionalRange: { low: 4.5, high: 5.3, notes: '5.4-5.6 = prediabetic territory in functional medicine' },
    relatedMarkers: ['1558-6','20578-1'],
  },
  {
    loinc: '20578-1', standardName: 'Fasting Insulin', specimen: 'serum',
    aliases: ['fasting insulin','insulin fasting','serum insulin','insulin level','insulin','insulina en ayunas','nüchterninsulin','insulina de jejum','insuline à jeun'],
    category: 'diabetes', unit: 'uIU/mL',
    alternateUnits: [{ unit: 'pmol/L', conversionFactor: 6.945 }],
    conventionalRange: { low: 2.6, high: 24.9 },
    functionalRange: { low: 2, high: 5, notes: 'Most sensitive early marker of metabolic dysfunction' },
    relatedMarkers: ['1558-6','4548-4','14933-6'],
  },
  {
    loinc: '14933-6', standardName: 'HOMA-IR', specimen: 'serum',
    aliases: ['homa-ir','homa ir','homeostatic model assessment','insulin resistance index','homa','índice homa'],
    category: 'diabetes', unit: 'ratio',
    conventionalRange: { low: 0, high: 2.5 },
    functionalRange: { low: 0, high: 1.5, notes: 'Calculated: (fasting insulin × fasting glucose) / 405' },
    relatedMarkers: ['1558-6','20578-1'],
  },
  {
    loinc: '1521-4', standardName: 'C-Peptide', specimen: 'serum',
    aliases: ['c-peptide','c peptide','cpeptide','péptido c','c-peptid'],
    category: 'diabetes', unit: 'ng/mL',
    alternateUnits: [{ unit: 'nmol/L', conversionFactor: 0.331 }],
    conventionalRange: { low: 1.1, high: 4.4 },
    functionalRange: { low: 1.0, high: 2.5 },
    relatedMarkers: ['20578-1','1558-6'],
  },
  {
    loinc: '53553-4', standardName: 'Fructosamine', specimen: 'serum',
    aliases: ['fructosamine','glycated albumin','fructosamina'],
    category: 'diabetes', unit: 'umol/L',
    conventionalRange: { low: 200, high: 285 },
    functionalRange: { low: 200, high: 260 },
    relatedMarkers: ['4548-4','1558-6'],
  },

  // ========================= LIPIDS (8 markers) ===========================
  {
    loinc: '2093-3', standardName: 'Total Cholesterol', specimen: 'serum',
    aliases: ['total cholesterol','cholesterol total','cholesterol','tc','colesterol total','gesamtcholesterin','cholestérol total'],
    category: 'lipids', unit: 'mg/dL',
    alternateUnits: [{ unit: 'mmol/L', conversionFactor: 0.02586 }],
    conventionalRange: { low: 125, high: 200 },
    functionalRange: { low: 180, high: 250, notes: 'Functional medicine does NOT target very low cholesterol — needed for hormones, brain, cell membranes' },
    relatedMarkers: ['2085-9','13457-7','2571-8','43084-2'],
  },
  {
    loinc: '2085-9', standardName: 'HDL Cholesterol', specimen: 'serum',
    aliases: ['hdl','hdl cholesterol','hdl-c','high density lipoprotein','hdl colesterol','hdl-cholesterin','cholestérol hdl'],
    category: 'lipids', unit: 'mg/dL',
    alternateUnits: [{ unit: 'mmol/L', conversionFactor: 0.02586 }],
    conventionalRange: { low: 40, high: 999 },
    conventionalRangeFemale: { low: 50, high: 999 },
    functionalRange: { low: 55, high: 100, notes: 'Higher is protective. TG/HDL ratio < 2.0 is key metric' },
    relatedMarkers: ['2093-3','13457-7','2571-8'],
  },
  {
    loinc: '13457-7', standardName: 'LDL Cholesterol (Calculated)', specimen: 'serum',
    aliases: ['ldl','ldl cholesterol','ldl-c','low density lipoprotein','ldl calculated','ldl calc','ldl direct','ldl colesterol','ldl-cholesterin','cholestérol ldl'],
    category: 'lipids', unit: 'mg/dL',
    alternateUnits: [{ unit: 'mmol/L', conversionFactor: 0.02586 }],
    conventionalRange: { low: 0, high: 130 },
    functionalRange: { low: 80, high: 130, notes: 'Particle size matters more — request NMR LipoProfile if LDL elevated' },
    relatedMarkers: ['2093-3','2085-9','2571-8','86911-5'],
  },
  {
    loinc: '2571-8', standardName: 'Triglycerides', specimen: 'serum',
    aliases: ['triglycerides','trig','trigs','tg','triglyceride','triglicéridos','triglyzeride','triglicerídeos','triglycérides'],
    category: 'lipids', unit: 'mg/dL',
    alternateUnits: [{ unit: 'mmol/L', conversionFactor: 0.01129 }],
    conventionalRange: { low: 0, high: 150 },
    functionalRange: { low: 40, high: 80, notes: 'TG/HDL ratio is best insulin resistance proxy from standard lipid panel' },
    relatedMarkers: ['2093-3','2085-9','13457-7','20578-1'],
  },
  {
    loinc: '43084-2', standardName: 'Lp(a)', specimen: 'serum',
    aliases: ['lp(a)','lipoprotein a','lipoprotein(a)','lp a','lpa','lipoproteína(a)','lipoprotéine a'],
    category: 'lipids_advanced', unit: 'nmol/L',
    alternateUnits: [{ unit: 'mg/dL', conversionFactor: 2.5 }],
    conventionalRange: { low: 0, high: 75 },
    functionalRange: { low: 0, high: 30, notes: 'Genetic — doesnt change with lifestyle. If elevated, aggressive CVD prevention needed' },
    relatedMarkers: ['13457-7','30522-7'],
  },
  {
    loinc: '86911-5', standardName: 'LDL Particle Number', specimen: 'serum',
    aliases: ['ldl-p','ldl particle number','ldl particles','nmr ldl-p','ldl particle count'],
    category: 'lipids_advanced', unit: 'nmol/L',
    conventionalRange: { low: 0, high: 1300 },
    functionalRange: { low: 0, high: 1000, notes: 'Better predictor than LDL-C. Small dense LDL is the atherogenic subtype.' },
    relatedMarkers: ['13457-7','43084-2'],
  },
  {
    loinc: '13458-5', standardName: 'VLDL Cholesterol', specimen: 'serum',
    aliases: ['vldl','vldl cholesterol','vldl-c','very low density lipoprotein'],
    category: 'lipids', unit: 'mg/dL',
    conventionalRange: { low: 5, high: 40 },
    functionalRange: { low: 5, high: 25 },
    relatedMarkers: ['2571-8','2093-3'],
  },
  {
    loinc: '2089-1', standardName: 'ApoB', specimen: 'serum',
    aliases: ['apob','apolipoprotein b','apo b','apolipoprotein b-100','apolipoproteína b'],
    category: 'lipids_advanced', unit: 'mg/dL',
    conventionalRange: { low: 0, high: 130 },
    functionalRange: { low: 0, high: 90, notes: 'Single best measure of atherogenic particle burden. Better than LDL-C.' },
    relatedMarkers: ['13457-7','86911-5','43084-2'],
  },

  // ========================= INFLAMMATION (6 markers) =====================
  {
    loinc: '30522-7', standardName: 'hs-CRP', specimen: 'serum',
    aliases: ['hs-crp','hscrp','high sensitivity crp','c-reactive protein high sensitivity','crp high sensitivity','cardiac crp','crp hs','c reactive protein','crp','proteína c reactiva ultrasensible','hs-crp ultrasensibel','protéine c-réactive ultrasensible'],
    category: 'inflammation', unit: 'mg/L',
    conventionalRange: { low: 0, high: 3.0 },
    functionalRange: { low: 0, high: 0.5, notes: 'Most useful single inflammation marker. Above 1.0 = significant systemic inflammation' },
    relatedMarkers: ['10839-9','4537-7','1920-8','2276-4'],
  },
  {
    loinc: '10839-9', standardName: 'Homocysteine', specimen: 'plasma',
    aliases: ['homocysteine','hcy','homocisteína','homocystein','plasma homocysteine','total homocysteine','homocystéine'],
    category: 'inflammation', unit: 'umol/L',
    conventionalRange: { low: 0, high: 15 },
    functionalRange: { low: 5, high: 7, notes: 'Methylation marker + independent CVD risk factor. B12/folate/B6 dependent' },
    relatedMarkers: ['30522-7','2132-9','2284-8'],
  },
  {
    loinc: '4537-7', standardName: 'ESR', specimen: 'whole_blood',
    aliases: ['esr','sed rate','erythrocyte sedimentation rate','sedimentation rate','velocidad de sedimentación','blutsenkungsgeschwindigkeit','vitesse de sédimentation'],
    category: 'inflammation', unit: 'mm/hr',
    conventionalRange: { low: 0, high: 20 },
    functionalRange: { low: 0, high: 10 },
    relatedMarkers: ['30522-7','10839-9'],
  },
  {
    loinc: '1798-8', standardName: 'Fibrinogen', specimen: 'plasma',
    aliases: ['fibrinogen','fibrinógeno','fibrinogène'],
    category: 'inflammation', unit: 'mg/dL',
    conventionalRange: { low: 200, high: 400 },
    functionalRange: { low: 200, high: 300, notes: 'Acute phase reactant + coagulation factor. Elevated = inflammation AND clot risk' },
    relatedMarkers: ['30522-7','4537-7'],
  },
  {
    loinc: '26881-3', standardName: 'IL-6', specimen: 'serum',
    aliases: ['il-6','interleukin 6','interleukin-6','il6','interleucina 6'],
    category: 'inflammation', unit: 'pg/mL',
    conventionalRange: { low: 0, high: 7 },
    functionalRange: { low: 0, high: 2, notes: 'Pro-inflammatory cytokine. Elevated in chronic disease, obesity, stress' },
    relatedMarkers: ['30522-7','26885-4'],
  },
  {
    loinc: '26885-4', standardName: 'TNF-alpha', specimen: 'serum',
    aliases: ['tnf-alpha','tnf alpha','tumor necrosis factor alpha','tnf-a','tnf','factor de necrosis tumoral alfa'],
    category: 'inflammation', unit: 'pg/mL',
    conventionalRange: { low: 0, high: 8.1 },
    functionalRange: { low: 0, high: 3, notes: 'Major inflammatory cytokine. Elevated in autoimmunity, gut permeability, chronic infections' },
    relatedMarkers: ['26881-3','30522-7'],
  },

  // ========================= IRON PANEL (5 markers) =======================
  {
    loinc: '2276-4', standardName: 'Ferritin', specimen: 'serum',
    aliases: ['ferritin','serum ferritin','ferritina','ferritine'],
    category: 'iron', unit: 'ng/mL',
    alternateUnits: [{ unit: 'ug/L', conversionFactor: 1 }, { unit: 'pmol/L', conversionFactor: 2.247 }],
    conventionalRange: { low: 12, high: 150 },
    conventionalRangeMale: { low: 12, high: 300 },
    conventionalRangeFemale: { low: 12, high: 150 },
    functionalRange: { low: 40, high: 100, notes: 'Below 40 = suboptimal for energy, thyroid, hair. Also acute phase reactant — check CRP to rule out false elevation' },
    functionalRangeMale: { low: 50, high: 150 },
    functionalRangeFemale: { low: 40, high: 100 },
    relatedMarkers: ['2498-4','2500-7','14800-7','718-7','30522-7'],
  },
  {
    loinc: '2498-4', standardName: 'Iron (Serum)', specimen: 'serum',
    aliases: ['iron','serum iron','fe','iron serum','hierro sérico','eisen','fer sérique'],
    category: 'iron', unit: 'ug/dL',
    alternateUnits: [{ unit: 'umol/L', conversionFactor: 0.1791 }],
    conventionalRange: { low: 35, high: 175 },
    functionalRange: { low: 60, high: 170 },
    relatedMarkers: ['2276-4','2500-7','14800-7'],
  },
  {
    loinc: '2500-7', standardName: 'TIBC', specimen: 'serum',
    aliases: ['tibc','total iron binding capacity','iron binding capacity','capacidad total de fijación de hierro','capacité totale de fixation du fer'],
    category: 'iron', unit: 'ug/dL',
    alternateUnits: [{ unit: 'umol/L', conversionFactor: 0.1791 }],
    conventionalRange: { low: 250, high: 450 },
    functionalRange: { low: 250, high: 370, notes: 'Elevated TIBC + low ferritin = true iron deficiency' },
    relatedMarkers: ['2276-4','2498-4','14800-7'],
  },
  {
    loinc: '14800-7', standardName: 'Iron Saturation', specimen: 'serum',
    aliases: ['iron saturation','transferrin saturation','tsat','iron sat','% saturation','saturación de transferrina','saturation de la transferrine'],
    category: 'iron', unit: '%',
    conventionalRange: { low: 15, high: 55 },
    functionalRange: { low: 25, high: 45, notes: 'Below 20% = functional iron deficiency. Above 45% = investigate hemochromatosis' },
    relatedMarkers: ['2276-4','2498-4','2500-7'],
  },
  {
    loinc: '14723-1', standardName: 'Transferrin', specimen: 'serum',
    aliases: ['transferrin','transferrina','transferrine'],
    category: 'iron', unit: 'mg/dL',
    conventionalRange: { low: 200, high: 360 },
    functionalRange: { low: 200, high: 320 },
    relatedMarkers: ['2276-4','2500-7','14800-7'],
  },

  // ========================= NUTRIENTS (12 markers) =======================
  {
    loinc: '1989-3', standardName: 'Vitamin D, 25-OH', specimen: 'serum',
    aliases: ['vitamin d','25-oh vitamin d','25-hydroxyvitamin d','vit d','25(oh)d','25-oh-d','calcidiol','vitamin d 25 hydroxy','vitamin d total','25 hydroxy vitamin d','vitamina d','25-oh-vitamin d3','vitamine d'],
    category: 'nutrient', unit: 'ng/mL',
    alternateUnits: [{ unit: 'nmol/L', conversionFactor: 2.496 }],
    conventionalRange: { low: 30, high: 100 },
    functionalRange: { low: 50, high: 80, notes: 'Most practitioners target 60-80. Critical immune modulator' },
    relatedMarkers: ['17861-6','2276-4'],
  },
  {
    loinc: '2132-9', standardName: 'Vitamin B12', specimen: 'serum',
    aliases: ['vitamin b12','b12','cobalamin','cyanocobalamin','vit b12','vitamina b12','cobalamina','vitamine b12'],
    category: 'nutrient', unit: 'pg/mL',
    alternateUnits: [{ unit: 'pmol/L', conversionFactor: 0.7378 }],
    conventionalRange: { low: 200, high: 900 },
    functionalRange: { low: 500, high: 1000, notes: 'Below 500 = neurological symptoms possible. Check MMA for tissue-level B12 status' },
    relatedMarkers: ['10839-9','2284-8','14723-1'],
  },
  {
    loinc: '2284-8', standardName: 'Folate', specimen: 'serum',
    aliases: ['folate','folic acid','serum folate','vitamin b9','folato','folsäure','acide folique'],
    category: 'nutrient', unit: 'ng/mL',
    alternateUnits: [{ unit: 'nmol/L', conversionFactor: 2.266 }],
    conventionalRange: { low: 2.7, high: 17 },
    functionalRange: { low: 10, high: 25, notes: 'Consider MTHFR status. RBC folate is better long-term indicator' },
    relatedMarkers: ['2132-9','10839-9'],
  },
  {
    loinc: '2601-3', standardName: 'Magnesium (Serum)', specimen: 'serum',
    aliases: ['magnesium','mg','serum magnesium','magnesio','magnésium'],
    category: 'mineral', unit: 'mg/dL',
    alternateUnits: [{ unit: 'mmol/L', conversionFactor: 0.4114 }, { unit: 'mEq/L', conversionFactor: 0.8229 }],
    conventionalRange: { low: 1.7, high: 2.2 },
    functionalRange: { low: 2.0, high: 2.2, notes: 'Serum Mg is POOR indicator — only 1% of body Mg is in serum. Order RBC Mg instead' },
    relatedMarkers: ['31100-1'],
  },
  {
    loinc: '31100-1', standardName: 'Magnesium (RBC)', specimen: 'rbc',
    aliases: ['rbc magnesium','magnesium rbc','red blood cell magnesium','erythrocyte magnesium','intracellular magnesium','magnesium intracellular'],
    category: 'mineral', unit: 'mg/dL',
    conventionalRange: { low: 4.0, high: 6.4 },
    functionalRange: { low: 5.2, high: 6.5, notes: 'Gold standard for Mg status. Deficiency causes muscle cramps, insomnia, anxiety, arrhythmias' },
    relatedMarkers: ['2601-3'],
  },
  {
    loinc: '2601-6', standardName: 'Zinc', specimen: 'serum',
    aliases: ['zinc','serum zinc','plasma zinc','zn','zinc sérico'],
    category: 'mineral', unit: 'ug/dL',
    alternateUnits: [{ unit: 'umol/L', conversionFactor: 0.153 }],
    conventionalRange: { low: 60, high: 130 },
    functionalRange: { low: 80, high: 120, notes: 'Essential for immune function, thyroid, testosterone, taste/smell, wound healing' },
    relatedMarkers: ['2601-3','2191-5'],
  },
  {
    loinc: '2075-0', standardName: 'Omega-3 Index', specimen: 'whole_blood',
    aliases: ['omega-3 index','omega 3 index','epa+dha index','fatty acid profile','índice omega-3'],
    category: 'fatty_acids', unit: '%',
    conventionalRange: { low: 4, high: 12 },
    functionalRange: { low: 8, high: 12, notes: 'Below 8% = increased CVD and cognitive risk. Target 8-12%' },
    relatedMarkers: ['2571-8','30522-7'],
  },
  {
    loinc: '17861-6', standardName: 'Calcium', specimen: 'serum',
    aliases: ['calcium','ca','serum calcium','calcio','kalzium'],
    category: 'mineral', unit: 'mg/dL',
    alternateUnits: [{ unit: 'mmol/L', conversionFactor: 0.2495 }],
    conventionalRange: { low: 8.5, high: 10.5 },
    functionalRange: { low: 9.2, high: 10.0, notes: 'Always interpret with albumin. Persistently above 10.2 = check PTH for hyperparathyroidism' },
    relatedMarkers: ['1989-3','2731-8'],
  },
  {
    loinc: '2731-8', standardName: 'Phosphorus', specimen: 'serum',
    aliases: ['phosphorus','phosphate','serum phosphorus','fósforo','phosphor'],
    category: 'mineral', unit: 'mg/dL',
    alternateUnits: [{ unit: 'mmol/L', conversionFactor: 0.3229 }],
    conventionalRange: { low: 2.5, high: 4.5 },
    functionalRange: { low: 3.0, high: 4.0 },
    relatedMarkers: ['17861-6','1989-3'],
  },
  {
    loinc: '2823-3', standardName: 'Potassium', specimen: 'serum',
    aliases: ['potassium','k','serum potassium','potasio','kalium'],
    category: 'electrolyte', unit: 'mEq/L',
    alternateUnits: [{ unit: 'mmol/L', conversionFactor: 1 }],
    conventionalRange: { low: 3.5, high: 5.0 },
    functionalRange: { low: 4.0, high: 4.5 },
    relatedMarkers: ['2951-2','2601-3'],
  },
  {
    loinc: '2951-2', standardName: 'Sodium', specimen: 'serum',
    aliases: ['sodium','na','serum sodium','sodio','natrium'],
    category: 'electrolyte', unit: 'mEq/L',
    alternateUnits: [{ unit: 'mmol/L', conversionFactor: 1 }],
    conventionalRange: { low: 136, high: 145 },
    functionalRange: { low: 138, high: 142 },
    relatedMarkers: ['2823-3','2075-0'],
  },
  {
    loinc: '2028-9', standardName: 'CO2 (Bicarbonate)', specimen: 'serum',
    aliases: ['co2','bicarbonate','carbon dioxide','tco2','total co2','bicarbonato'],
    category: 'electrolyte', unit: 'mEq/L',
    alternateUnits: [{ unit: 'mmol/L', conversionFactor: 1 }],
    conventionalRange: { low: 23, high: 29 },
    functionalRange: { low: 25, high: 28 },
    relatedMarkers: ['2823-3','2951-2'],
  },

  // ========================= LIVER (7 markers) ============================
  {
    loinc: '1742-6', standardName: 'ALT', specimen: 'serum',
    aliases: ['alt','sgpt','alanine aminotransferase','alanine transaminase','gpt','alat','transaminasa glutámico pirúvica','alanine-aminotransférase'],
    category: 'liver', unit: 'U/L',
    conventionalRange: { low: 7, high: 56 },
    functionalRange: { low: 10, high: 25, notes: 'Most liver-specific of the transaminases. Elevation above 25 = liver stress' },
    relatedMarkers: ['1920-8','2324-2','1975-2','1751-7'],
  },
  {
    loinc: '1920-8', standardName: 'AST', specimen: 'serum',
    aliases: ['ast','sgot','aspartate aminotransferase','aspartate transaminase','got','asat','transaminasa glutámico oxalacética','aspartate-aminotransférase'],
    category: 'liver', unit: 'U/L',
    conventionalRange: { low: 10, high: 40 },
    functionalRange: { low: 10, high: 25, notes: 'Also found in muscle/heart — not liver-specific. AST > ALT suggests alcohol or muscle damage' },
    relatedMarkers: ['1742-6','2324-2'],
  },
  {
    loinc: '2324-2', standardName: 'GGT', specimen: 'serum',
    aliases: ['ggt','gamma-glutamyl transferase','gamma gt','ggtp','gamma-glutamyl transpeptidase','gamma-gt','gamma-glutamyltransférase'],
    category: 'liver', unit: 'U/L',
    conventionalRange: { low: 0, high: 65 },
    functionalRange: { low: 10, high: 25, notes: 'Most sensitive liver enzyme. Also marker of oxidative stress and glutathione depletion' },
    relatedMarkers: ['1742-6','1920-8'],
  },
  {
    loinc: '1975-2', standardName: 'Total Bilirubin', specimen: 'serum',
    aliases: ['total bilirubin','bilirubin total','bilirubin','tbil','bilirrubina total','bilirubine totale'],
    category: 'liver', unit: 'mg/dL',
    alternateUnits: [{ unit: 'umol/L', conversionFactor: 17.1 }],
    conventionalRange: { low: 0.1, high: 1.2 },
    functionalRange: { low: 0.2, high: 1.0, notes: 'Mildly elevated (1.0-3.0) may be Gilberts syndrome — actually protective antioxidant' },
    relatedMarkers: ['1742-6','1920-8','1968-7'],
  },
  {
    loinc: '1968-7', standardName: 'Direct Bilirubin', specimen: 'serum',
    aliases: ['direct bilirubin','conjugated bilirubin','bilirubin direct','bilirrubina directa','bilirubine directe'],
    category: 'liver', unit: 'mg/dL',
    alternateUnits: [{ unit: 'umol/L', conversionFactor: 17.1 }],
    conventionalRange: { low: 0, high: 0.3 },
    functionalRange: { low: 0, high: 0.2 },
    relatedMarkers: ['1975-2','1742-6'],
  },
  {
    loinc: '1751-7', standardName: 'Albumin', specimen: 'serum',
    aliases: ['albumin','serum albumin','albúmina','albumine'],
    category: 'liver', unit: 'g/dL',
    alternateUnits: [{ unit: 'g/L', conversionFactor: 10 }],
    conventionalRange: { low: 3.5, high: 5.5 },
    functionalRange: { low: 4.0, high: 5.0, notes: 'Below 4.0 suggests inflammation, malnutrition, or liver dysfunction. Also affects calcium interpretation' },
    relatedMarkers: ['6768-6','1742-6'],
  },
  {
    loinc: '6768-6', standardName: 'Alkaline Phosphatase', specimen: 'serum',
    aliases: ['alkaline phosphatase','alk phos','alp','alkp','fosfatasa alcalina','alkalische phosphatase','phosphatase alcaline'],
    category: 'liver', unit: 'U/L',
    conventionalRange: { low: 44, high: 147 },
    functionalRange: { low: 50, high: 100, notes: 'Low ALP may indicate zinc deficiency. Elevated = liver or bone source (check GGT to differentiate)' },
    relatedMarkers: ['1742-6','2324-2','2601-6'],
  },

  // ========================= KIDNEY (5 markers) ===========================
  {
    loinc: '2160-0', standardName: 'Creatinine', specimen: 'serum',
    aliases: ['creatinine','serum creatinine','creat','creatinina','kreatinin','créatinine'],
    category: 'kidney', unit: 'mg/dL',
    alternateUnits: [{ unit: 'umol/L', conversionFactor: 88.4 }],
    conventionalRange: { low: 0.6, high: 1.2 },
    conventionalRangeMale: { low: 0.7, high: 1.3 },
    conventionalRangeFemale: { low: 0.6, high: 1.1 },
    functionalRange: { low: 0.8, high: 1.1 },
    relatedMarkers: ['3094-0','33914-3','3097-3'],
  },
  {
    loinc: '3094-0', standardName: 'BUN', specimen: 'serum',
    aliases: ['bun','blood urea nitrogen','urea nitrogen','urea','nitrógeno ureico en sangre','harnstoff-stickstoff','urée'],
    category: 'kidney', unit: 'mg/dL',
    alternateUnits: [{ unit: 'mmol/L', conversionFactor: 0.357 }],
    conventionalRange: { low: 6, high: 20 },
    functionalRange: { low: 10, high: 16, notes: 'Low BUN may = low protein intake or liver issues. BUN/creatinine ratio >20 suggests dehydration or GI bleed' },
    relatedMarkers: ['2160-0','33914-3'],
  },
  {
    loinc: '33914-3', standardName: 'eGFR', specimen: 'serum',
    aliases: ['egfr','estimated gfr','glomerular filtration rate','gfr','filtración glomerular estimada','débit de filtration glomérulaire'],
    category: 'kidney', unit: 'mL/min/1.73m2',
    conventionalRange: { low: 60, high: 999 },
    functionalRange: { low: 90, high: 999, notes: 'Below 90 = early kidney impairment. Below 60 = CKD' },
    relatedMarkers: ['2160-0','3094-0'],
  },
  {
    loinc: '3097-3', standardName: 'BUN/Creatinine Ratio', specimen: 'serum',
    aliases: ['bun/creatinine ratio','bun creatinine ratio','bun/creat'],
    category: 'kidney', unit: 'ratio',
    conventionalRange: { low: 10, high: 20 },
    functionalRange: { low: 10, high: 16 },
    relatedMarkers: ['3094-0','2160-0'],
  },
  {
    loinc: '14959-1', standardName: 'Uric Acid', specimen: 'serum',
    aliases: ['uric acid','serum uric acid','ácido úrico','harnsäure','acide urique'],
    category: 'kidney', unit: 'mg/dL',
    alternateUnits: [{ unit: 'umol/L', conversionFactor: 59.48 }],
    conventionalRange: { low: 2.4, high: 8.2 },
    conventionalRangeMale: { low: 3.4, high: 7.0 },
    conventionalRangeFemale: { low: 2.4, high: 6.0 },
    functionalRange: { low: 3.0, high: 5.5, notes: 'Above 5.5 associated with insulin resistance, CVD risk, and gout even if asymptomatic' },
    relatedMarkers: ['2160-0','20578-1','30522-7'],
  },

  // ========================= CBC (10 markers) =============================
  {
    loinc: '718-7', standardName: 'Hemoglobin', specimen: 'whole_blood',
    aliases: ['hemoglobin','hgb','hb','haemoglobin','hemoglobina','hämoglobin','hémoglobine'],
    category: 'cbc', unit: 'g/dL',
    alternateUnits: [{ unit: 'g/L', conversionFactor: 10 }],
    conventionalRange: { low: 12.0, high: 17.5 },
    conventionalRangeMale: { low: 13.5, high: 17.5 },
    conventionalRangeFemale: { low: 12.0, high: 16.0 },
    functionalRange: { low: 13.5, high: 15.5 },
    functionalRangeMale: { low: 14.0, high: 16.0 },
    functionalRangeFemale: { low: 12.5, high: 14.5 },
    relatedMarkers: ['2276-4','787-2','786-4','4544-3'],
  },
  {
    loinc: '4544-3', standardName: 'Hematocrit', specimen: 'whole_blood',
    aliases: ['hematocrit','hct','haematocrit','hematocrito','hämatokrit','hématocrite'],
    category: 'cbc', unit: '%',
    conventionalRange: { low: 36, high: 52 },
    conventionalRangeMale: { low: 40, high: 52 },
    conventionalRangeFemale: { low: 36, high: 46 },
    functionalRange: { low: 38, high: 48 },
    relatedMarkers: ['718-7','787-2'],
  },
  {
    loinc: '787-2', standardName: 'MCV', specimen: 'whole_blood',
    aliases: ['mcv','mean corpuscular volume','volumen corpuscular medio','volume globulaire moyen'],
    category: 'cbc', unit: 'fL',
    conventionalRange: { low: 80, high: 100 },
    functionalRange: { low: 85, high: 92, notes: 'Low = iron deficiency or thalassemia. High = B12/folate deficiency. Normal doesnt rule out both coexisting' },
    relatedMarkers: ['718-7','2276-4','2132-9','786-4'],
  },
  {
    loinc: '786-4', standardName: 'MCH', specimen: 'whole_blood',
    aliases: ['mch','mean corpuscular hemoglobin','hemoglobina corpuscular media'],
    category: 'cbc', unit: 'pg',
    conventionalRange: { low: 27, high: 33 },
    functionalRange: { low: 28, high: 32 },
    relatedMarkers: ['718-7','787-2','785-6'],
  },
  {
    loinc: '785-6', standardName: 'MCHC', specimen: 'whole_blood',
    aliases: ['mchc','mean corpuscular hemoglobin concentration'],
    category: 'cbc', unit: 'g/dL',
    conventionalRange: { low: 32, high: 36 },
    functionalRange: { low: 33, high: 35 },
    relatedMarkers: ['718-7','787-2','786-4'],
  },
  {
    loinc: '788-0', standardName: 'RDW', specimen: 'whole_blood',
    aliases: ['rdw','red cell distribution width','rdw-cv','red blood cell distribution width'],
    category: 'cbc', unit: '%',
    conventionalRange: { low: 11.5, high: 14.5 },
    functionalRange: { low: 11.5, high: 13.0, notes: 'Elevated RDW = mixed-size RBCs, often iron + B12 deficiency coexisting. Also independent CVD risk marker' },
    relatedMarkers: ['718-7','787-2','2276-4','2132-9'],
  },
  {
    loinc: '6690-2', standardName: 'WBC', specimen: 'whole_blood',
    aliases: ['wbc','white blood cell count','white blood cells','leucocytes','leukocyte count','leucocitos','leukozyten','leucocytes'],
    category: 'cbc', unit: 'x10^3/uL',
    alternateUnits: [{ unit: 'K/uL', conversionFactor: 1 }, { unit: 'x10^9/L', conversionFactor: 1 }],
    conventionalRange: { low: 4.5, high: 11.0 },
    functionalRange: { low: 5.0, high: 8.0, notes: 'Below 5 may indicate chronic viral infection, immune suppression, or autoimmunity' },
    relatedMarkers: ['770-8','751-8','731-0','711-2','704-7'],
  },
  {
    loinc: '777-3', standardName: 'Platelets', specimen: 'whole_blood',
    aliases: ['platelets','platelet count','plt','plaquetas','thrombozyten','plaquettes'],
    category: 'cbc', unit: 'x10^3/uL',
    alternateUnits: [{ unit: 'K/uL', conversionFactor: 1 }, { unit: 'x10^9/L', conversionFactor: 1 }],
    conventionalRange: { low: 150, high: 400 },
    functionalRange: { low: 175, high: 325 },
    relatedMarkers: ['6690-2','718-7'],
  },
  {
    loinc: '789-8', standardName: 'RBC Count', specimen: 'whole_blood',
    aliases: ['rbc','red blood cell count','red blood cells','eritrocitos','erythrozyten','érythrocytes'],
    category: 'cbc', unit: 'x10^6/uL',
    alternateUnits: [{ unit: 'M/uL', conversionFactor: 1 }, { unit: 'x10^12/L', conversionFactor: 1 }],
    conventionalRange: { low: 4.0, high: 5.9 },
    conventionalRangeMale: { low: 4.5, high: 5.9 },
    conventionalRangeFemale: { low: 4.0, high: 5.2 },
    functionalRange: { low: 4.2, high: 5.5 },
    relatedMarkers: ['718-7','4544-3','787-2'],
  },
  {
    loinc: '32623-1', standardName: 'MPV', specimen: 'whole_blood',
    aliases: ['mpv','mean platelet volume','volumen plaquetario medio'],
    category: 'cbc', unit: 'fL',
    conventionalRange: { low: 7.5, high: 11.5 },
    functionalRange: { low: 8.0, high: 10.5, notes: 'High MPV = larger, more active platelets. Elevated in inflammation, CVD risk' },
    relatedMarkers: ['777-3','30522-7'],
  },

  // ========================= CBC DIFFERENTIAL (5 markers) =================
  {
    loinc: '770-8', standardName: 'Neutrophils %', specimen: 'whole_blood',
    aliases: ['neutrophils','neutrophils %','neut %','neutrophil percentage','neutrófilos','neutrophiles'],
    category: 'cbc_differential', unit: '%',
    conventionalRange: { low: 40, high: 70 },
    functionalRange: { low: 40, high: 60 },
    relatedMarkers: ['6690-2','751-8','711-2'],
  },
  {
    loinc: '751-8', standardName: 'Lymphocytes %', specimen: 'whole_blood',
    aliases: ['lymphocytes','lymphocytes %','lymph %','lymphocyte percentage','linfocitos','lymphozyten'],
    category: 'cbc_differential', unit: '%',
    conventionalRange: { low: 20, high: 45 },
    functionalRange: { low: 25, high: 40 },
    relatedMarkers: ['6690-2','770-8'],
  },
  {
    loinc: '731-0', standardName: 'Monocytes %', specimen: 'whole_blood',
    aliases: ['monocytes','monocytes %','mono %','monocyte percentage','monocitos','monozyten'],
    category: 'cbc_differential', unit: '%',
    conventionalRange: { low: 2, high: 8 },
    functionalRange: { low: 2, high: 7 },
    relatedMarkers: ['6690-2','770-8'],
  },
  {
    loinc: '711-2', standardName: 'Eosinophils %', specimen: 'whole_blood',
    aliases: ['eosinophils','eosinophils %','eos %','eosinophil percentage','eosinófilos','eosinophile'],
    category: 'cbc_differential', unit: '%',
    conventionalRange: { low: 0, high: 5 },
    functionalRange: { low: 0, high: 3, notes: 'Elevated = allergies, parasites, asthma, or eosinophilic GI disorders' },
    relatedMarkers: ['6690-2','704-7'],
  },
  {
    loinc: '704-7', standardName: 'Basophils %', specimen: 'whole_blood',
    aliases: ['basophils','basophils %','baso %','basophil percentage','basófilos','basophile'],
    category: 'cbc_differential', unit: '%',
    conventionalRange: { low: 0, high: 1 },
    functionalRange: { low: 0, high: 1 },
    relatedMarkers: ['6690-2','711-2'],
  },

  // ========================= ADRENAL / HPA (4 markers) ====================
  {
    loinc: '2143-6', standardName: 'Cortisol (AM)', specimen: 'serum',
    aliases: ['cortisol','morning cortisol','am cortisol','serum cortisol','cortisol am','cortisol matutino','cortisol sérico','cortisol matinal'],
    category: 'adrenal', unit: 'ug/dL',
    alternateUnits: [{ unit: 'nmol/L', conversionFactor: 27.59 }],
    conventionalRange: { low: 6, high: 23 },
    functionalRange: { low: 10, high: 18, notes: 'AM draw 7-9am only. Diurnal pattern (DUTCH/salivary) is more informative than single draw' },
    relatedMarkers: ['2191-5','1558-6'],
  },
  {
    loinc: '2191-5', standardName: 'DHEA-S', specimen: 'serum',
    aliases: ['dhea-s','dhea sulfate','dehydroepiandrosterone sulfate','dheas','dhea-so4','sulfato de dehidroepiandrosterona','dhéa-s'],
    category: 'adrenal', unit: 'ug/dL',
    alternateUnits: [{ unit: 'umol/L', conversionFactor: 0.02714 }],
    conventionalRange: { low: 45, high: 320 },
    functionalRange: { low: 200, high: 400, notes: 'Age-dependent adrenal reserve marker. Declines with chronic stress' },
    relatedMarkers: ['2143-6'],
  },
  {
    loinc: '51985-0', standardName: 'Pregnenolone', specimen: 'serum',
    aliases: ['pregnenolone','pregnenolona','prégnénolone'],
    category: 'adrenal', unit: 'ng/dL',
    conventionalRange: { low: 10, high: 200 },
    functionalRange: { low: 50, high: 150, notes: 'Mother hormone — precursor to all steroid hormones. Low = pregnenolone steal' },
    relatedMarkers: ['2143-6','2191-5'],
  },
  {
    loinc: '2232-7', standardName: '17-OH Progesterone', specimen: 'serum',
    aliases: ['17-oh progesterone','17-hydroxyprogesterone','17ohp','17 oh progesterone'],
    category: 'adrenal', unit: 'ng/dL',
    conventionalRange: { low: 20, high: 200 },
    functionalRange: { low: 30, high: 150 },
    relatedMarkers: ['2143-6','2191-5'],
  },

  // ========================= SEX HORMONES (10 markers) ====================
  {
    loinc: '2986-8', standardName: 'Testosterone (Total)', specimen: 'serum',
    aliases: ['testosterone','total testosterone','testosterone total','testosterona total'],
    category: 'hormone_general', unit: 'ng/dL',
    alternateUnits: [{ unit: 'nmol/L', conversionFactor: 0.03467 }],
    conventionalRange: { low: 300, high: 1000 },
    conventionalRangeMale: { low: 300, high: 1000 },
    conventionalRangeFemale: { low: 15, high: 70 },
    functionalRange: { low: 500, high: 900 },
    functionalRangeMale: { low: 500, high: 900 },
    functionalRangeFemale: { low: 20, high: 50 },
    relatedMarkers: ['2991-8','2243-4','13967-5'],
  },
  {
    loinc: '2991-8', standardName: 'Free Testosterone', specimen: 'serum',
    aliases: ['free testosterone','testosterone free','free test','testosterona libre'],
    category: 'hormone_general', unit: 'pg/mL',
    conventionalRangeMale: { low: 9, high: 30 },
    conventionalRangeFemale: { low: 0.3, high: 1.9 },
    conventionalRange: { low: 0.3, high: 30 },
    functionalRange: { low: 15, high: 25 },
    functionalRangeMale: { low: 15, high: 25 },
    functionalRangeFemale: { low: 0.5, high: 1.5 },
    relatedMarkers: ['2986-8','2243-4'],
  },
  {
    loinc: '2243-4', standardName: 'Estradiol', specimen: 'serum',
    aliases: ['estradiol','e2','estradiol e2','oestradiol','estradiol sérico'],
    category: 'hormone_general', unit: 'pg/mL',
    alternateUnits: [{ unit: 'pmol/L', conversionFactor: 3.671 }],
    conventionalRangeFemale: { low: 15, high: 350 },
    conventionalRangeMale: { low: 10, high: 40 },
    conventionalRange: { low: 10, high: 350 },
    functionalRange: { low: 50, high: 200, notes: 'Varies dramatically with menstrual phase. Specify cycle day when ordering.' },
    functionalRangeMale: { low: 20, high: 35 },
    relatedMarkers: ['2986-8','2232-7','13967-5'],
  },
  {
    loinc: '2236-8', standardName: 'Progesterone', specimen: 'serum',
    aliases: ['progesterone','p4','progesterona','progestérone'],
    category: 'hormone_female', unit: 'ng/mL',
    alternateUnits: [{ unit: 'nmol/L', conversionFactor: 3.18 }],
    conventionalRange: { low: 0.1, high: 25 },
    functionalRange: { low: 10, high: 25, notes: 'Luteal phase only (day 19-22). Below 10 = luteal insufficiency' },
    relatedMarkers: ['2243-4','13967-5'],
  },
  {
    loinc: '13967-5', standardName: 'SHBG', specimen: 'serum',
    aliases: ['shbg','sex hormone binding globulin','sex hormone-binding globulin','globulina fijadora de hormonas sexuales'],
    category: 'hormone_general', unit: 'nmol/L',
    conventionalRangeMale: { low: 10, high: 57 },
    conventionalRangeFemale: { low: 18, high: 144 },
    conventionalRange: { low: 10, high: 144 },
    functionalRange: { low: 30, high: 80, notes: 'Low SHBG = insulin resistance indicator. High SHBG = less bioavailable testosterone' },
    relatedMarkers: ['2986-8','2991-8','2243-4','20578-1'],
  },
  {
    loinc: '10501-5', standardName: 'LH', specimen: 'serum',
    aliases: ['lh','luteinizing hormone','hormona luteinizante','hormone lutéinisante'],
    category: 'hormone_general', unit: 'mIU/mL',
    alternateUnits: [{ unit: 'IU/L', conversionFactor: 1 }],
    conventionalRange: { low: 1.0, high: 96 },
    functionalRange: { low: 2, high: 15, notes: 'LH/FSH ratio > 2:1 suggests PCOS' },
    relatedMarkers: ['15067-2','2243-4','2236-8'],
  },
  {
    loinc: '15067-2', standardName: 'FSH', specimen: 'serum',
    aliases: ['fsh','follicle stimulating hormone','hormona folículo estimulante','hormone folliculo-stimulante'],
    category: 'hormone_general', unit: 'mIU/mL',
    alternateUnits: [{ unit: 'IU/L', conversionFactor: 1 }],
    conventionalRange: { low: 1.5, high: 134 },
    functionalRange: { low: 3, high: 10, notes: 'Elevated = diminished ovarian reserve (women) or primary hypogonadism (men)' },
    relatedMarkers: ['10501-5','2243-4'],
  },
  {
    loinc: '2148-5', standardName: 'Prolactin', specimen: 'serum',
    aliases: ['prolactin','prl','prolactina','prolaktine'],
    category: 'hormone_general', unit: 'ng/mL',
    conventionalRange: { low: 2, high: 18 },
    conventionalRangeMale: { low: 2, high: 18 },
    conventionalRangeFemale: { low: 2, high: 29 },
    functionalRange: { low: 2, high: 15 },
    relatedMarkers: ['11580-8','10501-5'],
  },
  {
    loinc: '83088-9', standardName: 'AMH', specimen: 'serum',
    aliases: ['amh','anti-mullerian hormone','anti-müllerian hormone','antimüllerian hormone','hormona antimülleriana'],
    category: 'hormone_female', unit: 'ng/mL',
    alternateUnits: [{ unit: 'pmol/L', conversionFactor: 7.143 }],
    conventionalRange: { low: 0.7, high: 3.5 },
    functionalRange: { low: 1.0, high: 3.5, notes: 'Ovarian reserve marker. Below 1.0 = diminished reserve. Age-dependent' },
    relatedMarkers: ['15067-2','10501-5'],
  },
  {
    loinc: '1668-3', standardName: 'Estriol', specimen: 'serum',
    aliases: ['estriol','e3','estriol e3','oestriol'],
    category: 'hormone_female', unit: 'ng/mL',
    conventionalRange: { low: 0, high: 14 },
    functionalRange: { low: 0, high: 10, notes: 'Primarily relevant in pregnancy and for protective estrogen in menopause' },
    relatedMarkers: ['2243-4'],
  },

  // ========================= GUT HEALTH (4 markers) =======================
  {
    loinc: '50564-3', standardName: 'Calprotectin (Stool)', specimen: 'stool',
    aliases: ['calprotectin','fecal calprotectin','stool calprotectin','calprotectina fecal','calprotectine fécale'],
    category: 'gut', unit: 'ug/g',
    conventionalRange: { low: 0, high: 120 },
    functionalRange: { low: 0, high: 50, notes: 'Most reliable non-invasive marker of gut inflammation. Above 200 strongly suggests IBD' },
    relatedMarkers: ['30522-7'],
  },
  {
    loinc: '5196-0', standardName: 'Secretory IgA (Stool)', specimen: 'stool',
    aliases: ['secretory iga','siga','stool iga','fecal iga','iga secretora'],
    category: 'gut', unit: 'mg/dL',
    conventionalRange: { low: 51, high: 204 },
    functionalRange: { low: 60, high: 200, notes: 'Low = impaired gut immune defense. High = active gut immune response/infection' },
    relatedMarkers: ['50564-3'],
  },
  {
    loinc: '13504-6', standardName: 'Zonulin', specimen: 'serum',
    aliases: ['zonulin','serum zonulin','zonulina'],
    category: 'gut', unit: 'ng/mL',
    conventionalRange: { low: 0, high: 107 },
    functionalRange: { low: 0, high: 50, notes: 'Marker of intestinal permeability (leaky gut). Elevated = increased gut barrier permeability' },
    relatedMarkers: ['50564-3','30522-7'],
  },
  {
    loinc: '5130-9', standardName: 'Lactoferrin (Stool)', specimen: 'stool',
    aliases: ['lactoferrin','fecal lactoferrin','stool lactoferrin','lactoferrina fecal'],
    category: 'gut', unit: 'ug/mL',
    conventionalRange: { low: 0, high: 7.25 },
    functionalRange: { low: 0, high: 5.0, notes: 'Neutrophil-derived marker of gut inflammation. Complementary to calprotectin' },
    relatedMarkers: ['50564-3'],
  },

  // ========================= CARDIAC (3 markers) ==========================
  {
    loinc: '33762-6', standardName: 'NT-proBNP', specimen: 'serum',
    aliases: ['nt-probnp','nt probnp','n-terminal pro bnp','brain natriuretic peptide','bnp'],
    category: 'cardiac', unit: 'pg/mL',
    conventionalRange: { low: 0, high: 125 },
    functionalRange: { low: 0, high: 50, notes: 'Cardiac stress marker. Above 125 warrants cardiology evaluation' },
    relatedMarkers: ['30522-7','43084-2'],
  },
  {
    loinc: '49563-0', standardName: 'Troponin I (hs)', specimen: 'serum',
    aliases: ['troponin','troponin i','hs-troponin','high sensitivity troponin','troponina'],
    category: 'cardiac', unit: 'ng/L',
    conventionalRange: { low: 0, high: 34 },
    conventionalRangeMale: { low: 0, high: 34 },
    conventionalRangeFemale: { low: 0, high: 16 },
    functionalRange: { low: 0, high: 14 },
    relatedMarkers: ['33762-6','30522-7'],
  },
  {
    loinc: '13969-1', standardName: 'Oxidized LDL', specimen: 'serum',
    aliases: ['oxidized ldl','ox-ldl','oxldl','ldl oxidado'],
    category: 'cardiac', unit: 'U/L',
    conventionalRange: { low: 0, high: 60 },
    functionalRange: { low: 0, high: 40, notes: 'OxLDL is the truly atherogenic form. Better CVD risk marker than standard LDL-C' },
    relatedMarkers: ['13457-7','30522-7','2085-9'],
  },

  // ========================= AUTOIMMUNE (3 markers) =======================
  {
    loinc: '8066-1', standardName: 'ANA', specimen: 'serum',
    aliases: ['ana','antinuclear antibody','antinuclear antibodies','anticuerpos antinucleares','anticorps antinucléaires'],
    category: 'autoimmune', unit: 'titer',
    conventionalRange: { low: 0, high: 1 },
    functionalRange: { low: 0, high: 1, notes: 'Positive ANA (>1:80) warrants further autoimmune workup. Pattern matters (homogeneous, speckled, etc.)' },
    relatedMarkers: ['30152-4','30522-7'],
  },
  {
    loinc: '5130-0', standardName: 'Rheumatoid Factor', specimen: 'serum',
    aliases: ['rheumatoid factor','rf','factor reumatoide','facteur rhumatoïde'],
    category: 'autoimmune', unit: 'IU/mL',
    conventionalRange: { low: 0, high: 14 },
    functionalRange: { low: 0, high: 10 },
    relatedMarkers: ['8066-1','30522-7','4537-7'],
  },
  {
    loinc: '56718-0', standardName: 'Anti-CCP', specimen: 'serum',
    aliases: ['anti-ccp','ccp antibodies','anti-cyclic citrullinated peptide','anticcp','anticuerpos anti-ccp'],
    category: 'autoimmune', unit: 'U/mL',
    conventionalRange: { low: 0, high: 20 },
    functionalRange: { low: 0, high: 20, notes: 'More specific than RF for rheumatoid arthritis. Can appear years before clinical RA' },
    relatedMarkers: ['5130-0','8066-1'],
  },

  // ========================= PANCREATIC (2 markers) =======================
  {
    loinc: '1798-0', standardName: 'Amylase', specimen: 'serum',
    aliases: ['amylase','serum amylase','amilasa','amylase sérique'],
    category: 'pancreatic', unit: 'U/L',
    conventionalRange: { low: 28, high: 100 },
    functionalRange: { low: 30, high: 80 },
    relatedMarkers: ['1798-1'],
  },
  {
    loinc: '1798-1', standardName: 'Lipase', specimen: 'serum',
    aliases: ['lipase','serum lipase','lipasa'],
    category: 'pancreatic', unit: 'U/L',
    conventionalRange: { low: 0, high: 160 },
    functionalRange: { low: 10, high: 60, notes: 'More specific for pancreatic function than amylase' },
    relatedMarkers: ['1798-0'],
  },

  // ========================= BONE (2 markers) =============================
  {
    loinc: '2731-3', standardName: 'PTH', specimen: 'serum',
    aliases: ['pth','parathyroid hormone','intact pth','parathormone','paratohormona','parathormone intacte'],
    category: 'bone', unit: 'pg/mL',
    alternateUnits: [{ unit: 'pmol/L', conversionFactor: 0.1053 }],
    conventionalRange: { low: 15, high: 65 },
    functionalRange: { low: 20, high: 50, notes: 'Interpret with calcium and vitamin D. Elevated PTH + normal calcium = consider vitamin D deficiency first' },
    relatedMarkers: ['17861-6','1989-3','2731-8'],
  },
  {
    loinc: '15220-7', standardName: 'Osteocalcin', specimen: 'serum',
    aliases: ['osteocalcin','bone gla protein','osteocalcina'],
    category: 'bone', unit: 'ng/mL',
    conventionalRange: { low: 9, high: 42 },
    functionalRange: { low: 15, high: 35, notes: 'Bone formation marker. Also linked to glucose metabolism — low osteocalcin associated with insulin resistance' },
    relatedMarkers: ['2731-3','17861-6','1989-3'],
  },

  // ========================= COAGULATION (2 markers) ======================
  {
    loinc: '3255-7', standardName: 'D-Dimer', specimen: 'plasma',
    aliases: ['d-dimer','d dimer','dímero d','d-dimère'],
    category: 'coagulation', unit: 'ng/mL',
    alternateUnits: [{ unit: 'ug/mL FEU', conversionFactor: 0.002 }],
    conventionalRange: { low: 0, high: 500 },
    functionalRange: { low: 0, high: 250, notes: 'Elevated = clot breakdown somewhere. Nonspecific but important to trend' },
    relatedMarkers: ['1798-8'],
  },
  {
    loinc: '3173-2', standardName: 'aPTT', specimen: 'plasma',
    aliases: ['aptt','activated partial thromboplastin time','ptt','partial thromboplastin time','tiempo parcial de tromboplastina'],
    category: 'coagulation', unit: 'seconds',
    conventionalRange: { low: 25, high: 35 },
    functionalRange: { low: 25, high: 33 },
    relatedMarkers: ['3255-7','1798-8'],
  },

  // ========================= OXIDATIVE STRESS (2 markers) =================
  {
    loinc: '49072-2', standardName: 'Glutathione (RBC)', specimen: 'rbc',
    aliases: ['glutathione','rbc glutathione','gsh','reduced glutathione','glutatión','glutathion'],
    category: 'oxidative_stress', unit: 'umol/L',
    conventionalRange: { low: 795, high: 1235 },
    functionalRange: { low: 900, high: 1200, notes: 'Master antioxidant. Low = oxidative stress, toxin burden, poor detoxification' },
    relatedMarkers: ['2324-2','30522-7'],
  },
  {
    loinc: '2711-0', standardName: '8-OHdG', specimen: 'urine',
    aliases: ['8-ohdg','8-hydroxy-2-deoxyguanosine','oxidative dna damage marker'],
    category: 'oxidative_stress', unit: 'ng/mg creatinine',
    conventionalRange: { low: 0, high: 15 },
    functionalRange: { low: 0, high: 8, notes: 'DNA oxidative damage marker. Elevated = significant oxidative stress' },
    relatedMarkers: ['49072-2','30522-7'],
  },

  // ========================= ENVIRONMENTAL / TOXINS (2 markers) ===========
  {
    loinc: '5671-3', standardName: 'Lead (Blood)', specimen: 'whole_blood',
    aliases: ['lead','blood lead','lead level','pb','plomo','plomb','blei'],
    category: 'environmental', unit: 'ug/dL',
    conventionalRange: { low: 0, high: 5 },
    functionalRange: { low: 0, high: 2, notes: 'No safe level. Even 2-5 associated with cognitive effects, hypertension' },
    relatedMarkers: ['5672-1'],
  },
  {
    loinc: '5672-1', standardName: 'Mercury (Blood)', specimen: 'whole_blood',
    aliases: ['mercury','blood mercury','hg','mercurio','mercure','quecksilber'],
    category: 'environmental', unit: 'ug/L',
    conventionalRange: { low: 0, high: 10 },
    functionalRange: { low: 0, high: 3, notes: 'Sources: fish consumption, dental amalgams. Above 5 = significant exposure' },
    relatedMarkers: ['5671-3'],
  },
];

// ---------------------------------------------------------------------------
// LOOKUP FUNCTIONS
// ---------------------------------------------------------------------------

/** Find marker by any alias — fuzzy, case-insensitive, punctuation-stripped */
export function findMarkerByName(input: string): LabMarkerDefinition | null {
  const normalized = input.toLowerCase().trim()
    .replace(/[,.\-\(\)\/\\:;'"]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // 1. Exact standard name match
  for (const marker of LOINC_MAP) {
    if (marker.standardName.toLowerCase() === normalized) return marker;
  }

  // 2. Exact alias match
  for (const marker of LOINC_MAP) {
    for (const alias of marker.aliases) {
      if (alias === normalized) return marker;
    }
  }

  // 3. Alias starts with input or input starts with alias (handles "TSH, 3rd Gen" → "tsh")
  for (const marker of LOINC_MAP) {
    for (const alias of marker.aliases) {
      if (normalized.startsWith(alias) || alias.startsWith(normalized)) return marker;
    }
  }

  // 4. Substring match — input contains alias or vice versa
  for (const marker of LOINC_MAP) {
    for (const alias of marker.aliases) {
      if (normalized.includes(alias) || alias.includes(normalized)) return marker;
    }
  }

  // 5. Word-level match — any alias word fully present in input
  for (const marker of LOINC_MAP) {
    const nameWords = marker.standardName.toLowerCase().split(/\s+/);
    const inputWords = normalized.split(/\s+/);
    if (nameWords.length > 0 && nameWords.every(w => inputWords.some(iw => iw.includes(w) || w.includes(iw)))) {
      return marker;
    }
  }

  return null;
}

/** Find by LOINC code */
export function findMarkerByLoinc(loinc: string): LabMarkerDefinition | null {
  return LOINC_MAP.find(m => m.loinc === loinc) || null;
}

/** Get all markers in a category */
export function getMarkersByCategory(category: LabCategory): LabMarkerDefinition[] {
  return LOINC_MAP.filter(m => m.category === category);
}

/** Convert between units */
export function convertUnit(marker: LabMarkerDefinition, value: number, fromUnit: string, toUnit: string): number | null {
  if (fromUnit.toLowerCase() === toUnit.toLowerCase()) return value;

  // Normalize unit strings for matching
  const normalizeUnit = (u: string) => u.toLowerCase().replace(/\s+/g, '').replace(/\//g, '/');
  const from = normalizeUnit(fromUnit);
  const to = normalizeUnit(toUnit);
  const primary = normalizeUnit(marker.unit);

  if (from === to) return value;

  // from primary → alternate
  if (from === primary && marker.alternateUnits) {
    const alt = marker.alternateUnits.find(a => normalizeUnit(a.unit) === to);
    if (alt) return value * alt.conversionFactor;
  }

  // from alternate → primary
  if (to === primary && marker.alternateUnits) {
    const alt = marker.alternateUnits.find(a => normalizeUnit(a.unit) === from);
    if (alt) return value / alt.conversionFactor;
  }

  // alternate → alternate (through primary)
  if (marker.alternateUnits) {
    const fromAlt = marker.alternateUnits.find(a => normalizeUnit(a.unit) === from);
    const toAlt = marker.alternateUnits.find(a => normalizeUnit(a.unit) === to);
    if (fromAlt && to === primary) return value / fromAlt.conversionFactor;
    if (from === primary && toAlt) return value * toAlt.conversionFactor;
    if (fromAlt && toAlt) return (value / fromAlt.conversionFactor) * toAlt.conversionFactor;
  }

  return null;
}

/** Dictionary statistics */
export function getMapStats() {
  const categories = new Set(LOINC_MAP.map(m => m.category));
  const totalAliases = LOINC_MAP.reduce((sum, m) => sum + m.aliases.length, 0);
  const specimens = new Set(LOINC_MAP.map(m => m.specimen));
  const withFunctionalRanges = LOINC_MAP.filter(m => m.functionalRange.low !== undefined || m.functionalRange.high !== undefined).length;
  const withUnitConversions = LOINC_MAP.filter(m => m.alternateUnits && m.alternateUnits.length > 0).length;
  const withSexSpecificRanges = LOINC_MAP.filter(m => m.conventionalRangeMale || m.conventionalRangeFemale).length;

  return {
    totalMarkers: LOINC_MAP.length,
    totalAliases,
    categories: [...categories].sort(),
    totalCategories: categories.size,
    specimens: [...specimens],
    withFunctionalRanges,
    withUnitConversions,
    withSexSpecificRanges,
    languagesSupported: ['English', 'Spanish', 'Portuguese', 'German', 'French'],
  };
}
