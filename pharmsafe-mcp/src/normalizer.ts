// Brand name → generic name mapping for top 150+ prescribed medications
// Real-world prescriptions frequently use brand names (Coumadin vs warfarin)
export const BRAND_TO_GENERIC: Record<string, string> = {
  // Anticoagulants
  'coumadin': 'warfarin',
  'jantoven': 'warfarin',
  'eliquis': 'apixaban',
  'xarelto': 'rivaroxaban',
  'pradaxa': 'dabigatran',
  'savaysa': 'edoxaban',
  'lovenox': 'enoxaparin',
  'arixtra': 'fondaparinux',
  'plavix': 'clopidogrel',
  'brilinta': 'ticagrelor',
  'effient': 'prasugrel',
  // Statins
  'lipitor': 'atorvastatin',
  'crestor': 'rosuvastatin',
  'zocor': 'simvastatin',
  'pravachol': 'pravastatin',
  'mevacor': 'lovastatin',
  'lescol': 'fluvastatin',
  'livalo': 'pitavastatin',
  // ACE inhibitors / ARBs
  'prinivil': 'lisinopril',
  'zestril': 'lisinopril',
  'vasotec': 'enalapril',
  'altace': 'ramipril',
  'lotensin': 'benazepril',
  'capoten': 'captopril',
  'cozaar': 'losartan',
  'diovan': 'valsartan',
  'avapro': 'irbesartan',
  'benicar': 'olmesartan',
  'atacand': 'candesartan',
  'micardis': 'telmisartan',
  // Beta blockers
  'lopressor': 'metoprolol',
  'toprol': 'metoprolol',
  'toprol xl': 'metoprolol',
  'tenormin': 'atenolol',
  'inderal': 'propranolol',
  'coreg': 'carvedilol',
  'zebeta': 'bisoprolol',
  'bystolic': 'nebivolol',
  // Calcium channel blockers
  'norvasc': 'amlodipine',
  'procardia': 'nifedipine',
  'adalat': 'nifedipine',
  'cardizem': 'diltiazem',
  'tiazac': 'diltiazem',
  'calan': 'verapamil',
  'verelan': 'verapamil',
  // Diuretics
  'lasix': 'furosemide',
  'bumex': 'bumetanide',
  'demadex': 'torsemide',
  'microzide': 'hydrochlorothiazide',
  'hygroton': 'chlorthalidone',
  'aldactone': 'spironolactone',
  'inspra': 'eplerenone',
  // Diabetes
  'glucophage': 'metformin',
  'glumetza': 'metformin',
  'fortamet': 'metformin',
  'lantus': 'insulin',
  'basaglar': 'insulin',
  'toujeo': 'insulin',
  'levemir': 'insulin',
  'tresiba': 'insulin',
  'humalog': 'insulin',
  'novolog': 'insulin',
  'apidra': 'insulin',
  'admelog': 'insulin',
  'humulin': 'insulin',
  'novolin': 'insulin',
  'glucotrol': 'glipizide',
  'diabeta': 'glyburide',
  'micronase': 'glyburide',
  'glynase': 'glyburide',
  'amaryl': 'glimepiride',
  'januvia': 'sitagliptin',
  'onglyza': 'saxagliptin',
  'tradjenta': 'linagliptin',
  'jardiance': 'empagliflozin',
  'invokana': 'canagliflozin',
  'farxiga': 'dapagliflozin',
  'ozempic': 'semaglutide',
  'rybelsus': 'semaglutide',
  'wegovy': 'semaglutide',
  'trulicity': 'dulaglutide',
  'victoza': 'liraglutide',
  'saxenda': 'liraglutide',
  'mounjaro': 'tirzepatide',
  // PPIs / H2 blockers
  'prilosec': 'omeprazole',
  'losec': 'omeprazole',
  'nexium': 'esomeprazole',
  'protonix': 'pantoprazole',
  'prevacid': 'lansoprazole',
  'aciphex': 'rabeprazole',
  'dexilant': 'dexlansoprazole',
  'zantac': 'ranitidine',
  'pepcid': 'famotidine',
  'tagamet': 'cimetidine',
  // Antidepressants
  'zoloft': 'sertraline',
  'prozac': 'fluoxetine',
  'sarafem': 'fluoxetine',
  'paxil': 'paroxetine',
  'pexeva': 'paroxetine',
  'celexa': 'citalopram',
  'lexapro': 'escitalopram',
  'luvox': 'fluvoxamine',
  'effexor': 'venlafaxine',
  'effexor xr': 'venlafaxine',
  'cymbalta': 'duloxetine',
  'pristiq': 'desvenlafaxine',
  'fetzima': 'levomilnacipran',
  'wellbutrin': 'bupropion',
  'wellbutrin xl': 'bupropion',
  'wellbutrin sr': 'bupropion',
  'zyban': 'bupropion',
  'remeron': 'mirtazapine',
  'trazodone': 'trazodone',
  'desyrel': 'trazodone',
  'elavil': 'amitriptyline',
  'pamelor': 'nortriptyline',
  // Benzodiazepines
  'xanax': 'alprazolam',
  'ativan': 'lorazepam',
  'valium': 'diazepam',
  'klonopin': 'clonazepam',
  'restoril': 'temazepam',
  'halcion': 'triazolam',
  'serax': 'oxazepam',
  // Sleep aids
  'ambien': 'zolpidem',
  'ambien cr': 'zolpidem',
  'sonata': 'zaleplon',
  'lunesta': 'eszopiclone',
  'belsomra': 'suvorexant',
  'dayvigo': 'lemborexant',
  // Opioids
  'oxycontin': 'oxycodone',
  'roxicodone': 'oxycodone',
  'percocet': 'oxycodone',
  'vicodin': 'hydrocodone',
  'norco': 'hydrocodone',
  'lortab': 'hydrocodone',
  'ms contin': 'morphine',
  'duramorph': 'morphine',
  'avinza': 'morphine',
  'dilaudid': 'hydromorphone',
  'exalgo': 'hydromorphone',
  'duragesic': 'fentanyl',
  'actiq': 'fentanyl',
  'fentora': 'fentanyl',
  'sublimaze': 'fentanyl',
  'methadose': 'methadone',
  'dolophine': 'methadone',
  'ultram': 'tramadol',
  'ultracet': 'tramadol',
  'nucynta': 'tapentadol',
  'suboxone': 'buprenorphine',
  'subutex': 'buprenorphine',
  'butrans': 'buprenorphine',
  // NSAIDs
  'advil': 'ibuprofen',
  'motrin': 'ibuprofen',
  'aleve': 'naproxen',
  'naprosyn': 'naproxen',
  'voltaren': 'diclofenac',
  'cataflam': 'diclofenac',
  'mobic': 'meloxicam',
  'celebrex': 'celecoxib',
  'indocin': 'indomethacin',
  'toradol': 'ketorolac',
  'feldene': 'piroxicam',
  // Antibiotics
  'zithromax': 'azithromycin',
  'z-pak': 'azithromycin',
  'biaxin': 'clarithromycin',
  'ery-tab': 'erythromycin',
  'cipro': 'ciprofloxacin',
  'levaquin': 'levofloxacin',
  'avelox': 'moxifloxacin',
  'amoxil': 'amoxicillin',
  'augmentin': 'amoxicillin-clavulanate',
  'keflex': 'cephalexin',
  'rocephin': 'ceftriaxone',
  'bactrim': 'trimethoprim-sulfamethoxazole',
  'septra': 'trimethoprim-sulfamethoxazole',
  'macrobid': 'nitrofurantoin',
  'macrodantin': 'nitrofurantoin',
  'monurol': 'fosfomycin',
  'vancocin': 'vancomycin',
  'flagyl': 'metronidazole',
  'doryx': 'doxycycline',
  'vibramycin': 'doxycycline',
  'minocin': 'minocycline',
  'zyvox': 'linezolid',
  'diflucan': 'fluconazole',
  'sporanox': 'itraconazole',
  'vfend': 'voriconazole',
  // Antiplatelets
  'bayer': 'aspirin',
  'ecotrin': 'aspirin',
  'bufferin': 'aspirin',
  // GI
  'zofran': 'ondansetron',
  'reglan': 'metoclopramide',
  'compazine': 'prochlorperazine',
  'phenergan': 'promethazine',
  'imodium': 'loperamide',
  // Respiratory
  'ventolin': 'albuterol',
  'proair': 'albuterol',
  'proventil': 'albuterol',
  'xopenex': 'levalbuterol',
  'spiriva': 'tiotropium',
  'symbicort': 'budesonide-formoterol',
  'advair': 'fluticasone-salmeterol',
  'breo': 'fluticasone-vilanterol',
  // Thyroid
  'synthroid': 'levothyroxine',
  'levoxyl': 'levothyroxine',
  'unithroid': 'levothyroxine',
  'euthyrox': 'levothyroxine',
  'cytomel': 'liothyronine',
  'armour': 'desiccated thyroid',
  // Bladder
  'ditropan': 'oxybutynin',
  'ditropan xl': 'oxybutynin',
  'oxytrol': 'oxybutynin',
  'detrol': 'tolterodine',
  'detrol la': 'tolterodine',
  'vesicare': 'solifenacin',
  'enablex': 'darifenacin',
  'toviaz': 'fesoterodine',
  'myrbetriq': 'mirabegron',
  'gemtesa': 'vibegron',
  // Anticonvulsants / Neuropathic pain
  'tegretol': 'carbamazepine',
  'equetro': 'carbamazepine',
  'depakote': 'valproate',
  'depakene': 'valproate',
  'lamictal': 'lamotrigine',
  'keppra': 'levetiracetam',
  'dilantin': 'phenytoin',
  'phenytek': 'phenytoin',
  'neurontin': 'gabapentin',
  'gralise': 'gabapentin',
  'horizant': 'gabapentin',
  'lyrica': 'pregabalin',
  'topamax': 'topiramate',
  // Allergies
  'benadryl': 'diphenhydramine',
  'claritin': 'loratadine',
  'alavert': 'loratadine',
  'zyrtec': 'cetirizine',
  'allegra': 'fexofenadine',
  'clarinex': 'desloratadine',
  'xyzal': 'levocetirizine',
  'atarax': 'hydroxyzine',
  'vistaril': 'hydroxyzine',
  // Corticosteroids
  'deltasone': 'prednisone',
  'medrol': 'methylprednisolone',
  'decadron': 'dexamethasone',
  'cortef': 'hydrocortisone',
  // Cardiac
  'lanoxin': 'digoxin',
  'cordarone': 'amiodarone',
  'pacerone': 'amiodarone',
  'nexterone': 'amiodarone',
  'multaq': 'dronedarone',
  'betapace': 'sotalol',
  'tikosyn': 'dofetilide',
  // Nitrates
  'nitrostat': 'nitroglycerin',
  'nitro-dur': 'nitroglycerin',
  'isordil': 'isosorbide dinitrate',
  'imdur': 'isosorbide mononitrate',
  // Gout
  'zyloprim': 'allopurinol',
  'uloric': 'febuxostat',
  'colcrys': 'colchicine',
  // Immunosuppressants
  'prograf': 'tacrolimus',
  'neoral': 'cyclosporine',
  'sandimmune': 'cyclosporine',
  'cellcept': 'mycophenolate',
  'myfortic': 'mycophenolate',
  'rheumatrex': 'methotrexate',
  'trexall': 'methotrexate',
  // PDE5 inhibitors
  'viagra': 'sildenafil',
  'revatio': 'sildenafil',
  'cialis': 'tadalafil',
  'adcirca': 'tadalafil',
  'levitra': 'vardenafil',
  'stendra': 'avanafil',
  // Other common
  'lithobid': 'lithium',
  'eskalith': 'lithium',
  'tylenol': 'acetaminophen',
  'paracetamol': 'acetaminophen',
  'singulair': 'montelukast',
  'aricept': 'donepezil',
  'namenda': 'memantine',
  'exelon': 'rivastigmine',
  'razadyne': 'galantamine',
  'nolvadex': 'tamoxifen',
  'soltamox': 'tamoxifen',
  'arimidex': 'anastrozole',
  'aromasin': 'exemestane',
  'femara': 'letrozole'
};

