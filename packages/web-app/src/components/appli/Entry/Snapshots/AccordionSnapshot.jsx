import React from 'react';
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  AccordionActions,
  Typography,
  Box
} from '@material-ui/core';
import ExpandMore from '@material-ui/icons/ExpandMore';
import PropTypes from 'prop-types';

import Contribution from '../../../common/Contribution/Contribution';
import { getAccordionBodyFromType } from './UtilityFunction';
import authorType from '../../../../types/author.type';

const AccordionSnapshot = ({
  snapshot,
  snapshotType,
  isNetwork,
  author,
  reviewer
}) => (
  <Accordion>
    <AccordionSummary expandIcon={<ExpandMore />}>
      <Typography>
        {reviewer
          ? `${reviewer?.nickname} - `
          : `${author?.nickname ? author?.nickname : ''} - `}
        {snapshot.id
          ? ` ${new Date(snapshot.id).toLocaleDateString()}-${new Date(
              snapshot.id
            ).toLocaleTimeString()} `
          : ' '}
        {snapshot.title ?? snapshot.name ?? ''}
      </Typography>
    </AccordionSummary>
    <AccordionDetails>
      <Box sx={{ width: '100%' }}>
        {getAccordionBodyFromType(snapshotType, snapshot, isNetwork ?? false)}
      </Box>
    </AccordionDetails>
    <AccordionActions>
      <Contribution
        author={author}
        creationDate={snapshot.date}
        reviewer={reviewer}
        dateReviewed={snapshot.dateReviewed}
      />
    </AccordionActions>
  </Accordion>
);

AccordionSnapshot.propTypes = {
  snapshot: PropTypes.shape({
    id: PropTypes.string,
    title: PropTypes.string,
    name: PropTypes.string,
    date: PropTypes.string,
    dateReviewed: PropTypes.string
  }),
  snapshotType: PropTypes.string,
  isNetwork: PropTypes.bool,
  author: authorType,
  reviewer: authorType
};
export default AccordionSnapshot;
