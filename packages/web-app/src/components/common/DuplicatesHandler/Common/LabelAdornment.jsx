import React from 'react';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import {
  useTheme,
  List,
  ListItem,
  ListItemText,
  ListItemIcon
} from '@mui/material';
import { useIntl } from 'react-intl';
import styled from 'styled-components';

const Wrapper = styled.div`
  margin-top: ${({ theme }) => theme.spacing(1)};
  margin-bot: ${({ theme }) => theme.spacing(1)};
`;

const LabelAdornment = () => {
  const theme = useTheme();
  const { formatMessage } = useIntl();

  return (
    <Wrapper>
      <List dense disablePadding>
        <ListItem dense>
          <ListItemIcon>
            <ErrorOutlineIcon style={{ color: theme.palette.successColor }} />
          </ListItemIcon>
          <ListItemText
            primary={formatMessage({
              id: 'Data is already in the database and should be selected when possible'
            })}
          />
        </ListItem>
        <ListItem>
          <ListItemIcon>
            <ErrorOutlineIcon style={{ color: theme.palette.errorColor }} />
          </ListItemIcon>
          <ListItemText
            primary={formatMessage({
              id: 'Data is not in the database and will be created when selected'
            })}
          />
        </ListItem>
        <ListItem>
          <ListItemIcon>
            <ErrorOutlineIcon
              style={{ color: theme.palette.secondary.light }}
            />
          </ListItemIcon>
          <ListItemText
            primary={formatMessage({
              id: 'It has no impact to select one or the other'
            })}
          />
        </ListItem>
      </List>
    </Wrapper>
  );
};

export default LabelAdornment;
