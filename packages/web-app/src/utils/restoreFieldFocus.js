// Restore the field after a dialog closes, while respecting a user who has
// already moved to another field before the next animation frame runs.
export const restoreFieldFocus = (input, container) => {
  requestAnimationFrame(() => {
    if (!input?.isConnected) return;
    const { activeElement, body } = input.ownerDocument;
    if (activeElement === body || container?.contains(activeElement)) {
      input.focus({ preventScroll: true });
    }
  });
};
