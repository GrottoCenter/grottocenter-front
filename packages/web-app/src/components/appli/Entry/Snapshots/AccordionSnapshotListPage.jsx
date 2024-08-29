import React from 'react';
import PropTypes from 'prop-types';

import ScrollableContent from '../../../common/Layouts/Fixed/ScrollableContent';
import Alert404 from './error/404Alert';
import authorType from '../../../../types/author.type';
import AccordionSnapshot from './AccordionSnapshot';
import Translate from '../../../common/Translate';

const AccordionSnapshotListPage = ({ data, type, isNetwork }) => (
  <ScrollableContent
    dense
    title={
      <Translate
        id="Full {type} revision history"
        values={{
          type
        }}
        defaultMessage={`Full ${type} revision history`}
      />
    }
    content={
      data ? (
        data.map(snapshotType =>
          snapshotType[Object.keys(snapshotType)[0]].map(snapshot => (
            <AccordionSnapshot
              key={snapshot.id + snapshot.t_id}
              snapshot={snapshot}
              snapshotType={Object.keys(snapshotType)[0]}
              isNetwork={isNetwork}
              author={snapshot.author}
              reviewer={snapshot.reviewer}
              all
            />
          ))
        )
      ) : (
        <Alert404 type={type} />
      )
    }
  />
);

AccordionSnapshotListPage.propTypes = {
  data: PropTypes.arrayOf(
    PropTypes.shape({
      snapshotType: PropTypes.shape({
        id: PropTypes.string,
        title: PropTypes.string,
        name: PropTypes.string,
        author: authorType,
        reviewer: authorType,
        date: PropTypes.string,
        dateReviewed: PropTypes.string
      })
    })
  ),
  type: PropTypes.string,
  isNetwork: PropTypes.bool
};
export default AccordionSnapshotListPage;
