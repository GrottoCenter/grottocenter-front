import { renderHook } from '@testing-library/react';
import useContinuousAngle from './useContinuousAngle';

const renderAngle = initial =>
  renderHook(({ angle }) => useContinuousAngle(angle), {
    initialProps: { angle: initial }
  });

describe('useContinuousAngle', () => {
  it('passes a first angle through unchanged', () => {
    const { result } = renderAngle(40);
    expect(result.current).toBe(40);
  });

  it('takes the short way across the 0/360 boundary', () => {
    const { result, rerender } = renderAngle(359);
    rerender({ angle: 2 });

    // The raw value would drop to 2 and animate backwards through 180°; the
    // continuous one steps 3° forward instead.
    expect(result.current).toBe(362);
  });

  it('keeps unwrapping over several turns in the same direction', () => {
    const { result, rerender } = renderAngle(0);
    [350, 340, 330, 320].forEach(angle => rerender({ angle }));

    // Four 10° steps anticlockwise, never a 340° jump forward.
    expect(result.current).toBe(-40);
  });

  it('is idempotent when re-rendered with the same angle', () => {
    const { result, rerender } = renderAngle(359);
    rerender({ angle: 2 });
    rerender({ angle: 2 });
    rerender({ angle: 2 });

    expect(result.current).toBe(362);
  });

  it('returns null without spinning when the angle drops out and comes back', () => {
    const { result, rerender } = renderAngle(359);
    rerender({ angle: null });
    expect(result.current).toBeNull();

    // Losing the compass must not reset the accumulator to zero.
    rerender({ angle: 2 });
    expect(result.current).toBe(362);
  });
});
