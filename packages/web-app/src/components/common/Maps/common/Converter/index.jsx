import React, { useState, Suspense } from 'react';
import PropTypes from 'prop-types';
import { styled } from '@mui/material/styles';
import { Button as MuiButton, Skeleton } from '@mui/material';
import ConvertIcon from '@mui/icons-material/Transform';
import { useIntl } from 'react-intl';
import { anyPass, isEmpty, isNil } from 'ramda';
import { useFullScreen } from 'react-browser-hooks';

import CustomControl, { customControlProps } from '../CustomControl';
import StandardDialog from '../../../StandardDialog';

const Convert = React.lazy(() => import('./Convert'));

const Button = styled(MuiButton)`
  background: ${props => props.theme.palette.backgroundButton};
  color: black;

  &:hover {
    color: white;
  }
`;

const isNilOrEmpty = anyPass([isNil, isEmpty]);

const ConverterControl = ({
  position = 'bottomleft',
  projectionsList = [],
  ...props
}) => {
  const { fullScreen } = useFullScreen();
  const { formatMessage } = useIntl();
  const [anchorEl, setAnchorEl] = useState(null);

  const handleOpenMenu = event => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <CustomControl position={position} {...props}>
      <Button
        aria-label="data-control"
        onClick={handleOpenMenu}
        startIcon={<ConvertIcon fontSize="inherit" />}
        // TODO enable on fullscreen as it's currently hidden
        disabled={fullScreen || isNilOrEmpty(projectionsList)}>
        {formatMessage({ id: 'Converter' })}
      </Button>
      {!isNilOrEmpty(projectionsList) && (
        <StandardDialog
          title={formatMessage({ id: 'Converter' })}
          open={Boolean(anchorEl)}
          onClose={handleClose}>
          <Suspense
            fallback={
              <>
                <Skeleton width={125} />
                <Skeleton width={75} />
                <Skeleton width={100} />
              </>
            }>
            <Convert list={projectionsList} />
          </Suspense>
        </StandardDialog>
      )}
    </CustomControl>
  );
};

ConverterControl.propTypes = {
  ...customControlProps,
  projectionsList: PropTypes.arrayOf(PropTypes.shape({}))
};

export default ConverterControl;
