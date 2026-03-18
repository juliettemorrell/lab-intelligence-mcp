/**
 * Genomic Data Parser
 *
 * Parses consumer genomic data (23andMe, AncestryDNA) and clinical
 * VCF files. Extracts clinically relevant variants and cross-references
 * with pharmacogenomics and functional medicine SNP databases.
 *
 * Formats:
 *   - 23andMe raw data (tab-delimited: rsid, chromosome, position, genotype)
 *   - AncestryDNA raw data (similar format with header differences)
 *   - VCF (Variant Call Format from clinical sequencing)
 *   - Generic SNP list (rsID + genotype)
 *
 * Clinical focus:
 *   - Pharmacogenomics (drug metabolism: CYP450 family)
 *   - Methylation (MTHFR, COMT, CBS, MTR, MTRR)
 *   - Detoxification (GSTM1, GSTP1, SOD2, NAT2)
 *   - Nutrient metabolism (VDR, BCMO1, FUT2, HFE)
 *   - Inflammation (TNF-alpha, IL-6, APOE)
 *   - Cardiovascular (Factor V Leiden, MTHFR, APOE, Lp(a))
 */

export interface GenomicVariant {
  rsid: string;
  chromosome: string;
  position: number;
  genotype: string;
  gene: string | null;
  clinicalName: string | null;
  category: GenomicCategory;
  riskAllele: string | null;
  riskLevel: 'normal' | 'heterozygous' | 'homozygous' | 'not_applicable';
  clinicalSignificance: string | null;
  functionalImplication: string | null;
  relatedLabMarkers: string[];  // LOINC codes of labs to check
  pharmGKBLevel: string | null; // Evidence level from PharmGKB
}

export type GenomicCategory =
  | 'methylation' | 'detoxification' | 'pharmacogenomics' | 'nutrient_metabolism'
  | 'inflammation' | 'cardiovascular' | 'thyroid' | 'immune'
  | 'neurotransmitter' | 'hormone_metabolism' | 'gut_health' | 'other';

export interface GenomicParsedResult {
  source: string;
  totalVariants: number;
  clinicallyRelevant: number;
  variants: GenomicVariant[];
  pharmacogenomicSummary: PharmSummary[];
  methylationStatus: MethylationProfile | null;
  suggestedLabTests: Array<{ test: string; loinc: string; reason: string }>;
}

export interface PharmSummary {
  gene: string;
  metabolizerStatus: string;
  affectedDrugs: string[];
  recommendation: string;
}

export interface MethylationProfile {
  mthfrC677T: string | null;
  mthfrA1298C: string | null;
  comt: string | null;
  cbs: string | null;
  mtr: string | null;
  mtrr: string | null;
  overallStatus: 'normal' | 'mildly_impaired' | 'moderately_impaired' | 'significantly_impaired';
  implications: string[];
}

