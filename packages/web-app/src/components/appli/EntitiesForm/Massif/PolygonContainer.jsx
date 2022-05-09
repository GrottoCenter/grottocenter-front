import { FormControl as MuiFormControl, FormLabel } from '@material-ui/core';

import React from 'react';
import { Controller } from 'react-hook-form';
import { useIntl } from 'react-intl';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import PolygonMap from './PolygonMap/Polygon';

const FormControl = styled(MuiFormControl)`
  padding-bottom: ${({ theme }) => theme.spacing(4)}px;
`;

const PolygonContainer = ({ control, geoJson }) => {
  const { formatMessage } = useIntl();

  return (
    <FormControl component="fieldset">
      <FormLabel>{formatMessage({ id: 'Location of the massif' })}</FormLabel>
      <Controller
        name="massif.geoJson"
        control={control}
        rules={{ required: true }}
        render={({ field }) => <PolygonMap data={geoJson} {...field} />}
      />
    </FormControl>
  );
};
PolygonContainer.propTypes = {
  geoJson: PropTypes.shape({}),
  control: PropTypes.shape({}),
  errors: PropTypes.shape({
    geogPolygon: PropTypes.shape({})
  }),
  reset: PropTypes.func
};

export default PolygonContainer;
