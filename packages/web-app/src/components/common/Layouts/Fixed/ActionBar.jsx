import React, { useContext } from 'react';
import { isNil } from 'ramda';
import { useIntl } from 'react-intl';
import { Tooltip, Fab } from '@material-ui/core';
import { Share, Print, Map, GpsFixed, Edit } from '@material-ui/icons';
import styled from 'styled-components';
import PropTypes from 'prop-types';
import ReactToPrint from 'react-to-print';
import { isMobile } from 'react-device-detect';
import grey from '@material-ui/core/colors/grey';
import { EntryContext } from '../../../appli/Entry/Provider';

const Wrapper = styled.div`
  position: sticky;
  top: ${({ theme }) => theme.appBarHeight}px;
  display: flex;
  flex-wrap: wrap;
  flex-direction: ${!isMobile && 'row-reverse'};
  justify-content: ${isMobile && 'space-between'};
  //over leaflet
  z-index: 1001;
  @media print {
    display: none;
  }
`;

const StyledFab = styled(Fab)`
  margin: ${({ theme }) => theme.spacing(2)}px;
  :disabled {
    background-color: ${grey[100]};
  }
`;

const ActionButton = ({ Icon, label, onClick }) => {
  const { formatMessage } = useIntl();
  const tooltipMessage = isNil(onClick)
    ? formatMessage({ id: 'disabled' })
    : label;

  return (
    <Tooltip title={tooltipMessage}>
      <span>
        <StyledFab
          aria-label={label}
          size="small"
          disabled={isNil(onClick)}
          onClick={onClick}>
          {Icon}
        </StyledFab>
      </span>
    </Tooltip>
  );
};

const ActionBar = ({ printRef, onEdit }) => {
  const { formatMessage } = useIntl();

  const {
    state: { position: pos }
  } = useContext(EntryContext);
  const lat = pos != null ? pos[0] : undefined;
  const long = pos != null ? pos[1] : undefined;

  const openMap = () => {
    window.open(
      `https://www.openstreetmap.org/?mlat=${lat}&mlon=${long}`,
      '_blank',
      'noopener,noreferrer'
    );
  };

  return (
    <Wrapper>
      {onEdit && (
        <ActionButton
          onClick={onEdit}
          Icon={
            <Edit fontSize={isMobile ? 'small' : 'medium'} color="inherit" />
          }
          label={formatMessage({ id: 'Edit' })}
        />
      )}
      <ReactToPrint
        trigger={() => (
          <ActionButton
            Icon={<Print fontSize={isMobile ? 'small' : 'medium'} />}
            label={formatMessage({ id: 'Print' })}
          />
        )}
        content={() => printRef.current}
      />
      <ActionButton
        Icon={
          <Share fontSize={isMobile ? 'small' : 'medium'} color="inherit" />
        }
        label={formatMessage({ id: 'Share' })}
      />
      <ActionButton
        Icon={<GpsFixed fontSize={isMobile ? 'small' : 'medium'} />}
        label={formatMessage({ id: 'GeoHack' })}
      />
      <ActionButton
        onClick={lat && long ? openMap : undefined}
        Icon={<Map fontSize={isMobile ? 'small' : 'medium'} />}
        label={formatMessage({ id: 'Open on OpenStreetMap' })}
      />
    </Wrapper>
  );
};

ActionButton.propTypes = {
  Icon: PropTypes.node.isRequired,
  label: PropTypes.string.isRequired,
  onClick: PropTypes.func
};

ActionBar.propTypes = {
  printRef: PropTypes.shape({
    // eslint-disable-next-line react/forbid-prop-types
    current: PropTypes.any
  }).isRequired,
  onEdit: PropTypes.func
};

export default ActionBar;
