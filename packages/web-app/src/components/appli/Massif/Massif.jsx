import React from 'react';
import { isNil, isEmpty } from 'ramda';
import Skeleton from '@material-ui/lab/Skeleton';
import { useIntl } from 'react-intl';
import CreateIcon from '@material-ui/icons/Create';

import { Box, IconButton } from '@material-ui/core';
import Layout from '../../common/Layouts/Fixed/FixedContent';
import CavesList from '../../common/cave/CavesList';
import EntrancesList from '../../common/entrance/EntrancesList';
import DocumentsList from '../../common/DocumentsList/DocumentsList';
import Alert from '../../common/Alert';
import MassifPropTypes from './propTypes';
import MapMassif from './MapMassif';
import Descriptions from './Descriptions';

const Massif = ({ isFetching, error, massif, canEdit, onEdit }) => {
  const { formatMessage } = useIntl();

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
            `${formatMessage({ id: 'Language' })} : ${
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
                alignItems="start"
                display="flex"
                flexBasis="300px"
                justifyContent="space-between">
                {!isEmpty(massif.descriptions) ? (
                  <Descriptions descriptions={massif.descriptions} />
                ) : (
                  <Alert
                    severity="info"
                    title={formatMessage({
                      id: 'This massif does not have a description'
                    })}
                  />
                )}
                {canEdit && (
                  <IconButton
                    size="medium"
                    aria-label="edit"
                    color="primary"
                    onClick={onEdit}
                    disabled={isNil(onEdit)}>
                    <CreateIcon />
                  </IconButton>
                )}
              </Box>
              {massif.geogPolygon && (
                <>
                  <hr />
                  <MapMassif massif={massif} />
                </>
              )}
              <hr />
              <DocumentsList
                docs={massif.documents.map(doc => ({
                  ...doc,
                  title: doc.titles[0].text
                }))}
                emptyMessageComponent={
                  <Alert
                    severity="info"
                    title={formatMessage({
                      id: 'This massif has no documents listed yet.'
                    })}
                  />
                }
                title={formatMessage({ id: 'Documents' })}
              />
              <hr />
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
              <hr />
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

Massif.propTypes = MassifPropTypes;

Massif.defaultProps = {
  massif: undefined
};

export default Massif;