// ---------------------------------------------------------------------------
// Clinically relevant SNP database
// ---------------------------------------------------------------------------
const CLINICAL_SNPS: Record<string, {
  gene: string;
  name: string;
  category: GenomicCategory;
  riskAllele: string;
  significance: string;
  functionalNote: string;
  relatedLabs: string[];
  pharmLevel?: string;
}> = {
  // ===== METHYLATION =====
  'rs1801133': {
    gene: 'MTHFR', name: 'MTHFR C677T', category: 'methylation',
    riskAllele: 'T', significance: 'Reduced enzyme activity (30-70% decrease)',
    functionalNote: 'Impaired folate metabolism. Homozygous TT = ~70% reduced MTHFR activity. May need methylfolate instead of folic acid. Check homocysteine.',
    relatedLabs: ['10839-9', '2284-8', '2132-9'], // homocysteine, folate, B12
  },
  'rs1801131': {
    gene: 'MTHFR', name: 'MTHFR A1298C', category: 'methylation',
    riskAllele: 'C', significance: 'Reduced BH4 production',
    functionalNote: 'Affects BH4 (tetrahydrobiopterin) production — impacts neurotransmitter synthesis. Compound heterozygosity (C677T + A1298C) has additive effect.',
    relatedLabs: ['10839-9', '2284-8'],
  },
  'rs4680': {
    gene: 'COMT', name: 'COMT Val158Met', category: 'neurotransmitter',
    riskAllele: 'A', significance: 'Slower catecholamine breakdown',
    functionalNote: 'Met/Met (AA) = "worrier" genotype — slower dopamine/norepinephrine/estrogen clearance. Better focus but more anxiety-prone. Affects estrogen metabolism (check 2:16 OH estrogen ratio).',
    relatedLabs: ['2243-4', '2143-6'], // estradiol, cortisol
  },
  'rs234706': {
    gene: 'CBS', name: 'CBS C699T', category: 'methylation',
    riskAllele: 'T', significance: 'Upregulated CBS enzyme',
    functionalNote: 'Faster transsulfuration — may deplete homocysteine too quickly and produce excess sulfite/ammonia. Consider low-sulfur diet if symptomatic.',
    relatedLabs: ['10839-9', '3094-0'], // homocysteine, BUN (ammonia proxy)
  },
  'rs1805087': {
    gene: 'MTR', name: 'MTR A2756G', category: 'methylation',
    riskAllele: 'G', significance: 'Altered B12-dependent methionine synthase',
    functionalNote: 'Affects methionine regeneration. May increase B12 requirements.',
    relatedLabs: ['2132-9', '10839-9'],
  },
  'rs1801394': {
    gene: 'MTRR', name: 'MTRR A66G', category: 'methylation',
    riskAllele: 'G', significance: 'Reduced MTRR enzyme function',
    functionalNote: 'MTRR regenerates MTR. Variants may reduce B12 utilization efficiency.',
    relatedLabs: ['2132-9', '10839-9'],
  },

  // ===== DETOXIFICATION =====
  'rs1695': {
    gene: 'GSTP1', name: 'GSTP1 Ile105Val', category: 'detoxification',
    riskAllele: 'G', significance: 'Altered glutathione S-transferase activity',
    functionalNote: 'Reduced phase II detox capacity. May need enhanced glutathione support (NAC, liposomal glutathione). Check GGT as proxy for glutathione status.',
    relatedLabs: ['2324-2', '49072-2'], // GGT, glutathione
  },
  'rs4880': {
    gene: 'SOD2', name: 'SOD2 Ala16Val', category: 'detoxification',
    riskAllele: 'T', significance: 'Altered mitochondrial antioxidant defense',
    functionalNote: 'Val/Val = less efficient mitochondrial superoxide dismutase. Consider CoQ10, MnSOD cofactors (manganese). Check oxidative stress markers.',
    relatedLabs: ['49072-2', '2711-0'], // glutathione, 8-OHdG
  },
  'rs1048943': {
    gene: 'CYP1A1', name: 'CYP1A1*2C', category: 'detoxification',
    riskAllele: 'G', significance: 'Increased phase I detox activity',
    functionalNote: 'Faster phase I without matched phase II = more reactive intermediates. Support phase II (cruciferous vegetables, DIM, glutathione).',
    relatedLabs: ['2324-2', '1742-6'], // GGT, ALT
  },

  // ===== NUTRIENT METABOLISM =====
  'rs2228570': {
    gene: 'VDR', name: 'VDR FokI', category: 'nutrient_metabolism',
    riskAllele: 'T', significance: 'Reduced vitamin D receptor activity',
    functionalNote: 'May need higher vitamin D doses to achieve same effect. Target higher serum 25-OH-D levels (60-80 ng/mL).',
    relatedLabs: ['1989-3', '17861-6'], // vitamin D, calcium
  },
  'rs12934922': {
    gene: 'BCMO1', name: 'BCMO1 A379V', category: 'nutrient_metabolism',
    riskAllele: 'T', significance: 'Reduced beta-carotene to vitamin A conversion',
    functionalNote: 'Poor converter — may need preformed vitamin A (retinol) rather than relying on beta-carotene from plants.',
    relatedLabs: [],
  },
  'rs602662': {
    gene: 'FUT2', name: 'FUT2 (Non-secretor)', category: 'gut_health',
    riskAllele: 'A', significance: 'Non-secretor status',
    functionalNote: 'Non-secretors have altered gut microbiome, lower bifidobacteria, impaired B12 absorption, and different blood group antigen expression. May need supplemental B12 and probiotics.',
    relatedLabs: ['2132-9', '5196-0'], // B12, secretory IgA
  },
  'rs1799945': {
    gene: 'HFE', name: 'HFE H63D', category: 'nutrient_metabolism',
    riskAllele: 'G', significance: 'Mild iron absorption increase',
    functionalNote: 'Heterozygous = mild effect. Compound with C282Y = higher hemochromatosis risk. Monitor ferritin and iron saturation.',
    relatedLabs: ['2276-4', '14800-7'], // ferritin, iron saturation
  },
  'rs1800562': {
    gene: 'HFE', name: 'HFE C282Y', category: 'nutrient_metabolism',
    riskAllele: 'A', significance: 'Significant iron overload risk',
    functionalNote: 'Homozygous = high hemochromatosis risk. Monitor ferritin, iron saturation, and transferrin closely. May need phlebotomy.',
    relatedLabs: ['2276-4', '14800-7', '2498-4', '2500-7'],
  },

  // ===== CARDIOVASCULAR =====
  'rs6025': {
    gene: 'F5', name: 'Factor V Leiden', category: 'cardiovascular',
    riskAllele: 'A', significance: 'Increased clotting risk (3-8x heterozygous, 80x homozygous)',
    functionalNote: 'Major thrombophilia variant. Avoid oral contraceptives, monitor D-dimer, consider anticoagulation for high-risk situations.',
    relatedLabs: ['3255-7', '1798-8'], // D-dimer, fibrinogen
  },
  'rs429358': {
    gene: 'APOE', name: 'APOE (E4 determinant)', category: 'cardiovascular',
    riskAllele: 'C', significance: 'APOE4 allele — cardiovascular and Alzheimer risk',
    functionalNote: 'E4 carriers have higher LDL, worse response to saturated fat, increased Alzheimer risk. Aggressive lipid management, anti-inflammatory diet, exercise critical.',
    relatedLabs: ['13457-7', '2085-9', '30522-7', '2089-1'], // LDL, HDL, hs-CRP, ApoB
  },
  'rs7412': {
    gene: 'APOE', name: 'APOE (E2 determinant)', category: 'cardiovascular',
    riskAllele: 'T', significance: 'APOE2 allele — cardioprotective but higher triglycerides',
    functionalNote: 'E2 carriers have lower LDL but may have higher triglycerides. Type III hyperlipoproteinemia risk if homozygous E2/E2.',
    relatedLabs: ['2571-8', '13457-7'],
  },

  // ===== PHARMACOGENOMICS =====
  'rs1065852': {
    gene: 'CYP2D6', name: 'CYP2D6*4', category: 'pharmacogenomics',
    riskAllele: 'A', significance: 'Non-functional allele — poor metabolizer',
    functionalNote: 'CYP2D6 metabolizes ~25% of all drugs. Poor metabolizers need dose adjustments for: codeine (no effect), tamoxifen (reduced efficacy), SSRIs, beta-blockers, many opioids.',
    relatedLabs: [],
    pharmLevel: '1A',
  },
  'rs4244285': {
    gene: 'CYP2C19', name: 'CYP2C19*2', category: 'pharmacogenomics',
    riskAllele: 'A', significance: 'Non-functional allele — poor metabolizer',
    functionalNote: 'Affects clopidogrel (Plavix) efficacy, PPI metabolism, some antidepressants. Poor metabolizers may need alternative antiplatelet therapy.',
    relatedLabs: [],
    pharmLevel: '1A',
  },
  'rs1799853': {
    gene: 'CYP2C9', name: 'CYP2C9*2', category: 'pharmacogenomics',
    riskAllele: 'T', significance: 'Reduced metabolism',
    functionalNote: 'Affects warfarin dosing, NSAIDs, sulfonylureas. May need lower doses.',
    relatedLabs: [],
    pharmLevel: '1A',
  },
  'rs776746': {
    gene: 'CYP3A5', name: 'CYP3A5*3', category: 'pharmacogenomics',
    riskAllele: 'G', significance: 'Non-expressor (most common)',
    functionalNote: 'Affects tacrolimus dosing in transplant patients. Non-expressors need lower doses.',
    relatedLabs: [],
    pharmLevel: '1A',
  },

  // ===== INFLAMMATION =====
  'rs1800629': {
    gene: 'TNF-alpha', name: 'TNF-alpha G308A', category: 'inflammation',
    riskAllele: 'A', significance: 'Increased TNF-alpha production',
    functionalNote: 'Higher baseline inflammation. May respond well to anti-inflammatory interventions (omega-3, curcumin). Monitor hs-CRP more closely.',
    relatedLabs: ['30522-7', '26885-4', '4537-7'], // hs-CRP, TNF-alpha, ESR
  },
  'rs1800795': {
    gene: 'IL-6', name: 'IL-6 G174C', category: 'inflammation',
    riskAllele: 'C', significance: 'Altered IL-6 expression',
    functionalNote: 'CC genotype associated with higher IL-6 levels and inflammatory response. Important context for interpreting hs-CRP and inflammatory labs.',
    relatedLabs: ['30522-7', '26881-3'],
  },

  // ===== THYROID =====
  'rs965513': {
    gene: 'FOXE1', name: 'FOXE1 (thyroid susceptibility)', category: 'thyroid',
    riskAllele: 'A', significance: 'Increased thyroid disease susceptibility',
    functionalNote: 'Increased risk for thyroid nodules and cancer. More aggressive thyroid monitoring warranted.',
    relatedLabs: ['11580-8', '30152-4', '5765-2'],
  },
  'rs1991517': {
    gene: 'DIO2', name: 'DIO2 Thr92Ala', category: 'thyroid',
    riskAllele: 'C', significance: 'Reduced T4-to-T3 conversion in tissues',
    functionalNote: 'May explain persistent hypothyroid symptoms despite normal TSH. Tissues convert T4→T3 less efficiently. May benefit from combination T4+T3 therapy rather than T4 alone.',
    relatedLabs: ['11580-8', '3051-0', '3016-3', '33244-7'],
  },
};

