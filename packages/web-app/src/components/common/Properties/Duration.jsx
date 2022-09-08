import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { useIntl } from 'react-intl';

const DurationWrapper = styled.div`
  display: flex;
  align-items: center;
  & > span {
    margin-left: 5px;
  }
`;

const Duration = ({ image, durationStr, title }) => {
  const { formatMessage } = useIntl();
  const splittedTime = durationStr.split(':');
  const valueToDisplay = `${
    +splittedTime[0] > 0 ? `${+splittedTime[0]}h ` : ''
  }${+splittedTime[1]}m`;
  return (
    <DurationWrapper>
      <img
        src={image}
        alt={formatMessage({ id: title })}
        title={formatMessage({ id: title })}
        height="30"
      />
      <span>{valueToDisplay}</span>
    </DurationWrapper>
  );
};

Duration.propTypes = {
  image: PropTypes.string.isRequired,
  durationStr: PropTypes.string.isRequired, // format : hh:mm:ss
  title: PropTypes.string.isRequired
};

export default Duration;
