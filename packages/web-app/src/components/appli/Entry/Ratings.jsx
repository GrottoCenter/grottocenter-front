import { styled } from '@mui/material/styles';
import React from 'react';
import { useIntl } from 'react-intl';
import PropTypes from 'prop-types';
import { Rating } from '../../common/Properties';

const RatingWrapper = styled('div')`
  display: flex;
  flex-wrap: wrap;
`;

const Ratings = ({ className, interest, progression, access, size }) => {
  const { formatMessage } = useIntl();

  return (
    <RatingWrapper className={className}>
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
  className: PropTypes.string,
  interest: PropTypes.number,
  progression: PropTypes.number,
  access: PropTypes.number,
  size: PropTypes.oneOf(['small', 'large'])
};

export default Ratings;
