import React from 'react';
import styled from 'styled-components';
import { useIntl } from 'react-intl';
import { isNil } from 'ramda';
import PropTypes from 'prop-types';
import MassifForm from '../../../components/appli/EntitiesForm/Massif';
import { makeMassifValueData } from '../../../components/appli/EntitiesForm/Massif/transformers';
import Spinner from '../../../components/common/Spinner';
import Layout from '../../../components/common/Layouts/Fixed/FixedContent';
import Translate from '../../../components/common/Translate';

const MassifEditContainer = ({ isFetching, massif }) => {
  const { formatMessage } = useIntl();

  const Center = styled.div`
    padding: 10%;
  `;

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
          <Center>
            <Spinner text={' '} size={100} />
          </Center>
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
