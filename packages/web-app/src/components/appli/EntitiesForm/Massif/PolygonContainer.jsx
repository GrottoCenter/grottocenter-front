import {
  FormControl as MuiFormControl,
  FormHelperText,
  FormLabel
} from '@material-ui/core';
import React, { Suspense } from 'react';
import { Controller } from 'react-hook-form';
import { useIntl } from 'react-intl';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { Skeleton } from '@material-ui/lab';

const PolygonMap = React.lazy(() => import('./PolygonMap/Polygon'));

const FormControl = styled(MuiFormControl)`
  padding-bottom: ${({ theme }) => theme.spacing(4)}px;
`;

const PolygonContainer = ({ control, geoJson, errors }) => {
  const { formatMessage } = useIntl();

  return (
    <Suspense
      fallback={
        <>
          <Skeleton width={125} />
          <Skeleton width={75} />
          <Skeleton width={100} />
        </>
      }>
      <FormControl
        component="fieldset"
        required
        error={!!errors?.massif?.geoJson}>
        <FormLabel>{formatMessage({ id: 'Massif area' })}</FormLabel>
        <FormHelperText>
          {formatMessage({
            id:
              'Draw the area covered by the massif using the tools at the right of the map.'
          })}
        </FormHelperText>
        <Controller
          name="massif.geoJson"
          control={control}
          rules={{ required: true }}
          render={({ field }) => <PolygonMap data={geoJson} {...field} />}
        />
      </FormControl>
    </Suspense>
  );
};
PolygonContainer.propTypes = {
  geoJson: PropTypes.shape({}),
  control: PropTypes.shape({}),
  errors: PropTypes.shape({
    massif: PropTypes.shape({
      geoJson: PropTypes.shape({})
    })
  }),
  reset: PropTypes.func
};

export default PolygonContainer;