// Dose/frequency/route patterns to strip from medication strings
const DOSE_PATTERNS = [
  /\b\d+\.?\d*\s*(mg|mcg|g|mcg\/ml|mg\/ml|mg\/kg|units?|iu|meq|ml|l|%)\b/gi,
  /\b\d+\.?\d*\s*(mg\/dl|g\/dl)\b/gi,
  /\b\d+\s*(mg\/\d+\s*mg)\b/gi
];

const FREQUENCY_PATTERNS = [
  /\b(once|twice|thrice|[1-4])\s*(a\s*)?(daily|day|weekly|week|monthly|month)\b/gi,
  /\b(bid|tid|qid|qd|qod|qhs|qam|qpm|q\d+h|prn|po|iv|im|sq|sc|sl|pr|topical|inhaled)\b/gi,
  /\b(every|q)\s*\d+\s*(hours?|hrs?|h|minutes?|mins?|days?)\b/gi,
  /\bas\s+needed\b/gi,
  /\bat\s+bedtime\b/gi,
  /\b(daily|nightly|bedtime|weekly|monthly|morning|evening)\b/gi,
  /\b\d+\s*units?\b/gi
];

const ROUTE_WORDS = [
  'tablet', 'tablets', 'capsule', 'capsules', 'cap', 'tab', 'caplet',
  'oral', 'injection', 'injectable', 'solution', 'suspension', 'elixir',
  'syrup', 'patch', 'cream', 'ointment', 'gel', 'spray', 'inhaler',
  'er', 'xr', 'sr', 'ir', 'dr', 'cd', 'la', 'xl', 'extended-release',
  'controlled-release', 'sustained-release', 'immediate-release'
];

