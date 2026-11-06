import PropTypes from 'prop-types';
import { CircularProgress } from '@mui/material';
import { useIntl } from 'react-intl';
import { Navigate, useNavigate, useParams } from 'react-router-dom';

import PointForm from '@/components/appli/EntitiesForm/Point';
import CustomIcon from '@/components/common/CustomIcon';
import FetchErrorState from '@/components/common/FetchErrorState';
import Layout from '@/components/common/Layouts/Fixed/FixedContent';
import { usePoint, useCreatePoint, useUpdatePoint } from '@/hooks';
import { EntityIcon } from '@/pages/EntityCreation/entityConfig';

const PointEdit = ({ isNew = false }) => {
  const { pointId } = useParams();
  const navigate = useNavigate();
  const { formatMessage } = useIntl();
  const query = usePoint(isNew ? null : pointId);
  const createMutation = useCreatePoint();
  const updateMutation = useUpdatePoint();
  const mutation = isNew ? createMutation : updateMutation;
  const target = isNew ? '/ui/points' : `/ui/points/${pointId}`;

  const handleSubmit = async body => {
    const point = await mutation.mutateAsync(
      isNew ? body : { id: pointId, ...body }
    );
    navigate(`/ui/points/${isNew ? point.id : pointId}`, { replace: true });
  };

  if (!isNew && query.data?.isDeleted) {
    return <Navigate to={target} replace />;
  }

  let content = <CircularProgress />;
  if (!isNew && (query.error || query.isPaused)) {
    content = (
      <FetchErrorState
        error={query.error}
        isPaused={query.isPaused}
        messageId="points.fetchError"
        onRetry={query.refetch}
      />
    );
  } else if (isNew || query.data) {
    content = (
      <PointForm
        key={isNew ? 'new' : pointId}
        isNew={isNew}
        values={isNew ? undefined : query.data}
        error={mutation.error}
        onSubmit={handleSubmit}
        onCancel={() => navigate(target)}
      />
    );
  }

  return (
    <Layout
      title={isNew ? formatMessage({ id: 'points.create' }) : query.data?.label}
      icon={
        isNew ? <EntityIcon iconType="point" /> : <CustomIcon type="point" />
      }
      content={content}
    />
  );
};

PointEdit.propTypes = { isNew: PropTypes.bool };

export default PointEdit;
