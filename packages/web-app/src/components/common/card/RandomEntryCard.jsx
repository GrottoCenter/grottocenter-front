import { useEffect } from 'react';
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
import Autorenew from '@mui/icons-material/Autorenew';
import MuiRating from '@mui/material/Rating';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import { styled } from '@mui/material/styles';
import { isNil } from 'ramda';
import { FormattedMessage, useIntl } from 'react-intl';
import {
  durationStringToMinutes,
  formatDurationMinutes
} from '@/utils/dateTimeDuration';
import CustomIcon from '../CustomIcon';
import AppLink from '../AppLink';
import { depthIcon, lengthIcon } from '../../../assets/icons';

const CARD_HEIGHT = 280;

const BgCard = styled(Card)(({ theme }) => ({
  position: 'relative',
  height: CARD_HEIGHT,
  overflow: 'hidden',
  [theme.breakpoints.down('sm')]: {
    height: 'auto',
    minHeight: CARD_HEIGHT,
    display: 'flex',
    flexDirection: 'column'
  }
}));

const Overlay = styled(Box)({
  position: 'absolute',
  inset: 0,
  background:
    'linear-gradient(to top, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.3) 55%, rgba(0,0,0,0.05) 100%)'
});

const Content = styled(Box)(({ theme }) => ({
  position: 'absolute',
  bottom: 0,
  left: 0,
  right: 0,
  padding: 16,
  zIndex: 1,
  [theme.breakpoints.down('sm')]: {
    position: 'relative',
    marginTop: 'auto',
    paddingTop: theme.spacing(8)
  }
}));

const InfoImg = styled('img')({
  height: 14,
  width: 14,
  filter: 'invert(1) brightness(2)'
});

const WhiteRating = styled(MuiRating)({
  color: 'white',
  fontSize: '0.875rem'
});

const getTopoImage = documents => {
  if (!documents) return null;
  const topoDoc = documents.find(d => d.type === 13);
  if (isNil(topoDoc)) return null;
  const topo = topoDoc.files?.find(f => f.pathOld !== null);
  return topo?.pathOld || null;
};

const RandomEntryCard = ({ entry, isFetching, fetch, onRefresh }) => {
  const { formatMessage, formatNumberToParts } = useIntl();
  const formatTime = timeStr =>
    timeStr &&
    formatDurationMinutes(
      durationStringToMinutes(timeStr),
      formatNumberToParts
    );

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
            justifyContent: 'space-between',
            gap: 0.5,
            mt: '4px',
            flexDirection: { xs: 'column', sm: 'row' },
            alignItems: { xs: 'stretch', sm: 'flex-end' }
          }}>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'minmax(0, 1fr) auto',
              alignItems: 'center',
              columnGap: 0.75,
              rowGap: 0.25,
              minWidth: 0
            }}>
            {[
              {
                labelId: 'Interest of the visit',
                value: stats?.aestheticism,
                time: null
              },
              {
                labelId: 'Ease of reach',
                value: stats?.approach,
                time: formatTime(timeInfo?.eTTrail)
              },
              {
                labelId: 'Ease of move',
                value: stats?.caving,
                time: formatTime(timeInfo?.eTUnderground)
              }
            ].map(({ labelId, value, time }) =>
              value > 0 ? (
                <Box key={labelId} sx={{ display: 'contents' }}>
                  <Typography
                    variant="caption"
                    sx={{ color: 'rgba(255,255,255,0.75)' }}>
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
              <Box
                sx={{
                  display: 'flex',
                  gap: 1,
                  mt: '4px',
                  gridColumn: '1 / -1'
                }}>
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
            nativeButton={false}
            to={`/ui/entrances/${entry.id}`}
            sx={{
              color: 'white',
              borderColor: 'rgba(255,255,255,0.6)',
              width: { xs: '100%', sm: 'auto' },
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
