import PropTypes from 'prop-types';
import { styled } from '@mui/material/styles';
import { useIntl } from 'react-intl';
import { Tooltip } from '@mui/material';

import {
  durationStringToMinutes,
  formatDurationMinutes
} from '@/utils/dateTimeDuration';

const DurationWrapper = styled('div')`
  display: flex;
  align-items: center;
  & > span {
    margin-left: 5px;
  }
`;

const Duration = ({ image, durationStr, title }) => {
  const { formatMessage, formatNumber } = useIntl();
  const valueToDisplay = formatDurationMinutes(
    durationStringToMinutes(durationStr),
    formatNumber
  );
  return (
    <Tooltip title={formatMessage({ id: title })}>
      <DurationWrapper>
        <img src={image} alt={formatMessage({ id: title })} height="30" />
        <span>{valueToDisplay}</span>
      </DurationWrapper>
    </Tooltip>
  );
};

Duration.propTypes = {
  image: PropTypes.string.isRequired,
  durationStr: PropTypes.string.isRequired, // format : hh:mm:ss
  title: PropTypes.string.isRequired
};

export default Duration;
