import { calculateMasonryRowSpan } from './masonryUtils';

describe('calculateMasonryRowSpan', () => {
  it('reserves the card height and the existing vertical gap', () => {
    expect(calculateMasonryRowSpan(340, 8)).toBe(348);
  });

  it('rounds fractional heights up to prevent card overlap', () => {
    expect(calculateMasonryRowSpan(100.25, 8)).toBe(109);
  });

  it('uses a safe single row before content can be measured', () => {
    expect(calculateMasonryRowSpan(0, 8)).toBe(1);
    expect(calculateMasonryRowSpan(Number.NaN, 8)).toBe(1);
  });
});