// ---------------------------------------------------------------------------
// PARSING FUNCTIONS
// ---------------------------------------------------------------------------

/**
 * Parse raw genomic data from any supported format.
 */
export function parseGenomicData(data: string, sourceHint?: string): GenomicParsedResult {
  // Keep ALL lines for parsers that need them (they handle comments internally)
  const allLines = data.split('\n');
  // For format detection, strip comment lines
  const nonCommentLines = allLines.filter(l => l.trim() && !l.startsWith('#'));

  let variants: GenomicVariant[] = [];
  let source = sourceHint || 'unknown';

  // Check sourceHint first for explicit routing
  const hint = (sourceHint || '').toLowerCase();

  // Detect format from content
  const hasVCFHeader = data.includes('##fileformat=VCF') || allLines.some(l => l.startsWith('#CHROM'));
  const has23andMeHeader = data.includes('23andMe') || data.includes('23andme') ||
    allLines.some(l => /^#\s*rsid\s+chromosome/i.test(l));
  const hasAncestryHeader = data.toLowerCase().includes('ancestrydna') || data.toLowerCase().includes('ancestry');
  const hasRsidData = nonCommentLines.some(l => /^rs\d+\t/.test(l));

  if (hasVCFHeader || hint === 'vcf') {
    source = 'vcf';
    variants = parseVCF(allLines);
  } else if (has23andMeHeader || hint === '23andme' || (hasRsidData && !hasAncestryHeader)) {
    source = data.includes('AncestryDNA') ? 'ancestrydna' : '23andme';
    variants = parseDTC(allLines);
  } else if (hasAncestryHeader || hint === 'ancestrydna') {
    source = 'ancestrydna';
    variants = parseDTC(allLines);
  } else {
    // Try to parse as generic rsID + genotype
    variants = parseGenericSNP(nonCommentLines);
    source = 'generic_snp';
  }

  // Filter to clinically relevant
  const clinical = variants.filter(v => v.clinicalName !== null);

  // Build pharmacogenomics summary
  const pharmSummary = buildPharmSummary(variants);

  // Build methylation profile
  const methylation = buildMethylationProfile(variants);

  // Suggest lab tests based on variants found
  const suggestedLabs = buildLabSuggestions(clinical);

  return {
    source,
    totalVariants: variants.length,
    clinicallyRelevant: clinical.length,
    variants: clinical,
    pharmacogenomicSummary: pharmSummary,
    methylationStatus: methylation,
    suggestedLabTests: suggestedLabs,
  };
}

function parseDTC(lines: string[]): GenomicVariant[] {
  const variants: GenomicVariant[] = [];

  // Find the first data line (starts with 'rs' or 'i' after tab-split)
  // Skip ALL comment/header lines starting with '#'
  let dataStartIdx = 0;
  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    if (trimmed && !trimmed.startsWith('#')) {
      dataStartIdx = i;
      break;
    }
  }

  for (let i = dataStartIdx; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const cols = trimmed.split('\t');
    if (cols.length < 4) continue;

    const rsid = cols[0].trim();
    const chromosome = cols[1].trim();
    const position = parseInt(cols[2].trim());
    const genotype = cols[3].trim();

    if (!rsid.startsWith('rs') && !rsid.startsWith('i')) continue;
    if (genotype === '--' || genotype === '00' || !genotype) continue;

    const snpInfo = CLINICAL_SNPS[rsid];
    const variant: GenomicVariant = {
      rsid,
      chromosome,
      position: isNaN(position) ? 0 : position,
      genotype,
      gene: snpInfo?.gene || null,
      clinicalName: snpInfo?.name || null,
      category: snpInfo?.category || 'other',
      riskAllele: snpInfo?.riskAllele || null,
      riskLevel: snpInfo ? getRiskLevel(genotype, snpInfo.riskAllele) : 'not_applicable',
      clinicalSignificance: snpInfo?.significance || null,
      functionalImplication: snpInfo?.functionalNote || null,
      relatedLabMarkers: snpInfo?.relatedLabs || [],
      pharmGKBLevel: snpInfo?.pharmLevel || null,
    };

    // Only include if clinically relevant (in our database)
    if (snpInfo) variants.push(variant);
  }

  return variants;
}