/**
 * Normalize a medication name:
 * - Convert to lowercase
 * - Strip dose, frequency, route
 * - Map brand name to generic
 * - Trim whitespace
 */
export function normalizeMedName(input: string): string {
  if (!input || typeof input !== 'string') return '';

  let name = input.toLowerCase().trim();

  // Strip parenthetical content (often has generic name in parens)
  const parenMatch = name.match(/\(([^)]+)\)/);
  if (parenMatch) {
    const paren = parenMatch[1].trim();
    // If parenthetical is a known generic, use it
    if (!BRAND_TO_GENERIC[paren] && paren.length > 3) {
      name = paren;
    } else {
      name = name.replace(/\s*\([^)]+\)\s*/, ' ');
    }
  }

  // Strip dose patterns
  for (const pattern of DOSE_PATTERNS) {
    name = name.replace(pattern, ' ');
  }

  // Strip frequency patterns
  for (const pattern of FREQUENCY_PATTERNS) {
    name = name.replace(pattern, ' ');
  }

  // Strip route/formulation words
  for (const word of ROUTE_WORDS) {
    const pattern = new RegExp(`\\b${word}\\b`, 'gi');
    name = name.replace(pattern, ' ');
  }

  // Strip dashes, extra commas
  name = name.replace(/[,;]/g, ' ');
  name = name.replace(/\s+/g, ' ').trim();

  // Take first word-group if multiple words remain
  // (handles "warfarin sodium" → keeps "warfarin")
  // But preserve known multi-word names
  const knownMultiWord = ['calcium carbonate', 'calcium citrate', 'magnesium oxide',
    'ferrous sulfate', 'ferrous gluconate', 'potassium chloride', 'sodium chloride',
    'vitamin d', 'vitamin b12', 'folic acid', 'iodinated contrast',
    'amoxicillin-clavulanate', 'trimethoprim-sulfamethoxazole',
    'fluticasone-salmeterol', 'fluticasone-vilanterol', 'budesonide-formoterol',
    'isosorbide mononitrate', 'isosorbide dinitrate', 'desiccated thyroid'];

  for (const known of knownMultiWord) {
    if (name.includes(known)) return known;
  }

  // Map brand to generic
  if (BRAND_TO_GENERIC[name]) {
    return BRAND_TO_GENERIC[name];
  }

  // Try partial matches for brand names with suffixes like "XL", "SR"
  for (const [brand, generic] of Object.entries(BRAND_TO_GENERIC)) {
    if (name.startsWith(brand + ' ') || name === brand) {
      return generic;
    }
  }

  return name;
}

