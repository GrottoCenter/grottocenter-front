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
    mimeTypes: ['model/gltf-binary', 'model/gltf+json', 'model/obj'],
    extensions: ['glb         ', 'gltf        ', 'obj         '],
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

describe('3D document uploads', () => {
  it.each([DocumentTypes.TOPOGRAPHIC_DATA, DocumentTypes.PHYSICAL_OBJECT])(
    'accepts GLB and glTF for %s when MIME types are missing or generic',
    async type => {
      const user = userEvent.setup({ applyAccept: false });
      const { container } = render(<UploadForm type={type} />);
      const input = container.querySelector('input[type="file"]');
      expect(input.accept).toContain('.glb');
      expect(input.accept).toContain('.gltf');
      await user.upload(input, [
        new File(['glb'], 'scan.glb', { type: '' }),
        new File(['{}'], 'object.gltf', { type: 'application/json' })
      ]);
      expect(await screen.findByText('scan.glb')).toBeInTheDocument();
      expect(await screen.findByText('object.gltf')).toBeInTheDocument();
    }
  );

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
