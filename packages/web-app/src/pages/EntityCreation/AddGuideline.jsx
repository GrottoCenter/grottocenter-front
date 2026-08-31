import { useIntl } from 'react-intl';
import { useNavigate, useSearchParams } from 'react-router-dom';

import GuidelineForm from '@/components/appli/EntitiesForm/Guideline';
import Layout from '@/components/common/Layouts/Fixed/FixedContent';
import { usePostGuideline } from '@/hooks';
import { EntityIcon } from './entityConfig';

const SCOPE_TYPES = ['countries', 'regions', 'massifs'];

const AddGuideline = () => {
  const { formatMessage } = useIntl();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const mutation = usePostGuideline();
  const scopeType = searchParams.get('scopeType');
  const scopeId = searchParams.get('scopeId');
  const scopeName = searchParams.get('scopeName');
  const associatedScope =
    SCOPE_TYPES.includes(scopeType) && scopeId
      ? {
          type: scopeType,
          value: { id: scopeId, name: scopeName || scopeId }
        }
      : undefined;

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
          associatedScope={associatedScope}
          closeForm={() => navigate(-1)}
          onSubmit={handleSubmit}
        />
      }
    />
  );
};

export default AddGuideline;
