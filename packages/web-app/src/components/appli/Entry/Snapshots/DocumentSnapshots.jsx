import * as React from 'react';
import {
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  styled
} from '@material-ui/core';
import { useIntl } from 'react-intl';
import { pathOr } from 'ramda';
import PropTypes from 'prop-types';

const PropertyName = styled(TableCell)`
  font-weight: bold;
  text-transform: uppercase;
`;

const Property = ({ name, value }) => (
  <TableRow key={name}>
    <PropertyName align="right">{name}</PropertyName>
    <TableCell>{value}</TableCell>
  </TableRow>
);
Property.propTypes = {
  name: PropTypes.string.isRequired,
  value: PropTypes.string
};
const INFORMATION_NOT_FOUND = 'unknown';

const DocumentSnapshots = information => {
  const { document } = information;
  const {
    type,
    datePublication,
    editor,
    identifier,
    license,
    parent,
    description
  } = document;
  const { formatMessage } = useIntl();
  return (
    <TableContainer>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell align="right">
              {formatMessage({ id: 'Property name' })}
            </TableCell>
            <TableCell>{formatMessage({ id: 'Property value' })}</TableCell>
          </TableRow>
        </TableHead>

        <TableBody>
          <Property
            name={formatMessage({ id: 'Document type' })}
            value={formatMessage({
              id: pathOr(
                formatMessage({ id: INFORMATION_NOT_FOUND }),
                ['name'],
                type
              )
            })}
          />
          {pathOr(
            formatMessage({ id: INFORMATION_NOT_FOUND }),
            ['language', 'refName'],
            description
          ) !== '' && (
            <Property
              name={formatMessage({ id: 'Title and description language' })}
              value={formatMessage({
                id: description.language.refName
              })}
            />
          )}

          <Property
            key="title"
            name={formatMessage({ id: 'Title' })}
            value={description.title}
          />
          <Property
            key="description"
            name={formatMessage({ id: 'Description' })}
            value={description.body}
          />
          <Property
            name={formatMessage({ id: 'Publication Date' })}
            value={
              datePublication ?? formatMessage({ id: INFORMATION_NOT_FOUND })
            }
          />
          <Property
            name={formatMessage({ id: 'Editor' })}
            value={
              editor?.name
                ? `${editor.name} ${editor.surname}`
                : editor?.nickname ??
                  formatMessage({ id: INFORMATION_NOT_FOUND })
            }
          />
          <Property
            key="identifier"
            name={formatMessage({ id: 'Identifier' })}
            value={identifier ?? formatMessage({ id: INFORMATION_NOT_FOUND })}
          />
          <Property
            key="license"
            name={formatMessage({ id: 'License' })}
            value={pathOr(
              formatMessage({ id: INFORMATION_NOT_FOUND }),
              ['name'],
              license
            )}
          />
          <Property
            key="parent_document"
            name={formatMessage({ id: 'Parent document' })}
            value={pathOr(
              formatMessage({ id: INFORMATION_NOT_FOUND }),
              ['id'],
              parent
            )}
          />
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default DocumentSnapshots;