function parseVCF(lines: string[]): GenomicVariant[] {
  const variants: GenomicVariant[] = [];

  for (const line of lines) {
    if (line.startsWith('#')) continue;
    const cols = line.split('\t');
    if (cols.length < 5) continue;

    const chromosome = cols[0];
    const position = parseInt(cols[1]);
    const rsid = cols[2]; // May be '.' if no rsID
    const ref = cols[3];
    const alt = cols[4];

    if (!rsid || rsid === '.') continue;

    // Reconstruct genotype from GT field (last column, first subfield)
    let genotype = '';
    if (cols.length >= 10) {
      const formatFields = cols[8].split(':');
      const sampleFields = cols[9].split(':');
      const gtIdx = formatFields.indexOf('GT');
      if (gtIdx >= 0) {
        const gt = sampleFields[gtIdx];
        const alleles = gt.split(/[/|]/);
        genotype = alleles.map(a => a === '0' ? ref : alt).join('');
      }
    }

    const snpInfo = CLINICAL_SNPS[rsid];
    if (snpInfo) {
      variants.push({
        rsid, chromosome, position, genotype,
        gene: snpInfo.gene, clinicalName: snpInfo.name, category: snpInfo.category,
        riskAllele: snpInfo.riskAllele,
        riskLevel: getRiskLevel(genotype, snpInfo.riskAllele),
        clinicalSignificance: snpInfo.significance,
        functionalImplication: snpInfo.functionalNote,
        relatedLabMarkers: snpInfo.relatedLabs,
        pharmGKBLevel: snpInfo.pharmLevel || null,
      });
    }
  }

  return variants;
}

