import React from 'react';
import { useIntl } from 'react-intl';
import PropTypes from 'prop-types';

import ScrollableContent from '../../../common/Layouts/Fixed/ScrollableContent';
import getAuthor from '../../../../util/getAuthor';
import Alert404 from './error/404Alert';
import authorType from '../../../../types/author.type';
import AccordionSnapshot from './AccordionSnapshot';

const AccordionSnapshotListPage = ({ data, type, isNetwork }) => {
  const { formatMessage } = useIntl();
  return (
    <ScrollableContent
      dense
      title={formatMessage({ id: `${type} snapshots` })}
      content={
        data ? (
          data.map((snapshotType, index) =>
            snapshotType[Object.keys(snapshotType)[0]].map(snapshot => {
              const author = getAuthor(snapshot.author);
              const reviewer = getAuthor(snapshot.reviewer);
              return (
                <AccordionSnapshot
                  key={snapshot.id + snapshot.t_id}
                  snapshot={snapshot}
                  snapshotType={Object.keys(snapshotType)[0]}
                  isNetwork={isNetwork}
                  author={author}
                  reviewer={reviewer}
                  all
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
};

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
