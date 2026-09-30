import { meetsMinimumInterest } from './interest';

describe('meetsMinimumInterest', () => {
  it('includes every entrance when no minimum is selected', () => {
    expect(meetsMinimumInterest(null, 0)).toBe(true);
    expect(meetsMinimumInterest(0, 0)).toBe(true);
  });

  it('compares the rounded stars shown to the user', () => {
    expect(meetsMinimumInterest(3, 4)).toBe(true);
    expect(meetsMinimumInterest(2, 4)).toBe(false);
    expect(meetsMinimumInterest(null, 4)).toBe(false);
  });
});
