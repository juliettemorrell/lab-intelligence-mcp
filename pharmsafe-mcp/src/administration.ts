export interface TimingConflict {
  drug1: string;
  drug2: string;
  conflict: string;
  recommendation: string;
  separationRequired: string;
}

export interface FoodInteraction {
  drug: string;
  food: string;
  effect: string;
  recommendation: string;
  severity: 'major' | 'moderate' | 'minor';
}

export interface AdministrationGuidance {
  drug: string;
  timing: string;
  withFood: 'with-food' | 'empty-stomach' | 'either' | 'avoid-specific';
  specialInstructions: string[];
}

const ADMINISTRATION_GUIDANCE: AdministrationGuidance[] = [
  { drug: 'levothyroxine', timing: 'morning, 30-60 min before breakfast', withFood: 'empty-stomach', specialInstructions: ['Take on completely empty stomach', 'Wait 4h before calcium, iron, or antacids', 'Consistent timing important for stable levels'] },
  { drug: 'omeprazole', timing: 'morning, 30 min before first meal', withFood: 'empty-stomach', specialInstructions: ['Take 30 min before eating for maximum acid suppression', 'Swallow whole — do not crush or chew'] },
  { drug: 'pantoprazole', timing: 'morning, 30 min before first meal', withFood: 'empty-stomach', specialInstructions: ['Best acid suppression when taken before meal', 'Swallow whole'] },
  { drug: 'alendronate', timing: 'morning, 30 min before food/drink/other meds', withFood: 'empty-stomach', specialInstructions: ['Take with 8oz plain water only', 'Stay upright (sitting/standing) for 30 min', 'Do NOT lie down after taking', 'No food/drink/other meds for 30 min'] },
  { drug: 'metformin', timing: 'with meals', withFood: 'with-food', specialInstructions: ['Take with food to reduce GI side effects', 'Extended-release: take with evening meal'] },
  { drug: 'iron', timing: 'empty stomach or with vitamin C', withFood: 'empty-stomach', specialInstructions: ['Best absorbed on empty stomach', 'Vitamin C enhances absorption', 'Separate from calcium, antacids, PPIs by 2h', 'Separate from levothyroxine by 4h', 'May take with food if GI upset (reduces absorption 40%)'] },
  { drug: 'warfarin', timing: 'same time daily (usually evening)', withFood: 'either', specialInstructions: ['Consistent timing is critical', 'Consistent vitamin K intake — do not suddenly change diet', 'Avoid large changes in green leafy vegetable consumption'] },
  { drug: 'digoxin', timing: 'same time daily', withFood: 'either', specialInstructions: ['Consistent timing important', 'High-fiber meals may reduce absorption — take 2h before high-fiber food'] },
  { drug: 'ciprofloxacin', timing: '2h before or 6h after divalent cations', withFood: 'either', specialInstructions: ['Avoid dairy, calcium, iron, antacids within 2h before or 6h after', 'May take with food (not dairy-based)'] },
  { drug: 'doxycycline', timing: 'with food and water', withFood: 'with-food', specialInstructions: ['Take with full glass of water', 'Sit upright for 30 min after (esophageal irritation risk)', 'Avoid dairy, antacids, iron within 2h', 'Avoid sun exposure'] },
  { drug: 'lisinopril', timing: 'same time daily', withFood: 'either', specialInstructions: ['Can take with or without food', 'Consistent timing preferred'] },
  { drug: 'atorvastatin', timing: 'any time daily', withFood: 'either', specialInstructions: ['Can be taken any time (long half-life)', 'Avoid grapefruit juice in large quantities'] },
  { drug: 'simvastatin', timing: 'evening/bedtime', withFood: 'either', specialInstructions: ['Take in evening — cholesterol synthesis peaks at night', 'Avoid grapefruit (CYP3A4 inhibition → toxicity)', 'Short half-life requires evening dosing'] },
  { drug: 'prednisone', timing: 'morning with food', withFood: 'with-food', specialInstructions: ['Take with food to reduce GI irritation', 'Morning dosing mimics natural cortisol rhythm', 'Do not stop abruptly if taken >2 weeks'] },
  { drug: 'methotrexate', timing: 'WEEKLY — same day each week', withFood: 'either', specialInstructions: ['WEEKLY dosing for RA/psoriasis — NEVER daily', 'Take folic acid 1mg daily (not on MTX day)', 'Avoid alcohol', 'Avoid NSAIDs around dosing day if possible'] },
  { drug: 'spironolactone', timing: 'with food', withFood: 'with-food', specialInstructions: ['Food increases absorption by 100%', 'Take with meal for best efficacy'] }
];

