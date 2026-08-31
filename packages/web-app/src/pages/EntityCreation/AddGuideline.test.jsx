import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { IntlProvider } from 'react-intl';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import { usePostGuideline } from '@/hooks';
import AddGuideline from './AddGuideline';

vi.mock('@/hooks', () => ({ usePostGuideline: vi.fn() }));
vi.mock('@/components/common/Layouts/Fixed/FixedContent', () => ({
  default: ({ title, content }) => (
    <main>
      <h1>{title}</h1>
      {content}
    </main>
  )
}));
vi.mock('@/components/appli/EntitiesForm/Guideline', () => ({
  default: ({ onSubmit, withScope }) => (
    <button
      type="button"
      data-with-scope={String(withScope)}
      onClick={() =>
        onSubmit({
          title: 'Access',
          description: 'Rules',
          language: 'eng',
          countries: ['FR'],
          regions: [],
          massifs: []
        })
      }>
      Submit guideline
    </button>
  )
}));

it('creates a scoped guideline and opens its detail page', async () => {
  const user = userEvent.setup();
  const mutateAsync = vi.fn().mockResolvedValue({ id: 42 });
  usePostGuideline.mockReturnValue({ mutateAsync });

  render(
    <MemoryRouter initialEntries={['/ui/entity/add/guideline']}>
      <IntlProvider
        locale="en"
        messages={{ 'guidelines.create_new': 'Create a new guideline' }}>
        <Routes>
          <Route path="/ui/entity/add/guideline" element={<AddGuideline />} />
          <Route
            path="/ui/guidelines/:guidelineId"
            element={<div>Guideline detail</div>}
          />
        </Routes>
      </IntlProvider>
    </MemoryRouter>
  );

  const submit = screen.getByRole('button', { name: 'Submit guideline' });
  expect(submit).toHaveAttribute('data-with-scope', 'true');
  await user.click(submit);

  expect(mutateAsync).toHaveBeenCalledWith(
    expect.objectContaining({ countries: ['FR'] })
  );
  expect(await screen.findByText('Guideline detail')).toBeVisible();
});
