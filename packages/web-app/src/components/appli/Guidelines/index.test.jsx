import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { IntlProvider } from 'react-intl';

import {
  useGuidelines,
  useNotification,
  usePatchGuideline,
  usePermissions
} from '@/hooks';
import Guidelines from './index';

vi.mock('@/hooks', () => ({
  useGuidelines: vi.fn(),
  useNotification: vi.fn(),
  useOnlineStatus: () => true,
  usePatchGuideline: vi.fn(),
  usePermissions: vi.fn()
}));
vi.mock('./Guideline', () => ({
  default: ({ guideline, onUnlink }) => (
    <button type="button" onClick={() => onUnlink?.(guideline)}>
      Unlink {guideline.title}
    </button>
  )
}));
vi.mock('../../common/Layouts/Fixed/ScrollableContent', () => ({
  default: ({ title, icon, content }) => (
    <section>
      <h2>{title}</h2>
      {icon}
      {content}
    </section>
  )
}));
vi.mock('../../common/SectionCreateButton', () => ({
  default: ({ isOpen, onToggle, label }) => (
    <button type="button" onClick={onToggle}>
      {isOpen ? 'Cancel' : label}
    </button>
  )
}));
vi.mock('@/components/common/NewEntityButton', () => ({
  default: ({ to, tooltip }) => <a href={to}>{tooltip}</a>
}));

const messages = {
  Associate: 'Associate',
  Guidelines: 'Guidelines',
  'guidelines.attach_existing': 'Attach an existing guideline',
  'guidelines.btn_attach': 'Attach',
  'guidelines.create_new': 'Create a new guideline',
  'guidelines.no_results': 'No results',
  'guidelines.none': 'No guidelines attached to this {entityType}.',
  'guidelines.search_placeholder': 'Search',
  'guidelines.select_guideline': 'Select a guideline',
  country: 'country',
  massif: 'massif'
};

beforeEach(() => {
  useNotification.mockReturnValue({ onError: vi.fn() });
  useGuidelines.mockReturnValue({
    data: { guidelines: [] },
    error: null,
    isFetching: false
  });
});

it('patches every remaining scope when unlinking from a direct entity', async () => {
  const user = userEvent.setup();
  const mutateAsync = vi.fn().mockResolvedValue(undefined);
  usePermissions.mockReturnValue({ isAuth: true });
  usePatchGuideline.mockReturnValue({ mutateAsync });

  render(
    <IntlProvider locale="en" messages={messages}>
      <Guidelines
        entityType="countries"
        entityId="FR"
        entityName="France"
        guidelines={[
          {
            id: 42,
            title: 'Access restrictions',
            countries: [{ id: 'FR' }, { id: 'ES' }],
            regions: [{ iso: 'FR-01' }],
            massifs: [{ id: 7 }],
            isDeleted: false
          }
        ]}
      />
    </IntlProvider>
  );

  await user.click(
    screen.getByRole('button', { name: 'Unlink Access restrictions' })
  );

  expect(mutateAsync).toHaveBeenCalledWith({
    id: 42,
    countries: ['ES'],
    regions: ['FR-01'],
    massifs: [7]
  });
});

it('shows separate create and associate actions without an inner mode toggle', async () => {
  const user = userEvent.setup();
  usePermissions.mockReturnValue({ isAuth: true });
  usePatchGuideline.mockReturnValue({ mutateAsync: vi.fn() });

  render(
    <IntlProvider locale="en" messages={messages}>
      <Guidelines
        entityType="massifs"
        entityId={7}
        entityName="Vercors"
        guidelines={[]}
      />
    </IntlProvider>
  );

  const associateButton = screen.getByRole('button', { name: 'Associate' });
  const createLink = screen.getByRole('link', {
    name: 'Create a new guideline'
  });

  expect(associateButton.nextElementSibling).toBe(createLink);
  expect(createLink).toHaveAttribute(
    'href',
    '/ui/entity/add/guideline?scopeType=massifs&scopeId=7&scopeName=Vercors'
  );

  await user.click(associateButton);

  expect(screen.getByTestId('attach-guideline-autocomplete')).toBeVisible();
  expect(screen.getByRole('button', { name: 'Cancel' })).toBeVisible();
  expect(screen.queryByTestId('guideline-mode-toggle')).not.toBeInTheDocument();
  expect(useGuidelines).toHaveBeenLastCalledWith({
    limit: 100,
    enabled: true
  });
});
