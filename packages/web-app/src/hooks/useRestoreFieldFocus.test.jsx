import { renderHook } from '@testing-library/react';
import { restoreFieldFocus } from '@/utils/restoreFieldFocus';
import { useRestoreFieldFocus } from './useRestoreFieldFocus';

vi.mock('@/utils/restoreFieldFocus', () => ({ restoreFieldFocus: vi.fn() }));

it('restores the current field only when the dialog closes', () => {
  const inputRef = { current: document.createElement('input') };
  const containerRef = { current: document.createElement('div') };
  const { rerender } = renderHook(
    ({ open }) => useRestoreFieldFocus(open, inputRef, containerRef),
    { initialProps: { open: false } }
  );
  expect(restoreFieldFocus).not.toHaveBeenCalled();
  rerender({ open: true });
  expect(restoreFieldFocus).not.toHaveBeenCalled();

  inputRef.current = document.createElement('input');
  containerRef.current = document.createElement('div');
  rerender({ open: false });
  expect(restoreFieldFocus).toHaveBeenCalledExactlyOnceWith(
    inputRef.current,
    containerRef.current
  );
  rerender({ open: false });
  expect(restoreFieldFocus).toHaveBeenCalledTimes(1);
});
