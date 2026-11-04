import {
  act,
  fireEvent,
  screen,
  waitFor,
  within
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { apiPost } from '@/api/client';
import { renderWithProviders } from '@/test/renderWithProviders';
import messages from '@/../public/lang/en.json';
import AssociationForm from './AssociationForm';

const state = vi.hoisted(() => ({ results: [], isOnline: true }));
vi.mock('@/api/client', () => ({ apiPost: vi.fn() }));
vi.mock('@/hooks', async importOriginal => ({
  ...(await importOriginal()),
  useOnlineStatus: () => state.isOnline,
  useNotification: () => ({ onSuccess: vi.fn() }),
  useLanguages: () => ({
    isSuccess: true,
    data: [{ id: 'eng', refName: 'English' }]
  })
}));

const renderForm = (props = {}) => {
  const onSubmit = vi.fn().mockResolvedValue({});
  const onClose = vi.fn();
  const view = renderWithProviders(
    <MemoryRouter>
      <AssociationForm onClose={onClose} onSubmit={onSubmit} {...props} />
    </MemoryRouter>,
    {
      messages,
      preloadedState: {
        intl: { locale: 'en', AVAILABLE_LANGUAGES: { en: { id: 'eng' } } }
      }
    }
  );
  return { ...view, onSubmit: props.onSubmit ?? onSubmit, onClose };
};
const input = () => screen.getByRole('combobox', { name: /^Organization/ });
const associate = () => screen.getByRole('button', { name: 'Associate' });
const dialog = () => within(screen.getByTestId('related-entity-dialog'));
const creations = () =>
  apiPost.mock.calls.filter(([url]) => url.endsWith('/organizations'));
const openCreate = async (query = 'New organization') => {
  const user = userEvent.setup();
  await user.type(input(), query);
  await user.click(
    await screen.findByTestId('create-responsible-organization-search-button')
  );
  await screen.findByTestId('related-entity-dialog');
  return user;
};
const selectType = label => {
  fireEvent.mouseDown(
    dialog().getByRole('combobox', { name: /Organization type/ })
  );
  fireEvent.click(screen.getByRole('option', { name: label }));
};
const create = async () => {
  selectType('Research organization');
  fireEvent.click(dialog().getByRole('button', { name: 'Create and select' }));
  await waitFor(() =>
    expect(
      screen.queryByTestId('related-entity-dialog')
    ).not.toBeInTheDocument()
  );
};
const selectExisting = async () => {
  const user = userEvent.setup();
  await user.type(input(), 'Existing');
  await user.click(
    await screen.findByRole('option', { name: /Existing organization/ })
  );
  return user;
};

beforeEach(() => {
  vi.clearAllMocks();
  state.results = [];
  state.isOnline = true;
  apiPost.mockImplementation(async (url, body) => {
    if (url.endsWith('/search')) return { results: state.results };
    return { id: 42, name: body.name.text, type: body.type };
  });
});

it('requires a selected organization and never creates from unselected text', async () => {
  const { onSubmit } = renderForm();
  await userEvent.setup().type(input(), 'Unselected organization');
  fireEvent.click(associate());
  expect(await screen.findByText('Required')).toBeVisible();
  await waitFor(() => expect(input()).toHaveFocus());
  expect(onSubmit).not.toHaveBeenCalled();
  expect(creations()).toHaveLength(0);
  expect(
    screen.queryByRole('combobox', { name: /Organization type/ })
  ).not.toBeInTheDocument();
});

it('links an existing unclassified organization without creating or asking for its type', async () => {
  state.results = [
    {
      id: 42,
      name: 'Existing organization',
      type: null,
      _type: 'organizations'
    }
  ];
  const { onSubmit, onClose } = renderForm();
  await selectExisting();
  expect(input()).toHaveValue('Existing organization');
  fireEvent.click(associate());
  await waitFor(() =>
    expect(onSubmit).toHaveBeenCalledWith({
      id: 42,
      name: 'Existing organization'
    })
  );
  expect(onClose).toHaveBeenCalledTimes(1);
  expect(creations()).toHaveLength(0);
});

it('clears the previous pick when its label is edited instead of linking the wrong organization', async () => {
  state.results = [
    { id: 42, name: 'Existing organization', _type: 'organizations' }
  ];
  const { onSubmit } = renderForm();
  const user = await selectExisting();
  await user.type(input(), ' changed');
  expect(input()).toHaveValue('Existing organization changed');
  fireEvent.click(associate());
  expect(await screen.findByText('Required')).toBeVisible();
  expect(onSubmit).not.toHaveBeenCalled();
});

it('reuses the compact creation dialog and selects the created organization before associating', async () => {
  const { onSubmit, onClose } = renderForm();
  await openCreate('New research group');
  expect(dialog().getByLabelText(/Organization name/)).toHaveValue(
    'New research group'
  );
  expect(
    dialog().getByRole('combobox', { name: /Country/ })
  ).not.toHaveAttribute('aria-required', 'true');
  expect(dialog().queryByLabelText('Email')).not.toBeInTheDocument();
  fireEvent.click(dialog().getByRole('button', { name: 'Create and select' }));
  expect(
    await dialog().findByText('Choose an organization type.')
  ).toBeVisible();
  expect(creations()).toHaveLength(0);
  await create();
  expect(creations()).toEqual([
    [
      expect.stringContaining('/organizations'),
      expect.objectContaining({
        name: { text: 'New research group', language: 'eng' },
        type: 'RESEARCH',
        country: { id: null }
      })
    ]
  ]);
  expect(onSubmit).not.toHaveBeenCalled();
  expect(onClose).not.toHaveBeenCalled();
  expect(input()).toHaveValue('New research group');
  await waitFor(() => expect(input()).toHaveFocus());
  fireEvent.click(associate());
  await waitFor(() =>
    expect(onSubmit).toHaveBeenCalledWith({
      id: 42,
      name: 'New research group'
    })
  );
  expect(onClose).toHaveBeenCalledTimes(1);
});

it('validates the organization name limit in the shared creation dialog', async () => {
  const { onSubmit } = renderForm();
  await openCreate('New organization');
  fireEvent.change(dialog().getByLabelText(/Organization name/), {
    target: { value: 'x'.repeat(201) }
  });
  selectType('Other');
  fireEvent.click(dialog().getByRole('button', { name: 'Create and select' }));
  await waitFor(() =>
    expect(dialog().getByLabelText(/Organization name/)).toHaveFocus()
  );
  expect(creations()).toHaveLength(0);
  fireEvent.change(dialog().getByLabelText(/Organization name/), {
    target: { value: 'x'.repeat(200) }
  });
  await create();
  expect(creations()[0][1].name.text).toHaveLength(200);
  expect(onSubmit).not.toHaveBeenCalled();
});

it('cancels local creation without creating or associating and preserves the search', async () => {
  const { onSubmit, onClose } = renderForm();
  const user = await openCreate('Group to search');
  await user.type(dialog().getByLabelText(/Organization name/), ' draft');
  await user.click(dialog().getByRole('button', { name: 'Cancel' }));
  await waitFor(() =>
    expect(
      screen.queryByTestId('related-entity-dialog')
    ).not.toBeInTheDocument()
  );
  expect(input()).toHaveValue('Group to search');
  await waitFor(() => expect(input()).toHaveFocus());
  expect(creations()).toHaveLength(0);
  expect(onSubmit).not.toHaveBeenCalled();
  expect(onClose).not.toHaveBeenCalled();
});

it('retains a created organization when association fails and retries without creating again', async () => {
  const onSubmit = vi
    .fn()
    .mockRejectedValueOnce(new Error('Association rejected'))
    .mockResolvedValue({});
  const { onClose } = renderForm({ onSubmit });
  await openCreate();
  await create();
  fireEvent.click(associate());
  await waitFor(() => expect(associate()).toBeEnabled());
  expect(onClose).not.toHaveBeenCalled();
  expect(input()).toHaveValue('New organization');
  fireEvent.click(associate());
  await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
  expect(onSubmit).toHaveBeenCalledTimes(2);
  expect(onSubmit.mock.calls[0]).toEqual(onSubmit.mock.calls[1]);
  expect(creations()).toHaveLength(1);
});

it('prevents repeated association while pending', async () => {
  state.results = [
    { id: 42, name: 'Existing organization', _type: 'organizations' }
  ];
  let resolveAssociation;
  const onSubmit = vi.fn(
    () =>
      new Promise(resolve => {
        resolveAssociation = resolve;
      })
  );
  const { container, onClose } = renderForm({ onSubmit });
  await selectExisting();
  fireEvent.click(associate());
  await waitFor(() => expect(associate()).toBeDisabled());
  expect(input()).toBeDisabled();
  fireEvent.submit(container.querySelector('form'));
  expect(onSubmit).toHaveBeenCalledTimes(1);
  await act(async () => resolveAssociation({}));
  expect(onClose).toHaveBeenCalledTimes(1);
});

it('cannot associate offline, even on direct submission', async () => {
  state.results = [
    { id: 42, name: 'Existing organization', _type: 'organizations' }
  ];
  state.isOnline = false;
  const { container, onSubmit } = renderForm();
  await selectExisting();
  expect(associate()).toBeDisabled();
  await act(async () => fireEvent.submit(container.querySelector('form')));
  expect(onSubmit).not.toHaveBeenCalled();
});
