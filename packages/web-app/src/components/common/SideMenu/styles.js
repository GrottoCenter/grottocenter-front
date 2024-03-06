import { styled } from '@mui/material/styles';
import { Link } from 'react-router-dom';
import { ListItem } from '@mui/material';

export const StyledLink = styled(Link)`
  color: inherit;
  text-decoration: inherit;
`;

export const StyledListItem = styled(ListItem, {
  shouldForwardProp: prop => prop[0] !== '$'
})`
  padding-left: ${({ theme, $nested }) => ($nested ? theme.spacing(4) : 0)}px;
`;
