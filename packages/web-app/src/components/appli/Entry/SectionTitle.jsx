import PropTypes from 'prop-types';
import React from 'react';
import { Typography, Box } from '@mui/material';
import { styled } from '@mui/material/styles';
import { useIntl } from 'react-intl';
import AnchorCopyButton, { AnchorHeadingWrapper } from '../../common/AnchorCopyButton';
import { useAnchorScroll } from '../../../hooks';

const AnchorBox = styled(Box)`
  scroll-margin-top: ${({ theme }) => theme.appBarHeight}px;
`;

const SectionTitle = ({ title, anchorId, isDeleted = false, marginBotton = 2 }) => {
  const { formatMessage } = useIntl();
  useAnchorScroll(anchorId);

  const heading = anchorId ? (
    <AnchorHeadingWrapper>
      {title}
      <AnchorCopyButton anchorId={anchorId} />
    </AnchorHeadingWrapper>
  ) : (
    title
  );

  if (!isDeleted)
    return (
      <AnchorBox id={anchorId} mb={marginBotton}>
        <Typography variant="h4">{heading}&nbsp;</Typography>
      </AnchorBox>
    );

  return (
    <AnchorBox id={anchorId} mb={2}>
      <Typography
        variant="h4"
        noWrap
        sx={{
          display: 'inline-block',
          textTransform: 'uppercase',
          fontWeight: 'bold'
        }}>
        [{formatMessage({ id: 'deleted' })}]&nbsp;
      </Typography>
      <Typography
        variant="h4"
        noWrap
        sx={{
          fontStyle: 'italic',
          textDecoration: 'line-through',
          display: 'inline-block',
          fontWeight: 'normal'
        }}>
        {heading}&nbsp;
      </Typography>
    </AnchorBox>
  );
};

export default SectionTitle;

SectionTitle.propTypes = {
  title: PropTypes.string.isRequired,
  anchorId: PropTypes.string,
  isDeleted: PropTypes.bool,
  marginBotton: PropTypes.number
};
