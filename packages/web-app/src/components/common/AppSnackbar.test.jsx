import { render, screen } from '@testing-library/react';

import AppSnackbar from './AppSnackbar';

describe('AppSnackbar', () => {
  it('keeps notistack control props off the DOM', () => {
    const consoleError = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    try {
      render(
        <AppSnackbar
          id="offline"
          message="You are offline."
          variant="warning"
          persist
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
          autoHideDuration={5000}
          hideIconVariant={false}
          iconVariant={{}}
        />
      );

      const content = screen.getByRole('alert').parentElement;
      expect(content).not.toHaveAttribute('persist');
      expect(content).not.toHaveAttribute('anchorOrigin');
      expect(content).not.toHaveAttribute('autoHideDuration');
      expect(content).not.toHaveAttribute('hideIconVariant');
      expect(content).not.toHaveAttribute('iconVariant');
      expect(consoleError).not.toHaveBeenCalled();
    } finally {
      consoleError.mockRestore();
    }
  });

  it('retains the presentation props required by notistack', () => {
    render(
      <AppSnackbar
        id="success"
        message="Saved"
        variant="success"
        className="custom-snackbar"
        style={{ marginTop: 4 }}
      />
    );

    const content = screen.getByRole('alert').parentElement;
    expect(content).toHaveClass('custom-snackbar');
    expect(content).toHaveStyle({ marginTop: '4px' });
  });
});
