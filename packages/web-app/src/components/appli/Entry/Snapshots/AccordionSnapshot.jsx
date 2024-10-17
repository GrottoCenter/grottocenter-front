import React from 'react';
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  AccordionActions,
  Typography,
  Box
} from '@mui/material';
import ExpandMore from '@mui/icons-material/ExpandMore';
import PropTypes from 'prop-types';

import { styled } from '@mui/material/styles';
import Contribution from '../../../common/Contribution/Contribution';
import { getAccordionBodyFromType } from './UtilityFunction';
import authorType from '../../../../types/author.type';
import { HighLightsChar } from '../../../common/Highlights';
import RestoreSnapshot from './component/RestoreSnapshot';
import Translate from '../../../common/Translate';

const FlexDiv50 = styled('div')`
  flex-basis: 50%;
`;
const AccordionSnapshot = ({
  snapshot,
  snapshotType,
  isNetwork,
  author,
  reviewer,
  previous,
  all
}) => {
  const snapshotTitle = snapshot.title ?? snapshot.name ?? '';
  const previousVersionTitle = previous?.title ?? previous?.name ?? undefined;
  return (
    <Accordion>
      <AccordionSummary expandIcon={<ExpandMore />}>
        <FlexDiv50>
          {all ? (
            <strong>
              <Translate>
                {snapshotType.charAt(0).toUpperCase() + snapshotType.slice(1)}
              </Translate>
            </strong>
          ) : (
            ''
          )}
          <Typography>
            {snapshot.id
              ? ` ${new Date(snapshot.id).toLocaleDateString()} - ${new Date(
                  snapshot.id
                ).toLocaleTimeString()}`
              : ''}
            {' - '}
            {reviewer
              ? `${reviewer?.nickname}`
              : `${author?.nickname ? author?.nickname : ''}`}
          </Typography>
        </FlexDiv50>
        <FlexDiv50>
          <HighLightsChar
            oldText={previousVersionTitle}
            newText={snapshotTitle}
          />
        </FlexDiv50>
      </AccordionSummary>
      <AccordionDetails>
        <Box style={{ width: '100%' }}>
          {snapshotType !== 'documents' && (
            <Box>
              <RestoreSnapshot
                snapshot={snapshot}
                snapshotType={snapshotType}
                isNetwork={isNetwork}
              />
            </Box>
          )}
          {getAccordionBodyFromType(
            snapshotType,
            snapshot,
            isNetwork ?? false,
            previous
          )}
        </Box>
      </AccordionDetails>
      <AccordionActions>
        <Contribution
          author={author}
          dateInscription={snapshot.dateInscription}
          reviewer={reviewer}
          dateReviewed={snapshot.dateReviewed}
        />
      </AccordionActions>
    </Accordion>
  );
};

AccordionSnapshot.propTypes = {
  snapshot: PropTypes.shape({
    id: PropTypes.string,
    title: PropTypes.string,
    name: PropTypes.string,
    dateInscription: PropTypes.string,
    dateReviewed: PropTypes.string
  }),
  snapshotType: PropTypes.string,
  isNetwork: PropTypes.bool,
  author: authorType,
  reviewer: authorType,
  previous: PropTypes.shape({
    id: PropTypes.number,
    title: PropTypes.string,
    name: PropTypes.string,
    date: PropTypes.string,
    dateReviewed: PropTypes.string
  }),
  all: PropTypes.bool
};
export default AccordionSnapshot;
