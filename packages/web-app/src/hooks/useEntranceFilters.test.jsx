import { act, renderHook } from '@testing-library/react';

import useEntranceFilters from './useEntranceFilters';

describe('useEntranceFilters preferences', () => {
  beforeEach(() => localStorage.clear());

  it('restores existing preferences, fills missing categories and rounds displayed interest', () => {
    localStorage.setItem(
      'grottocenter_activeEntranceFilters',
      JSON.stringify({ small: false })
    );
    localStorage.setItem('grottocenter_minInterest', '7.5');
    const { result, rerender } = renderHook(() => useEntranceFilters());
    expect(result.current.filters).toEqual({
      sizes: { small: false, medium: true, large: true },
      qualities: { insufficient: true, satisfactory: true, good: true },
      minInterest: 8
    });
    expect(result.current.hasActiveFilters).toBe(true);
    const { filters } = result.current;
    rerender();
    expect(result.current.filters).toBe(filters);
  });

  it('persists independent changes and restores all defaults after reset', () => {
    const { result } = renderHook(() => useEntranceFilters());
    expect(result.current.hasActiveFilters).toBe(false);
    act(() => {
      result.current.toggleSize('small');
      result.current.toggleSize('medium');
      result.current.toggleQuality('insufficient');
      result.current.setMinInterest(8);
    });
    expect(result.current.filters.sizes).toEqual({
      small: false,
      medium: false,
      large: true
    });
    expect(
      JSON.parse(localStorage.getItem('grottocenter_activeQualityFilters'))
        .insufficient
    ).toBe(false);
    expect(localStorage.getItem('grottocenter_minInterest')).toBe('8');
    expect(result.current.hasActiveFilters).toBe(true);
    act(() => result.current.resetFilters());
    expect(result.current.hasActiveFilters).toBe(false);
    expect(
      JSON.parse(localStorage.getItem('grottocenter_activeEntranceFilters'))
    ).toEqual({ small: true, medium: true, large: true });
    expect(
      JSON.parse(localStorage.getItem('grottocenter_activeQualityFilters'))
    ).toEqual({ insufficient: true, satisfactory: true, good: true });
    expect(localStorage.getItem('grottocenter_minInterest')).toBe('0');
  });
});
