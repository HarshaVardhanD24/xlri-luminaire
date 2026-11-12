import { ALUMNI_ORDER, type AlumniId } from '../data/alumni';
import type { OptionKey } from '../data/questions';
import { PRIMARY_POINTS, SCORING, SECONDARY_POINTS } from '../data/scoring';

export interface ResultBreakdown {
  winner: AlumniId;
  runnerUp: AlumniId;
  ranking: { id: AlumniId; total: number; primaries: number }[];
}

/**
 * answers[i] is the option chosen for question i+1.
 * Ranking: 1) total score, 2) number of primary matches,
 * 3) deterministic answer-sequence tie-break: compare points earned on the most recent
 *    question, then the one before, and so on (later answers weigh as the tiebreaker),
 * 4) fixed alumni order as a final, never-random fallback.
 */
export function calculateResult(answers: (OptionKey | null)[]): ResultBreakdown {
  const total = {} as Record<AlumniId, number>;
  const primaries = {} as Record<AlumniId, number>;
  const perQuestion = {} as Record<AlumniId, number[]>;
  for (const id of ALUMNI_ORDER) {
    total[id] = 0;
    primaries[id] = 0;
    perQuestion[id] = answers.map(() => 0);
  }

  answers.forEach((answer, i) => {
    if (!answer) return;
    const pair = SCORING[i + 1]?.[answer];
    if (!pair) return;
    const [p, s] = pair;
    total[p] += PRIMARY_POINTS;
    primaries[p] += 1;
    perQuestion[p][i] += PRIMARY_POINTS;
    total[s] += SECONDARY_POINTS;
    perQuestion[s][i] += SECONDARY_POINTS;
  });

  const ranked = [...ALUMNI_ORDER].sort((a, b) => {
    if (total[b] !== total[a]) return total[b] - total[a];
    if (primaries[b] !== primaries[a]) return primaries[b] - primaries[a];
    for (let i = answers.length - 1; i >= 0; i--) {
      const d = perQuestion[b][i] - perQuestion[a][i];
      if (d !== 0) return d;
    }
    return ALUMNI_ORDER.indexOf(a) - ALUMNI_ORDER.indexOf(b);
  });

  return {
    winner: ranked[0],
    runnerUp: ranked[1],
    ranking: ranked.map((id) => ({ id, total: total[id], primaries: primaries[id] })),
  };
}
