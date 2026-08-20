import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useIntl } from 'react-intl';
import { Skeleton } from '@mui/material';

import Layout from '../../components/common/Layouts/Fixed/FixedContent';
import PersonForm from '../../components/appli/EntitiesForm/Person';
import Alert from '../../components/common/Alert';
import { usePerson, useUserProperties, usePermissions } from '../../hooks';

const PersonEdit = () => {
  const { formatMessage } = useIntl();
  const { personId } = useParams();
  const navigate = useNavigate();
  const { isAdmin, isModerator } = usePermissions();

  const userId = useUserProperties()?.id ?? null;
  const isOurAccount = userId?.toString() === personId.toString();
  const { data: person, isFetching } = usePerson(
    isOurAccount ? undefined : personId
  );
  let isAllowed = isOurAccount || isAdmin;
  if (isModerator && person?.type === 'AUTHOR') isAllowed = true;

  useEffect(() => {
    if (isOurAccount) {
      navigate('/ui/account', { replace: true });
    }
  }, [isOurAccount, navigate]);

  let title = isFetching ? <Skeleton /> : '';
  if (person) {
    title = formatMessage(
      { id: 'Editing {person}', defaultMessage: 'Editing {person}' },
      { person: person.nickname }
    );
  }

  return (
    <Layout
      title={title}
      content={
        <>
          {isFetching && (
            <>
              <Skeleton height={100} />
              <Skeleton height={500} />
            </>
          )}
          {!isAllowed && (
            <Alert
              severity="error"
              content={formatMessage({
                id: 'You are not authorized to edit this person.'
              })}
            />
          )}
          {isAllowed && !person && !isFetching && (
            <Alert
              severity="error"
              content={formatMessage({
                id: "The person you are looking for doesn't exist."
              })}
            />
          )}
          {person && isAllowed && (
            <PersonForm
              personValues={person}
              onCancel={() => navigate(`/ui/persons/${personId}`)}
            />
          )}
        </>
      }
    />
  );
};

PersonEdit.propTypes = {};

export default PersonEdit;
