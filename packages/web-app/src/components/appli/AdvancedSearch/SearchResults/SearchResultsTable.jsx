import React, { createRef } from 'react';
import PropTypes from 'prop-types';
import { injectIntl } from 'react-intl';
import withStyles from '@mui/styles/withStyles';
import { withRouter } from 'react-router-dom';
import { isMobile } from 'react-device-detect';
import styled from 'styled-components';
import DescriptionIcon from '@mui/icons-material/Description';
import {
  Button,
  CircularProgress,
  Table,
  TableCell,
  TableBody,
  TablePagination,
  TableRow
} from '@mui/material';
import { pathOr } from 'ramda';

import { CSVDownload } from 'react-csv';
import Translate from '../../../common/Translate';
import Alert from '../../../common/Alert';

import SearchTableActions from './SearchTableActions';
import ResultsTableHead from './ResultsTableHead';
import { ADVANCED_SEARCH_TYPES } from '../../../../conf/config';

const StyledTableFooter = styled.div`
  align-items: center;
  display: flex;
  justify-content: space-between;
  margin: ${({ theme }) => theme.spacing(2)};
`;

const styles = () => ({
  table: {
    marginBottom: 0,
    overflow: 'auto'
  },
  tableRow: {
    '&:hover': {
      cursor: 'pointer'
    }
  },
  textError: {
    color: '#ff3333'
  }
});

const DEFAULT_FROM = 0;
const DEFAULT_PAGE = 0;
const DEFAULT_SIZE = 10;
// Don't authorize anyone to download all the database in CSV
const MAX_NUMBER_OF_DATA_TO_EXPORT_IN_CSV = 10000;

function truncateString(str, num) {
  return str.length > num ? `${str.slice(0, num)}...` : str;
}

// ============= MAIN COMPONENT ============= //

