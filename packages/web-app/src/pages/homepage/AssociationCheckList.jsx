import React from 'react';
import PropTypes from 'prop-types';
import CheckIcon from '@mui/icons-material/Check';
import { styled, keyframes } from '@mui/material/styles';
import withStyles from '@mui/styles/withStyles';

const CheckList = styled('ul')`
  width: 100%;
  list-style-type: none;
`;

const ListTitle = styled('p')`
  margin-bottom: 40px;
  display: block;
  font-weight: 600;
`;

const CheckListWrapper = styled('div')`
  @media (min-width: 550px) {
    display: none;
  }
`;

const zoomAnimation = keyframes`
  {
    50%  { transform: scale(1.5, 1.5); }
    100% { transform: scale(1, 1); }
  }
`;

const ListIcon = styled(CheckIcon)`
  height: 50px !important; // lesshint importantRule: false
  width: 50px !important; // lesshint importantRule: false
  float: left;
  fill: ${props => props.color} !important; // lesshint importantRule: false

  :hover {
    animation: ${zoomAnimation} 500ms ease;
  }

  @media (min-width: 550px) {
    height: 80px !important; // lesshint importantRule: false
    width: 80px !important; // lesshint importantRule: false
  }
`;

const ListItem = styled('li')`
  display: inline-block;
  font-weight: 300;
  font-size: large;
  line-height: 25px;
  min-height: 80px;
  text-align: justify;
  margin-bottom: 40px;

  &::after {
    content: '';
    clear: both;
  }

  &:nth-child(odd) span {
    display: block;
    margin-left: 80px;
    margin-right: 0px;
  }

  &:nth-child(even) span {
    display: block;
    margin-left: 0px;
    margin-right: 80px;
    text-align: right;
  }

  &:nth-child(even) svg {
    float: right;
  }

  @media (max-width: 550px) {
    :last-child {
      margin-bottom: 0px;
    }
  }
`;

const StyledListIcon = withStyles(
  theme => ({
    root: {
      fill: theme.palette.accent1Color
    }
  }),
  { withTheme: true }
)(ListIcon);

const AssociationCheckList = ({ title, entries }) => (
  <CheckListWrapper>
    <ListTitle>{title}</ListTitle>

    <CheckList>
      {entries.map(entry => (
        <ListItem key={entry.word.props.children}>
          <StyledListIcon />
          {entry.description}
        </ListItem>
      ))}
    </CheckList>
  </CheckListWrapper>
);

AssociationCheckList.propTypes = {
  // eslint-disable-next-line react/forbid-prop-types
  entries: PropTypes.array.isRequired,
  title: PropTypes.element.isRequired
};

export default AssociationCheckList;
