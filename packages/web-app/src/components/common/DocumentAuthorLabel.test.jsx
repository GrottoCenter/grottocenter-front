import { render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import messages from '@/../public/lang/fr.json';
import DocumentAuthorLabel from './DocumentAuthorLabel';

it.each([
  ['CAVER', 'Caver'],
  ['AUTHOR', 'Author'],
  [undefined, null]
])(
  'keeps the person type accessible without a visible suffix (%s)',
  (type, label) => {
    render(
      <IntlProvider locale="fr" messages={messages}>
        <button type="button">
          <DocumentAuthorLabel
            author={{ nickname: 'Marie Dupont', type }}
            showPersonType={false}
          />
        </button>
      </IntlProvider>
    );
    const button = screen.getByRole('button');
    expect(button).toHaveTextContent(/^Marie Dupont$/);
    expect(button).toHaveAccessibleName(
      label ? `${messages[label]} Marie Dupont` : 'Marie Dupont'
    );
  }
);
