import { useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { IntlProvider } from 'react-intl';
import { MemoryRouter } from 'react-router-dom';

import messages from '@/../public/lang/en.json';
import { MAX_SIZE_OF_UPLOADED_FILES } from '@/conf/config';
import {
  DOCUMENT_TYPE_ACCEPT,
  DocumentTypes
} from '@/utils/documentTypeHelpers';
import { DocumentFormContext } from '@/components/appli/EntitiesForm/Document/Provider';
import AddFileForm from './index';

const dropzoneOptions = vi.hoisted(() => ({}));

vi.mock('react-dropzone', async importOriginal => {
  const actual = await importOriginal();
  return {
    ...actual,
    useDropzone: options =>
      actual.useDropzone({ ...options, ...dropzoneOptions })
  };
});

vi.mock('@/hooks', () => ({
  useFileFormats: () => ({
    mimeTypes: [
      'model/gltf-binary',
      'model/gltf+json',
      'model/obj',
      'image/png'
    ],
    extensions: [
      'glb         ',
      'gltf        ',
      'obj         ',
      'png         '
    ],
    isLoading: false
  }),
  useLicenses: () => ({ data: [] }),
  useUserProperties: () => ({ id: 1 }),
  findLicenseByName: () => null
}));

const formContext = {
  document: { parent: null, authorizationDocument: null, license: null },
  updateAttribute: vi.fn()
};

const UploadForm = ({ type, initialFiles = [], fileError }) => {
  const [files, setFiles] = useState(initialFiles);
  return (
    <MemoryRouter>
      <IntlProvider locale="en" messages={messages}>
        <DocumentFormContext.Provider value={formContext}>
          <AddFileForm
            files={files}
            setFiles={setFiles}
            acceptConfig={DOCUMENT_TYPE_ACCEPT[type] ?? null}
            fileError={fileError}
          />
          <output data-testid="file-values">{JSON.stringify(files)}</output>
        </DocumentFormContext.Provider>
      </IntlProvider>
    </MemoryRouter>
  );
};

describe('document uploads', () => {
  const readFiles = () =>
    JSON.parse(screen.getByTestId('file-values').textContent);

  it('keeps automatic detection untouched until an explicit choice and can restore it', async () => {
    const user = userEvent.setup({ applyAccept: false });
    const { container } = render(<UploadForm type={DocumentTypes.IMAGE} />);
    await user.upload(
      container.querySelector('input[type="file"]'),
      new File(['photo'], 'sphere.png', { type: 'image/png' })
    );
    const toggle = await screen.findByTestId('panorama-display-toggle');
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(readFiles()[0]).not.toHaveProperty('isPanorama');
    await user.click(toggle);
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toHaveAttribute('aria-checked', 'mixed');
    expect(readFiles()[0]).not.toHaveProperty('isPanorama');
    await user.click(checkbox);
    expect(readFiles()[0]).toMatchObject({ isPanorama: true, state: 'IS_NEW' });
    await user.click(checkbox);
    expect(readFiles()[0]).toMatchObject({
      isPanorama: false,
      state: 'IS_NEW'
    });
    await user.click(toggle);
    await user.click(toggle);
    expect(screen.getByRole('checkbox')).not.toBeChecked();
    await user.click(
      screen.getByRole('button', { name: messages['panorama.useAutomatic'] })
    );
    expect(readFiles()[0]).not.toHaveProperty('isPanorama');
  });

  it.each([true, false, undefined])(
    'initializes an existing %s flag and proposes the corrected value',
    async isPanorama => {
      const user = userEvent.setup();
      const file = {
        id: 1,
        fileName: 'sphere.jpg',
        completePath: '/sphere.jpg',
        state: 'IS_INTACT',
        isPanorama,
        pdfPageOffset: 0
      };
      render(<UploadForm type={DocumentTypes.IMAGE} initialFiles={[file]} />);
      await user.click(screen.getByTestId('panorama-display-toggle'));
      const checkbox = screen.getByRole('checkbox');
      expect(checkbox.checked).toBe(isPanorama === true);
      expect(
        screen.queryByText(messages['panorama.useAutomatic'])
      ).not.toBeInTheDocument();
      await user.click(checkbox);
      expect(readFiles()[0]).toMatchObject({
        id: 1,
        isPanorama: isPanorama !== true,
        state: 'IS_MODIFIED',
        pdfPageOffset: 0
      });
    }
  );

  it('shows a localized error on the appropriate collapsed file and clears it when corrected', async () => {
    const user = userEvent.setup();
    const first = { id: 1, fileName: 'first.jpg', state: 'IS_INTACT' };
    const second = {
      id: 2,
      fileName: 'second.jpg',
      isPanorama: true,
      state: 'IS_MODIFIED'
    };
    render(
      <UploadForm
        type={DocumentTypes.IMAGE}
        initialFiles={[first, second]}
        fileError={{ file: second, code: 'E_INCOMPATIBLE_PANORAMA' }}
      />
    );
    expect(screen.getByTestId('selected-file-second.jpg')).toContainElement(
      screen.getByRole('alert')
    );
    expect(screen.getByRole('alert')).toHaveTextContent(
      messages.E_INCOMPATIBLE_PANORAMA
    );
    await user.click(screen.getAllByTestId('panorama-display-toggle')[1]);
    await user.click(screen.getByRole('checkbox'));
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(readFiles()[1].isPanorama).toBe(false);
  });

  it('does not offer the setting for unsupported formats or download an image to decide', () => {
    const { container } = render(
      <UploadForm
        type={DocumentTypes.BOOK}
        initialFiles={[
          { id: 1, fileName: 'animation.gif', completePath: '/animation.gif' },
          { id: 2, fileName: 'movie.mp4', completePath: '/movie.mp4' },
          { id: 3, fileName: 'scan.pdf', completePath: '/scan.pdf' }
        ]}
      />
    );
    expect(
      screen.queryByTestId('panorama-display-toggle')
    ).not.toBeInTheDocument();
    expect(container.querySelector('img')).toBeNull();
    expect(screen.getByTestId('pdf-page-offset')).toBeInTheDocument();
  });
  afterEach(() => {
    Object.keys(dropzoneOptions).forEach(key => {
      delete dropzoneOptions[key];
    });
  });

  it.each([
    ['too small', { minSize: 100 }],
    ['too many files', { maxFiles: 1 }],
    [
      'unknown reason',
      { validator: () => ({ code: 'custom-rejection', message: 'Rejected' }) }
    ]
  ])(
    'identifies both files rejected for %s with the real message catalogue',
    async (_reason, options) => {
      Object.assign(dropzoneOptions, options);
      const user = userEvent.setup({ applyAccept: false });
      const { container } = render(<UploadForm type={DocumentTypes.IMAGE} />);

      await user.upload(container.querySelector('input[type="file"]'), [
        new File(['image'], 'scan.png', { type: 'image/png' }),
        new File(['image'], 'photo.png', { type: 'image/png' })
      ]);

      expect(
        await screen.findByText('This file was rejected: scan.png.')
      ).toBeInTheDocument();
      expect(
        await screen.findByText('This file was rejected: photo.png.')
      ).toBeInTheDocument();
      expect(
        screen.queryByText('scan.png', { exact: true })
      ).not.toBeInTheDocument();
      expect(
        screen.queryByText('photo.png', { exact: true })
      ).not.toBeInTheDocument();
    }
  );

  it('identifies both oversized files and the accepted size with the real message catalogue', async () => {
    const user = userEvent.setup({ applyAccept: false });
    const { container } = render(<UploadForm type={DocumentTypes.IMAGE} />);
    const files = ['scan.png', 'photo.png'].map(name => {
      const file = new File(['image'], name, { type: 'image/png' });
      Object.defineProperty(file, 'size', {
        value: MAX_SIZE_OF_UPLOADED_FILES + 1
      });
      return file;
    });

    await user.upload(container.querySelector('input[type="file"]'), files);

    const maxSize = `${MAX_SIZE_OF_UPLOADED_FILES / 1000000} Mo`;
    expect(
      await screen.findByText(
        `The following file is too big: scan.png. Max accepted size: ${maxSize}`
      )
    ).toBeInTheDocument();
    expect(
      await screen.findByText(
        `The following file is too big: photo.png. Max accepted size: ${maxSize}`
      )
    ).toBeInTheDocument();
    expect(
      screen.queryByText('scan.png', { exact: true })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText('photo.png', { exact: true })
    ).not.toBeInTheDocument();
  });

  it('accepts topographic GLB and glTF when MIME types are missing or generic', async () => {
    const user = userEvent.setup({ applyAccept: false });
    const { container } = render(
      <UploadForm type={DocumentTypes.TOPOGRAPHIC_DATA} />
    );
    const input = container.querySelector('input[type="file"]');
    expect(input.accept).toContain('.glb');
    expect(input.accept).toContain('.gltf');
    await user.upload(input, [
      new File(['glb'], 'scan.glb', { type: '' }),
      new File(['{}'], 'object.gltf', { type: 'application/json' })
    ]);
    expect(await screen.findByText('scan.glb')).toBeInTheDocument();
    expect(await screen.findByText('object.gltf')).toBeInTheDocument();
  });

  it('uses backend formats for physical objects without a 3D-only restriction', async () => {
    const user = userEvent.setup({ applyAccept: false });
    const { container } = render(
      <UploadForm type={DocumentTypes.PHYSICAL_OBJECT} />
    );
    const input = container.querySelector('input[type="file"]');
    expect(input.accept).toContain('.png');
    await user.upload(
      input,
      new File(['photo'], 'specimen.png', { type: 'image/png' })
    );
    expect(await screen.findByText('specimen.png')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('identifies each rejected file with the real message catalogue', async () => {
    const user = userEvent.setup({ applyAccept: false });
    const { container } = render(
      <UploadForm type={DocumentTypes.TOPOGRAPHIC_DATA} />
    );
    await user.upload(container.querySelector('input[type="file"]'), [
      new File(['model'], 'scan.stl', {
        type: 'application/octet-stream'
      }),
      new File(['video'], 'clip.mp4', { type: 'video/mp4' })
    ]);
    expect(
      await screen.findByText('The file type is not accepted: scan.stl.')
    ).toBeInTheDocument();
    expect(
      await screen.findByText('The file type is not accepted: clip.mp4.')
    ).toBeInTheDocument();
    expect(
      screen.queryByText('scan.stl', { exact: true })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText('clip.mp4', { exact: true })
    ).not.toBeInTheDocument();

    await user.upload(
      container.querySelector('input[type="file"]'),
      new File(['csv'], 'table.csv', { type: 'text/csv' })
    );
    expect(
      await screen.findByText('The file type is not accepted: table.csv.')
    ).toBeInTheDocument();
    expect(
      screen.queryByText('The file type is not accepted: scan.stl.')
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText('The file type is not accepted: clip.mp4.')
    ).not.toBeInTheDocument();
  });

  it('rejects an Image extension outside its configured list despite matching image/*', async () => {
    const user = userEvent.setup({ applyAccept: false });
    const { container } = render(<UploadForm type={DocumentTypes.IMAGE} />);
    await user.upload(
      container.querySelector('input[type="file"]'),
      new File(['image'], 'photo.webp', { type: 'image/webp' })
    );
    expect(
      await screen.findByText('The file type is not accepted: photo.webp.')
    ).toBeInTheDocument();
    expect(
      screen.queryByText('photo.webp', { exact: true })
    ).not.toBeInTheDocument();
  });
});
