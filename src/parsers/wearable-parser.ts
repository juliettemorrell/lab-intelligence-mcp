/**
 * Wearable Data Parser
 *
 * Normalizes wearable device data from multiple sources into a standard
 * format that can be correlated with lab results. Maps wearable metrics
 * to LOINC codes where applicable (e.g., heart rate, SpO2, blood glucose).
 *
 * Supported formats:
 *   - Apple Health XML export (export.xml from Health app)
 *   - Oura Ring JSON (API response or data export)
 *   - Withings JSON (API response)
 *   - Garmin JSON (Connect API or FIT file export)
 *   - Fitbit JSON (API response or data export)
 *   - WHOOP JSON (API response)
 *   - Dexcom JSON (Clarity export or API)
 *   - Generic CSV (any wearable CSV export)
 */

export interface WearableDataPoint {
  metricName: string;
  standardName: string;
  loincCode: string | null;
  value: number;
  unit: string;
  timestamp: string;
  source: string;
  deviceType: string;
  category: WearableCategory;
}

export type WearableCategory =
  | 'heart_rate' | 'hrv' | 'blood_pressure' | 'spo2' | 'temperature'
  | 'sleep' | 'activity' | 'body_composition' | 'glucose' | 'respiratory'
  | 'stress' | 'readiness' | 'recovery';

export interface WearableParsedResult {
  source: string;
  deviceType: string;
  dateRange: { start: string; end: string } | null;
  totalDataPoints: number;
  metrics: Map<string, WearableDataPoint[]>;
  dailySummaries: DailySummary[];
}

export interface DailySummary {
  date: string;
  avgHeartRate?: number;
  restingHeartRate?: number;
  avgHrv?: number;
  steps?: number;
  sleepMinutes?: number;
  sleepEfficiency?: number;
  deepSleepMinutes?: number;
  remSleepMinutes?: number;
  spo2Avg?: number;
  bodyTemp?: number;
  bodyTempDeviation?: number;
  readinessScore?: number;
  stressScore?: number;
  activeCalories?: number;
  avgGlucose?: number;
  glucoseMin?: number;
  glucoseMax?: number;
  weight?: number;
  bodyFatPct?: number;
  systolic?: number;
  diastolic?: number;
}

// Wearable metrics that map to LOINC codes
const WEARABLE_LOINC_MAP: Record<string, { loinc: string; standardName: string; unit: string; category: WearableCategory }> = {
  'heart_rate': { loinc: '8867-4', standardName: 'Heart Rate', unit: 'bpm', category: 'heart_rate' },
  'resting_heart_rate': { loinc: '40443-4', standardName: 'Resting Heart Rate', unit: 'bpm', category: 'heart_rate' },
  'hrv': { loinc: '80404-7', standardName: 'Heart Rate Variability (RMSSD)', unit: 'ms', category: 'hrv' },
  'spo2': { loinc: '59408-5', standardName: 'Oxygen Saturation (SpO2)', unit: '%', category: 'spo2' },
  'body_temperature': { loinc: '8310-5', standardName: 'Body Temperature', unit: '°C', category: 'temperature' },
  'systolic_bp': { loinc: '8480-6', standardName: 'Systolic Blood Pressure', unit: 'mmHg', category: 'blood_pressure' },
  'diastolic_bp': { loinc: '8462-4', standardName: 'Diastolic Blood Pressure', unit: 'mmHg', category: 'blood_pressure' },
  'respiratory_rate': { loinc: '9279-1', standardName: 'Respiratory Rate', unit: 'breaths/min', category: 'respiratory' },
  'body_weight': { loinc: '29463-7', standardName: 'Body Weight', unit: 'kg', category: 'body_composition' },
  'body_fat_pct': { loinc: '41982-0', standardName: 'Body Fat Percentage', unit: '%', category: 'body_composition' },
  'bmi': { loinc: '39156-5', standardName: 'BMI', unit: 'kg/m2', category: 'body_composition' },
  'blood_glucose': { loinc: '2339-0', standardName: 'Blood Glucose', unit: 'mg/dL', category: 'glucose' },
  'steps': { loinc: '55423-8', standardName: 'Steps', unit: 'steps', category: 'activity' },
};

/**
 * Auto-detect the source format and parse accordingly.
 */
