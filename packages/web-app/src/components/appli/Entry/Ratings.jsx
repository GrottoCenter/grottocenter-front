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

const Ratings = ({ interest, progression, access, size }) => {
  const { formatMessage } = useIntl();

  return (
    <RatingWrapper size={size}>
      {!!interest && (
        <Rating
          label={formatMessage({ id: 'Interest' })}
          value={interest}
          size={size}
        />
      )}
      {!!progression && (
        <Rating
          label={formatMessage({ id: 'Progression' })}
          value={progression}
          size={size}
        />
      )}
      {!!access && (
        <Rating
          label={formatMessage({ id: 'Access' })}
          value={access}
          size={size}
        />
      )}
    </RatingWrapper>
  );
};

Ratings.propTypes = {
  interest: PropTypes.number,
  progression: PropTypes.number,
  access: PropTypes.number,
  size: PropTypes.oneOf(['small', 'large'])
};

export default Ratings;
