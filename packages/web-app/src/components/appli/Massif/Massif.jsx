import React from 'react';
import PropTypes from 'prop-types';
import { isNil } from 'ramda';
import Skeleton from '@material-ui/lab/Skeleton';
import { useIntl } from 'react-intl';
import CreateIcon from '@material-ui/icons/Create';

import { Box, IconButton } from '@material-ui/core';
import Layout from '../../common/Layouts/Fixed/FixedContent';
import CavesList from '../../common/cave/CavesList';
import EntrancesList from '../../common/entrance/EntrancesList';
import Alert from '../../common/Alert';

const Massif = ({ isFetching, error, massif, canEdit /* , onEdit */ }) => {
  const { formatMessage } = useIntl();

  console.log(massif);

  let title = '';
  if (massif?.name) {
    title = massif.name;
  } else if (!error) {
    title = formatMessage({ id: 'Loading massif data...' });
  }

  return (
    <Layout
      title={title}
      subheader={
        <>
          {isFetching && !error ? (
            <Skeleton />
          ) : (
            massif &&
            `${formatMessage({ id: 'language' })} : ${
              massif?.names[0].language
            }`
          )}
        </>
      }
      content={
        <>
          {isFetching && isNil(error) && (
            <>
              <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                <Skeleton height={300} width={800} /> {/* Map Skeleton */}
              </Box>
              <Skeleton height={100} /> {/* EntranceList data Skeleton */}
              <Skeleton height={100} /> {/* CavesList data Skeleton */}
              <Skeleton height={100} /> {/* Documents Skeleton */}
            </>
          )}
          {error && (
            <Alert
              title={formatMessage({
                id:
                  'Error, the massif data you are looking for is not available.'
              })}
              severity="error"
            />
          )}
          {massif && (
            <>
              <Box
                justifyContent="right"
                display="flex"
                sx={{ marginRight: 6 }}>
                {canEdit && (
                  <IconButton
                    size="medium"
                    aria-label="edit"
                    color="primary"
                    // onClick={onEdit} ### À décommenter lorsque la page edit sera prête
                    disabled // ={isNil(onEdit)} ### À décommenter lorsque la page edit sera prête
                  >
                    {formatMessage({ id: 'Edit' })}
                    <CreateIcon />
                  </IconButton>
                )}
              </Box>
              <EntrancesList
                entrances={massif.entrances}
                emptyMessageComponent={
                  <Alert
                    severity="info"
                    title={formatMessage({
                      id: 'This massif has no entrances listed yet.'
                    })}
                  />
                }
                title={formatMessage({ id: 'Entrances list' })}
              />
              <CavesList
                caves={massif.networks}
                emptyMessageComponent={
                  <Alert
                    severity="info"
                    title={formatMessage({
                      id: 'This massif has no networks listed yet.'
                    })}
                  />
                }
                title={formatMessage({ id: 'Networks list' })}
              />
            </>
          )}
        </>
      }
    />
  );
};

Massif.propTypes = {
  isFetching: PropTypes.bool.isRequired,
  error: PropTypes.shape({}),
  massif: PropTypes.shape({
    name: PropTypes.string,
    names: PropTypes.arrayOf(
      PropTypes.shape({
        language: PropTypes.string
      })
    ),
    entrances: PropTypes.arrayOf(PropTypes.shape({})),
    networks: PropTypes.arrayOf(PropTypes.shape({}))
  }),
  onEdit: PropTypes.func.isRequired,
  canEdit: PropTypes.bool.isRequired
};
Massif.defaultProps = {
  massif: undefined
};

export default Massif;
