export type BatteryStatus = 'normal' | 'low' | 'critical' | 'unavailable';

const MIN_VALID_VOLTAGE = 2.5;
const MAX_VALID_VOLTAGE = 4.35;
const LOW_VOLTAGE = 3.45;
const CRITICAL_VOLTAGE = 3.3;

export function batteryStatus(percentage?: number | null, voltage?: number | null): BatteryStatus {
  const hasPercentage = typeof percentage === 'number' && percentage >= 0 && percentage <= 100;
  const hasVoltage = typeof voltage === 'number' && voltage >= MIN_VALID_VOLTAGE && voltage <= MAX_VALID_VOLTAGE;
  if (!hasPercentage && !hasVoltage) return 'unavailable';
  if ((hasVoltage && voltage! <= CRITICAL_VOLTAGE) || (hasPercentage && percentage! <= 3)) return 'critical';
  if ((hasVoltage && voltage! <= LOW_VOLTAGE) || (hasPercentage && percentage! <= 10)) return 'low';
  return 'normal';
}

export function batteryLabel(status: BatteryStatus): string {
  if (status === 'critical') return 'Critical battery';
  if (status === 'low') return 'Low battery';
  if (status === 'unavailable') return 'Battery unavailable';
  return 'Battery';
}
