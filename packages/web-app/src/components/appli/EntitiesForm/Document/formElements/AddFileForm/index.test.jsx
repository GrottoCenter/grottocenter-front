import { useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { IntlProvider } from 'react-intl';

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
  useDocuments: () => ({ data: [] }),
  findLicenseByName: () => null
}));

const formContext = {
  document: { parent: null, authorizationDocument: null, license: null },
  updateAttribute: vi.fn()
};

const UploadForm = ({ type }) => {
  const [files, setFiles] = useState([]);
  return (
    <IntlProvider locale="en" messages={messages}>
      <DocumentFormContext.Provider value={formContext}>
        <AddFileForm
          files={files}
          setFiles={setFiles}
          acceptConfig={DOCUMENT_TYPE_ACCEPT[type] ?? null}
          showAuthorization={false}
        />
      </DocumentFormContext.Provider>
    </IntlProvider>
  );
};

describe('document uploads', () => {
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
      new File(['obj'], 'object.obj', { type: 'model/obj' })
    );
    expect(
      await screen.findByText('The file type is not accepted: object.obj.')
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
