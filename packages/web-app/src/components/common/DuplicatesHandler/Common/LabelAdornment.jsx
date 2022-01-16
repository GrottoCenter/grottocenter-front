import React from 'react';
import ErrorOutlineIcon from '@material-ui/icons/ErrorOutline';
import {
  useTheme,
  List,
  ListItem,
  ListItemText,
  ListItemIcon
} from '@material-ui/core';
import { useIntl } from 'react-intl';
import styled from 'styled-components';

const Wrapper = styled.div`
  margin-top: ${({ theme }) => theme.spacing(1)}px;
  margin-bot: ${({ theme }) => theme.spacing(1)}px;
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
              id:
                'Data are already in the database and should be selected when possible'
            })}
          />
        </ListItem>
        <ListItem>
          <ListItemIcon>
            <ErrorOutlineIcon style={{ color: theme.palette.errorColor }} />
          </ListItemIcon>
          <ListItemText
            primary={formatMessage({
              id:
                'Data are not in the database and will be created when selected'
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
