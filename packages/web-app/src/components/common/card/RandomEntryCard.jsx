import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Button,
  Card,
  CardMedia,
  IconButton,
  Skeleton,
  Typography
} from '@mui/material';
import { Autorenew } from '@mui/icons-material';
import MuiRating from '@mui/material/Rating';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import { styled } from '@mui/material/styles';
import { isNil } from 'ramda';
import { FormattedMessage, useIntl } from 'react-intl';
import CustomIcon from '../CustomIcon';
import AppLink from '../AppLink';
import { depthIcon, lengthIcon } from '../../../assets/icons';

const CARD_HEIGHT = 280;

const BgCard = styled(Card)({
  position: 'relative',
  height: CARD_HEIGHT,
  overflow: 'hidden'
});

const Overlay = styled(Box)({
  position: 'absolute',
  inset: 0,
  background:
    'linear-gradient(to top, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.3) 55%, rgba(0,0,0,0.05) 100%)'
});

const Content = styled(Box)({
  position: 'absolute',
  bottom: 0,
  left: 0,
  right: 0,
  padding: 16,
  zIndex: 1
});

const InfoImg = styled('img')({
  height: 14,
  width: 14,
  filter: 'invert(1) brightness(2)'
});

const WhiteRating = styled(MuiRating)({
  color: 'white',
  fontSize: '0.875rem'
});

const formatTime = timeStr => {
  if (!timeStr) return null;
  const [h, m] = timeStr.split(':').map(Number);
  if (h === 0) return `${m}min`;
  if (m === 0) return `${h}h`;
  return `${h}h${m}`;
};

const getTopoImage = documents => {
  if (!documents) return null;
  const topoDoc = documents.find(d => d.type === 13);
  if (isNil(topoDoc)) return null;
  const topo = topoDoc.files?.find(f => f.pathOld !== null);
  return topo?.pathOld || null;
};

const RandomEntryCard = ({ entry, isFetching, fetch, onRefresh }) => {
  const { formatMessage } = useIntl();

  useEffect(() => {
    fetch();
  }, [fetch]);

  if (isFetching) {
    return (
      <BgCard>
        <Skeleton variant="rectangular" width="100%" height={CARD_HEIGHT} />
      </BgCard>
    );
  }

  if (!entry?.id) return null;

  const { county, region, country, cave, documents, stats, timeInfo } = entry;
  const imageSrc = getTopoImage(documents);
  const locationParts = [county, region, country].filter(Boolean);

  return (
    <BgCard>
      <CardMedia
        image={imageSrc || '/images/caves/gours.jpg'}
        sx={{ position: 'absolute', inset: 0, height: '100%' }}
      />
      <Overlay />
      <Box
        sx={{
          position: 'absolute',
          top: 12,
          left: 12,
          zIndex: 1,
          '& > span': { margin: 0.25 }
        }}>
        <CustomIcon type="entrance" size={32} />
      </Box>
      {onRefresh && (
        <IconButton
          onClick={onRefresh}
          sx={{
            position: 'absolute',
            top: 8,
            right: 8,
            zIndex: 1,
            color: 'white',
            '&:hover': { opacity: 1, backgroundColor: 'rgba(255,255,255,0.15)' }
          }}>
          <Autorenew sx={{ fontSize: 28 }} />
        </IconButton>
      )}
      <Content>
        <Typography variant="h4" component="h3" sx={{ color: 'white' }}>
          {entry.name}
        </Typography>
        {locationParts.length > 0 && (
          <Typography
            variant="caption"
            sx={{ color: 'rgba(255,255,255,0.75)', mb: '6px' }}>
            {locationParts.join(' · ')}
          </Typography>
        )}

        <Box
          sx={{
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            gap: 0.5,
            mt: '4px'
          }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {[
              { labelId: 'Interest', value: stats?.aestheticism, time: null },
              {
                labelId: 'Access',
                value: stats?.approach,
                time: formatTime(timeInfo?.eTTrail)
              },
              {
                labelId: 'Progression',
                value: stats?.caving,
                time: formatTime(timeInfo?.eTUnderground)
              }
            ].map(({ labelId, value, time }) =>
              value > 0 ? (
                <Box
                  key={labelId}
                  sx={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Typography
                    variant="caption"
                    sx={{ color: 'rgba(255,255,255,0.75)', minWidth: 78 }}>
                    {formatMessage({ id: labelId })}
                    {time && ` (${time})`}
                  </Typography>
                  <WhiteRating
                    readOnly
                    size="small"
                    value={value / 2}
                    precision={0.5}
                    emptyIcon={
                      <StarBorderIcon
                        fontSize="inherit"
                        sx={{ color: 'rgba(255,255,255,0.35)' }}
                      />
                    }
                  />
                </Box>
              ) : null
            )}
            {cave && (cave.depth || cave.length) && (
              <Box sx={{ display: 'flex', gap: 1, mt: '4px' }}>
                {cave.depth && (
                  <Box
                    sx={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <InfoImg src={depthIcon} alt="depth" />
                    <Typography
                      variant="caption"
                      sx={{ color: 'rgba(255,255,255,0.75)' }}>
                      {cave.depth} m
                    </Typography>
                  </Box>
                )}
                {cave.length && (
                  <Box
                    sx={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <InfoImg src={lengthIcon} alt="length" />
                    <Typography
                      variant="caption"
                      sx={{ color: 'rgba(255,255,255,0.75)' }}>
                      {cave.length} m
                    </Typography>
                  </Box>
                )}
              </Box>
            )}
          </Box>

          <Button
            variant="outlined"
            size="small"
            component={AppLink}
            to={`/ui/entrances/${entry.id}`}
            sx={{
              color: 'white',
              borderColor: 'rgba(255,255,255,0.6)',
              '&:hover': {
                borderColor: 'white',
                backgroundColor: 'rgba(255,255,255,0.1)'
              }
            }}>
            <FormattedMessage id="Discover" />
          </Button>
        </Box>
      </Content>
    </BgCard>
  );
};

RandomEntryCard.propTypes = {
  fetch: PropTypes.func.isRequired,
  onRefresh: PropTypes.func,
  isFetching: PropTypes.bool,
  entry: PropTypes.shape({
    id: PropTypes.number,
    name: PropTypes.string,
    county: PropTypes.string,
    region: PropTypes.string,
    country: PropTypes.string,
    documents: PropTypes.arrayOf(PropTypes.shape({})),
    stats: PropTypes.shape({
      aestheticism: PropTypes.number,
      approach: PropTypes.number,
      caving: PropTypes.number
    }),
    timeInfo: PropTypes.shape({
      eTTrail: PropTypes.string,
      eTUnderground: PropTypes.string
    }),
    cave: PropTypes.shape({
      depth: PropTypes.number,
      length: PropTypes.number
    })
  })
};

export default RandomEntryCard;
