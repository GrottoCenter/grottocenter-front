import styled from 'styled-components';
import { Link } from 'react-router-dom';
import { ListItem } from '@mui/material';

export const StyledLink = styled(Link)`
  color: inherit;
  text-decoration: inherit;
`;

export const StyledListItem = styled(ListItem)`
  padding-left: ${({ theme, $nested }) => ($nested ? theme.spacing(4) : '0px')};
`;
