import { screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import { useDocument } from '@/hooks';
import { renderWithProviders } from '@/test/renderWithProviders';
import messages from '@/../public/lang/en.json';
import DocumentEdit from './index';

vi.mock('@/hooks', () => ({
  useDocument: vi.fn(),
  useOnlineStatus: () => true
}));
vi.mock('../../components/appli/EntitiesForm/Document', () => ({
  default: ({ initialValues }) => (
    <div data-testid="edit-files">
      {initialValues.files
        .map(file => `${file.fileName}:${file.state}`)
        .join(',')}
    </div>
  )
}));
const current = {
  id: 7,
  files: [{ id: 1, fileName: 'old.pdf', completePath: '/old.pdf' }]
};
const onCancel = vi.fn();
const renderEdit = () =>
  renderWithProviders(
    <MemoryRouter>
      <DocumentEdit id={7} requireUpdate onCancel={onCancel} />
    </MemoryRouter>,
    { messages }
  );

describe('editing a pending document', () => {
  it('prevents silently dropping pending uploaded files', () => {
    useDocument.mockImplementation((_id, options) => ({
      data: options?.requireUpdate ? { id: 7, newFiles: [{ id: 2 }] } : current,
      isPending: false
    }));
    renderEdit();
    expect(screen.queryByTestId('edit-files')).not.toBeInTheDocument();
    expect(
      screen.getByText(messages['documentModeration.pendingFilesEdit'])
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onCancel).toHaveBeenCalled();
  });

  it('passes existing rename states to the form', () => {
    useDocument.mockImplementation((_id, options) => ({
      data: options?.requireUpdate
        ? { id: 7, modifiedFiles: [{ id: 1, fileName: 'renamed.pdf' }] }
        : current,
      isPending: false
    }));
    renderEdit();
    expect(screen.getByTestId('edit-files')).toHaveTextContent(
      'renamed.pdf:IS_MODIFIED'
    );
  });
});