function parseGenericSNP(lines: string[]): GenomicVariant[] {
  const variants: GenomicVariant[] = [];

  for (const line of lines) {
    // Match patterns like: rs1801133 CT, rs1801133\tCT, rs1801133 C/T
    const match = line.match(/(rs\d+)\s+([ACGT]{1,2}|[ACGT]\/[ACGT])/i);
    if (!match) continue;

    const rsid = match[1];
    const genotype = match[2].replace('/', '');
    const snpInfo = CLINICAL_SNPS[rsid];

    if (snpInfo) {
      variants.push({
        rsid, chromosome: '', position: 0, genotype,
        gene: snpInfo.gene, clinicalName: snpInfo.name, category: snpInfo.category,
        riskAllele: snpInfo.riskAllele,
        riskLevel: getRiskLevel(genotype, snpInfo.riskAllele),
        clinicalSignificance: snpInfo.significance,
        functionalImplication: snpInfo.functionalNote,
        relatedLabMarkers: snpInfo.relatedLabs,
        pharmGKBLevel: snpInfo.pharmLevel || null,
      });
    }
  }

  return variants;
}

// ---------------------------------------------------------------------------
// Clinical analysis builders
// ---------------------------------------------------------------------------

function getRiskLevel(genotype: string, riskAllele: string): 'normal' | 'heterozygous' | 'homozygous' {
  if (!genotype || !riskAllele) return 'normal';
  const alleles = genotype.split('');
  const riskCount = alleles.filter(a => a.toUpperCase() === riskAllele.toUpperCase()).length;
  if (riskCount >= 2) return 'homozygous';
  if (riskCount === 1) return 'heterozygous';
  return 'normal';
}

