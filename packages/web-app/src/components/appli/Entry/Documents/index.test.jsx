import { fireEvent, render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import PropTypes from 'prop-types';

import Documents from './index';

const permissions = vi.hoisted(() => ({ isAuth: true }));
vi.mock('@/hooks', () => ({
  usePermissions: () => permissions,
  useOnlineStatus: () => true,
  useIsDesktopLayout: () => true,
  useAuthNavigate: () => vi.fn(),
  useLinkDocumentsToEntrance: () => ({ mutateAsync: vi.fn() }),
  useUnlinkDocumentToEntrance: () => ({ mutate: vi.fn() })
}));
vi.mock('@/components/common/Layouts/Fixed/ScrollableContent', () => ({
  default: ({ icon, content }) => (
    <div>
      {icon !== undefined && <div data-testid="action-slot">{icon}</div>}
      {content}
    </div>
  )
}));
vi.mock('@/components/appli/SearchDocumentForm', () => ({
  default: () => <div data-testid="association-form" />
}));
vi.mock('@/components/common/DocumentsList/DocumentsList', () => {
  const DocumentsList = ({ documents }) => <div>{documents.length}</div>;
  DocumentsList.propTypes = {
    documents: PropTypes.arrayOf(PropTypes.shape({}))
  };
  return { default: DocumentsList };
});
vi.mock('@/pages/EntityCreation/entityConfig', () => ({
  EntityIcon: () => null
}));

const renderDocuments = isEditAllowed => (
  <IntlProvider locale="en" messages={{}} onError={() => {}}>
    <Documents documents={[]} entranceId={42} isEditAllowed={isEditAllowed} />
  </IntlProvider>
);

describe('entrance document association permissions', () => {
  beforeEach(() => {
    permissions.isAuth = true;
  });

  it.each(['deleted entrance', 'logged out'])(
    'removes the open search and the action slot for a %s',
    reason => {
      const { rerender } = render(renderDocuments(true));
      fireEvent.click(screen.getByTestId('associate-documents-button'));
      expect(screen.getByTestId('association-form')).toBeInTheDocument();

      if (reason === 'logged out') permissions.isAuth = false;
      rerender(renderDocuments(reason !== 'deleted entrance'));

      expect(screen.queryByTestId('association-form')).not.toBeInTheDocument();
      expect(screen.queryByTestId('action-slot')).not.toBeInTheDocument();
    }
  );
});
