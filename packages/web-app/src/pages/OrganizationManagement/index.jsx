import { useState } from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import { Navigate, useSearchParams } from 'react-router-dom';
import BusinessIcon from '@mui/icons-material/Business';

import Organization from '@/components/appli/Organization';
import PageContainer from '@/components/common/Layouts/PageContainer';
import PageHeader from '@/components/common/Layouts/PageHeader';
import StandardDialog from '@/components/common/StandardDialog';
import { useOrganization, usePermissions } from '@/hooks';
import DuplicatesSection from './DuplicatesSection';

const OrganizationPreview = ({ id, onClose }) => {
  const { formatMessage } = useIntl();
  const { data, error, isFetching, isPaused } = useOrganization(id);

  return (
    <StandardDialog
      open
      onClose={onClose}
      title={formatMessage({ id: 'Organization' })}
      fullScreenOnMobile
      maxWidth="xl">
      <Organization
        key={id}
        organization={data}
        error={error}
        isLoading={isFetching}
        isPaused={isPaused}
        isPreview
      />
    </StandardDialog>
  );
};

OrganizationPreview.propTypes = {
  id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
  onClose: PropTypes.func.isRequired
};

const OrganizationManagementContent = () => {
  const { formatMessage } = useIntl();
  const [previewId, setPreviewId] = useState(null);

  return (
    <PageContainer>
      <PageHeader
        title={formatMessage({ id: 'Organization management' })}
        icon={<BusinessIcon />}
      />
      <DuplicatesSection onPreview={setPreviewId} />
      {previewId != null && (
        <OrganizationPreview
          id={previewId}
          onClose={() => setPreviewId(null)}
        />
      )}
    </PageContainer>
  );
};

const OrganizationManagement = () => {
  const [searchParams] = useSearchParams();
  const { isAuth, isModerator } = usePermissions();

  if (searchParams.get('tab') === 'deleted') {
    return <Navigate to="/ui/deleted-entities?type=organizations" replace />;
  }
  return isAuth && isModerator ? (
    <OrganizationManagementContent />
  ) : (
    <Navigate to="/ui/dashboard" replace />
  );
};

export default OrganizationManagement;