function buildPharmSummary(variants: GenomicVariant[]): PharmSummary[] {
  const pharmVariants = variants.filter(v => v.category === 'pharmacogenomics');
  const byGene = new Map<string, GenomicVariant[]>();

  for (const v of pharmVariants) {
    if (!v.gene) continue;
    if (!byGene.has(v.gene)) byGene.set(v.gene, []);
    byGene.get(v.gene)!.push(v);
  }

  const summaries: PharmSummary[] = [];

  for (const [gene, geneVariants] of byGene) {
    const homozygous = geneVariants.some(v => v.riskLevel === 'homozygous');
    const heterozygous = geneVariants.some(v => v.riskLevel === 'heterozygous');

    let status = 'Normal Metabolizer';
    if (homozygous) status = 'Poor Metabolizer';
    else if (heterozygous) status = 'Intermediate Metabolizer';

    const drugs = PHARM_DRUG_MAP[gene] || [];

    summaries.push({
      gene,
      metabolizerStatus: status,
      affectedDrugs: drugs,
      recommendation: homozygous
        ? `${gene} poor metabolizer — dose adjustments or alternatives needed for: ${drugs.join(', ')}`
        : heterozygous
          ? `${gene} intermediate metabolizer — monitor for altered drug response`
          : `${gene} normal metabolizer — standard dosing expected`,
    });
  }

  return summaries;
}

const PHARM_DRUG_MAP: Record<string, string[]> = {
  'CYP2D6': ['codeine', 'tramadol', 'tamoxifen', 'fluoxetine', 'paroxetine', 'metoprolol', 'carvedilol', 'ondansetron', 'dextromethorphan'],
  'CYP2C19': ['clopidogrel', 'omeprazole', 'esomeprazole', 'citalopram', 'escitalopram', 'voriconazole', 'diazepam'],
  'CYP2C9': ['warfarin', 'celecoxib', 'flurbiprofen', 'glipizide', 'losartan', 'phenytoin'],
  'CYP3A5': ['tacrolimus', 'sirolimus'],
  'CYP1A1': ['caffeine', 'theophylline', 'melatonin'],
};

