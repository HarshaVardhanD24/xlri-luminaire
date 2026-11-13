import { describe, expect, it } from 'vitest';
import { isValidName, isValidRoll, normalizeRoll } from './roll';

describe('roll numbers', () => {
  it('accepts the four formats, any case, stray spaces', () => {
    for (const r of ['B26023', 'h26123', ' B25 999 ', 'H25000']) expect(isValidRoll(r)).toBe(true);
    expect(normalizeRoll(' b26 023 ')).toBe('B26023');
  });
  it('names: letters and simple punctuation only', () => {
    for (const n of ['D Harsha Vardhan', "Anne-Marie O'Neil", 'B. Muthuraman']) expect(isValidName(n)).toBe(true);
    for (const n of ['', 'A', '=1+1', '<b>', '12345', 'x'.repeat(61)]) expect(isValidName(n)).toBe(false);
  });

  it('rejects everything else', () => {
    for (const r of ['', 'B27001', 'X26001', 'B2600', 'B260234', 'B26O23', '26023', "B26023'; DROP", '=B26023']) expect(isValidRoll(r)).toBe(false);
  });
});
