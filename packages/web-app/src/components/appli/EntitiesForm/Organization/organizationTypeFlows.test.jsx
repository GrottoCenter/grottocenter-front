import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import { apiPatch, apiPost, apiPut } from '@/api/client';
import { renderWithProviders } from '@/test/renderWithProviders';
import messages from '@/../public/lang/en.json';
import { DocumentFormContext } from '../Document/Provider';
import CreateNewOrganization from '../Document/formElements/OrganizationAutoComplete/CreateNewOrganization';
import { OrganizationForm } from './index';
import { makeOrganizationValueData } from './transformers';

const state = vi.hoisted(() => ({ isOnline: true }));
vi.mock('@/api/client', () => ({
  apiPatch: vi.fn(),
  apiPost: vi.fn(),
  apiPut: vi.fn()
}));
vi.mock('@/hooks', async () => ({
  ...(await import('@/hooks/mutations/useOrganizationForm')),
  useOnlineStatus: () => state.isOnline,
  useLanguages: () => ({
    isSuccess: true,
    data: [
      { id: 'eng', refName: 'English' },
      { id: 'fra', refName: 'French' }
    ]
  })
}));
vi.mock('../utils/CoordinateFormSection', () => ({ default: () => null }));
vi.mock('../utils/LicenseBox', () => ({ default: () => null }));
const renderForm = element =>
  renderWithProviders(
    <MemoryRouter>
      <Routes>
        <Route path="/" element={element} />
        <Route
          path="/ui/organizations/:id"
          element={<p>Organization saved</p>}
        />
      </Routes>
    </MemoryRouter>,
    {
      messages,
      preloadedState: {
        intl: { locale: 'en', AVAILABLE_LANGUAGES: { en: { id: 'eng' } } }
      }
    }
  );

const selectType = label => {
  fireEvent.mouseDown(
    screen.getByRole('combobox', { name: /Organization type/ })
  );
  fireEvent.click(screen.getByRole('option', { name: label }));
};

const existingOrganization = {
  id: 42,
  nameId: 17,
  name: 'Existing organization',
  customMessage: 'A useful description',
  language: 'eng',
  country: 'FR',
  latitude: 0,
  longitude: 0
};

beforeEach(() => {
  vi.clearAllMocks();
  state.isOnline = true;
  apiPost.mockResolvedValue({
    id: 42,
    name: 'New organization',
    type: 'LIBRARY'
  });
  apiPut.mockResolvedValue({ id: 42 });
  apiPatch.mockResolvedValue({});
});

