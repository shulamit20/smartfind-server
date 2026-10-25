// Matching settings – change the numbers here, nothing else needs to change.
// Each key in `weights` is one criterion; its comparison lives in modules/lostReports/matching.ts.
// Dates are intentionally NOT part of the score (an item can be found months later).
export const matchingConfig = {
  weights: {
    category: 40,
    color: 20,
    location: 20,
  },
  // Only matches with at least this score are returned
  minScore: 60,
};

export type MatchCriterion = keyof typeof matchingConfig.weights;
