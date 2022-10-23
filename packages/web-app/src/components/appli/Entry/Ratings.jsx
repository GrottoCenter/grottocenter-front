import styled from 'styled-components';
import React from 'react';
import { useIntl } from 'react-intl';
import PropTypes from 'prop-types';
import { Rating } from '../../common/Properties';

const RatingWrapper = styled.div`
  display: flex;
  justify-content: space-evenly;
  align-items: center;
  flex-wrap: wrap;
  padding: ${({ theme }) => theme.spacing(2)}px;
  ${({ size }) => size === 'small' && `flex-direction: column`}
`;

const Ratings = ({ interestRate, progressionRate, accessRate, size }) => {
  const { formatMessage } = useIntl();

  return (
    <RatingWrapper size={size}>
      {!!interestRate && (
        <Rating
          label={formatMessage({ id: 'Interest' })}
          value={interestRate}
          size={size}
        />
      )}
      {!!progressionRate && (
        <Rating
          label={formatMessage({ id: 'Progression' })}
          value={progressionRate}
          size={size}
        />
      )}
      {!!accessRate && (
        <Rating
          label={formatMessage({ id: 'Access' })}
          value={accessRate}
          size={size}
        />
      )}
    </RatingWrapper>
  );
};

Ratings.propTypes = {
  interestRate: PropTypes.number,
  progressionRate: PropTypes.number,
  accessRate: PropTypes.number,
  size: PropTypes.oneOf(['small', 'large'])
};

export default Ratings;
