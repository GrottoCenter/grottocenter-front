import { useIntl } from 'react-intl';
import { Chip, ListItem, ListItemText, ListItemIcon } from '@material-ui/core';
import React from 'react';
import styled from 'styled-components';
import GCLink from '../../../common/GCLink';
import { documentType } from '../Provider';
import Files from './Files';
import { SnapshotButton } from '../Snapshots/UtilityFunction';

const StyledListItemText = styled(ListItemText)`
  width: 100%;
  margin: 0;
`;

const StyledChip = styled(Chip)`
  margin-left: ${({ theme }) => theme.spacing(2)}px;
  padding: 0 ${({ theme }) => theme.spacing(1)}px;
`;
const StyledListItem = styled(ListItem)`
  padding: 4px 0;
  margin: 0;
`;

const Document = ({ details, entities, id, overview, snapshot }) => {
  const { formatMessage } = useIntl();

  return (
    <StyledListItem>
      <StyledListItemText
        primary={
          <>
            <GCLink internal={false} href={`/ui/documents/${id}`}>
              {overview.title}
            </GCLink>
            <StyledChip
              variant="outlined"
              size="small"
              color="primary"
              label={
                (details.documentType &&
                  formatMessage({
                    id: details.documentType
                  })) ||
                formatMessage({ id: 'unknown' })
              }
            />
          </>
        }
        secondaryTypographyProps={{ component: 'div' }}
        secondary={
          <Files
            {...entities.files}
            licenseName={overview.license.name}
            licenseUrl={overview.license.url}
          />
        }
      />
      <ListItemIcon style={{ alignSelf: 'start' }}>
        <SnapshotButton
          color="primary"
          variant="outlined"
          id={id}
          type="documents"
          content={snapshot}
        />
      </ListItemIcon>
    </StyledListItem>
  );
};

Document.propTypes = documentType;

export default Document;
