import React from 'react';
import PropTypes from 'prop-types';
import { Badge, Tooltip } from '@material-ui/core';
import styled from 'styled-components';

import { useIntl } from 'react-intl';

const CaverIcon = styled.img`
  display: inline-block;
  height: 4rem;
  width: 4rem;
`;

const EntranceIcon = styled.img`
  display: inline-block;
  height: 4rem;
  vertical-align: text-bottom;
  width: 4rem;
`;

const StyledBadge = styled(Badge)`
  margin: ${({ theme }) => theme.spacing(1)}px;
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
        <StyledBadge color="primary" badgeContent={nbCavers} showZero>
          <CaverIcon src="/images/caver.svg" alt="Caver icon" />
        </StyledBadge>
      </Tooltip>

      <Tooltip title={formatMessage({ id: 'Number of explored entrances' })}>
        <StyledBadge
          badgeContent={nbExploredEntrances}
          color="secondary"
          showZero>
          <EntranceIcon src="/images/iconsV3/entry.svg" alt="Entrance icon" />
        </StyledBadge>
      </Tooltip>

      <Tooltip title={formatMessage({ id: 'Number of explored networks' })}>
        <StyledBadge
          badgeContent={nbExploredNetworks}
          color="secondary"
          showZero>
          <EntranceIcon
            src="/images/iconsV3/cave_system.svg"
            alt="Network icon"
          />
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
