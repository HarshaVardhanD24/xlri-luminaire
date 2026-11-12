import type { AlumniId } from './alumni';
import type { OptionKey } from './questions';

/**
 * Scoring matrix from the Luminaire brief (Section 9).
 * Each answer maps to [primary, secondary].
 * Primary earns PRIMARY_POINTS, secondary earns SECONDARY_POINTS.
 * Edit this file to rebalance the quiz; `npm test` checks every alumnus can still win.
 */
export const PRIMARY_POINTS = 2;
export const SECONDARY_POINTS = 1;

export const SCORING: Record<number, Record<OptionKey, [AlumniId, AlumniId]>> = {
  1: { A: ['LEE', 'BHA'], B: ['VIN', 'CHA'], C: ['MUT', 'SEN'], D: ['PAN', 'NIK'] },
  2: { A: ['LEE', 'BHA'], B: ['VIN', 'MUT'], C: ['MUT', 'SEN'], D: ['PAN', 'VAR'] },
  3: { A: ['LEE', 'BHA'], B: ['VIN', 'CHA'], C: ['MUT', 'PAN'], D: ['VAR', 'NIK'] },
  4: { A: ['LEE', 'BHA'], B: ['SEN', 'NIK'], C: ['PAN', 'VAR'], D: ['CHA', 'VIN'] },
  5: { A: ['LEE', 'SEN'], B: ['VAR', 'PAN'], C: ['VIN', 'MUT'], D: ['BHA', 'CHA'] },
  6: { A: ['LEE', 'BHA'], B: ['VIN', 'SEN'], C: ['MUT', 'PAN'], D: ['CHA', 'NIK'] },
};
