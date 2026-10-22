import { useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { IntlProvider } from 'react-intl';

import messages from '@/../public/lang/en.json';
import {
  DOCUMENT_TYPE_ACCEPT,
  DocumentTypes
} from '@/utils/documentTypeHelpers';
import { DocumentFormContext } from '@/components/appli/EntitiesForm/Document/Provider';
import AddFileForm from './index';

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

  it('keeps non-topographic formats out of the restricted topographic picker', async () => {
    const user = userEvent.setup({ applyAccept: false });
    const { container } = render(
      <UploadForm type={DocumentTypes.TOPOGRAPHIC_DATA} />
    );
    await user.upload(
      container.querySelector('input[type="file"]'),
      new File(['obj'], 'object.obj', { type: 'model/obj' })
    );
    expect(
      await screen.findByText(messages['error on file type'])
    ).toBeInTheDocument();
    expect(
      screen.queryByText('object.obj', { exact: true })
    ).not.toBeInTheDocument();
  });
});
