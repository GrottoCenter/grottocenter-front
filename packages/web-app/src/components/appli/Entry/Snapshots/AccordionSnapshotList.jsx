import React from 'react';
import PropTypes from 'prop-types';

import ScrollableContent from '../../../common/Layouts/Fixed/ScrollableContent';
import Alert404 from './error/404Alert';
import authorType from '../../../../types/author.type';
import AccordionSnapshot from './AccordionSnapshot';
import Translate from '../../../common/Translate';

const AccordionSnapshotList = ({ data, type, isNetwork, actualItem }) => {
  let previousVersion = actualItem;
  return (
    <ScrollableContent
      dense
      title={<Translate>Revisions</Translate>}
      content={
        data && Object.keys(data).length > 0 ? (
          Object.keys(data).map(snapshotType => {
            const reversed = [...data[snapshotType]].reverse();
            return reversed.map(snapshot => {
              const accordionSnapshot = (
                <AccordionSnapshot
                  key={snapshot.id + snapshot.t_id}
                  snapshot={snapshot}
                  snapshotType={snapshotType}
                  isNetwork={isNetwork}
                  author={snapshot.author}
                  reviewer={snapshot.reviewer}
                  previous={previousVersion}
                />
              );
              previousVersion = snapshot;
              return accordionSnapshot;
            });
          })
        ) : (
          <Alert404 type={type} />
        )
      }
    />
  );
};

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
  isNetwork: PropTypes.bool,
  actualItem: PropTypes.shape({
    id: PropTypes.number,
    title: PropTypes.string,
    name: PropTypes.string,
    author: authorType,
    reviewer: authorType,
    date: PropTypes.string,
    dateReviewed: PropTypes.string
  })
};
export default AccordionSnapshotList;
