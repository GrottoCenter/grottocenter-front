import { Box, Skeleton, Typography } from '@mui/material';
import { HandshakeOutlined } from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { useIntl } from 'react-intl';
import PartnersCarouselContainer from '../../containers/PartnersCarouselContainer';
import { useDynamicNumber } from '../../hooks';

const Section = styled('section')(({ theme }) => ({
  padding: '32px 24px',
  [theme.breakpoints.down('sm')]: {
    padding: '24px 16px'
  }
}));

const TitleRow = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 10,
  paddingBottom: '4px'
});

const Description = styled(Typography)({
  textAlign: 'center',
  maxWidth: 560,
  margin: '0 auto 24px',
  padding: '0 16px'
});

const PartnersSection = () => {
  const { formatMessage } = useIntl();
  const { data: officialPartners, isPending } =
    useDynamicNumber('officialPartners');

  return (
    <Section>
      <Box>
        <TitleRow>
          <HandshakeOutlined color="primary" sx={{ fontSize: 28 }} />
          <Typography
            variant="h3"
            component="h2"
            fontWeight={600}
            color="primary">
            {isPending ? (
              <Skeleton variant="text" width={120} />
            ) : (
              <>
                {officialPartners && `${officialPartners.toLocaleString()} `}
                {formatMessage({ id: 'partners' })}
              </>
            )}
          </Typography>
        </TitleRow>
        <Description variant="body2" color="text.secondary">
          {formatMessage({
            id: 'take part in the project by funding, providing data, communicating on the interest and benefits of cavers to share data.'
          })}
        </Description>
      </Box>
      <Box>
        <PartnersCarouselContainer />
      </Box>
    </Section>
  );
};

export default PartnersSection;
