import { describe, expect, it } from 'vitest';
import { findMatches, scoreMatch } from '../src/modules/lostReports/matching';

const lost = { categoryId: 1, colorId: 1, locationId: 1 };

describe('scoreMatch', () => {
  it('gives the full score when everything matches', () => {
    const result = scoreMatch(lost, { categoryId: 1, colorId: 1, locationId: 1 });
    expect(result.score).toBe(80);
    expect(result.breakdown).toEqual({ category: true, color: true, location: true });
  });

  it('adds only the weights of the criteria that match', () => {
    expect(scoreMatch(lost, { categoryId: 1, colorId: 2, locationId: 2 }).score).toBe(40);
    expect(scoreMatch(lost, { categoryId: 1, colorId: 1, locationId: 2 }).score).toBe(60);
    expect(scoreMatch(lost, { categoryId: 2, colorId: 1, locationId: 1 }).score).toBe(40);
    expect(scoreMatch(lost, { categoryId: 2, colorId: 2, locationId: 2 }).score).toBe(0);
  });

  it('shows which criteria matched in the breakdown', () => {
    const result = scoreMatch(lost, { categoryId: 1, colorId: 2, locationId: 1 });
    expect(result.breakdown).toEqual({ category: true, color: false, location: true });
  });

  it('ignores dates completely', () => {
    const lostWithDate = { ...lost, lostDate: new Date('2025-01-01') };
    const foundAYearLater = { categoryId: 1, colorId: 1, locationId: 1, foundDate: new Date('2026-01-01') };
    expect(scoreMatch(lostWithDate, foundAYearLater).score).toBe(80);
    expect(scoreMatch(lostWithDate, foundAYearLater).breakdown).not.toHaveProperty('date');
  });
});

describe('findMatches', () => {
  const items = [
    { id: 1, categoryId: 1, colorId: 2, locationId: 2 }, // 40 – below threshold
    { id: 2, categoryId: 1, colorId: 1, locationId: 2 }, // 60
    { id: 3, categoryId: 1, colorId: 1, locationId: 1 }, // 80
    { id: 4, categoryId: 2, colorId: 1, locationId: 1 }, // 40 – below threshold
  ];

  it('returns only matches at or above the threshold (60)', () => {
    const ids = findMatches(lost, items).map((m) => m.item.id);
    expect(ids).toEqual([3, 2]);
  });

  it('sorts by score, highest first', () => {
    const scores = findMatches(lost, items).map((m) => m.score);
    expect(scores).toEqual([80, 60]);
  });

  it('returns an empty list when nothing matches', () => {
    expect(findMatches(lost, [{ categoryId: 9, colorId: 9, locationId: 9 }])).toEqual([]);
  });

  it('uses the weights and threshold from the config', () => {
    const config = { weights: { category: 10, color: 10, location: 10 }, minScore: 20 };
    const ids = findMatches(lost, items, config).map((m) => m.item.id);
    expect(ids).toEqual([3, 2, 4]);
  });
});
