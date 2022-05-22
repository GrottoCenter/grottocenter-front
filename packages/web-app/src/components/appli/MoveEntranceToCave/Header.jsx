import React from 'react';
import PropTypes from 'prop-types';
import { Typography } from '@material-ui/core';
import { useIntl } from 'react-intl';

import GCLink from '../../common/GCLink';

const Header = ({ entrance }) => {
  const { formatMessage } = useIntl();

  return (
    <>
      <Typography variant="caption" color="primary">
        {formatMessage({
          id: `Entrance name`
        })}
      </Typography>
      <GCLink href={`/ui/entrances/${entrance.id}`} internal>
        <Typography variant="h3">{entrance.name}</Typography>
      </GCLink>
    </>
  );
};

Header.propTypes = {
  entrance: PropTypes.shape({
    id: PropTypes.number.isRequired,
    name: PropTypes.string.isRequired
  }).isRequired
};

export default Header;