export function parseWearableData(data: string, sourceHint?: string): WearableParsedResult {
  // Try to detect format
  if (data.trim().startsWith('<?xml') || data.includes('<HealthData')) {
    return parseAppleHealthXML(data);
  }

  let parsed: any;
  try {
    parsed = JSON.parse(data);
  } catch {
    // If not JSON, try CSV
    return parseWearableCSV(data, sourceHint || 'unknown');
  }

  // Detect JSON source
  if (sourceHint) {
    const hint = sourceHint.toLowerCase();
    if (hint.includes('oura')) return parseOuraJSON(parsed);
    if (hint.includes('withings')) return parseWithingsJSON(parsed);
    if (hint.includes('garmin')) return parseGarminJSON(parsed);
    if (hint.includes('fitbit')) return parseFitbitJSON(parsed);
    if (hint.includes('whoop')) return parseWhoopJSON(parsed);
    if (hint.includes('dexcom')) return parseDexcomJSON(parsed);
  }

  // Auto-detect from JSON structure
  if (parsed.data && Array.isArray(parsed.data) && parsed.data[0]?.day) return parseOuraJSON(parsed);
  if (parsed.body?.measuregrps) return parseWithingsJSON(parsed);
  if (parsed.activities || parsed.dailies) return parseGarminJSON(parsed);
  if (parsed.egvs || parsed.records) return parseDexcomJSON(parsed);

  return { source: 'unknown_json', deviceType: 'unknown', dateRange: null, totalDataPoints: 0, metrics: new Map(), dailySummaries: [] };
}

// ---------------------------------------------------------------------------
// Apple Health XML
// ---------------------------------------------------------------------------
function parseAppleHealthXML(xml: string): WearableParsedResult {
  const dataPoints: WearableDataPoint[] = [];
  const dailyMap = new Map<string, DailySummary>();

  // Parse Record elements: <Record type="HKQuantityTypeIdentifierHeartRate" value="72" unit="count/min" startDate="2024-01-15 08:30:00" .../>
  const recordRegex = /<Record\s+([^>]+)\/>/g;
  let match;

  while ((match = recordRegex.exec(xml)) !== null) {
    const attrs = parseXMLAttributes(match[1]);
    const type = attrs.type || '';
    const value = parseFloat(attrs.value || '');
    const unit = attrs.unit || '';
    const date = attrs.startDate || attrs.creationDate || '';
    const dateKey = date.substring(0, 10); // YYYY-MM-DD

    if (isNaN(value)) continue;

    const mapping = APPLE_HEALTH_TYPE_MAP[type];
    if (mapping) {
      const loincInfo = WEARABLE_LOINC_MAP[mapping.metricKey];
      dataPoints.push({
        metricName: type,
        standardName: loincInfo?.standardName || mapping.displayName,
        loincCode: loincInfo?.loinc || null,
        value,
        unit: loincInfo?.unit || unit,
        timestamp: date,
        source: 'apple_health',
        deviceType: attrs.sourceName || 'Apple Watch',
        category: loincInfo?.category || mapping.category,
      });

      // Aggregate to daily summary
      if (!dailyMap.has(dateKey)) dailyMap.set(dateKey, { date: dateKey });
      const daily = dailyMap.get(dateKey)!;
      updateDailySummary(daily, mapping.metricKey, value);
    }
  }

  const summaries = [...dailyMap.values()].sort((a, b) => a.date.localeCompare(b.date));
  return {
    source: 'apple_health',
    deviceType: 'Apple Watch / iPhone',
    dateRange: summaries.length ? { start: summaries[0].date, end: summaries[summaries.length - 1].date } : null,
    totalDataPoints: dataPoints.length,
    metrics: groupByMetric(dataPoints),
    dailySummaries: summaries,
  };
}

