import { useIntl } from 'react-intl';
import PropTypes from 'prop-types';
import SensitivitySection from '../../../common/SensitivitySection';
import { usePermissions } from '../../../../hooks';

/**
 * Sensitivity controls of the massif form.
 *
 * Nothing here calls the API: both values are plain form state, applied by the
 * form on save. That is what lets the panel exist on the creation form too —
 * the cascade endpoints need a massif id, which does not exist until save.
 */
const MassifSensitivityControl = ({
  isSensitive,
  onSensitiveChange,
  isLocked,
  onLockChange,
  wasSensitive = false
}) => {
  const { formatMessage } = useIntl();
  const { isAdmin } = usePermissions();

  if (!isAdmin) return null;

  const explanation = formatMessage({
    id: wasSensitive
      ? 'Removing sensitivity from the massif will not automatically remove the sensitivity flag from individual entrances.'
      : 'Marking a massif as sensitive automatically marks all entrances within its polygon as sensitive. Their locations are then hidden from everyone except administrators. This designation must be based on applicable legislation. For more details, see the User Guide.'
  });

  let alert = null;
  if (isLocked) {
    alert = {
      severity: 'info',
      content: formatMessage({
        id: 'The sensitivity of this massif is locked. Unlock it to change its sensitivity.'
      })
    };
  }

  return (
    <SensitivitySection
      title="Sensitivity Management"
      explanation={explanation}
      switchLabel="Sensitive massif"
      isSensitive={isSensitive}
      onSensitiveChange={onSensitiveChange}
      isSensitiveDisabled={isLocked}
      showLock
      isLocked={isLocked}
      onLockChange={onLockChange}
      alert={alert}
    />
  );
};

MassifSensitivityControl.propTypes = {
  isSensitive: PropTypes.bool.isRequired,
  onSensitiveChange: PropTypes.func.isRequired,
  isLocked: PropTypes.bool.isRequired,
  onLockChange: PropTypes.func.isRequired,
  wasSensitive: PropTypes.bool
};

export default MassifSensitivityControl;
