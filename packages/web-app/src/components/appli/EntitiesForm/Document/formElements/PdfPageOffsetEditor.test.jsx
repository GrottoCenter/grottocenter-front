import { useContext } from 'react';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import renderWithProviders from '@/test/renderWithProviders';
import messages from '@/../public/lang/fr.json';
import DocumentFormProvider, { DocumentFormContext } from '../Provider';
import PdfPageOffsetEditor from './PdfPageOffsetEditor';

const Form = () => {
  const { document, updateAttribute, isFormValid } =
    useContext(DocumentFormContext);
  return (
    <form onSubmit={event => event.preventDefault()}>
      <PdfPageOffsetEditor
        src="https://example.org/bulletin.pdf?dl=1#zoom=100"
        value={document.identifierPdfPageOffset}
        onChange={offset => updateAttribute('identifierPdfPageOffset', offset)}
      />
      <output data-testid="offset">
        {String(document.identifierPdfPageOffset)}
      </output>
      <button type="submit" disabled={!isFormValid}>
        Save document
      </button>
    </form>
  );
};

const renderForm = (offset = null) =>
  renderWithProviders(
    <DocumentFormProvider
      initialValues={{
        type: 'Book',
        title: 'Book',
        description: 'Book description',
        authors: [{ id: 1 }],
        identifierPdfPageOffset: offset
      }}>
      <Form />
    </DocumentFormProvider>,
    { messages, locale: 'fr' }
  );

const enterPages = (printed, pdf) => {
  fireEvent.change(
    screen.getByRole('spinbutton', { name: 'Numéro imprimé sur la page' }),
    { target: { value: printed } }
  );
  fireEvent.change(
    screen.getByRole('spinbutton', { name: 'Position de la page dans le PDF' }),
    {
      target: { value: pdf }
    }
  );
};

it.each([
  ['29', '30', '1'],
  ['129', '3', '-126'],
  ['29', '29', '0']
])(
  'saves only the offset for printed page %s and PDF page %s',
  async (printed, pdf, expected) => {
    renderForm();
    fireEvent.click(
      screen.getByRole('button', { name: 'Ajuster les numéros de page' })
    );
    expect(
      screen.queryByRole('button', { name: 'Annuler' })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Effacer' })
    ).not.toBeInTheDocument();
    enterPages(printed, pdf);
    expect(screen.getByRole('button', { name: 'Effacer' })).toBeVisible();
    await waitFor(() =>
      expect(screen.getByTestId('offset')).toHaveTextContent(expected)
    );
    expect(screen.getByRole('link', { name: 'Tester' })).toHaveAttribute(
      'href',
      `https://example.org/bulletin.pdf?dl=1#zoom=100&page=${pdf}`
    );
    expect(screen.getByRole('button', { name: 'Save document' })).toBeEnabled();
  }
);

it('blocks an incomplete correspondence and clears it without restoring the saved offset', async () => {
  renderForm(1);
  fireEvent.click(screen.getByRole('button', { name: 'Pagination ajustée' }));
  const printed = screen.getByRole('spinbutton', {
    name: 'Numéro imprimé sur la page'
  });
  fireEvent.change(printed, { target: { value: '' } });
  fireEvent.blur(printed);
  await waitFor(() =>
    expect(
      screen.getByText('Renseignez les deux numéros de page.')
    ).toBeVisible()
  );
  expect(screen.getByRole('button', { name: 'Save document' })).toBeDisabled();
  expect(
    screen.queryByRole('link', { name: 'Tester' })
  ).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Effacer' }));
  await waitFor(() =>
    expect(screen.getByRole('button', { name: 'Save document' })).toBeEnabled()
  );
  expect(screen.getByTestId('offset')).toHaveTextContent('null');
});

it.each(['0', '-1', '1.5'])(
  'blocks invalid page %s and accepts correction',
  async invalid => {
    renderForm();
    fireEvent.click(
      screen.getByRole('button', { name: 'Ajuster les numéros de page' })
    );
    enterPages('29', invalid);
    fireEvent.blur(
      screen.getByRole('spinbutton', {
        name: 'Position de la page dans le PDF'
      })
    );
    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: 'Save document' })
      ).toBeDisabled()
    );
    expect(
      screen.getByRole('spinbutton', {
        name: 'Position de la page dans le PDF'
      })
    ).toHaveAttribute('aria-invalid', 'true');
    enterPages('29', '30');
    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: 'Save document' })
      ).toBeEnabled()
    );
  }
);

it('removes a saved zero offset', async () => {
  renderForm(0);
  expect(screen.getByText('Pagination ajustée')).toBeVisible();
  fireEvent.click(screen.getByRole('button', { name: 'Pagination ajustée' }));
  fireEvent.click(screen.getByRole('button', { name: 'Effacer' }));
  await waitFor(() =>
    expect(screen.getByTestId('offset')).toHaveTextContent('null')
  );
  expect(
    screen.getByRole('button', { name: 'Ajuster les numéros de page' })
  ).toBeVisible();
});