const APPLE_HEALTH_TYPE_MAP: Record<string, { metricKey: string; displayName: string; category: WearableCategory }> = {
  'HKQuantityTypeIdentifierHeartRate': { metricKey: 'heart_rate', displayName: 'Heart Rate', category: 'heart_rate' },
  'HKQuantityTypeIdentifierRestingHeartRate': { metricKey: 'resting_heart_rate', displayName: 'Resting Heart Rate', category: 'heart_rate' },
  'HKQuantityTypeIdentifierHeartRateVariabilitySDNN': { metricKey: 'hrv', displayName: 'HRV (SDNN)', category: 'hrv' },
  'HKQuantityTypeIdentifierOxygenSaturation': { metricKey: 'spo2', displayName: 'SpO2', category: 'spo2' },
  'HKQuantityTypeIdentifierBodyTemperature': { metricKey: 'body_temperature', displayName: 'Body Temperature', category: 'temperature' },
  'HKQuantityTypeIdentifierBloodPressureSystolic': { metricKey: 'systolic_bp', displayName: 'Systolic BP', category: 'blood_pressure' },
  'HKQuantityTypeIdentifierBloodPressureDiastolic': { metricKey: 'diastolic_bp', displayName: 'Diastolic BP', category: 'blood_pressure' },
  'HKQuantityTypeIdentifierRespiratoryRate': { metricKey: 'respiratory_rate', displayName: 'Respiratory Rate', category: 'respiratory' },
  'HKQuantityTypeIdentifierBodyMass': { metricKey: 'body_weight', displayName: 'Body Weight', category: 'body_composition' },
  'HKQuantityTypeIdentifierBodyFatPercentage': { metricKey: 'body_fat_pct', displayName: 'Body Fat %', category: 'body_composition' },
  'HKQuantityTypeIdentifierBodyMassIndex': { metricKey: 'bmi', displayName: 'BMI', category: 'body_composition' },
  'HKQuantityTypeIdentifierBloodGlucose': { metricKey: 'blood_glucose', displayName: 'Blood Glucose', category: 'glucose' },
  'HKQuantityTypeIdentifierStepCount': { metricKey: 'steps', displayName: 'Steps', category: 'activity' },
};

// ---------------------------------------------------------------------------
// Oura JSON
// ---------------------------------------------------------------------------
function parseOuraJSON(data: any): WearableParsedResult {
  const dataPoints: WearableDataPoint[] = [];
  const summaries: DailySummary[] = [];
  const items = data.data || (Array.isArray(data) ? data : []);

  for (const item of items) {
    const date = item.day || item.summary_date;
    if (!date) continue;

    const summary: DailySummary = { date };

    if (item.average_hrv !== undefined) {
      summary.avgHrv = item.average_hrv;
      addPoint(dataPoints, 'hrv', item.average_hrv, date, 'oura');
    }
    if (item.lowest_heart_rate !== undefined) {
      summary.restingHeartRate = item.lowest_heart_rate;
      addPoint(dataPoints, 'resting_heart_rate', item.lowest_heart_rate, date, 'oura');
    }
    if (item.efficiency !== undefined) summary.sleepEfficiency = item.efficiency;
    if (item.total_sleep_duration !== undefined) summary.sleepMinutes = Math.round(item.total_sleep_duration / 60);
    if (item.deep_sleep_duration !== undefined) summary.deepSleepMinutes = Math.round(item.deep_sleep_duration / 60);
    if (item.rem_sleep_duration !== undefined) summary.remSleepMinutes = Math.round(item.rem_sleep_duration / 60);
    if (item.score !== undefined && item.contributors) summary.readinessScore = item.score;
    if (item.steps !== undefined) {
      summary.steps = item.steps;
      addPoint(dataPoints, 'steps', item.steps, date, 'oura');
    }
    if (item.active_calories !== undefined) summary.activeCalories = item.active_calories;
    if (item.temperature_deviation !== undefined) summary.bodyTempDeviation = item.temperature_deviation;

    summaries.push(summary);
  }

  return buildResult('oura', 'Oura Ring', dataPoints, summaries);
}

