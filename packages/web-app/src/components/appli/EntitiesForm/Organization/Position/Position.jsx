import { Slide } from '@material-ui/core';
import React from 'react';
import styled from 'styled-components';
import { useWatch } from 'react-hook-form';
import PropTypes from 'prop-types';
import MultipleMarkers, {
  isValidPositions
} from '../../../../common/Maps/MapMultipleMarkers';
import { useDebounce } from '../../../../../hooks';

const Style = styled.div`
  margin: ${({ theme }) => theme.spacing(4)}px;
`;

const PositionMap = ({ control }) => {
  const debouncedLatitude = useDebounce(
    useWatch({ control, name: 'organization.latitude' }),
    300
  );
  const debouncedLongitude = useDebounce(
    useWatch({ control, name: 'organization.longitude' }),
    300
  );
  const validPosition = isValidPositions([
    [debouncedLatitude, debouncedLongitude]
  ]);

  return (
    <Slide direction="up" in={validPosition} mountOnEnter unmountOnExit>
      <div>
        <Style>
          <MultipleMarkers
            positions={
              validPosition ? [[debouncedLatitude, debouncedLongitude]] : []
            }
            zoom={10}
            style={{ borderRadius: '4px', margin: '4px' }}
          />
        </Style>
      </div>
    </Slide>
  );
};
export default PositionMap;

PositionMap.propTypes = {
  control: PropTypes.shape({})
};
