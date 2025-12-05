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
import { styled } from '@mui/material/styles';
import GCLink from '../GCLink';
import { DYNAMIC_NEWS_RELOAD_INTERVAL } from '../../../conf/config';

const StyledCardMedia = styled(CardMedia)({
  height: '150px'
});

const StyledCardContent = styled(CardContent)({
  minHeight: '150px',
  textAlign: 'justify'
});

const StyledCardActions = styled(CardActions)({
  justifyContent: 'flex-end'
});

const StyledCard = styled(Card)(({ theme }) => ({
  '&:nth-of-type(n+1)': {
    marginTop: '4%',
    [theme.breakpoints.up('550')]: {
      marginTop: '0'
    }
  }
}));

const StyledActionCard = styled(StyledCard)`
  text-align: center !important;
`;

const StyledSyncIcon = styled(SyncIcon)(({ theme }) => ({
  '&:hover': {
    fill: theme.palette.accent1Color
  },
  fill: theme.palette.primary3Color
}));

const StyledSyncKOIcon = styled(SyncKOIcon)(({ theme }) => ({
  '&:hover': {
    fill: theme.palette.accent1Color
  },
  fill: theme.palette.primary3Color
}));

const StyledImageLoupe = styled(ImageLoupe)(({ theme }) => ({
  fill: theme.palette.accent1Color
}));

const StyledTitleTypography = styled(Typography)(({ theme }) => ({
  '&.MuiTypography-root': {
    fontSize: '24px'
  },
  minHeight: '60px'
}));

const StyledBodyTypography = styled(Typography)({
  '&.MuiTypography-root': {
    fontSize: '14px',
    letterSpacing: '0.00938em'
  },
  textAlign: 'justify'
});

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