describe('organization editor classification', () => {
  it.each([null, ''])(
    'allows saving an organization without a country (%s)',
    async country => {
      renderForm(
        <OrganizationForm
          organizationValues={makeOrganizationValueData({
            ...existingOrganization,
            type: 'SPELEOLOGY',
            country,
            customMessage: ''
          })}
        />
      );
      const countrySelect = screen.getByRole('combobox', { name: /Country/ });
      expect(countrySelect).not.toHaveAttribute('aria-required', 'true');
      fireEvent.click(screen.getByRole('button', { name: 'Update' }));
      await screen.findByText('Organization saved');
      expect(apiPut).toHaveBeenCalledWith(
        expect.stringContaining('/organizations/42'),
        expect.objectContaining({ country: { id: null }, customMessage: '' })
      );
    }
  );

  it.each(['000', 'eng'])(
    'allows changing the language from %s without renaming the organization',
    async language => {
      renderForm(
        <OrganizationForm
          organizationValues={makeOrganizationValueData({
            ...existingOrganization,
            type: 'SPELEOLOGY',
            language
          })}
        />
      );
      const languageSelect = screen
        .getByText(language === '000' ? 'Select a language' : 'English')
        .closest('[role="combobox"]');
      expect(languageSelect).not.toHaveAttribute('aria-disabled', 'true');
      fireEvent.mouseDown(languageSelect);
      fireEvent.click(screen.getByRole('option', { name: 'French' }));
      fireEvent.click(screen.getByRole('button', { name: 'Update' }));
      await screen.findByText('Organization saved');
      expect(apiPatch).not.toHaveBeenCalled();
      expect(apiPut).toHaveBeenCalledWith(
        expect.stringContaining('/organizations/42'),
        expect.objectContaining({
          type: 'SPELEOLOGY',
          name: { text: existingOrganization.name, language: 'fra' }
        })
      );
    }
  );

  it.each([null, undefined, 'FUTURE_TYPE'])(
    'requires classification of an existing organization with type %s before any write',
    async type => {
      renderForm(
        <OrganizationForm
          organizationValues={makeOrganizationValueData({
            ...existingOrganization,
            type
          })}
        />
      );
      fireEvent.change(screen.getByLabelText(/Organization name/), {
        target: { value: 'Renamed organization' }
      });
      const typeInput = screen.getByRole('combobox', {
        name: /Organization type/
      });
      expect(
        screen.getByTestId('organization-type-field').querySelector('input')
      ).toHaveValue('');
      fireEvent.click(screen.getByRole('button', { name: 'Update' }));
      expect(
        await screen.findByText('Choose an organization type.')
      ).toBeVisible();
      await waitFor(() => expect(typeInput).toHaveFocus());
      expect(apiPut).not.toHaveBeenCalled();
      expect(apiPost).not.toHaveBeenCalled();
      expect(apiPatch).not.toHaveBeenCalled();

      selectType('Research organization');
      fireEvent.click(screen.getByRole('button', { name: 'Update' }));
      expect(await screen.findByText('Organization saved')).toBeVisible();
      expect(apiPut).toHaveBeenCalledWith(
        expect.stringContaining('/organizations/42'),
        expect.objectContaining({
          id: 42,
          type: 'RESEARCH',
          name: { text: 'Renamed organization', language: 'eng' },
          latitude: 0,
          longitude: 0
        })
      );
      expect(apiPatch).not.toHaveBeenCalled();
    }
  );

  it('prefills and retains an already classified organization', async () => {
    renderForm(
      <OrganizationForm
        organizationValues={makeOrganizationValueData({
          ...existingOrganization,
          type: 'CAVE_RESCUE'
        })}
      />
    );
    expect(
      screen.getByRole('combobox', { name: /Organization type/ })
    ).toHaveTextContent('Cave rescue');
    fireEvent.click(screen.getByRole('button', { name: 'Update' }));
    await screen.findByText('Organization saved');
    expect(apiPut).toHaveBeenCalledTimes(1);
    expect(apiPut).toHaveBeenCalledWith(
      expect.stringContaining('/organizations/42'),
      expect.objectContaining({ type: 'CAVE_RESCUE' })
    );
  });

  it('does not preselect a type for creation and sends the explicit choice', async () => {
    renderForm(<OrganizationForm />);
    fireEvent.change(screen.getByLabelText(/Organization name/), {
      target: { value: 'New organization' }
    });
    fireEvent.mouseDown(screen.getByRole('combobox', { name: /Country/ }));
    fireEvent.click(screen.getByRole('option', { name: 'none' }));
    fireEvent.click(screen.getByRole('button', { name: 'Create' }));
    await screen.findByText('Choose an organization type.');
    expect(apiPost).not.toHaveBeenCalled();
    selectType('Library / documentation centre');
    fireEvent.click(screen.getByRole('button', { name: 'Create' }));
    await screen.findByText('Organization saved');
    expect(apiPost).toHaveBeenCalledWith(
      expect.stringContaining('/organizations'),
      expect.objectContaining({
        type: 'LIBRARY',
        customMessage: '',
        country: { id: null }
      })
    );
  });

  it('prevents a direct editor submission while offline', async () => {
    state.isOnline = false;
    const { container } = renderForm(
      <OrganizationForm
        organizationValues={makeOrganizationValueData({
          ...existingOrganization,
          type: 'RESEARCH'
        })}
      />
    );
    expect(screen.getByRole('button', { name: 'Update' })).toBeDisabled();
    await act(async () => fireEvent.submit(container.querySelector('form')));
    expect(apiPut).not.toHaveBeenCalled();
    expect(apiPatch).not.toHaveBeenCalled();
  });

  it('retains values after a structured rejection and allows correction and retry', async () => {
    apiPut.mockRejectedValueOnce({
      status: 400,
      body: {
        code: 'organizationType.required',
        message: 'Invalid type',
        metadata: {
          details: [{ message: 'Please classify the organization.' }]
        }
      }
    });
    renderForm(
      <OrganizationForm
        organizationValues={makeOrganizationValueData({
          ...existingOrganization,
          type: 'EDITION'
        })}
      />
    );
    fireEvent.change(screen.getByLabelText(/Organization name/), {
      target: { value: 'Renamed organization' }
    });
    fireEvent.click(screen.getByRole('button', { name: 'Update' }));
    await screen.findByText('Please classify the organization.');
    expect(screen.getByLabelText(/Organization name/)).toHaveValue(
      'Renamed organization'
    );
    expect(apiPatch).not.toHaveBeenCalled();
    expect(screen.getByText('Choose an organization type.')).toBeVisible();
    selectType('Caving club');
    fireEvent.click(screen.getByRole('button', { name: 'Update' }));
    await screen.findByText('Organization saved');
    expect(apiPut).toHaveBeenLastCalledWith(
      expect.stringContaining('/organizations/42'),
      expect.objectContaining({
        type: 'SPELEOLOGY',
        name: { text: 'Renamed organization', language: 'eng' }
      })
    );
  });

  it.each([
    ['Email', 'bad-email', 'The email must be valid.', 'contact@example.org'],
    ['URL', 'bad-url', 'The URL must be valid.', 'https://example.org']
  ])(
    'validates %s before saving and allows correction',
    async (label, invalid, message, valid) => {
      renderForm(
        <OrganizationForm
          organizationValues={makeOrganizationValueData({
            ...existingOrganization,
            type: 'SPELEOLOGY'
          })}
        />
      );
      const input = screen.getByLabelText(label);
      fireEvent.change(input, { target: { value: invalid } });
      await userEvent
        .setup()
        .click(screen.getByRole('button', { name: 'Update' }));
      expect(await screen.findByText(message)).toBeVisible();
      expect(apiPut).not.toHaveBeenCalled();
      fireEvent.change(input, { target: { value: valid } });
      fireEvent.click(screen.getByRole('button', { name: 'Update' }));
      await screen.findByText('Organization saved');
      expect(apiPut).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ [label === 'Email' ? 'mail' : 'url']: valid })
      );
    }
  );
});

