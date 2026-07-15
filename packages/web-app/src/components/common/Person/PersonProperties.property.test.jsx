import React from 'react';
import { render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import fc from 'fast-check';

import PersonProperties from './PersonProperties';

const messages = {
  'User information': 'User information',
  Banned: 'Banned',
  Id: 'Id',
  'Caver.Name': 'Name',
  Surname: 'Surname',
  Nickname: 'Nickname',
  Language: 'Language',
  Groups: 'Groups',
  Mail: 'Mail',
  Administrator: 'Administrator',
  Moderator: 'Moderator',
  Leader: 'Leader'
};

const renderPersonProperties = person =>
  render(
    <IntlProvider locale="en" messages={messages}>
      <PersonProperties person={person} />
    </IntlProvider>
  );

const groupNameArb = fc.constantFrom('Administrator', 'Moderator', 'Leader');

const groupArb = fc.record({
  id: fc.integer({ min: 1, max: 100 }),
  name: groupNameArb
});

const personArb = isBanned =>
  fc
    .record({
      id: fc.integer({ min: 1, max: 100000 }),
      name: fc.option(fc.string({ minLength: 1, maxLength: 20 }), {
        nil: undefined
      }),
      nickname: fc.string({ minLength: 1, maxLength: 20 }),
      surname: fc.option(fc.string({ minLength: 1, maxLength: 20 }), {
        nil: undefined
      }),
      language: fc.option(
        fc.constantFrom('en', 'fr', 'es', 'de', 'it', 'pt'),
        { nil: undefined }
      ),
      groups: fc.option(fc.array(groupArb, { minLength: 0, maxLength: 3 }), {
        nil: undefined
      }),
      mail: fc.option(fc.string({ minLength: 5, maxLength: 30 }), {
        nil: undefined
      })
    })
    .map(p => ({ ...p, isBanned }));

// fast-check runs many render iterations — needs more than Vitest's 5s default.
vi.setConfig({ testTimeout: 30000 });

/**
 * Property 6: Ban indicator visibility matches ban status
 *
 * For any person object, the PersonProperties component should render
 * the "Banned" chip if and only if person.isBanned is true.
 *
 * Encodes: the conditional rendering of the ban indicator chip.
 * Covers: both banned (isBanned=true) and not banned (isBanned=false/undefined) persons.
 *
 * Validates: Requirements 3.1, 3.3
 */
describe('Property 6: Ban indicator visibility matches ban status', () => {
  it('renders Banned chip when isBanned is true', () => {
    fc.assert(
      fc.property(personArb(true), person => {
        const { unmount } = renderPersonProperties(person);

        const chip = screen.getByText('Banned');
        expect(chip).toBeInTheDocument();

        unmount();
      }),
      { numRuns: 100 }
    );
  });

  it('does not render Banned chip when isBanned is false', () => {
    fc.assert(
      fc.property(personArb(false), person => {
        const { unmount } = renderPersonProperties(person);

        expect(screen.queryByText('Banned')).not.toBeInTheDocument();

        unmount();
      }),
      { numRuns: 100 }
    );
  });

  it('does not render Banned chip when isBanned is undefined', () => {
    fc.assert(
      fc.property(
        personArb(false).map(p => {
          const { isBanned, ...rest } = p;
          return rest;
        }),
        person => {
          const { unmount } = renderPersonProperties(person);

          expect(screen.queryByText('Banned')).not.toBeInTheDocument();

          unmount();
        }
      ),
      { numRuns: 100 }
    );
  });
});
