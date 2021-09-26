import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import { isEmpty, isNil } from 'ramda';

import Provider, {
  commentsType,
  detailsType,
  EntryContext,
  riggingsType,
  descriptionsType
} from './Provider';
import Layout from '../../common/Layouts/Fixed';
import FixedContent from '../../common/Layouts/Fixed/FixedContent';
import CustomIcon from '../../common/CustomIcon';
import EntryMap from './EntryMap';
import Properties from './Properties';
import Descriptions from './Descriptions';
import Riggings from './Riggings';
import Comments from './Comments';
import TmpContent from './WipContent';

const EntryProperties = () => (
  <>
    <EntryMap />
    <Properties />
  </>
);

export const Entry = () => {
  const { formatMessage, formatDate } = useIntl();
  const {
    state: {
      entryId,
      details: { name, author, creationDate, lastEditor, editionDate },
      descriptions,
      riggings,
      comments
    }
  } = useContext(EntryContext);

  const footer = `${formatMessage({ id: 'Created by' })}
        ${author.fullName} ${
    !isNil(creationDate) ? `(${formatDate(creationDate)})` : ''
  }
        ${
          !isNil(lastEditor) && !isNil(editionDate)
            ? ` - ${formatMessage({
                id: 'Last modification by'
              })} ${lastEditor} (
          ${formatDate(editionDate)})`
            : ''
        }`;

  return (
    <Layout
      fixedContent={
        <FixedContent
          title={name || ''}
          content={<EntryProperties />}
          footer={footer}
          icon={<CustomIcon type="entry" />}
        />
      }>
      <Descriptions descriptions={descriptions} entryId={entryId} />
      {!isEmpty(riggings) && <Riggings riggings={riggings} />}
      {!isEmpty(comments) && <Comments comments={comments} />}
      <TmpContent title="Documents" />
      {/* <TmpContent title="History" /> */}
    </Layout>
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
  riggings: riggingsType.isRequired,
  loading: PropTypes.bool,
  entryId: PropTypes.string.isRequired
};

export default HydratedEntry;