// ---------------------------------------------------------------------------
// Withings JSON
// ---------------------------------------------------------------------------
function parseWithingsJSON(data: any): WearableParsedResult {
  const dataPoints: WearableDataPoint[] = [];
  const dailyMap = new Map<string, DailySummary>();
  const groups = data.body?.measuregrps || [];

  const WITHINGS_TYPES: Record<number, string> = {
    1: 'body_weight', 4: 'height', 5: 'fat_free_mass', 6: 'body_fat_pct',
    8: 'fat_mass', 9: 'diastolic_bp', 10: 'systolic_bp', 11: 'heart_rate',
    76: 'muscle_mass', 77: 'water_mass', 88: 'bone_mass',
  };

  for (const group of groups) {
    const date = new Date(group.date * 1000).toISOString().split('T')[0];
    if (!dailyMap.has(date)) dailyMap.set(date, { date });
    const daily = dailyMap.get(date)!;

    for (const m of group.measures || []) {
      const metricKey = WITHINGS_TYPES[m.type];
      if (!metricKey) continue;
      const value = m.value * Math.pow(10, m.unit);
      const loincInfo = WEARABLE_LOINC_MAP[metricKey];
      if (loincInfo) addPoint(dataPoints, metricKey, value, date, 'withings');
      updateDailySummary(daily, metricKey, value);
    }
  }

  return buildResult('withings', 'Withings', dataPoints, [...dailyMap.values()]);
}

// ---------------------------------------------------------------------------
// Garmin JSON
// ---------------------------------------------------------------------------
function parseGarminJSON(data: any): WearableParsedResult {
  const dataPoints: WearableDataPoint[] = [];
  const summaries: DailySummary[] = [];

  const dailies = data.dailies || data.activities || (Array.isArray(data) ? data : []);
  for (const d of dailies) {
    const date = d.calendarDate || d.startTimeLocal?.substring(0, 10);
    if (!date) continue;

    const summary: DailySummary = { date };
    if (d.restingHeartRate) { summary.restingHeartRate = d.restingHeartRate; addPoint(dataPoints, 'resting_heart_rate', d.restingHeartRate, date, 'garmin'); }
    if (d.averageHeartRate) { summary.avgHeartRate = d.averageHeartRate; addPoint(dataPoints, 'heart_rate', d.averageHeartRate, date, 'garmin'); }
    if (d.totalSteps) { summary.steps = d.totalSteps; addPoint(dataPoints, 'steps', d.totalSteps, date, 'garmin'); }
    if (d.averageStressLevel) summary.stressScore = d.averageStressLevel;
    if (d.bodyBatteryChargedValue) summary.readinessScore = d.bodyBatteryChargedValue;
    if (d.activeCalories) summary.activeCalories = d.activeCalories;
    if (d.sleepTimeSeconds) summary.sleepMinutes = Math.round(d.sleepTimeSeconds / 60);
    if (d.deepSleepSeconds) summary.deepSleepMinutes = Math.round(d.deepSleepSeconds / 60);
    if (d.remSleepSeconds) summary.remSleepMinutes = Math.round(d.remSleepSeconds / 60);
    if (d.averageSPO2) { summary.spo2Avg = d.averageSPO2; addPoint(dataPoints, 'spo2', d.averageSPO2, date, 'garmin'); }

    summaries.push(summary);
  }

  return buildResult('garmin', 'Garmin', dataPoints, summaries);
}

// ---------------------------------------------------------------------------
// Fitbit JSON
// ---------------------------------------------------------------------------
function parseFitbitJSON(data: any): WearableParsedResult {
  const dataPoints: WearableDataPoint[] = [];
  const summaries: DailySummary[] = [];

  // Fitbit sleep data
  const sleepData = data.sleep || [];
  for (const s of sleepData) {
    const date = s.dateOfSleep;
    if (!date) continue;
    const summary: DailySummary = { date };
    summary.sleepMinutes = s.minutesAsleep;
    if (s.levels?.summary) {
      summary.deepSleepMinutes = s.levels.summary.deep?.minutes;
      summary.remSleepMinutes = s.levels.summary.rem?.minutes;
    }
    summary.sleepEfficiency = s.efficiency;
    summaries.push(summary);
  }

  // Fitbit activity data
  const activities = data.activities || data['activities-steps'] || [];
  for (const a of activities) {
    const date = a.dateTime || a.startDate;
    const value = parseInt(a.value || a.steps || '0');
    if (date && value) {
      addPoint(dataPoints, 'steps', value, date, 'fitbit');
    }
  }

  // Fitbit heart rate
  const hrData = data['activities-heart'] || [];
  for (const hr of hrData) {
    if (hr.value?.restingHeartRate) {
      addPoint(dataPoints, 'resting_heart_rate', hr.value.restingHeartRate, hr.dateTime, 'fitbit');
    }
  }

  return buildResult('fitbit', 'Fitbit', dataPoints, summaries);
}

