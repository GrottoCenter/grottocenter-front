import { CircularProgress } from '@mui/material';
import { useIntl } from 'react-intl';
import { useNavigate, useParams } from 'react-router-dom';

import GuidelineForm from '@/components/appli/EntitiesForm/Guideline';
import FetchErrorState from '@/components/common/FetchErrorState';
import Layout from '@/components/common/Layouts/Fixed/FixedContent';
import { useGuideline, usePatchGuideline } from '@/hooks';
import { EntityIcon } from '@/pages/EntityCreation/entityConfig';

const GuidelineEdit = () => {
  const { guidelineId } = useParams();
  const navigate = useNavigate();
  const { formatMessage } = useIntl();
  const { data, error, isPending, fetchStatus, refetch } =
    useGuideline(guidelineId);
  const mutation = usePatchGuideline();

  const handleSubmit = async ({
    title,
    description,
    language,
    countries,
    regions,
    massifs
  }) => {
    try {
      await mutation.mutateAsync({
        id: guidelineId,
        title,
        description,
        language,
        countries,
        regions,
        massifs
      });
      navigate(`/ui/guidelines/${guidelineId}`, { replace: true });
    } catch {
      /* toast handled globally */
    }
  };

  let content = <CircularProgress />;
  if (error || fetchStatus === 'paused') {
    content = (
      <FetchErrorState
        error={error}
        isPaused={fetchStatus === 'paused'}
        messageId="guidelines.public.fetch_error"
        onRetry={refetch}
      />
    );
  } else if (!isPending && data) {
    content = (
      <GuidelineForm
        isNew={false}
        withScope
        values={data}
        closeForm={() => navigate(`/ui/guidelines/${guidelineId}`)}
        onSubmit={handleSubmit}
      />
    );
  }

  return (
    <Layout
      icon={<EntityIcon iconType="guidelines" />}
      title={data?.title ?? formatMessage({ id: 'Loading ...' })}
      content={content}
    />
  );
};

export default GuidelineEdit;
