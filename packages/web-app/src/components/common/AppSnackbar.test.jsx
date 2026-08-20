import { render } from '@testing-library/react';

import AppSnackbar from './AppSnackbar';

describe('AppSnackbar', () => {
  it('does not forward notistack options to the DOM element', () => {
    const { container } = render(
      <AppSnackbar
        id="snackbar-1"
        message="Saved"
        variant="success"
        persist
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        autoHideDuration={6000}
        hideIconVariant={false}
        iconVariant={{}}
        className="custom-snackbar"
        style={{ marginTop: 8 }}
      />
    );

    const snackbar = container.firstChild;
    expect(snackbar).toHaveClass('custom-snackbar');
    expect(snackbar).toHaveStyle({ marginTop: '8px' });
    expect(snackbar).not.toHaveAttribute('persist');
    expect(snackbar).not.toHaveAttribute('anchorOrigin');
    expect(snackbar).not.toHaveAttribute('autoHideDuration');
    expect(snackbar).not.toHaveAttribute('hideIconVariant');
    expect(snackbar).not.toHaveAttribute('iconVariant');
  });
});