// ---------------------------------------------------------------------------
// WHOOP JSON
// ---------------------------------------------------------------------------
function parseWhoopJSON(data: any): WearableParsedResult {
  const dataPoints: WearableDataPoint[] = [];
  const summaries: DailySummary[] = [];

  const records = data.records || (Array.isArray(data) ? data : []);
  for (const r of records) {
    const date = r.created_at?.substring(0, 10) || r.date;
    if (!date) continue;

    const summary: DailySummary = { date };
    if (r.recovery?.resting_heart_rate) { summary.restingHeartRate = r.recovery.resting_heart_rate; addPoint(dataPoints, 'resting_heart_rate', r.recovery.resting_heart_rate, date, 'whoop'); }
    if (r.recovery?.hrv_rmssd_milli) { summary.avgHrv = r.recovery.hrv_rmssd_milli; addPoint(dataPoints, 'hrv', r.recovery.hrv_rmssd_milli, date, 'whoop'); }
    if (r.recovery?.score) summary.readinessScore = Math.round(r.recovery.score * 100);
    if (r.recovery?.spo2_percentage) { summary.spo2Avg = r.recovery.spo2_percentage; addPoint(dataPoints, 'spo2', r.recovery.spo2_percentage, date, 'whoop'); }
    if (r.sleep?.quality_duration_milli) summary.sleepMinutes = Math.round(r.sleep.quality_duration_milli / 60000);
    if (r.strain?.score) summary.stressScore = Math.round(r.strain.score * 10);

    summaries.push(summary);
  }

  return buildResult('whoop', 'WHOOP', dataPoints, summaries);
}

// ---------------------------------------------------------------------------
// Dexcom CGM JSON
// ---------------------------------------------------------------------------
function parseDexcomJSON(data: any): WearableParsedResult {
  const dataPoints: WearableDataPoint[] = [];
  const dailyMap = new Map<string, { sum: number; count: number; min: number; max: number; date: string }>();

  const readings = data.egvs || data.records || data.glucoseValues || (Array.isArray(data) ? data : []);

  for (const r of readings) {
    const value = r.value || r.glucoseValue || r.mg_dl;
    const timestamp = r.systemTime || r.displayTime || r.timestamp || r.recordedAt;
    if (!value || !timestamp) continue;

    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(numValue)) continue;

    const date = timestamp.substring(0, 10);
    addPoint(dataPoints, 'blood_glucose', numValue, timestamp, 'dexcom');

    if (!dailyMap.has(date)) dailyMap.set(date, { sum: 0, count: 0, min: Infinity, max: -Infinity, date });
    const day = dailyMap.get(date)!;
    day.sum += numValue;
    day.count++;
    day.min = Math.min(day.min, numValue);
    day.max = Math.max(day.max, numValue);
  }

  const summaries: DailySummary[] = [...dailyMap.values()].map(d => ({
    date: d.date,
    avgGlucose: Math.round(d.sum / d.count),
    glucoseMin: d.min,
    glucoseMax: d.max,
  }));

  return buildResult('dexcom', 'Dexcom CGM', dataPoints, summaries);
}

// ---------------------------------------------------------------------------
// Generic CSV
// ---------------------------------------------------------------------------
function parseWearableCSV(csv: string, source: string): WearableParsedResult {
  const dataPoints: WearableDataPoint[] = [];
  const lines = csv.split('\n').filter(l => l.trim());
  if (lines.length < 2) return buildResult(source, source, [], []);

  const headers = lines[0].split(',').map(h => h.trim().toLowerCase());

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',').map(c => c.trim());
    const date = findColumnValue(headers, cols, ['date', 'time', 'timestamp', 'datetime', 'recorded']);

    for (const [metricKey, loincInfo] of Object.entries(WEARABLE_LOINC_MAP)) {
      const colNames = [metricKey, loincInfo.standardName.toLowerCase(), ...getMetricAliases(metricKey)];
      const value = findColumnValue(headers, cols, colNames);
      if (value && date) {
        const numValue = parseFloat(value);
        if (!isNaN(numValue)) addPoint(dataPoints, metricKey, numValue, date, source);
      }
    }
  }

  return buildResult(source, source, dataPoints, []);
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function addPoint(points: WearableDataPoint[], metricKey: string, value: number, timestamp: string, source: string) {
  const loincInfo = WEARABLE_LOINC_MAP[metricKey];
  points.push({
    metricName: metricKey,
    standardName: loincInfo?.standardName || metricKey,
    loincCode: loincInfo?.loinc || null,
    value,
    unit: loincInfo?.unit || '',
    timestamp,
    source,
    deviceType: source,
    category: loincInfo?.category || 'activity',
  });
}

