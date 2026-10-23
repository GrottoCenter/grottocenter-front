import { render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import messages from '@/../public/lang/fr.json';
import FormSubmissionError from './FormSubmissionError';

it.each([
  [429, 'Too many requests'],
  [500, 'A server error occurred']
])(
  'translates HTTP %s instead of exposing the raw server message',
  (status, messageId) => {
    render(
      <IntlProvider locale="fr" messages={messages}>
        <FormSubmissionError
          error={{
            status,
            body: { code: 'INTERNAL', message: 'Private server message' }
          }}
        />
      </IntlProvider>
    );
    expect(screen.getByRole('alert')).toHaveTextContent(messages[messageId]);
    expect(screen.queryByText('Private server message')).toBeNull();
  }
);

it('keeps actionable conflict details while hiding server-error metadata', () => {
  const error = {
    status: 409,
    message: 'The target was deleted',
    body: { metadata: { details: ['Choose another target'] } }
  };
  const content = status => (
    <IntlProvider locale="fr" messages={messages}>
      <FormSubmissionError error={{ ...error, status }} />
    </IntlProvider>
  );
  const { rerender } = render(content(409));
  expect(screen.getByRole('alert')).toHaveTextContent('Choose another target');
  rerender(content(500));
  expect(screen.queryByText('Choose another target')).toBeNull();
});
