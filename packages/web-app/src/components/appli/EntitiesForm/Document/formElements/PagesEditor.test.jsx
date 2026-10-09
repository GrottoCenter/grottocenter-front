import { render, screen, fireEvent } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { DocumentFormContext } from '../Provider';
import PagesEditor from './PagesEditor';

const renderPages = pages => {
  const updateAttribute = vi.fn();
  render(
    <IntlProvider
      locale="en"
      messages={{
        Pages: 'Pages',
        'The page or the pages interval (using format: start-end, e.g: 10-12) where the article is.':
          'Use a page number or a range, e.g. 10-12.',
        'form.maxLength': 'Maximum {limit} characters ({count} entered).'
      }}>
      <DocumentFormContext.Provider
        value={{ document: { pages }, updateAttribute }}>
        <PagesEditor />
      </DocumentFormContext.Provider>
    </IntlProvider>
  );
  return updateAttribute;
};

describe('PagesEditor', () => {
  it.each([null, undefined])(
    'renders missing pages (%s) with accessible help',
    pages => {
      renderPages(pages);
      const input = screen.getByRole('textbox', { name: 'Pages' });
      expect(input).toHaveValue('');
      expect(input).toHaveAttribute('maxLength', '20');
      expect(input).toHaveAccessibleDescription(
        'Use a page number or a range, e.g. 10-12.'
      );
    }
  );

  it('preserves numeric range filtering', () => {
    const updateAttribute = renderPages('10-12');
    const input = screen.getByRole('textbox', { name: 'Pages' });
    fireEvent.change(input, { target: { value: '10-15' } });
    expect(updateAttribute).toHaveBeenCalledWith('pages', '10-15');
    fireEvent.change(input, { target: { value: 'text' } });
    expect(updateAttribute).toHaveBeenCalledTimes(1);
  });

  it.each(['12-10', '10-'])('flags an invalid prefilled range (%s)', pages => {
    renderPages(pages);
    expect(screen.getByRole('textbox', { name: 'Pages' })).toHaveAttribute(
      'aria-invalid',
      'true'
    );
  });

  it.each([19, 20])('accepts %i characters', count => {
    renderPages('1'.repeat(count));
    expect(screen.getByRole('textbox', { name: 'Pages' })).toHaveAttribute(
      'aria-invalid',
      'false'
    );
    expect(screen.getByText(`${count} / 20`)).toBeInTheDocument();
  });

  it('flags oversized API pages', () => {
    renderPages('1'.repeat(21));
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Maximum 20 characters (21 entered).'
    );
    expect(screen.getByRole('textbox', { name: 'Pages' })).toHaveAttribute(
      'aria-invalid',
      'true'
    );
  });
});
