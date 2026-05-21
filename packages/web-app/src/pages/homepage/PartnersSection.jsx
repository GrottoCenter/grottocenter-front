import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Box, Skeleton, Typography } from '@mui/material';
import { HandshakeOutlined } from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { useIntl } from 'react-intl';
import PartnersCarouselContainer from '../../containers/PartnersCarouselContainer';
import InternationalizedLink from '../../components/common/InternationalizedLink';
import { fseLinks, uisLinks } from '../../conf/externalLinks';
import { loadDynamicNumber } from '../../actions/DynamicNumber';

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

const SupporterRow = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
  marginTop: 16
});

const SupporterLogo = styled('img')({
  width: 30,
  height: 30
});

const Description = styled(Typography)({
  textAlign: 'center',
  maxWidth: 560,
  margin: '0 auto 24px',
  padding: '0 16px'
});

const PartnersSection = () => {
  const dispatch = useDispatch();
  const { formatMessage } = useIntl();
  const officialPartners = useSelector(
    state => state.dynamicNumber?.officialPartners
  );

  useEffect(() => {
    dispatch(loadDynamicNumber('officialPartners'));
  }, [dispatch]);

  return (
    <Section>
      <Box>
        <TitleRow>
          <HandshakeOutlined color="primary" sx={{ fontSize: 28 }} />
          <Typography variant="h5" component="h2" fontWeight={600} color="primary">
            {officialPartners?.isFetching ? (
              <Skeleton variant="text" width={120} />
            ) : (
              <>
                {officialPartners?.number &&
                  `${officialPartners.number.toLocaleString()} `}
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
        <SupporterRow>
          <InternationalizedLink links={fseLinks}>
            <SupporterLogo src="/images/FSE.svg" alt="Logo FSE" />
          </InternationalizedLink>
          <InternationalizedLink links={uisLinks}>
            <SupporterLogo src="/images/UIS.svg" alt="Logo UIS" />
          </InternationalizedLink>
          <Typography variant="body2" color="text.secondary">
            {formatMessage({
              id: 'Grottocenter is supported by the FSE and the UIS'
            })}
          </Typography>
        </SupporterRow>
      </Box>
    </Section>
  );
};

export default PartnersSection;