/**
 * Normalize a list of medication names.
 * Filters out empty strings.
 */
export function normalizeMedList(meds: string[]): string[] {
  return meds
    .map(m => normalizeMedName(m))
    .filter(m => m.length > 0);
}

/**
 * Check if two medication strings refer to the same drug.
 * Uses word-boundary matching to avoid false positives
 * (e.g., "lisin" matching "lisinopril" is OK, "asp" matching "aspirin" is OK,
 *  but "ace" should not match "acetaminophen").
 */
export function medMatches(query: string, target: string): boolean {
  const q = normalizeMedName(query);
  const t = normalizeMedName(target);

  if (!q || !t) return false;
  if (q === t) return true;

  // Word boundary match: query must be a complete word or prefix-of-word in target
  // This prevents "lisin" from matching "acetylsalicylic" etc.
  // But allows "warfarin" to match "warfarin sodium"
  if (q.length >= 5 && t.includes(q)) return true;
  if (t.length >= 5 && q.includes(t)) return true;

  return false;
}

/**
 * Find a drug in a normalized medication list.
 */
export function findMedInList(targetDrug: string, medList: string[]): string | null {
  const normalizedTarget = normalizeMedName(targetDrug);
  for (const med of medList) {
    if (medMatches(med, normalizedTarget)) return med;
  }
  return null;
}