function buildMethylationProfile(variants: GenomicVariant[]): MethylationProfile | null {
  const methylVariants = variants.filter(v =>
    ['MTHFR', 'COMT', 'CBS', 'MTR', 'MTRR'].includes(v.gene || '')
  );

  if (methylVariants.length === 0) return null;

  const find = (rsid: string) => methylVariants.find(v => v.rsid === rsid);
  const c677t = find('rs1801133');
  const a1298c = find('rs1801131');
  const comt = find('rs4680');
  const cbs = find('rs234706');
  const mtr = find('rs1805087');
  const mtrr = find('rs1801394');

  // Score methylation impairment
  let score = 0;
  const implications: string[] = [];

  if (c677t?.riskLevel === 'homozygous') { score += 3; implications.push('MTHFR C677T homozygous — ~70% reduced enzyme activity. Methylfolate strongly recommended over folic acid.'); }
  else if (c677t?.riskLevel === 'heterozygous') { score += 1; implications.push('MTHFR C677T heterozygous — ~30% reduced activity. Consider methylfolate.'); }

  if (a1298c?.riskLevel === 'homozygous') { score += 2; implications.push('MTHFR A1298C homozygous — reduced BH4 production affecting neurotransmitters.'); }
  else if (a1298c?.riskLevel === 'heterozygous') { score += 1; }

  // Compound heterozygosity
  if (c677t?.riskLevel === 'heterozygous' && a1298c?.riskLevel === 'heterozygous') {
    score += 1;
    implications.push('Compound MTHFR heterozygote (C677T + A1298C) — additive methylation impairment.');
  }

  if (comt?.riskLevel === 'homozygous') { score += 1; implications.push('COMT slow — slower catechol/estrogen clearance. May affect anxiety, estrogen dominance.'); }
  if (mtr?.riskLevel !== 'normal') { score += 1; implications.push('MTR variant — may increase B12 requirements.'); }
  if (mtrr?.riskLevel !== 'normal') { score += 1; implications.push('MTRR variant — B12 recycling may be impaired.'); }

  let overallStatus: MethylationProfile['overallStatus'] = 'normal';
  if (score >= 5) overallStatus = 'significantly_impaired';
  else if (score >= 3) overallStatus = 'moderately_impaired';
  else if (score >= 1) overallStatus = 'mildly_impaired';

  if (implications.length === 0) implications.push('No significant methylation variants detected.');

  return {
    mthfrC677T: c677t?.riskLevel || null,
    mthfrA1298C: a1298c?.riskLevel || null,
    comt: comt?.riskLevel || null,
    cbs: cbs?.riskLevel || null,
    mtr: mtr?.riskLevel || null,
    mtrr: mtrr?.riskLevel || null,
    overallStatus,
    implications,
  };
}

function buildLabSuggestions(variants: GenomicVariant[]): Array<{ test: string; loinc: string; reason: string }> {
  const suggestions = new Map<string, { test: string; loinc: string; reason: string }>();
  const LOINC_NAMES: Record<string, string> = {
    '10839-9': 'Homocysteine', '2284-8': 'Folate', '2132-9': 'Vitamin B12',
    '2243-4': 'Estradiol', '2143-6': 'Cortisol (AM)', '1989-3': 'Vitamin D',
    '17861-6': 'Calcium', '2276-4': 'Ferritin', '14800-7': 'Iron Saturation',
    '2498-4': 'Iron', '2500-7': 'TIBC', '2324-2': 'GGT', '49072-2': 'Glutathione (RBC)',
    '2711-0': '8-OHdG', '1742-6': 'ALT', '3094-0': 'BUN', '5196-0': 'Secretory IgA',
    '30522-7': 'hs-CRP', '26885-4': 'TNF-alpha', '4537-7': 'ESR', '26881-3': 'IL-6',
    '13457-7': 'LDL', '2085-9': 'HDL', '2571-8': 'Triglycerides', '2089-1': 'ApoB',
    '3255-7': 'D-Dimer', '1798-8': 'Fibrinogen',
    '11580-8': 'TSH', '30152-4': 'TPO Antibodies', '5765-2': 'Thyroglobulin Ab',
    '3051-0': 'Free T3', '3016-3': 'Free T4', '33244-7': 'Reverse T3',
  };

  for (const v of variants) {
    if (v.riskLevel === 'normal') continue;
    for (const loinc of v.relatedLabMarkers) {
      if (!suggestions.has(loinc)) {
        suggestions.set(loinc, {
          test: LOINC_NAMES[loinc] || loinc,
          loinc,
          reason: `${v.gene} ${v.riskLevel} variant (${v.rsid}) — ${v.clinicalName}`,
        });
      }
    }
  }

  return [...suggestions.values()];
}

/**
 * Detect if data looks like genomic data
 */
export function isGenomicData(text: string): boolean {
  const lower = text.toLowerCase();
  return lower.includes('rsid') || lower.includes('##fileformat=vcf') ||
    lower.includes('23andme') || lower.includes('ancestrydna') ||
    (text.includes('rs') && /rs\d+\s+[ACGT]{2}/i.test(text));
}