function updateDailySummary(daily: DailySummary, metricKey: string, value: number) {
  switch (metricKey) {
    case 'heart_rate': daily.avgHeartRate = value; break;
    case 'resting_heart_rate': daily.restingHeartRate = value; break;
    case 'hrv': daily.avgHrv = value; break;
    case 'steps': daily.steps = (daily.steps || 0) + value; break;
    case 'spo2': daily.spo2Avg = value; break;
    case 'body_temperature': daily.bodyTemp = value; break;
    case 'body_weight': daily.weight = value; break;
    case 'body_fat_pct': daily.bodyFatPct = value; break;
    case 'systolic_bp': daily.systolic = value; break;
    case 'diastolic_bp': daily.diastolic = value; break;
    case 'blood_glucose': daily.avgGlucose = value; break;
  }
}

function buildResult(source: string, deviceType: string, dataPoints: WearableDataPoint[], summaries: DailySummary[]): WearableParsedResult {
  const sorted = summaries.sort((a, b) => a.date.localeCompare(b.date));
  return {
    source,
    deviceType,
    dateRange: sorted.length ? { start: sorted[0].date, end: sorted[sorted.length - 1].date } : null,
    totalDataPoints: dataPoints.length,
    metrics: groupByMetric(dataPoints),
    dailySummaries: sorted,
  };
}

function groupByMetric(points: WearableDataPoint[]): Map<string, WearableDataPoint[]> {
  const map = new Map<string, WearableDataPoint[]>();
  for (const p of points) {
    if (!map.has(p.metricName)) map.set(p.metricName, []);
    map.get(p.metricName)!.push(p);
  }
  return map;
}

function parseXMLAttributes(attrString: string): Record<string, string> {
  const attrs: Record<string, string> = {};
  const regex = /(\w+)="([^"]*)"/g;
  let match;
  while ((match = regex.exec(attrString)) !== null) {
    attrs[match[1]] = match[2];
  }
  return attrs;
}

function findColumnValue(headers: string[], cols: string[], possibleNames: string[]): string | null {
  for (const name of possibleNames) {
    const idx = headers.findIndex(h => h.includes(name));
    if (idx >= 0 && cols[idx]) return cols[idx];
  }
  return null;
}

function getMetricAliases(key: string): string[] {
  const aliases: Record<string, string[]> = {
    'heart_rate': ['hr', 'pulse', 'bpm', 'heart rate'],
    'resting_heart_rate': ['rhr', 'resting hr', 'resting heart'],
    'hrv': ['heart rate variability', 'rmssd', 'sdnn'],
    'spo2': ['oxygen', 'o2', 'blood oxygen', 'saturation'],
    'steps': ['step count', 'daily steps'],
    'blood_glucose': ['glucose', 'bg', 'sugar', 'cgm'],
    'body_weight': ['weight', 'mass', 'body mass'],
    'body_fat_pct': ['body fat', 'fat %', 'fat percentage'],
    'systolic_bp': ['systolic', 'sys', 'sbp'],
    'diastolic_bp': ['diastolic', 'dia', 'dbp'],
    'body_temperature': ['temp', 'temperature'],
  };
  return aliases[key] || [];
}

/**
 * Detect if data looks like wearable data
 */
export function isWearableData(text: string): boolean {
  const lower = text.toLowerCase();
  return lower.includes('healthdata') || lower.includes('oura') || lower.includes('fitbit') ||
    lower.includes('garmin') || lower.includes('whoop') || lower.includes('dexcom') ||
    lower.includes('withings') || lower.includes('heart_rate') || lower.includes('hrv') ||
    lower.includes('sleep_duration') || lower.includes('steps');
}
