import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { IntlProvider } from 'react-intl';

import { useNotification, usePatchGuideline, usePermissions } from '@/hooks';
import Guidelines from './index';

vi.mock('@/hooks', () => ({
  useNotification: vi.fn(),
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
  default: ({ content }) => <section>{content}</section>
}));
vi.mock('../../common/SectionCreateButton', () => ({
  default: () => null
}));

it('patches every remaining scope when unlinking from a direct entity', async () => {
  const user = userEvent.setup();
  const mutateAsync = vi.fn().mockResolvedValue(undefined);
  usePermissions.mockReturnValue({ isAuth: true });
  useNotification.mockReturnValue({ onError: vi.fn() });
  usePatchGuideline.mockReturnValue({ mutateAsync });

  render(
    <IntlProvider locale="en" messages={{}}>
      <Guidelines
        entityType="countries"
        entityId="FR"
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
