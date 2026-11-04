import { useEffect, useRef } from 'react';
import { restoreFieldFocus } from '@/utils/restoreFieldFocus';

// Wait for the dialog's DOM and focus trap to be removed before restoring focus.
export const useRestoreFieldFocus = (isDialogOpen, inputRef, containerRef) => {
  const wasOpenRef = useRef(false);

  useEffect(() => {
    const wasOpen = wasOpenRef.current;
    wasOpenRef.current = isDialogOpen;
    if (wasOpen && !isDialogOpen) {
      restoreFieldFocus(inputRef.current, containerRef.current);
    }
  }, [isDialogOpen, inputRef, containerRef]);
};
