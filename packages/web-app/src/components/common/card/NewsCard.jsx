import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Chip } from '@mui/material';
import Card from '@mui/material/Card';
import CardMedia from '@mui/material/CardMedia';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import ImageLoupe from '@mui/icons-material/Loupe';
import SyncIcon from '@mui/icons-material/Sync';
import SyncKOIcon from '@mui/icons-material/SyncProblem';
import Divider from '@mui/material/Divider';
import withStyles from '@mui/styles/withStyles';
import { styled } from '@mui/material/styles';
import GCLink from '../GCLink';
import { DYNAMIC_NEWS_RELOAD_INTERVAL } from '../../../conf/config';

const StyledCardMedia = withStyles({
  root: {
    height: '150px'
  }
})(CardMedia);

const StyledCardContent = withStyles({
  root: {
    minHeight: '150px',
    textAlign: 'justify'
  }
})(CardContent);

const StyledCardActions = withStyles({
  root: {
    justifyContent: 'flex-end'
  }
})(CardActions);

const StyledCard = withStyles(
  theme => ({
    root: {
      '&:nth-child(n+1)': {
        marginTop: '4%',
        [theme.breakpoints.up('550')]: {
          marginTop: '0'
        }
      }
    }
  }),
  { withTheme: true }
)(Card);

const StyledActionCard = styled(StyledCard)`
  text-align: center !important;
`;

const StyledSyncIcon = withStyles(
  theme => ({
    root: {
      '&:hover': {
        fill: theme.palette.accent1Color
      },
      fill: theme.palette.primary3Color
    }
  }),
  { withTheme: true }
)(SyncIcon);

const StyledSyncKOIcon = withStyles(
  theme => ({
    root: {
      '&:hover': {
        fill: theme.palette.accent1Color
      },
      fill: theme.palette.primary3Color
    }
  }),
  { withTheme: true }
)(SyncKOIcon);

const StyledImageLoupe = withStyles(
  theme => ({
    root: {
      fill: theme.palette.accent1Color
    }
  }),
  { withTheme: true }
)(ImageLoupe);

const StyledTitleTypography = withStyles({
  root: {
    fontSize: '24px',
    minHeight: '60px'
  }
})(Typography);

const StyledBodyTypography = withStyles({
  root: {
    fontSize: '14px',
    textAlign: 'justify'
  }
})(Typography);

class NewsCard extends Component {
  constructor(props) {
    super(props);
    props.init();
    props.refresh();
  }

  componentDidMount() {
    const { refresh } = this.props;
    this.interval = setInterval(refresh, DYNAMIC_NEWS_RELOAD_INTERVAL);
  }

  componentWillUnmount() {
    clearInterval(this.interval);
  }

  render() {
    const { showSpinner, text, day, month, title, linkMore } = this.props;

    if (showSpinner && !text) {
      return (
        <StyledActionCard>
          <StyledSyncIcon />
        </StyledActionCard>
      );
    }

    if (!showSpinner && !text) {
      return (
        <StyledActionCard>
          <StyledSyncKOIcon />
        </StyledActionCard>
      );
    }

    return (
      <StyledCard>
        <StyledCardMedia image="images/homepage/news.jpg" />
        {day && month && <Chip color="primary" label={`${day} ${month}`} />}
        <StyledCardContent>
          <StyledTitleTypography gutterBottom component="h3">
            {title}
          </StyledTitleTypography>
          <StyledBodyTypography component="p">{text}</StyledBodyTypography>
        </StyledCardContent>
        <Divider />
        {linkMore && (
          <StyledCardActions>
            <GCLink href={linkMore}>
              <Button>
                <StyledImageLoupe />
              </Button>
            </GCLink>
          </StyledCardActions>
        )}
      </StyledCard>
    );
  }
}

NewsCard.propTypes = {
  showSpinner: PropTypes.bool,
  day: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  month: PropTypes.string,
  title: PropTypes.string,
  text: PropTypes.string,
  linkMore: PropTypes.string,
  init: PropTypes.func.isRequired,
  refresh: PropTypes.func.isRequired
};

export default NewsCard;