class SearchResultsTable extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      from: DEFAULT_FROM,
      page: DEFAULT_PAGE,
      size: DEFAULT_SIZE
    };
    this.handleRowClick = this.handleRowClick.bind(this);
    this.loadCSVData = this.loadCSVData.bind(this);
    this.getFullResultsAsCSV = this.getFullResultsAsCSV.bind(this);
    this.containerRef = createRef();
  }

  // ============================== //

  // If the results are empty, the component must
  // get back to the initial pagination state.
  componentDidUpdate(prevProps) {
    const { results: prevResults } = prevProps;
    const { results } = this.props;
    const { from, page, size } = this.state;

    if (
      !results &&
      (from !== DEFAULT_FROM || page !== DEFAULT_PAGE || size !== DEFAULT_SIZE)
    ) {
      // eslint-disable-next-line react/no-did-update-set-state
      this.setState({
        from: DEFAULT_FROM,
        page: DEFAULT_PAGE,
        size: DEFAULT_SIZE
      });
    }

    // Scroll to it only when new results are added
    if (
      (results && !prevResults) ||
      (results && results.length > prevResults.length)
    ) {
      this.containerRef.current.scrollIntoView({
        behavior: 'smooth'
      });
    }
  }

  // ===== Handle functions ===== //

  handleRowClick = docResult => {
    const { history, onRowClick, resourceType } = this.props;
    if (onRowClick) {
      onRowClick(docResult);
      return;
    }
    const { id } = docResult;
    let urlToRedirectTo = '';
    switch (resourceType) {
      case ADVANCED_SEARCH_TYPES.ENTRANCES:
        urlToRedirectTo = `/ui/entrances/${id}`;
        break;
      case ADVANCED_SEARCH_TYPES.ORGANIZATIONS:
        urlToRedirectTo = `/ui/organizations/${id}`;
        break;
      case ADVANCED_SEARCH_TYPES.MASSIFS:
        urlToRedirectTo = `/ui/massifs/${id}`;
        break;
      case ADVANCED_SEARCH_TYPES.DOCUMENTS:
        urlToRedirectTo = `/ui/documents/${id}`;
        break;
      default:
        break;
    }
    if (urlToRedirectTo !== '') {
      // Different behaviour if on mobile or not (better UX)
      if (isMobile) {
        history.push(urlToRedirectTo);
      } else {
        window.open(urlToRedirectTo, '_blank');
      }
    }
  };

  handleChangePage = (event, newPage) => {
    const { results, getNewResults, totalNbResults } = this.props;

    const { from, size } = this.state;

    // Formula: From = Page * Size (size remains the same here)
    const newFrom = newPage * size;

    /* Load new results if not enough already loaded:
      - click next page
      - results.length < totalNbResults (not ALL results already loaded)
      - results.length < newFrom + size (results on the asked page
          are not loaded)
    */
    if (
      newFrom > from &&
      results.length < totalNbResults &&
      results.length < newFrom + size
    ) {
      getNewResults(newFrom, size);
    }

    this.setState({
      page: newPage,
      from: newFrom
    });
  };

  handleChangeRowsPerPage = event => {
    const { results, getNewResults, totalNbResults } = this.props;
    const { from } = this.state;

    /*
      Formula used here:
        Page = From / Size

      Size is changing here.
      So we need to calculate the new page and the new from.
    */
    const newSize = event.target.value;
    const newPage = Math.trunc(from / newSize);
    const newFrom = newPage * newSize;

    /* Load new results if not enough already loaded:
      - results.length < totalNbResults (not ALL results already loaded)
      - results.length < newFrom + newSize (not enough results loaded)
    */
    if (results.length < totalNbResults && results.length < newFrom + newSize) {
      getNewResults(newFrom, newSize);
    }

    this.setState({
      from: newFrom,
      page: newPage,
      size: newSize
    });
  };

  // ===== CSV Export
  loadCSVData = () => {
    const { getFullResults } = this.props;
    getFullResults();
  };

  getFullResultsAsCSV = () => {
    const { resourceType, fullResults } = this.props;
    let cleanedResults;
    switch (resourceType) {
      case ADVANCED_SEARCH_TYPES.ENTRANCES:
        // Flatten cave and massif
        cleanedResults = fullResults.map(result => {
          const cleanedResult = result;
          cleanedResult.cave = pathOr(null, ['cave', 'name'], result);
          cleanedResult.massif = pathOr(null, ['massif', 'name'], result);
          delete cleanedResult.type;
          delete cleanedResult.highlights;
          return cleanedResult;
        });
        break;

      case ADVANCED_SEARCH_TYPES.ORGANIZATIONS:
      case ADVANCED_SEARCH_TYPES.MASSIFS:
        cleanedResults = fullResults.map(result => {
          const cleanedResult = result;
          delete cleanedResult.type;
          delete cleanedResult.highlights;
          return cleanedResult;
        });
        break;

      case ADVANCED_SEARCH_TYPES.DOCUMENTS:
        // Flatten regions and subjects
        cleanedResults = fullResults.map(result => {
          const cleanedResult = result;
          if (result.regions) {
            cleanedResult.regions = result.regions.map(s => s.names).join(', ');
          }
          if (result.subjects) {
            cleanedResult.subjects = result.subjects
              .map(s => s.code)
              .join(', ');
          }
          delete cleanedResult.type;
          delete cleanedResult.highlights;
          return cleanedResult;
        });
        break;

      default:
    }

    return cleanedResults;
  };

  // ===== Render ===== //

  render() {
    const {
      classes,
      isLoading,
      results,
      resourceType,
      totalNbResults,
      selectedIds,
      isLoadingFullData,
      wantToDownloadCSV,
      fullResults,
      intl
    } = this.props;
    const { from, page, size } = this.state;

    const canDownloadDataAsCSV =
      totalNbResults <= MAX_NUMBER_OF_DATA_TO_EXPORT_IN_CSV;
    /*
      When the component is loading the new page, we want to keep the
      previous results displayed (instead of a white board).
      That's why we check if the slice asked by the user is returning more
      than 0 results: if not, we keep the old results.
    */
    let resultsSliced = results;
    if (resultsSliced) {
      resultsSliced = results.slice(from, from + size);
      if (resultsSliced.length === 0) {
        resultsSliced = results.slice(results.length - size, results.length);
      }
    }

    /*
      For small screens, change the display property to allow horizontal scroll.
      Screen smaller than 1200px AND results type not "massif"
        => scrollable table (display: "block")
      (for massif, no scroll needed because the results are not very large)
    */
    const tableDisplayValueForScroll =
      window.innerWidth < 1200 && resourceType !== ADVANCED_SEARCH_TYPES.MASSIFS
        ? 'block'
        : 'table';

    if (resourceType === '' || resultsSliced === undefined) return '';
    return (
      <div ref={this.containerRef}>
        {resultsSliced.length > 0 ? (
          <>
            <Table
              className={classes.table}
              size="small"
              style={{ display: tableDisplayValueForScroll }}>
              <ResultsTableHead resourceType={resourceType} />

              <TableBody
                style={{
                  opacity: isLoading ? 0.3 : 1
                }}>
                {resultsSliced.map(result => (
                  <TableRow
                    hover
                    key={result.id}
                    selected={selectedIds && selectedIds.includes(result.id)}
                    className={classes.tableRow}
                    onClick={() => this.handleRowClick(result)}>
                    {resourceType === ADVANCED_SEARCH_TYPES.ENTRANCES && (
                      <>
                        <TableCell>{result.name}</TableCell>
                        <TableCell>
                          {result.countryCode ? result.countryCode : '-'}
                        </TableCell>
                        <TableCell>
                          {pathOr('-', ['massif', 'name'], result)}
                        </TableCell>
                        <TableCell>
                          {result.aestheticism
                            ? Number(result.aestheticism.toFixed(1))
                            : '-'}
                        </TableCell>
                        <TableCell>
                          {result.caving
                            ? Number(result.caving.toFixed(1))
                            : '-'}
                        </TableCell>
                        <TableCell>
                          {result.approach
                            ? Number(result.approach.toFixed(1))
                            : '-'}
                        </TableCell>
                        <TableCell>
                          {pathOr('-', ['cave', 'name'], result)}
                        </TableCell>
                        <TableCell>
                          {result.cave && result.cave.length
                            ? `${result.cave.length}m`
                            : '-'}
                        </TableCell>
                        <TableCell>
                          {result.cave && result.cave.depth
                            ? `${result.cave.depth}m`
                            : '-'}
                        </TableCell>
                      </>
                    )}
                    {resourceType === ADVANCED_SEARCH_TYPES.ORGANIZATIONS && (
                      <>
                        <TableCell>{result.name}</TableCell>
                        <TableCell>{result.mail ? result.mail : '-'}</TableCell>
                        <TableCell>{result.city ? result.city : '-'}</TableCell>
                        <TableCell>
                          {result.county ? result.county : '-'}
                        </TableCell>
                        <TableCell>
                          {result.region ? result.region : '-'}
                        </TableCell>
                        <TableCell>
                          {result.countryCode ? result.countryCode : '-'}
                        </TableCell>
                        <TableCell>
                          {result.nbCavers ? result.nbCavers : '0'}
                        </TableCell>
                      </>
                    )}
                    {resourceType === ADVANCED_SEARCH_TYPES.MASSIFS && (
                      <>
                        <TableCell>{result.name}</TableCell>
                        <TableCell>
                          {result.nbCaves ? result.nbCaves : '0'}
                        </TableCell>
                        <TableCell>
                          {result.nbEntrances ? result.nbEntrances : '0'}
                        </TableCell>
                      </>
                    )}
                    {resourceType === ADVANCED_SEARCH_TYPES.DOCUMENTS && (
                      <>
                        <TableCell>{result.title}</TableCell>
                        <TableCell>
                          {result.publication ? result.publication : '-'}
                        </TableCell>
                        <TableCell>
                          {result.subjects
                            ? result.subjects.map(s => s.code).join(', ')
                            : '-'}
                        </TableCell>
                        <TableCell>
                          {result.regions
                            ? truncateString(
                                result.regions.map(s => s.name).join(', '),
                                30
                              )
                            : '-'}
                        </TableCell>
                        <TableCell>
                          {result.authors ? result.authors : '-'}
                        </TableCell>
                        <TableCell>
                          {result.datePublication
                            ? result.datePublication
                            : '-'}
                        </TableCell>
                      </>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <StyledTableFooter>
              <Button
                disabled={!canDownloadDataAsCSV}
                type="button"
                variant="contained"
                size="large"
                onClick={this.loadCSVData}
                startIcon={<DescriptionIcon />}>
                <Translate>Export to CSV</Translate>
              </Button>

              {!isLoadingFullData &&
                fullResults.length === totalNbResults &&
                wantToDownloadCSV && (
                  <CSVDownload
                    data={this.getFullResultsAsCSV()}
                    target="_self"
                  />
                )}

              <TablePagination
                rowsPerPageOptions={[5, 10, 20]}
                component="div"
                count={totalNbResults}
                rowsPerPage={size}
                page={page}
                labelRowsPerPage={intl.formatMessage({
                  id: 'Results per page:'
                })}
                onPageChange={(event, pageNb) =>
                  this.handleChangePage(event, pageNb)
                }
                onRowsPerPageChange={event =>
                  this.handleChangeRowsPerPage(event)
                }
                ActionsComponent={() => (
                  <SearchTableActions
                    page={page}
                    size={size}
                    onPageChange={this.handleChangePage}
                    count={totalNbResults}
                  />
                )}
              />
            </StyledTableFooter>

            {isLoadingFullData && (
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <CircularProgress style={{ marginRight: '5px' }} />
                <Translate>Loading full data, please wait...</Translate>
              </div>
            )}
            {!canDownloadDataAsCSV && (
              <p className={classes.textError}>
                <Translate
                  id="Too many results to download ({0}). You can only download {1} results at once."
                  defaultMessage="Too many results to download ({0}). You can only download {1} results at once."
                  values={{
                    0: <b>{totalNbResults}</b>,
                    1: <b>{MAX_NUMBER_OF_DATA_TO_EXPORT_IN_CSV}</b>
                  }}
                />
              </p>
            )}
          </>
        ) : (
          <Alert
            severity="info"
            title={intl.formatMessage({
              id: 'No results'
            })}
          />
        )}
      </div>
    );
  }
}

SearchResultsTable.propTypes = {
  classes: PropTypes.shape({
    table: PropTypes.string,
    tableRow: PropTypes.string,
    textError: PropTypes.string
  }).isRequired,
  history: PropTypes.shape({ push: PropTypes.func }).isRequired,
  isLoading: PropTypes.bool.isRequired,
  isLoadingFullData: PropTypes.bool.isRequired,
  results: PropTypes.arrayOf(PropTypes.shape({})),
  resourceType: PropTypes.oneOf(['', ...Object.values(ADVANCED_SEARCH_TYPES)])
    .isRequired,
  getNewResults: PropTypes.func.isRequired,
  getFullResults: PropTypes.func.isRequired,
  wantToDownloadCSV: PropTypes.bool.isRequired,
  totalNbResults: PropTypes.number.isRequired,
  fullResults: PropTypes.arrayOf(PropTypes.shape({})),
  intl: PropTypes.shape({ formatMessage: PropTypes.func }).isRequired,
  onRowClick: PropTypes.func,
  selectedIds: PropTypes.arrayOf(PropTypes.string.isRequired)
};

SearchResultsTable.defaultProps = {
  results: undefined,
  fullResults: undefined
};

export default injectIntl(withRouter(withStyles(styles)(SearchResultsTable)));
