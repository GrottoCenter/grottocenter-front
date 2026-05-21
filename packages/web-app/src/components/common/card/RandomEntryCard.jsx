import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardMedia,
  Chip,
  Skeleton,
  Typography
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { isNil } from 'ramda';
import { FormattedMessage } from 'react-intl';
import GCLink from '../GCLink';
import { depthIcon, lengthIcon } from '../../../assets/icons';

const CompactCard = styled(Card)({
  display: 'flex',
  flexDirection: 'row',
  '@media (max-width: 600px)': {
    flexDirection: 'column'
  }
});

const MediaWrapper = styled(Box)({
  width: 200,
  minHeight: 160,
  flexShrink: 0,
  '@media (max-width: 600px)': {
    width: '100%',
    minHeight: 140
  }
});

const StyledCardMedia = styled(CardMedia)({
  height: '100%',
  minHeight: 160,
  '@media (max-width: 600px)': {
    minHeight: 140
  }
});

const ContentBox = styled(CardContent)({
  display: 'flex',
  flexDirection: 'column',
  flex: 1,
  padding: '16px !important'
});

const InfoRow = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  marginTop: 4
});

const InfoImg = styled('img')({
  height: 18,
  width: 18
});

const getTopoImage = documents => {
  if (!documents) return null;
  const topoDoc = documents.find(d => d.type === 13);
  if (isNil(topoDoc)) return null;
  const topo = topoDoc.files?.find(f => f.pathOld !== null);
  return topo?.pathOld || null;
};

const RandomEntryCard = ({ entry, isFetching, fetch }) => {
  useEffect(() => {
    fetch();
  }, [fetch]);

  if (isFetching) {
    return (
      <CompactCard>
        <MediaWrapper>
          <Skeleton variant="rectangular" width="100%" height={160} />
        </MediaWrapper>
        <ContentBox>
          <Skeleton variant="text" width="60%" height={32} />
          <Skeleton variant="text" width="40%" />
          <Skeleton variant="text" width="80%" sx={{ mt: 1 }} />
        </ContentBox>
      </CompactCard>
    );
  }

  if (!entry?.id) return null;

  const { county, region, country, cave, documents } = entry;
  const imageSrc = getTopoImage(documents);
  const locationParts = [county, region, country].filter(Boolean);

  return (
    <CompactCard>
      <MediaWrapper>
        <StyledCardMedia
          image={imageSrc || '/images/caves/gours.jpg'}
          title={entry.name}
        />
      </MediaWrapper>
      <ContentBox>
        <Chip
          label={<FormattedMessage id="Random cave" />}
          color="secondary"
          size="small"
          sx={{ alignSelf: 'flex-start', mb: 1 }}
        />
        <Typography variant="h6" gutterBottom>
          {entry.name}
        </Typography>
        {locationParts.length > 0 && (
          <Typography variant="body2" color="text.secondary">
            {locationParts.join(' · ')}
          </Typography>
        )}
        {cave && (
          <InfoRow>
            {cave.length && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <InfoImg src={lengthIcon} alt="length" />
                <Typography variant="caption">{cave.length} m</Typography>
              </Box>
            )}
            {cave.depth && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <InfoImg src={depthIcon} alt="depth" />
                <Typography variant="caption">{cave.depth} m</Typography>
              </Box>
            )}
          </InfoRow>
        )}
        <Box sx={{ mt: 'auto', pt: 2, textAlign: 'right' }}>
          <GCLink href={`/ui/entrances/${entry.id}`}>
            <Button variant="contained" color="secondary" size="small">
              <FormattedMessage id="Discover" />
            </Button>
          </GCLink>
        </Box>
      </ContentBox>
    </CompactCard>
  );
};

RandomEntryCard.propTypes = {
  fetch: PropTypes.func.isRequired,
  isFetching: PropTypes.bool,
  entry: PropTypes.shape({
    id: PropTypes.number,
    name: PropTypes.string,
    county: PropTypes.string,
    region: PropTypes.string,
    country: PropTypes.string,
    documents: PropTypes.arrayOf(PropTypes.shape({})),
    cave: PropTypes.shape({
      depth: PropTypes.number,
      length: PropTypes.number
    })
  })
};

export default RandomEntryCard;
