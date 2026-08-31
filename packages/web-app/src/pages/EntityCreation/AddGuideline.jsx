import { useIntl } from 'react-intl';
import { useNavigate } from 'react-router-dom';

import GuidelineForm from '@/components/appli/EntitiesForm/Guideline';
import Layout from '@/components/common/Layouts/Fixed/FixedContent';
import { usePostGuideline } from '@/hooks';
import { EntityIcon } from './entityConfig';

const AddGuideline = () => {
  const { formatMessage } = useIntl();
  const navigate = useNavigate();
  const mutation = usePostGuideline();

  const handleSubmit = async values => {
    try {
      const guideline = await mutation.mutateAsync(values);
      navigate(
        guideline?.id ? `/ui/guidelines/${guideline.id}` : '/ui/guidelines',
        { replace: true }
      );
    } catch {
      /* toast handled globally */
    }
  };

  return (
    <Layout
      icon={<EntityIcon iconType="guidelines" />}
      title={formatMessage({ id: 'guidelines.create_new' })}
      content={
        <GuidelineForm
          isNew
          withScope
          closeForm={() => navigate(-1)}
          onSubmit={handleSubmit}
        />
      }
    />
  );
};

export default AddGuideline;
