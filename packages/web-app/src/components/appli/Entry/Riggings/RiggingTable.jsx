import { useIntl } from 'react-intl';
import {
  TableContainer,
  Box,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody
} from '@mui/material';
import React from 'react';
import { isNil } from 'ramda';
import { styled } from '@mui/material/styles';
import PropTypes from 'prop-types';
import { ObstaclePropTypes } from '../../../../types/entrance.type';

import { HighLightsLine } from '../../../common/Highlights';
import SectionTitle from '../SectionTitle';
import RiggingSummary from './RiggingSummary';
import ColumnLegend from './ColumnLegend';

const OBSTACLE_LEGEND = [
  { abbrevKey: 'obstacle.abbrev.pit', labelKey: 'obstacle.label.pit' },
  { abbrevKey: 'obstacle.abbrev.step', labelKey: 'obstacle.label.step' },
  { abbrevKey: 'obstacle.abbrev.climb', labelKey: 'obstacle.label.climb' },
  { abbrevKey: 'obstacle.abbrev.waterfall', labelKey: 'obstacle.label.waterfall' }
];

const ANCHOR_LEGEND = [
  { abbrevKey: 'anchor.abbrev.spit', labelKey: 'anchor.label.spit' },
  { abbrevKey: 'anchor.abbrev.bolt', labelKey: 'anchor.label.bolt' },
  { abbrevKey: 'anchor.abbrev.piton', labelKey: 'anchor.label.piton' },
  { abbrevKey: 'anchor.abbrev.natural', labelKey: 'anchor.label.natural' },
  { abbrevKey: 'anchor.abbrev.soft', labelKey: 'anchor.label.soft' },
  { abbrevKey: 'anchor.abbrev.drilled', labelKey: 'anchor.label.drilled' },
  { abbrevKey: 'anchor.abbrev.redirect', labelKey: 'anchor.label.redirect' }
];

const StyledTable = styled(Table)`
  border-left: 1px solid ${props => props.theme.palette.primary.veryLight};
  margin-bottom: 0;
`;
const StyledTableRow = styled(TableRow)`
  &:nth-of-type(odd) {
    background-color: ${props => props.theme.palette.action.hover};
  }
`;
const StyledTableContainer = styled(TableContainer)`
  overflow-wrap: anywhere;
  overflow: auto;
`;
const StyledTableCell = styled(TableCell, {
  shouldForwardProp: prop => prop[0] !== '$'
})`
  ${props => (props.$isDeleted ? 'background-color: gray' : '')};
  border: 1px solid ${props => props.theme.palette.primary.veryLight};
  padding: 6px !important;
  min-width: 40px;
  thead & {
    text-transform: capitalize;
    white-space: nowrap;
  }
`;

const EmptyCellMark = styled('span')`
  color: ${props => props.theme.palette.text.disabled};
`;

const HighlightedTableCell = ({ data = '', oldData }) => {
  // In diff (snapshot) mode HighLightsLine must receive the raw strings;
  // the em dash placeholder is only for the regular display.
  let content;
  if (oldData !== undefined) {
    content = <HighLightsLine newText={data} oldText={oldData} />;
  } else if (!data || data.trim() === '') {
    content = <EmptyCellMark>—</EmptyCellMark>;
  } else {
    content = data;
  }
  return (
    <StyledTableCell component="th" scope="row">
      <span style={{ whiteSpace: 'pre-line' }}>{content}</span>
    </StyledTableCell>
  );
};

HighlightedTableCell.propTypes = {
  data: PropTypes.string,
  oldData: PropTypes.string
};

const RiggingTable = ({ id, obstacles, title, previous, isDeleted }) => {
  const { formatMessage } = useIntl();
  const previousObstacles = previous?.obstacles;

  const titleEl = (
    <SectionTitle
      title={title}
      anchorId={`rigging-${id}`}
      isDeleted={isDeleted}
    />
  );

  if (isNil(obstacles[0]) || isNil(obstacles[0].obstacle)) {
    return titleEl;
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1, mb: 1 }}>
        {titleEl}
        {previous === undefined && <RiggingSummary obstacles={obstacles} />}
      </Box>
      <StyledTableContainer>
        <StyledTable
          size="small"
          aria-label={formatMessage({ id: 'riggings' })}>
          <TableHead>
            <TableRow>
              <StyledTableCell $isDeleted={isDeleted} width="25%">
                {formatMessage({ id: 'obstacles' })}
                <ColumnLegend titleKey="Obstacle notation legend" items={OBSTACLE_LEGEND} />
              </StyledTableCell>
              <StyledTableCell $isDeleted={isDeleted} width="10%">
                {formatMessage({ id: 'ropes' })}
              </StyledTableCell>
              <StyledTableCell $isDeleted={isDeleted} width="20%">
                {formatMessage({ id: 'anchors' })}
                <ColumnLegend titleKey="Anchor notation legend" items={ANCHOR_LEGEND} />
              </StyledTableCell>
              <StyledTableCell $isDeleted={isDeleted}>
                {formatMessage({ id: 'observations' })}
              </StyledTableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {obstacles?.map(
              ({ obstacle, rope, anchor, observation }, index) => {
                const oldRow = previousObstacles
                  ? previousObstacles[index]
                  : undefined;
                const isAdded =
                  previousObstacles !== undefined && oldRow === undefined;
                return (
                  // eslint-disable-next-line react/no-array-index-key
                  <StyledTableRow key={`${obstacle}${rope}${anchor}${index}`}>
                    <HighlightedTableCell
                      data={obstacle}
                      oldData={isAdded ? '' : oldRow?.obstacle}
                    />
                    <HighlightedTableCell
                      data={rope}
                      oldData={isAdded ? '' : oldRow?.rope}
                    />
                    <HighlightedTableCell
                      data={anchor}
                      oldData={isAdded ? '' : oldRow?.anchor}
                    />
                    <HighlightedTableCell
                      data={observation}
                      oldData={isAdded ? '' : oldRow?.observation}
                    />
                  </StyledTableRow>
                );
              }
            )}
          </TableBody>
        </StyledTable>
      </StyledTableContainer>
    </Box>
  );
};

RiggingTable.propTypes = {
  id: PropTypes.number.isRequired,
  obstacles: PropTypes.arrayOf(ObstaclePropTypes),
  previous: PropTypes.shape({
    obstacles: PropTypes.arrayOf(ObstaclePropTypes)
  }),
  title: PropTypes.string.isRequired,
  isDeleted: PropTypes.bool
};

export default RiggingTable;
