import React, { Component } from 'react';
import PropTypes from 'prop-types';
import fetch from 'isomorphic-fetch';
import {
  Table,
  TableBody,
  TableRow,
  TableCell,
  TableHead
} from '@material-ui/core';
import GCLink from '../common/GCLink';
import { Loading } from '../common/Toolbox';

const EntriesOfInterestTableRow = props => {
  const {
    row: {
      id,
      name,
      country,
      region,
      isPublic,
      isSensitive,
      isOfInterest,
      entryInfo,
      stats,
      timeInfo
    }
  } = props;
  return (
    <TableRow>
      <TableCell>{id}</TableCell>
      <TableCell>{name}</TableCell>
      <TableCell>{country}</TableCell>
      <TableCell>{region}</TableCell>
      <TableCell>{isPublic}</TableCell>
      <TableCell>{isSensitive}</TableCell>
      <TableCell>{isOfInterest.data[0]}</TableCell>
      <TableCell>
        {entryInfo && entryInfo.depth ? entryInfo.depth : ''}
      </TableCell>
      <TableCell>{entryInfo ? entryInfo.length : ''}</TableCell>
      <TableCell>
        {entryInfo ? (
          <img
            style={{ width: '150px' }}
            src={entryInfo.path}
            alt="Entry info"
          />
        ) : (
          ''
        )}
      </TableCell>
      <TableCell>{stats ? stats.aestheticism : ''}</TableCell>
      <TableCell>{stats ? stats.caving : ''}</TableCell>
      <TableCell>{stats ? stats.approach : ''}</TableCell>
      <TableCell>{timeInfo ? timeInfo.eTTrail : ''}</TableCell>
      <TableCell>{timeInfo ? timeInfo.eTUnderground : ''}</TableCell>
    </TableRow>
  );
};

EntriesOfInterestTableRow.propTypes = {
  row: PropTypes.shape(PropTypes.any).isRequired
};

export class EntriesOfInterest extends Component {
  constructor(props) {
    super(props);
    this.state = {
      items: []
    };
    this.fetchData = this.fetchData.bind(this);
  }

  componentDidMount() {
    this.fetchData();
  }

  fetchData() {
    const _this = this; // eslint-disable-line no-underscore-dangle
    fetch(
      `${process.env.REACT_APP_API_URL}/api/admin/entrances/findAllOfInterest`
    )
      .then(response => {
        if (response.status >= 400) {
          throw new Error('Bad response from server');
        }
        return response.json();
      })
      .then(results => {
        _this.setState({
          items: results
        });
      });
  }

  render() {
    const { items } = this.state;
    if (items.length === 0) {
      return <Loading />;
    }

    const rows = [];
    items.forEach(newRow => {
      if (newRow !== undefined) {
        rows.push(<EntriesOfInterestTableRow key={newRow.id} row={newRow} />);
      }
    });

    return (
      <div>
        {rows.length > 0 && (
          <Table
            selectable={false}
            multiSelectable={false}
            wrapperStyle={{ overflow: 'initial' }}
            bodyStyle={{ overflow: 'initial' }}
            style={{ width: 'initial' }}>
            <TableHead>
              <TableRow>
                <TableCell>Id</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Country</TableCell>
                <TableCell>Region</TableCell>
                <TableCell>Is public</TableCell>
                <TableCell>Is sensitive</TableCell>
                <TableCell>Is of interest</TableCell>
                <TableCell>Depth</TableCell>
                <TableCell>Length</TableCell>
                <TableCell>Displayed image</TableCell>
                <TableCell>Stat for aestheticism</TableCell>
                <TableCell>Stat for caving</TableCell>
                <TableCell>Stat for approach</TableCell>
                <TableCell>Time to go</TableCell>
                <TableCell>Underground time</TableCell>
              </TableRow>
            </TableHead>
            <TableBody
              displayRowCheckbox={false}
              adjustForCheckbox={false}
              showRowHover>
              {rows}
            </TableBody>
          </Table>
        )}
      </div>
    );
  }
}

const AvailableTools = () => (
  <ul>
    <li>
      <GCLink internal href="/admin/listEntriesOfInterest">
        Entries of interest
      </GCLink>
    </li>
  </ul>
);

export default AvailableTools;
