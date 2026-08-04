import React from 'react';
import PropTypes from 'prop-types';
import { Badge, Tooltip } from '@mui/material';
import { styled } from '@mui/material/styles';

import { useIntl } from 'react-intl';
import { networkIcon, caverIcon, entranceIcon } from '../../../assets/icons';

const CaverIcon = styled('img')`
  display: inline-block;
  height: 2.5rem;
  width: 2.5rem;
`;

const EntranceIcon = styled('img')`
  display: inline-block;
  height: 2.5rem;
  vertical-align: text-bottom;
  width: 2.5rem;
`;

const StyledBadge = styled(Badge)`
  margin: ${({ theme }) => theme.spacing(0.5)};
`;

const BadgesSection = ({
  nbCavers,
  nbExploredEntrances,
  nbExploredNetworks
}) => {
  const { formatMessage } = useIntl();
  return (
    <>
      <Tooltip title={formatMessage({ id: 'Number of cavers' })}>
        <StyledBadge color="secondary" badgeContent={nbCavers} showZero>
          <CaverIcon src={caverIcon} alt="Caver icon" />
        </StyledBadge>
      </Tooltip>

      <Tooltip title={formatMessage({ id: 'Number of explored entrances' })}>
        <StyledBadge
          badgeContent={nbExploredEntrances}
          color="secondary"
          showZero>
          <EntranceIcon src={entranceIcon} alt="Entrance icon" />
        </StyledBadge>
      </Tooltip>

      <Tooltip title={formatMessage({ id: 'Number of explored networks' })}>
        <StyledBadge
          badgeContent={nbExploredNetworks}
          color="secondary"
          showZero>
          <EntranceIcon src={networkIcon} alt="Network icon" />
        </StyledBadge>
      </Tooltip>
    </>
  );
};

BadgesSection.propTypes = {
  nbCavers: PropTypes.number,
  nbExploredEntrances: PropTypes.number,
  nbExploredNetworks: PropTypes.number
};

export default BadgesSection;