const TIMING_CONFLICTS: TimingConflict[] = [
  { drug1: 'levothyroxine', drug2: 'calcium carbonate', conflict: 'Calcium chelates levothyroxine in GI tract', recommendation: 'Take levothyroxine in morning, calcium at lunch or evening', separationRequired: '≥4 hours' },
  { drug1: 'levothyroxine', drug2: 'iron', conflict: 'Iron chelates levothyroxine', recommendation: 'Take levothyroxine in morning, iron at lunch/evening', separationRequired: '≥4 hours' },
  { drug1: 'levothyroxine', drug2: 'omeprazole', conflict: 'PPI reduces levothyroxine absorption by altering gastric pH', recommendation: 'Take levothyroxine first, PPI 30-60 min later', separationRequired: '≥30 minutes' },
  { drug1: 'ciprofloxacin', drug2: 'calcium carbonate', conflict: 'Divalent cations chelate fluoroquinolones', recommendation: 'Take ciprofloxacin 2h before or 6h after calcium', separationRequired: '2h before or 6h after' },
  { drug1: 'ciprofloxacin', drug2: 'iron', conflict: 'Iron chelates fluoroquinolones, reducing absorption 50-90%', recommendation: 'Separate by at least 2 hours (ciprofloxacin first)', separationRequired: '≥2 hours' },
  { drug1: 'alendronate', drug2: 'calcium carbonate', conflict: 'Calcium reduces bisphosphonate absorption', recommendation: 'Take alendronate on waking with plain water, calcium later in day', separationRequired: '≥30 minutes (ideally 2h)' },
  { drug1: 'tetracycline', drug2: 'calcium carbonate', conflict: 'Calcium chelates tetracyclines', recommendation: 'Separate by 2-3 hours', separationRequired: '2-3 hours' },
  { drug1: 'digoxin', drug2: 'metoclopramide', conflict: 'Metoclopramide increases GI motility, reducing digoxin absorption', recommendation: 'Monitor digoxin levels when starting/stopping metoclopramide', separationRequired: 'Monitor levels' }
];

const FOOD_INTERACTIONS: FoodInteraction[] = [
  { drug: 'warfarin', food: 'vitamin K-rich foods (spinach, kale, broccoli)', effect: 'Vitamin K antagonizes warfarin effect. Sudden increase in intake drops INR.', recommendation: 'Maintain CONSISTENT intake — do not suddenly increase or decrease green vegetables. Small daily amounts are fine.', severity: 'major' },
  { drug: 'simvastatin', food: 'grapefruit/grapefruit juice', effect: 'Grapefruit inhibits intestinal CYP3A4, increasing simvastatin levels 7-16x. Rhabdomyolysis risk.', recommendation: 'AVOID grapefruit entirely with simvastatin. Limit to <1 grapefruit or 200mL juice with atorvastatin.', severity: 'major' },
  { drug: 'atorvastatin', food: 'grapefruit/grapefruit juice', effect: 'Grapefruit increases atorvastatin AUC ~2.5x (less than simvastatin but still significant)', recommendation: 'Limit grapefruit to small amounts. Avoid large quantities (>1 quart juice/day).', severity: 'moderate' },
  { drug: 'felodipine', food: 'grapefruit juice', effect: 'CYP3A4 inhibition doubles felodipine levels. Severe hypotension possible.', recommendation: 'Avoid grapefruit with felodipine.', severity: 'major' },
  { drug: 'carbamazepine', food: 'grapefruit juice', effect: 'CYP3A4 inhibition increases carbamazepine levels. Toxicity risk.', recommendation: 'Avoid grapefruit juice with carbamazepine.', severity: 'major' },
  { drug: 'linezolid', food: 'tyramine-rich foods (aged cheese, cured meats, tap beer, sauerkraut)', effect: 'Linezolid is a weak MAO inhibitor. Tyramine + MAOI → hypertensive crisis.', recommendation: 'Avoid high-tyramine foods during linezolid treatment. Educate patient on tyramine sources.', severity: 'major' },
  { drug: 'methotrexate', food: 'alcohol', effect: 'Alcohol + methotrexate: additive hepatotoxicity. Increased liver fibrosis risk.', recommendation: 'AVOID alcohol completely during methotrexate therapy. Even occasional use increases liver damage risk.', severity: 'major' },
  { drug: 'tetracycline', food: 'dairy products', effect: 'Calcium in dairy chelates tetracycline, reducing absorption 50-65%', recommendation: 'Take 1h before or 2h after dairy products.', severity: 'moderate' },
  { drug: 'metformin', food: 'alcohol (acute binge)', effect: 'Acute alcohol binge impairs hepatic gluconeogenesis and lactate clearance. Lactic acidosis and hypoglycemia risk.', recommendation: 'Avoid binge drinking. Moderate alcohol (1 drink/day) generally acceptable with metformin.', severity: 'moderate' },
  { drug: 'spironolactone', food: 'potassium-rich foods (bananas, oranges, salt substitutes)', effect: 'Spironolactone retains potassium. Combined with high-K diet → hyperkalemia.', recommendation: 'Avoid salt substitutes (KCl). Moderate intake of high-potassium foods. Monitor serum K.', severity: 'moderate' },
  { drug: 'lisinopril', food: 'potassium-rich foods / salt substitutes', effect: 'ACE inhibitors reduce aldosterone → potassium retention. High-K diet may cause hyperkalemia.', recommendation: 'Avoid salt substitutes. No need to restrict all high-K foods, but monitor if symptoms arise.', severity: 'moderate' },
  { drug: 'theophylline', food: 'caffeine', effect: 'Both methylxanthines — additive CNS and cardiac stimulation. Caffeine competes for CYP1A2 metabolism.', recommendation: 'Limit caffeine intake. Switch to decaf if experiencing palpitations, insomnia, or tremor.', severity: 'moderate' },
  { drug: 'ciprofloxacin', food: 'dairy/calcium-fortified foods', effect: 'Calcium chelates fluoroquinolones, reducing absorption', recommendation: 'Do not take with milk, yogurt, or calcium-fortified juice. Separate by 2 hours.', severity: 'moderate' }
];

