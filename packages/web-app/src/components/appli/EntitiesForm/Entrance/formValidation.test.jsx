import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import messages from '@/../public/lang/en.json';
import { EntranceForm } from './index';
import { NetworkForm } from '../Network';

const mocks = vi.hoisted(() => ({
  create: vi.fn(),
  createEntrance: vi.fn(),
  update: vi.fn(),
  updateEntrance: vi.fn(),
  updateNetwork: vi.fn(),
  isAdmin: true
}));

vi.mock('react-redux', () => ({
  useSelector: selector =>
    selector({
      intl: { locale: 'en', AVAILABLE_LANGUAGES: { en: { id: 'eng' } } }
    })
}));

vi.mock('../../../../hooks', () => ({
  useCreateEntrance: () => ({ mutate: mocks.createEntrance }),
  useUpdateEntrance: () => ({ mutate: mocks.updateEntrance }),
  useCreateCaveAndEntrance: () => ({ mutate: mocks.create }),
  useUpdateCaveAndEntrance: () => ({ mutate: mocks.update }),
  useUpdateCave: () => ({ mutate: mocks.updateNetwork }),
  usePermissions: () => ({ isAdmin: mocks.isAdmin }),
  useNotification: () => ({ onInfo: vi.fn() }),
  useNearbyEntrances: () => [],
  useProjections: () => [],
  useLanguages: () => ({
    data: [{ id: 'eng', refName: 'English' }],
    isSuccess: true
  }),
  WGS84_DD: 'WGS84',
  DMS_CODE: 'DMS'
}));

vi.mock('./NameSuggestionDropdown', () => ({
  default: ({ children }) => children
}));
vi.mock('./NetworkMembershipSection', () => ({ default: () => null }));
vi.mock('./EntranceAttributes', () => ({ default: () => null }));
vi.mock('../utils/LicenseBox', () => ({ default: () => null }));
vi.mock('../utils/FormProgressInfo', () => ({ default: () => <p>Saving</p> }));
vi.mock('../../../common/CRSMenu', () => ({ default: () => null }));
vi.mock('../utils/MapMarkerSelector', () => ({
  default: ({ onLatitudeChange, onLongitudeChange }) => (
    <button
      type="button"
      onClick={() => {
        onLatitudeChange('45');
        onLongitudeChange('6');
      }}>
      Set map position
    </button>
  )
}));
vi.mock('../../../common/AutoCompleteSearch/CaveAutoCompleteSearch', () => ({
  default: ({ onSelection, inputRef, onBlur, error, helperText }) => (
    <>
      <input aria-label="Network search" ref={inputRef} onBlur={onBlur} />
      {error && <span>{helperText}</span>}
      <button
        type="button"
        onClick={() =>
          onSelection({
            id: 7,
            name: 'Shared cave',
            depth: 20001,
            length: 100000001,
            temperature: 101
          })
        }>
        Select network
      </button>
    </>
  )
}));
vi.mock('../utils/FormContainers', async importOriginal => {
  const actual = await importOriginal();
  return {
    ...actual,
    FormActionRow: ({ isNew, disabled, isSubmitting }) => (
      <button type="submit" disabled={disabled || isSubmitting}>
        {isNew ? 'Create' : 'Update'}
      </button>
    )
  };
});

const cave = {
  id: 7,
  name: 'Test cave',
  language: 'eng',
  depth: 10,
  length: 100,
  temperature: 10,
  entrances: [{ id: 42 }]
};
const entrance = {
  id: 42,
  name: 'Test cave',
  language: 'eng',
  latitude: 45,
  longitude: 6,
  altitude: 100,
  yearDiscovery: 2000
};
const renderForm = element =>
  render(
    <IntlProvider
      locale="en"
      messages={{
        ...messages,
        'Latitude must be between -90 and 90':
          'Latitude must be between -90 and 90'
      }}>
      {element}
    </IntlProvider>
  );

beforeEach(() => {
  vi.clearAllMocks();
  mocks.isAdmin = true;
});

