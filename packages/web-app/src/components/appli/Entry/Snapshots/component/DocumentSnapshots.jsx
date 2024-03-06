import * as React from 'react';
import {
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  styled
} from '@mui/material';
import { useIntl } from 'react-intl';
import { pathOr } from 'ramda';
import PropTypes from 'prop-types';
import intactDescription from '../../../../../types/intactDescription.type';
import licenseType from '../../../../../types/license.type';
import { HighLightsLine } from '../../../../common/Highlights';

const PropertyName = styled(TableCell)`
  font-weight: bold;
  text-transform: uppercase;
`;

const Property = ({ name, value, oldValue }) => (
  <TableRow key={name}>
    <PropertyName align="right">{name}</PropertyName>
    <TableCell>
      <HighLightsLine newText={value} oldText={oldValue} />
    </TableCell>
  </TableRow>
);
Property.propTypes = {
  name: PropTypes.string.isRequired,
  value: PropTypes.string,
  oldValue: PropTypes.string
};
const INFORMATION_NOT_FOUND = 'unknown';

const DocumentSnapshots = ({ document, previous }) => {
  const {
    type,
    datePublication,
    editor,
    identifier,
    license,
    parent,
    description,
    intactDescriptions
  } = document;
  const documentDescription =
    description ?? (intactDescriptions ? intactDescriptions[0] : {});
  const previousDescription = previous?.descriptions
    ? previous?.descriptions[0]
    : previous?.description;
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
            oldValue={previous?.type.name}
          />
          <Property
            name={formatMessage({ id: 'Title and description language' })}
            value={formatMessage({
              id: pathOr(
                INFORMATION_NOT_FOUND,
                ['language', 'refName'],
                documentDescription
              )
            })}
            oldValue={previousDescription?.language?.refName}
          />
          <Property
            key="title"
            name={formatMessage({ id: 'Title' })}
            value={documentDescription.title}
            oldValue={previousDescription?.title}
          />
          <Property
            key="description"
            name={formatMessage({ id: 'Description' })}
            value={documentDescription.body}
            oldValue={previousDescription?.body ?? previousDescription?.text}
          />
          <Property
            name={formatMessage({ id: 'Publication Date' })}
            value={
              datePublication ?? formatMessage({ id: INFORMATION_NOT_FOUND })
            }
            oldValue={previous?.datePublication}
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
            oldValue={previous?.identifier}
          />
          <Property
            key="license"
            name={formatMessage({ id: 'License' })}
            value={pathOr(
              formatMessage({ id: INFORMATION_NOT_FOUND }),
              ['name'],
              license
            )}
            oldValue={previous?.license?.name}
          />
          <TableRow key="parent_document">
            <PropertyName align="right">
              {formatMessage({ id: 'Parent document' })}
            </PropertyName>
            {parent ? (
              <TableCell numeric component="a" href={`/ui/documents/${parent}`}>
                <HighLightsLine newText={parent} oldText={previous?.parent} />
              </TableCell>
            ) : (
              <TableCell>
                {formatMessage({ id: INFORMATION_NOT_FOUND })}
              </TableCell>
            )}
          </TableRow>
        </TableBody>
      </Table>
    </TableContainer>
  );
};
DocumentSnapshots.propTypes = {
  document: PropTypes.shape({
    type: PropTypes.string,
    datePublication: PropTypes.string,
    editor: PropTypes.shape({
      name: PropTypes.string,
      surname: PropTypes.string,
      nickname: PropTypes.string
    }),
    identifier: PropTypes.string,
    license: licenseType,
    parent: PropTypes.number,
    description: intactDescription,
    intactDescriptions: intactDescription
  }),
  previous: PropTypes.shape({
    type: PropTypes.string,
    datePublication: PropTypes.string,
    editor: PropTypes.shape({
      name: PropTypes.string,
      surname: PropTypes.string,
      nickname: PropTypes.string
    }),
    identifier: PropTypes.string,
    license: licenseType,
    parent: PropTypes.number,
    descriptions: intactDescription,
    description: intactDescription
  })
};

export default DocumentSnapshots;