describe('inline document organization creation', () => {
  const renderInline = (
    contextValueName,
    onCreateSuccess = vi.fn(),
    parentSubmit = vi.fn()
  ) => {
    const updateAttribute = vi.fn();
    const rendered = renderForm(
      <DocumentFormContext.Provider value={{ updateAttribute }}>
        <form onSubmit={parentSubmit}>
          <CreateNewOrganization
            enabled
            contextValueName={contextValueName}
            defaultValue=" New organization "
            onCreateSuccess={onCreateSuccess}
          />
        </form>
      </DocumentFormContext.Provider>
    );
    return { ...rendered, updateAttribute, onCreateSuccess, parentSubmit };
  };

  it.each([null, 'editor', 'library'])(
    'uses the context default when available for %s and allows overriding it',
    async contextValueName => {
      const { container, updateAttribute, onCreateSuccess, parentSubmit } =
        renderInline(contextValueName);
      expect(container.querySelectorAll('form')).toHaveLength(1);
      if (contextValueName === null) {
        fireEvent.click(screen.getByRole('button', { name: 'create' }));
        await screen.findByText('Choose an organization type.');
        expect(apiPost).not.toHaveBeenCalled();
      } else {
        expect(
          screen.getByTestId('organization-type-field').querySelector('input')
        ).toHaveValue(contextValueName === 'editor' ? 'EDITION' : 'LIBRARY');
      }
      selectType('Library / documentation centre');
      fireEvent.click(screen.getByRole('button', { name: 'create' }));
      await waitFor(() =>
        expect(onCreateSuccess).toHaveBeenCalledWith({
          id: 42,
          name: 'New organization',
          type: 'LIBRARY'
        })
      );
      expect(apiPost).toHaveBeenCalledWith(
        expect.stringContaining('/organizations'),
        { name: { text: 'New organization' }, type: 'LIBRARY' }
      );
      if (contextValueName) {
        expect(updateAttribute).toHaveBeenCalledWith(
          contextValueName,
          expect.objectContaining({ type: 'LIBRARY' })
        );
      }
      expect(parentSubmit).not.toHaveBeenCalled();
    }
  );

  it('keeps inline values on failure and creates via Enter without submitting the document', async () => {
    apiPost.mockRejectedValueOnce({
      status: 500,
      message: 'Private server detail'
    });
    const { onCreateSuccess, parentSubmit } = renderInline('editor');
    selectType('Library / documentation centre');
    const input = screen.getByLabelText(/Name/);
    fireEvent.keyDown(input, { key: 'Enter' });
    await screen.findByText('A server error occurred');
    expect(screen.queryByText('Private server detail')).not.toBeInTheDocument();
    expect(input).toHaveValue(' New organization ');
    expect(
      screen.getByRole('combobox', { name: /Organization type/ })
    ).toHaveTextContent('Library / documentation centre');
    fireEvent.keyDown(input, { key: 'Enter' });
    await waitFor(() => expect(onCreateSuccess).toHaveBeenCalledTimes(1));
    expect(parentSubmit).not.toHaveBeenCalled();
  });

  it('prevents inline writes while offline', async () => {
    state.isOnline = false;
    renderInline(null);
    selectType('Publisher');
    expect(screen.getByRole('button', { name: 'create' })).toBeDisabled();
    fireEvent.keyDown(screen.getByLabelText(/Name/), { key: 'Enter' });
    await waitFor(() => expect(apiPost).not.toHaveBeenCalled());
  });

  it('blocks duplicate inline creation while the request is pending', async () => {
    let resolveCreation;
    apiPost.mockImplementationOnce(
      () =>
        new Promise(resolve => {
          resolveCreation = resolve;
        })
    );
    const { onCreateSuccess } = renderInline(null);
    selectType('Publisher');
    fireEvent.click(screen.getByRole('button', { name: 'create' }));
    await waitFor(() => expect(apiPost).toHaveBeenCalledTimes(1));
    expect(screen.getByRole('button', { name: 'create' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'create' }));
    await act(async () =>
      resolveCreation({ id: 42, name: 'New organization', type: 'EDITION' })
    );
    expect(apiPost).toHaveBeenCalledTimes(1);
    expect(onCreateSuccess).toHaveBeenCalledTimes(1);
  });
});