describe('entrance and network submission validation', () => {
  it.each([null, 11])(
    'saves an image-only change from %s without changing the cave',
    async featuredFile => {
      renderForm(
        <EntranceForm
          entranceValues={{
            ...entrance,
            featuredFile,
            documents: [
              {
                id: 3,
                files: [
                  { id: 11, fileName: 'first.jpg', completePath: '/first.jpg' },
                  {
                    id: 12,
                    fileName: 'second.jpg',
                    completePath: '/second.jpg'
                  }
                ]
              }
            ]
          }}
          caveValues={cave}
        />
      );
      expect(screen.queryByRole('radiogroup')).toBeNull();
      fireEvent.click(screen.getByTestId('featured-image-toggle'));
      fireEvent.click(screen.getByRole('radio', { name: 'Image 2 of 2' }));
      expect(screen.getByRole('radiogroup')).toBeVisible();
      fireEvent.click(screen.getByText('Update'));
      await waitFor(() =>
        expect(mocks.updateEntrance).toHaveBeenCalledTimes(1)
      );
      expect(mocks.updateEntrance.mock.calls[0][0]).toMatchObject({
        id: 42,
        featuredFile: 12
      });
      expect(mocks.update).not.toHaveBeenCalled();
    }
  );

  it.each([
    { files: [] },
    { files: [{ id: 11, fileName: 'first.jpg', completePath: '/first.jpg' }] },
    { files: [{ id: 12, fileName: 'other.jpg', completePath: '/other.jpg' }] }
  ])('explicitly clears a saved image with null (%j)', async ({ files }) => {
    renderForm(
      <EntranceForm
        entranceValues={{
          ...entrance,
          featuredFile: 11,
          documents: [
            {
              id: 3,
              files
            }
          ]
        }}
        caveValues={cave}
      />
    );
    fireEvent.click(screen.getByTestId('featured-image-toggle'));
    fireEvent.click(screen.getByRole('radio', { name: 'No featured image' }));
    fireEvent.click(screen.getByText('Update'));
    await waitFor(() => expect(mocks.updateEntrance).toHaveBeenCalledTimes(1));
    expect(mocks.updateEntrance.mock.calls[0][0].featuredFile).toBeNull();
  });

  it.each([
    ['Altitude', null],
    ['Altitude', 11],
    ['Depth', 11]
  ])(
    'omits an unchanged featured image (%s, %s) during unrelated edits',
    async (label, featuredFile) => {
      renderForm(
        <EntranceForm
          entranceValues={{ ...entrance, featuredFile, documents: [] }}
          caveValues={cave}
        />
      );
      fireEvent.change(screen.getByLabelText(label), {
        target: { value: '101' }
      });
      fireEvent.click(screen.getByText('Update'));
      const mutation = label === 'Depth' ? mocks.update : mocks.updateEntrance;
      await waitFor(() => expect(mutation).toHaveBeenCalledOnce());
      const payload =
        label === 'Depth'
          ? mutation.mock.calls[0][0].entranceData
          : mutation.mock.calls[0][0];
      expect(payload).not.toHaveProperty('featuredFile');
    }
  );

  it.each([
    ['Altitude', '10000', '9999'],
    ['Depth', '20001', '20000'],
    ['Development', '100000001', '100000000'],
    ['Temperature', '101', '100'],
    ['Year of discovery', '-10000', '-9999']
  ])(
    'blocks an invalid %s and focuses it on submit',
    async (label, invalid, valid) => {
      renderForm(<EntranceForm entranceValues={entrance} caveValues={cave} />);
      const input = screen.getByLabelText(label);
      fireEvent.change(input, { target: { value: invalid } });
      expect(input).toHaveAttribute('aria-invalid', 'false');
      expect(screen.getByText('Update')).toBeEnabled();
      fireEvent.click(screen.getByText('Update'));
      await waitFor(() => expect(input).toHaveFocus());
      expect(input).toHaveAttribute('aria-invalid', 'true');
      expect(mocks.update).not.toHaveBeenCalled();
      expect(mocks.updateEntrance).not.toHaveBeenCalled();
      fireEvent.change(input, { target: { value: valid } });
      await waitFor(() =>
        expect(input).toHaveAttribute('aria-invalid', 'false')
      );
      fireEvent.click(screen.getByText('Update'));
      await waitFor(() =>
        expect(
          mocks.update.mock.calls.length +
            mocks.updateEntrance.mock.calls.length
        ).toBe(1)
      );
    }
  );

  it('validates required fields with an active create button and keeps map rules', async () => {
    renderForm(<EntranceForm />);
    expect(screen.getByText('Create')).toBeEnabled();
    fireEvent.click(screen.getByText('Create'));
    await waitFor(() =>
      expect(
        screen.getByLabelText('Entrance name', { exact: false })
      ).toHaveFocus()
    );
    expect(mocks.create).not.toHaveBeenCalled();
    fireEvent.change(screen.getByLabelText('Entrance name', { exact: false }), {
      target: { value: 'New cave' }
    });
    fireEvent.click(screen.getByText('Set map position'));
    fireEvent.change(screen.getByLabelText('Latitude', { exact: false }), {
      target: { value: '91' }
    });
    fireEvent.click(screen.getByText('Create'));
    await screen.findByText('Latitude must be between -90 and 90');
    expect(mocks.create).not.toHaveBeenCalled();
    fireEvent.click(screen.getByText('Set map position'));
    fireEvent.click(screen.getByText('Create'));
    await waitFor(() => expect(mocks.create).toHaveBeenCalledOnce());
  });

  it('does not create an entrance with invalid numeric values, including direct submission', async () => {
    const { container } = renderForm(<EntranceForm />);
    fireEvent.change(screen.getByLabelText('Entrance name', { exact: false }), {
      target: { value: 'New cave' }
    });
    fireEvent.click(screen.getByText('Set map position'));
    const fields = [
      ['Altitude', '10000', '9999'],
      ['Depth', '20001', '20000'],
      ['Development', '100000001', '100000000'],
      ['Temperature', '101', '100'],
      ['Year of discovery', '-10000', '-9999']
    ];
    fields.forEach(([label, invalid]) => {
      fireEvent.change(screen.getByLabelText(label), {
        target: { value: invalid }
      });
    });
    fireEvent.submit(container.querySelector('form'));
    await waitFor(() =>
      expect(screen.getByLabelText('Altitude')).toHaveFocus()
    );
    fields.forEach(([label]) =>
      expect(screen.getByLabelText(label)).toHaveAttribute(
        'aria-invalid',
        'true'
      )
    );
    expect(mocks.create).not.toHaveBeenCalled();
    expect(mocks.createEntrance).not.toHaveBeenCalled();
    fields.forEach(([label, _invalid, valid]) => {
      fireEvent.change(screen.getByLabelText(label), {
        target: { value: valid }
      });
    });
    fireEvent.click(screen.getByText('Create'));
    await waitFor(() => expect(mocks.create).toHaveBeenCalledOnce());
  });

  it('requires a network selection but does not validate locked historical characteristics', async () => {
    renderForm(<EntranceForm />);
    fireEvent.change(screen.getByLabelText('Entrance name', { exact: false }), {
      target: { value: 'New entrance' }
    });
    fireEvent.click(screen.getByText('Set map position'));
    fireEvent.click(
      screen.getByLabelText('Link to an existing entrance or network')
    );
    fireEvent.click(screen.getByText('Create'));
    await waitFor(() =>
      expect(screen.getByLabelText('Network search')).toHaveFocus()
    );
    expect(mocks.createEntrance).not.toHaveBeenCalled();
    fireEvent.click(screen.getByText('Select network'));
    fireEvent.click(screen.getByText('Create'));
    await waitFor(() => expect(mocks.createEntrance).toHaveBeenCalledOnce());
  });

  it('allows non-admin edits with hidden coordinates and locked cave values', async () => {
    mocks.isAdmin = false;
    renderForm(
      <EntranceForm
        entranceValues={{
          ...entrance,
          isSensitive: true,
          latitude: null,
          longitude: null
        }}
        caveValues={{
          ...cave,
          depth: 20001,
          temperature: 101,
          entrances: [{ id: 42 }, { id: 43 }]
        }}
      />
    );
    fireEvent.change(screen.getByLabelText('Altitude'), {
      target: { value: '101' }
    });
    fireEvent.click(screen.getByText('Update'));
    await waitFor(() => expect(mocks.updateEntrance).toHaveBeenCalledOnce());
    expect(mocks.updateEntrance.mock.calls[0][0]).not.toHaveProperty(
      'latitude'
    );
  });

  it('restores numeric rules after selecting a network and switching back', async () => {
    renderForm(<EntranceForm />);
    fireEvent.change(screen.getByLabelText('Entrance name', { exact: false }), {
      target: { value: 'New entrance' }
    });
    fireEvent.click(screen.getByText('Set map position'));
    const toggle = screen.getByLabelText(
      'Link to an existing entrance or network'
    );
    fireEvent.click(toggle);
    fireEvent.click(screen.getByText('Select network'));
    fireEvent.click(toggle);
    const depth = screen.getByLabelText('Depth');
    fireEvent.change(depth, { target: { value: '20001' } });
    fireEvent.click(screen.getByText('Create'));
    await waitFor(() => expect(depth).toHaveFocus());
    expect(mocks.create).not.toHaveBeenCalled();
    fireEvent.change(depth, { target: { value: '20000' } });
    fireEvent.click(screen.getByText('Create'));
    await waitFor(() => expect(mocks.create).toHaveBeenCalledOnce());
    expect(mocks.create.mock.calls[0][0].entranceData.cave).toBeNull();
  });

  it('validates network fields on blur and on form submission', async () => {
    const { container } = renderForm(<NetworkForm networkValues={cave} />);
    const temperature = screen.getByLabelText('Temperature');
    fireEvent.change(temperature, { target: { value: '101' } });
    expect(temperature).toHaveAttribute('aria-invalid', 'false');
    fireEvent.blur(temperature);
    await screen.findByText('Temperature must be between -100 and 100 °C');
    fireEvent.submit(container.querySelector('form'));
    await waitFor(() => expect(temperature).toHaveFocus());
    expect(mocks.updateNetwork).not.toHaveBeenCalled();
    fireEvent.change(temperature, { target: { value: '100' } });
    await waitFor(() =>
      expect(temperature).toHaveAttribute('aria-invalid', 'false')
    );
    fireEvent.click(screen.getByText('Update'));
    await waitFor(() => expect(mocks.updateNetwork).toHaveBeenCalledOnce());
  });
});
