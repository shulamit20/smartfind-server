import { matchingConfig, MatchCriterion } from '../../config/matching';

// Pure matching logic – no database here, so it is easy to test.

interface Matchable {
  categoryId: number;
  colorId: number;
  locationId: number;
}

// How each criterion is checked. To add a criterion: add its weight in config/matching.ts
// and its comparison here.
const criteria: Record<MatchCriterion, (lost: Matchable, found: Matchable) => boolean> = {
  category: (lost, found) => lost.categoryId === found.categoryId,
  color: (lost, found) => lost.colorId === found.colorId,
  location: (lost, found) => lost.locationId === found.locationId,
};

export type MatchBreakdown = Record<MatchCriterion, boolean>;

// Score one lost report against one found item
export function scoreMatch(lost: Matchable, found: Matchable, config = matchingConfig) {
  const breakdown = {} as MatchBreakdown;
  let score = 0;
  for (const name of Object.keys(config.weights) as MatchCriterion[]) {
    breakdown[name] = criteria[name](lost, found);
    if (breakdown[name]) score += config.weights[name];
  }
  return { score, breakdown };
}

// Score all found items, keep those at or above the threshold, best first
export function findMatches<T extends Matchable>(lost: Matchable, foundItems: T[], config = matchingConfig) {
  return foundItems
    .map((item) => ({ item, ...scoreMatch(lost, item, config) }))
    .filter((match) => match.score >= config.minScore)
    .sort((a, b) => b.score - a.score);
}
