import React, { useContext, useRef } from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import { isNil, propOr } from 'ramda';

import styled from 'styled-components';
import Provider, {
  commentsType,
  detailsType,
  EntryContext,
  documentsType,
  historiesType,
  locationsType,
  riggingsType
} from './Provider';
import { descriptionsType } from '../Descriptions/propTypes';
import Layout from '../../common/Layouts/Fixed';
import FixedContent from '../../common/Layouts/Fixed/FixedContent';
import CustomIcon from '../../common/CustomIcon';
import EntryMap from './EntryMap';
import Properties from './Properties';
import Descriptions from '../Descriptions';
import Locations from './Locations';
import Riggings from './Riggings/Riggings';
import Comments from './Comments/index';
import Documents from './Documents';
import Histories from './Histories';
import { useBoolean, usePermissions } from '../../../hooks';
import StandardDialog from '../../common/StandardDialog';
import { EntranceForm } from '../EntitiesForm';
import SensitiveCaveWarning from './SensitiveCaveWarning';
import AuthorAndDate from '../../common/Contribution/AuthorAndDate';

const HalfSplitContainer = styled.div(
  ({ theme }) => `
  display: flex;
  flex-direction: column;
  ${theme.breakpoints.up('lg')} {
    flex-direction: row;
  }
`
);

export const Entry = () => {
  const { formatMessage } = useIntl();
  const {
    state: {
      details: {
        author,
        cave,
        country,
        creationDate,
        depth,
        development,
        dateReviewed,
        id,
        isSensitive,
        language,
        reviewer,
        name,
        temperature,
        discoveryYear
      },
      position,
      descriptions,
      documents,
      histories,
      locations,
      riggings,
      comments,
      details
    }
  } = useContext(EntryContext);
  const permissions = usePermissions();
  const editPage = useBoolean();

  const handleEdit = () => {
    editPage.open();
  };

  const componentRef = useRef();

  const snap = {
    ...details,
    latitude: position ? position[0] : undefined,
    longitude: position ? position[1] : undefined,
    cave: cave?.id,
    caveName: cave?.names?.[0]?.name ?? cave?.name ?? name
  };

  return (
    <div ref={componentRef}>
      <Layout>
        <FixedContent
          title={name || ''}
          icon={<CustomIcon type="entry" />}
          onEdit={permissions.isAuth ? handleEdit : undefined}
          printRef={componentRef}
          snapshot={{
            id,
            entity: 'entrances',
            actualVersion: snap,
            isNetwork: cave?.entrances.length > 1,
            all: true
          }}
          content={
            <HalfSplitContainer>
              {isSensitive && <SensitiveCaveWarning />}
              <EntryMap />
              <Properties />
            </HalfSplitContainer>
          }
          footer={
            <>
              {!isNil(author) && (
                <AuthorAndDate
                  author={author}
                  verb="Created"
                  date={creationDate}
                />
              )}
              {!isNil(reviewer) && (
                <AuthorAndDate
                  author={reviewer}
                  verb="Updated"
                  date={dateReviewed}
                />
              )}
            </>
          }
        />
        {id && (
          <Locations
            locations={locations}
            entranceId={id}
            isSensitive={isSensitive}
          />
        )}
        {id && (
          <Descriptions
            descriptions={descriptions}
            entityType="entrance"
            entityId={id}
          />
        )}
        {id && <Riggings riggings={riggings} entranceId={id} />}
        {id && <Documents documents={documents} entranceId={id} />}
        {id && <Histories histories={histories} entranceId={id} />}
        {id && <Comments comments={comments} entranceId={id} />}
        {permissions.isAuth && (
          <StandardDialog
            fullWidth
            maxWidth="md"
            open={editPage.isOpen}
            onClose={editPage.close}
            scrollable
            title={formatMessage({ id: 'Entrance edition' })}>
            <EntranceForm
              entranceValues={{
                country,
                depth,
                id,
                isSensitive,
                name,
                language,
                latitude: propOr(undefined, 0, position),
                length: development,
                longitude: propOr(undefined, 1, position),
                yearDiscovery: discoveryYear
              }}
              caveValues={{
                ...cave,
                name: cave?.names?.[0]?.name ?? cave?.name ?? name,
                language: cave?.names?.[0]?.language ?? language,
                massif: cave?.massif?.id,
                temperature
              }}
            />
          </StandardDialog>
        )}
      </Layout>
    </div>
  );
};

const HydratedEntry = ({ ...props }) => (
  <Provider {...props}>
    <Entry />
  </Provider>
);

Entry.propTypes = {};

HydratedEntry.propTypes = {
  details: detailsType.isRequired,
  comments: commentsType.isRequired,
  descriptions: descriptionsType.isRequired,
  documents: documentsType.isRequired,
  histories: historiesType.isRequired,
  locations: locationsType.isRequired,
  riggings: riggingsType.isRequired,
  loading: PropTypes.bool
};

export default HydratedEntry;
