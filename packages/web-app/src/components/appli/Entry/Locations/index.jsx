import { useState } from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';

import ContributionSection from '@/components/appli/Contributions/ContributionSection';
import SectionCreateButton from '@/components/common/SectionCreateButton';
import { LocationPropTypes } from '../../../../types/entrance.type';
import Location from './Location';
import CreateLocationForm from '../../EntitiesForm/Location';
import {
  useCreateLocation,
  useMoveLocationRelevance,
  usePermissions
} from '../../../../hooks';
import { useMoveRelevanceWithUndo } from '../../../../hooks/useMoveRelevanceWithUndo';
import Alert from '../../../common/Alert';

const Locations = ({ entranceId, locations, isSensitive, isEditAllowed }) => {
  const { formatMessage } = useIntl();
  const permissions = usePermissions();
  const [isFormVisible, setIsFormVisible] = useState(false);
  const createMutation = useCreateLocation();
  const moveMutation = useMoveLocationRelevance();
  const { movingId, handleMove } = useMoveRelevanceWithUndo(moveMutation);

  const onSubmitForm = data => {
    createMutation.mutate({
      entrance: entranceId,
      title: data.title,
      body: data.body,
      language: data.language
    });
    setIsFormVisible(false);
  };

  return (
    <ContributionSection
      anchorId="location"
      title={formatMessage({ id: 'Access' })}
      items={locations}
      renderItem={(location, { isFirst, isLast }) => (
        <Location
          location={location}
          entranceId={entranceId}
          isEditAllowed={isEditAllowed}
          isMoving={movingId === location.id}
          onMoveUp={() => handleMove(location.id, -1)}
          onMoveDown={() => handleMove(location.id, 1)}
          isFirst={isFirst}
          isLast={isLast}
        />
      )}
      createAction={
        // Hidden for non-admins on sensitive entrances: they cannot add locations
        permissions.isAuth &&
        isEditAllowed &&
        (!isSensitive || permissions.isAdmin) && (
          <SectionCreateButton
            isOpen={isFormVisible}
            onToggle={() => setIsFormVisible(!isFormVisible)}
            label={formatMessage({ id: 'New' })}
            tooltip={formatMessage({ id: 'Add a new location' })}
            openTooltip={formatMessage({ id: 'Cancel adding a new location' })}
          />
        )
      }
      form={
        isFormVisible ? (
          <CreateLocationForm isNewLocation onSubmit={onSubmitForm} />
        ) : null
      }
      emptyState={
        <Alert
          severity={isSensitive ? 'warning' : 'info'}
          content={formatMessage({
            id: isSensitive
              ? 'This entrance has a restricted access, you can not see its locations.'
              : 'There is currently no location for this entrance.'
          })}
        />
      }
    />
  );
};

Locations.propTypes = {
  entranceId: PropTypes.number.isRequired,
  locations: PropTypes.arrayOf(LocationPropTypes),
  isSensitive: PropTypes.bool,
  isEditAllowed: PropTypes.bool
};

export default Locations;