export function getAdministrationGuidance(medications: string[]): AdministrationGuidance[] {
  const normalizedMeds = medications.map(m => m.toLowerCase().trim());
  const results: AdministrationGuidance[] = [];

  for (const med of normalizedMeds) {
    for (const entry of ADMINISTRATION_GUIDANCE) {
      if (med.includes(entry.drug) || entry.drug.includes(med)) {
        results.push(entry);
      }
    }
  }

  return results;
}

export function checkTimingConflicts(medications: string[]): TimingConflict[] {
  const normalizedMeds = medications.map(m => m.toLowerCase().trim());
  const results: TimingConflict[] = [];

  for (let i = 0; i < normalizedMeds.length; i++) {
    for (let j = i + 1; j < normalizedMeds.length; j++) {
      for (const conflict of TIMING_CONFLICTS) {
        const d1 = conflict.drug1.toLowerCase();
        const d2 = conflict.drug2.toLowerCase();
        const med1 = normalizedMeds[i];
        const med2 = normalizedMeds[j];

        if ((med1.includes(d1) || d1.includes(med1)) && (med2.includes(d2) || d2.includes(med2)) ||
            (med1.includes(d2) || d2.includes(med1)) && (med2.includes(d1) || d1.includes(med2))) {
          results.push(conflict);
        }
      }
    }
  }

  return results;
}

export function checkFoodInteractions(medications: string[]): FoodInteraction[] {
  const normalizedMeds = medications.map(m => m.toLowerCase().trim());
  const results: FoodInteraction[] = [];

  for (const med of normalizedMeds) {
    for (const entry of FOOD_INTERACTIONS) {
      if (med.includes(entry.drug.toLowerCase()) || entry.drug.toLowerCase().includes(med)) {
        results.push(entry);
      }
    }
  }

  return results;
}

export function generateTimingSchedule(medications: string[]): {
  morning_empty: string[];
  morning_with_food: string[];
  with_meals: string[];
  evening: string[];
  bedtime: string[];
  anytime: string[];
  separationNotes: string[];
} {
  const guidance = getAdministrationGuidance(medications);
  const conflicts = checkTimingConflicts(medications);

  const schedule = {
    morning_empty: [] as string[],
    morning_with_food: [] as string[],
    with_meals: [] as string[],
    evening: [] as string[],
    bedtime: [] as string[],
    anytime: [] as string[],
    separationNotes: [] as string[]
  };

  for (const g of guidance) {
    if (g.withFood === 'empty-stomach') {
      schedule.morning_empty.push(g.drug);
    } else if (g.timing.includes('evening') || g.timing.includes('bedtime')) {
      schedule.evening.push(g.drug);
    } else if (g.withFood === 'with-food') {
      schedule.with_meals.push(g.drug);
    } else {
      schedule.anytime.push(g.drug);
    }
  }

  for (const c of conflicts) {
    schedule.separationNotes.push(`${c.drug1} ↔ ${c.drug2}: separate by ${c.separationRequired} (${c.conflict})`);
  }

  return schedule;
}
