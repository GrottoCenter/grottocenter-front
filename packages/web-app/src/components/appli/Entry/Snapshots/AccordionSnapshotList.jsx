import React from 'react';
import PropTypes from 'prop-types';

import ScrollableContent from '../../../common/Layouts/Fixed/ScrollableContent';
import getAuthor from '../../../../util/getAuthor';
import Alert404 from './error/404Alert';
import authorType from '../../../../types/author.type';
import AccordionSnapshot from './AccordionSnapshot';
import Translate from '../../../common/Translate';

const AccordionSnapshotList = ({ data, type, isNetwork }) => (
  <ScrollableContent
    dense
    title={
      <Translate
        id="{type} snapshots"
        values={{
          type
        }}
        defaultMessage={`${type} snapshots`}
      />
    }
    content={
      data && Object.keys(data).length > 0 ? (
        Object.keys(data).map(snapshotType =>
          data[snapshotType].map(snapshot => {
            const author = getAuthor(snapshot.author);
            const reviewer = getAuthor(snapshot.reviewer);
            return (
              <AccordionSnapshot
                key={snapshot.id + snapshot.t_id}
                snapshot={snapshot}
                snapshotType={snapshotType}
                isNetwork={isNetwork}
                author={author}
                reviewer={reviewer}
              />
            );
          })
        )
      ) : (
        <Alert404 type={type} />
      )
    }
  />
);

AccordionSnapshotList.propTypes = {
  data: PropTypes.shape({
    snapshotType: PropTypes.shape({
      id: PropTypes.string,
      title: PropTypes.string,
      name: PropTypes.string,
      author: authorType,
      reviewer: authorType,
      date: PropTypes.string,
      dateReviewed: PropTypes.string
    })
  }),
  type: PropTypes.string,
  isNetwork: PropTypes.bool
};
export default AccordionSnapshotList;
