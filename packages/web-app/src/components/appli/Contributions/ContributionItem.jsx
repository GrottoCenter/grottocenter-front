import PropTypes from 'prop-types';
import { Box, ListItem, ListItemText } from '@mui/material';
import { styled } from '@mui/material/styles';

const Item = styled(ListItem, {
  shouldForwardProp: prop => prop !== 'inlineActions'
})`
  display: ${({ inlineActions }) => (inlineActions ? 'flex' : 'flow-root')};
  flex-direction: row;
  align-items: flex-start;
  border-top: 1px solid ${({ theme }) => theme.palette.divider};
  padding-top: ${({ theme }) => theme.spacing(0.5)};
  padding-bottom: ${({ theme }) => theme.spacing(0.5)};
`;

const ContributionItem = ({
  actions,
  title,
  form,
  children,
  inlineActions = false
}) => {
  const content = form || (
    <ListItemText
      sx={{ m: 0 }}
      disableTypography
      primary={title}
      secondary={children}
    />
  );
  const flowContent = form ? <Box sx={{ width: '100%' }}>{form}</Box> : content;

  return (
    <Item disableGutters inlineActions={inlineActions}>
      {!inlineActions && <Box sx={{ float: 'right', ml: 0.5 }}>{actions}</Box>}
      {inlineActions ? (
        <Box sx={{ flex: 1, minWidth: 0 }}>{content}</Box>
      ) : (
        flowContent
      )}
      {inlineActions && <Box sx={{ flexShrink: 0, ml: 0.5 }}>{actions}</Box>}
    </Item>
  );
};

ContributionItem.propTypes = {
  actions: PropTypes.node,
  title: PropTypes.node,
  form: PropTypes.node,
  children: PropTypes.node,
  inlineActions: PropTypes.bool
};

export default ContributionItem;
