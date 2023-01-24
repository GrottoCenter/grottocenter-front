import { FormHelperText } from '@material-ui/core';
import React, { Suspense } from 'react';
import { Controller } from 'react-hook-form';
import { useIntl } from 'react-intl';
import PropTypes from 'prop-types';

import { Skeleton } from '@material-ui/lab';
import InputLanguage from '../utils/InputLanguage';
import InputText from '../utils/InputText';
import { FormRow, FormSectionLabel } from '../utils/FormContainers';

const PolygonMap = React.lazy(() => import('./PolygonMap'));

const MassifFields = ({ control, errors, geoJson }) => {
  const { formatMessage } = useIntl();
  return (
    <>
      <FormSectionLabel label="Basic Information" />
      <FormRow>
        <InputText
          formKey="massif.name"
          labelName="Massif name"
          control={control}
          isError={!!errors?.massif?.name}
          isRequired
        />

        <InputLanguage
          formKey="massif.language"
          control={control}
          isError={!!errors?.massif?.language}
        />
      </FormRow>

      <FormSectionLabel label="Description of the massif" />
      <InputText
        formKey="massif.descriptionTitle"
        labelName="Title"
        control={control}
        isError={!!errors?.massif?.descriptionTitle}
        isRequired
      />
      <InputText
        formKey="massif.description"
        labelName="Description"
        control={control}
        isError={!!errors?.massif?.description}
        isRequired
        minRows={6}
      />

      <FormSectionLabel label="Massif area" />
      <FormHelperText>
        {formatMessage({
          id: 'Draw the area covered by the massif using the tools at the right of the map.'
        })}
      </FormHelperText>
      <Suspense
        fallback={
          <>
            <Skeleton width={125} />
            <Skeleton width={75} />
            <Skeleton width={100} />
          </>
        }>
        <Controller
          name="massif.geoJson"
          control={control}
          rules={{ required: true }}
          render={({ field }) => <PolygonMap data={geoJson} {...field} />}
        />
      </Suspense>
    </>
  );
};
MassifFields.propTypes = {
  control: PropTypes.shape({}),
  errors: PropTypes.shape({
    massif: PropTypes.shape({
      description: PropTypes.arrayOf(PropTypes.shape({})),
      descriptionTitle: PropTypes.arrayOf(PropTypes.shape({})),
      language: PropTypes.shape({ message: PropTypes.string }),
      name: PropTypes.shape({ message: PropTypes.string }),
      geoJson: PropTypes.shape({})
    })
  }),
  geoJson: PropTypes.shape({}),
  isNewDescription: PropTypes.bool
};

export default MassifFields;
