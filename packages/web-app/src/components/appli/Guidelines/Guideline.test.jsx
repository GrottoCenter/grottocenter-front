import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { IntlProvider } from 'react-intl';
import { MemoryRouter } from 'react-router-dom';

import Guideline from './Guideline';

vi.mock('@/hooks', () => ({ useOnlineStatus: () => true }));

const messages = {
  Posted: 'Posted',
  Updated: 'Modified',
  'author.by': '{verb} by',
  'author.unknown': '{verb} by an unknown author',
  Language: 'Language',
  unlink: 'Unlink',
  Unlink: 'Unlink',
  No: 'No',
  close: 'Close',
  'Are you sure you want to unlink {name}?': 'Unlink {name}?',
  'guidelines.scope_required': 'Select at least one scope.',
  'Massif guideline': 'Massif guideline'
};

const guideline = {
  id: 42,
  title: 'Access restrictions',
  description: 'Complete description without truncation.',
  language: 'eng',
  countries: ['FR'],
  regions: ['FR-01'],
  massifs: [],
  author: { id: 3, nickname: 'Paul' },
  reviewer: { id: 4, nickname: 'Jane' },
  dateInscription: '2026-05-12T09:30:00.000Z',
  dateReviewed: '2026-08-10T09:30:00.000Z',
  isDeleted: false
};

const renderGuideline = props =>
  render(
    <MemoryRouter>
      <IntlProvider locale="en" messages={messages}>
        <Guideline guideline={guideline} {...props} />
      </IntlProvider>
    </MemoryRouter>
  );

it('renders a linked summary and confirms unlinking', async () => {
  const user = userEvent.setup();
  const onUnlink = vi.fn().mockResolvedValue(undefined);
  renderGuideline({ onUnlink });

  expect(
    screen.getByRole('link', { name: 'Access restrictions' })
  ).toHaveAttribute('href', '/ui/guidelines/42');
  expect(
    screen.getByRole('link', { name: 'Access restrictions' })
  ).not.toHaveAttribute('target');
  expect(screen.getByAltText('Guidelines')).toBeVisible();
  expect(
    screen.getByText('Complete description without truncation.')
  ).toBeVisible();
  expect(screen.queryByRole('button', { name: 'Edit' })).toBeNull();
  expect(screen.queryByRole('button', { name: 'Delete' })).toBeNull();
  expect(screen.queryByRole('button', { name: 'History' })).toBeNull();
  expect(screen.getByRole('button', { name: 'Unlink' })).toHaveClass(
    'MuiButton-colorError'
  );

  await user.click(screen.getByRole('button', { name: 'Unlink' }));
  expect(screen.getByText('Unlink Access restrictions?')).toBeVisible();
  await user.click(screen.getByRole('button', { name: 'Unlink' }));
  expect(onUnlink).toHaveBeenCalledWith(guideline);
});

it('blocks unlinking the last scope until api#1775', () => {
  renderGuideline({
    onUnlink: vi.fn(),
    guideline: { ...guideline, regions: [] }
  });

  expect(screen.getByRole('button', { name: 'Unlink' })).toBeDisabled();
});

it('shows inherited scopes beside the guideline title', () => {
  renderGuideline({ scopeTypes: ['massif'] });

  const title = screen.getByRole('heading', { name: 'Access restrictions' });
  const icon = screen.getByAltText('Guidelines');
  const scope = screen.getByText('Massif guideline');

  expect(scope).toBeVisible();
  expect(title.previousElementSibling).toContainElement(icon);
  expect(title.parentElement.parentElement).toContainElement(scope);
});

it('can hide attribution in inherited guideline summaries', () => {
  renderGuideline({ hideAttribution: true });

  expect(
    screen.getByText('Complete description without truncation.')
  ).toBeVisible();
  expect(screen.queryByText('Paul')).toBeNull();
  expect(screen.queryByText('Jane')).toBeNull();
  expect(screen.queryByText(/Language/)).toBeNull();
});
