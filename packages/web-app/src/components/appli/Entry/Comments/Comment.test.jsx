import { render, screen, within } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { describe, expect, it, vi } from 'vitest';

import messages from '../../../../../public/lang/en.json';
import Comment from './Comment';

vi.mock('../../../../hooks', () => ({
  useUpdateComment: () => ({ mutate: vi.fn() }),
  useDeleteComment: () => ({ mutate: vi.fn() }),
  useRestoreComment: () => ({ mutate: vi.fn() }),
  usePermissions: () => ({ isAuth: false, isAdmin: false, isModerator: false }),
  useUserProperties: () => null
}));
vi.mock('../ActionButtons', () => ({ default: () => null }));
vi.mock('../SectionTitle', () => ({
  default: ({ title }) => <h3>{title}</h3>
}));
vi.mock('../../../common/Contribution/Contribution', () => ({
  default: ({ body }) => <div>{body}</div>
}));
vi.mock('../../../common/Contribution/ContributionMetadata', () => ({
  default: () => <div>Metadata footer</div>
}));

const renderComment = comment =>
  render(
    <IntlProvider locale="en" messages={messages}>
      <Comment comment={comment} entranceId={1} />
    </IntlProvider>
  );

describe('Comment', () => {
  it('shows the comment text before visit details and metadata last', () => {
    renderComment({
      id: 1,
      title: 'A memorable visit',
      body: 'The main passage was impressive.',
      author: { id: 1, nickname: 'Alice' },
      aestheticism: 8,
      caving: 7,
      approach: 2,
      eTTrail: '1:30:00',
      eTUnderground: '4:20:00',
      isDeleted: false
    });

    const title = screen.getByRole('heading', { name: 'A memorable visit' });
    const interest = screen.getByRole('group', { name: 'Interest' });
    const progression = screen.getByRole('group', { name: 'Progression' });
    const access = screen.getByRole('group', { name: 'Access' });
    const body = screen.getByText('The main passage was impressive.');
    const metadata = screen.getByText('Metadata footer');

    expect(screen.getByAltText('Time to go')).toBeInTheDocument();
    expect(screen.getByAltText('Underground time')).toBeInTheDocument();
    expect(screen.getByText('1h30m')).toBeInTheDocument();
    expect(screen.getByText('4h20m')).toBeInTheDocument();
    expect(within(interest).getByText('4/5 · Remarkable')).toBeInTheDocument();
    expect(
      within(progression).getByText('3.5/5 · Intermediate – Easy')
    ).toBeInTheDocument();
    expect(
      within(access).getByText('1/5 · Very difficult')
    ).toBeInTheDocument();
    expect(title.compareDocumentPosition(body)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING
    );
    expect(body.compareDocumentPosition(interest)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING
    );
    expect(interest.compareDocumentPosition(metadata)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING
    );
  });

  it('does not reserve space for absent visit details', () => {
    renderComment({
      id: 2,
      title: 'Short note',
      body: 'Just a note.',
      author: { id: 2, nickname: 'Bob' },
      isDeleted: false
    });

    expect(
      screen.queryByRole('group', { name: 'Interest' })
    ).not.toBeInTheDocument();
    expect(screen.queryByAltText('Time to go')).not.toBeInTheDocument();
    expect(screen.getByText('Just a note.')).toBeInTheDocument();
    expect(screen.getByText('Metadata footer')).toBeInTheDocument();
  });
});
