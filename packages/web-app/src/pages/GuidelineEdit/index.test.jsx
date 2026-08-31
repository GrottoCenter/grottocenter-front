import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { IntlProvider } from 'react-intl';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import { useGuideline, usePatchGuideline } from '@/hooks';
import GuidelineEdit from './index';

vi.mock('@/hooks', () => ({
  useGuideline: vi.fn(),
  usePatchGuideline: vi.fn()
}));
vi.mock('@/components/common/Layouts/Fixed/FixedContent', () => ({
  default: ({ title, content }) => (
    <main>
      <h1>{title}</h1>
      {content}
    </main>
  )
}));
vi.mock('@/components/appli/EntitiesForm/Guideline', () => ({
  default: ({ onSubmit, withScope, values }) => (
    <button
      type="button"
      data-with-scope={String(withScope)}
      onClick={() =>
        onSubmit({
          ...values,
          title: 'Updated title',
          countries: ['FR'],
          regions: [],
          massifs: []
        })
      }>
      Save guideline
    </button>
  )
}));

it('updates every guideline field from a protected dedicated page', async () => {
  const user = userEvent.setup();
  const mutateAsync = vi.fn().mockResolvedValue(undefined);
  usePatchGuideline.mockReturnValue({ mutateAsync });
  useGuideline.mockReturnValue({
    data: {
      id: 42,
      title: 'Access restrictions',
      description: 'Rules',
      language: 'eng',
      countries: ['FR'],
      regions: [],
      massifs: []
    },
    error: null,
    isPending: false,
    fetchStatus: 'idle',
    refetch: vi.fn()
  });

  render(
    <MemoryRouter initialEntries={['/ui/guidelines/42/edit']}>
      <IntlProvider locale="en" messages={{ 'Loading ...': 'Loading' }}>
        <Routes>
          <Route
            path="/ui/guidelines/:guidelineId/edit"
            element={<GuidelineEdit />}
          />
          <Route
            path="/ui/guidelines/:guidelineId"
            element={<div>Guideline detail</div>}
          />
        </Routes>
      </IntlProvider>
    </MemoryRouter>
  );

  const submit = screen.getByRole('button', { name: 'Save guideline' });
  expect(submit).toHaveAttribute('data-with-scope', 'true');
  await user.click(submit);

  expect(mutateAsync).toHaveBeenCalledWith(
    expect.objectContaining({
      id: '42',
      title: 'Updated title',
      countries: ['FR']
    })
  );
  expect(await screen.findByText('Guideline detail')).toBeVisible();
});
