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
import { isNil } from 'ramda';
import { styled } from '@mui/material/styles';
import PropTypes from 'prop-types';
import { ObstaclePropTypes } from '../../../../types/entrance.type';

import { HighLightsLine } from '../../../common/Highlights';
import SectionTitle from '../SectionTitle';
import RiggingSummary from './RiggingSummary';
import ColumnLegend, { LegendHeader } from './ColumnLegend';
import { OBSTACLE_LEGEND, ANCHOR_LEGEND } from '@/utils/riggingLegends';

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
  /* Never let the table widen its ancestors: it scrolls inside this box
     instead of pushing the page into a horizontal scroll. */
  max-width: 100%;
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
    /* The four labels are single words, so wrapping can only break them
       mid-word (the container sets overflow-wrap: anywhere). They stay on one
       line; the table is made to fit below instead. */
    white-space: nowrap;
  }

  /* Those unwrappable headers plus their legend buttons set the table's
     minimum width at ~360px — just over a phone's content width. Rather than
     let it overflow, shrink the header itself: smaller type, tighter padding
     and a more compact legend button, which together give back ~60px. */
  ${props => props.theme.breakpoints.down('sm')} {
    padding: 4px !important;

    thead & {
      font-size: 0.75rem;
    }
    thead & .MuiIconButton-root {
      margin-left: 2px;
      padding: 2px;
    }
    thead & .MuiSvgIcon-root {
      font-size: 1rem;
    }
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
      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: 0.5,
          mb: 0.5
        }}>
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
                <LegendHeader>
                  {formatMessage({ id: 'obstacles' })}
                  <ColumnLegend
                    titleKey="Obstacle notation legend"
                    items={OBSTACLE_LEGEND}
                  />
                </LegendHeader>
              </StyledTableCell>
              <StyledTableCell $isDeleted={isDeleted} width="10%">
                {formatMessage({ id: 'ropes' })}
              </StyledTableCell>
              <StyledTableCell $isDeleted={isDeleted} width="20%">
                <LegendHeader>
                  {formatMessage({ id: 'anchors' })}
                  <ColumnLegend
                    titleKey="Anchor notation legend"
                    items={ANCHOR_LEGEND}
                  />
                </LegendHeader>
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
