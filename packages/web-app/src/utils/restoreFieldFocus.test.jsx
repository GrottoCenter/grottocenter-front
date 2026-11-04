import { act, render, screen } from '@testing-library/react';
import { restoreFieldFocus } from './restoreFieldFocus';

it.each([false, true])(
  'restores the field unless the user moved elsewhere (moved: %s)',
  async moved => {
    render(
      <>
        <div data-testid="field">
          <input aria-label="Original field" />
          <button type="button">Create</button>
        </div>
        <input aria-label="Next field" />
      </>
    );
    const input = screen.getByLabelText('Original field');
    const next = screen.getByLabelText('Next field');
    screen.getByRole('button').focus();
    restoreFieldFocus(input, screen.getByTestId('field'));
    if (moved) next.focus();
    await act(
      async () =>
        new Promise(resolve => {
          requestAnimationFrame(resolve);
        })
    );
    expect(moved ? next : input).toHaveFocus();
  }
);
