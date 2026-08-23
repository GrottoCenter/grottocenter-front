import { fireEvent, render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';

import DocumentSubmissionSuccess from './DocumentSubmissionSuccess';

const messages = {
  'Add another article': 'Add another article',
  'Add another document': 'Add another document',
  'Adding another article will preserve the parent document, publication date, editor and library.':
    'Adding another article will preserve the parent document, publication date, editor and library.',
  Finish: 'Finish',
  'It will be verified by one of ours moderators.':
    'It will be verified by a moderator.',
  'Your document has been successfully submitted, thank you!':
    'Your document has been successfully submitted, thank you!'
};

it('presents repeat actions as secondary and finishing as primary', () => {
  const onSubmitAnotherArticle = vi.fn();
  const onSubmitAnotherDocument = vi.fn();
  const onFinish = vi.fn();

  render(
    <IntlProvider locale="en" messages={messages}>
      <DocumentSubmissionSuccess
        isArticle
        isNewDocument
        onSubmitAnotherArticle={onSubmitAnotherArticle}
        onSubmitAnotherDocument={onSubmitAnotherDocument}
        onFinish={onFinish}
      />
    </IntlProvider>
  );

  expect(
    screen.getByText(
      'Your document has been successfully submitted, thank you! It will be verified by a moderator.'
    )
  ).toBeVisible();
  expect(
    screen.getByText(
      'Adding another article will preserve the parent document, publication date, editor and library.'
    )
  ).toBeVisible();

  const anotherArticle = screen.getByRole('button', {
    name: 'Add another article'
  });
  const anotherDocument = screen.getByRole('button', {
    name: 'Add another document'
  });
  const finish = screen.getByRole('button', { name: 'Finish' });

  expect(anotherArticle).toHaveClass('MuiButton-outlined');
  expect(anotherDocument).toHaveClass('MuiButton-outlined');
  expect(finish).toHaveClass('MuiButton-contained');

  fireEvent.click(anotherArticle);
  fireEvent.click(anotherDocument);
  fireEvent.click(finish);

  expect(onSubmitAnotherArticle).toHaveBeenCalledOnce();
  expect(onSubmitAnotherDocument).toHaveBeenCalledOnce();
  expect(onFinish).toHaveBeenCalledOnce();
});
