import React from 'react';
import { useIntl } from 'react-intl';
import { isNil } from 'ramda';
import PropTypes from 'prop-types';
import { CircularProgress } from '@material-ui/core';
import MassifForm from '../../../components/appli/EntitiesForm/Massif';
import { makeMassifValueData } from '../../../components/appli/EntitiesForm/Massif/transformers';
import Layout from '../../../components/common/Layouts/Fixed/FixedContent';
import Translate from '../../../components/common/Translate';

const MassifEditContainer = ({ isFetching, massif }) => {
  const { formatMessage } = useIntl();

  if (isNil(massif) && !isFetching) {
    return (
      <Translate>
        Error, the massif data you are looking for is not available.
      </Translate>
    );
  }

  return (
    <Layout
      title={massif?.name || formatMessage({ id: 'Loading massif data...' })}
      content={
        isFetching ? (
          <CircularProgress />
        ) : (
          <>
            <MassifForm massifValues={makeMassifValueData(massif)} />
          </>
        )
      }
    />
  );
};

MassifEditContainer.propTypes = {
  massif: PropTypes.shape({
    name: PropTypes.shape({ message: PropTypes.string })
  }),
  isFetching: PropTypes.bool
};

export default MassifEditContainer;
