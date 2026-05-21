import React from 'react';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Container,
  Link,
  Typography
} from '@mui/material';
import { alpha, styled } from '@mui/material/styles';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { useIntl } from 'react-intl';
import { useSelector } from 'react-redux';
import GCLink from '../common/GCLink';
import InternationalizedLink from '../common/InternationalizedLink';
import {
  pftGdLink,
  contributorsLink,
  contributeLinks
} from '../../conf/externalLinks';

const FaqRoot = styled('main')(({ theme }) => ({
  backgroundColor: theme.palette.background.default,
  minHeight: '60vh',
  padding: '48px 0 64px'
}));

const PageHeader = styled(Box)(({ theme }) => ({
  textAlign: 'center',
  marginBottom: 40,
  [theme.breakpoints.down('sm')]: {
    marginBottom: 24
  }
}));

const StyledAccordion = styled(Accordion)({
  marginBottom: 8,
  '&:before': { display: 'none' },
  borderRadius: '8px !important',
  boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
  overflow: 'hidden'
});

const StyledSummary = styled(AccordionSummary)(({ theme }) => ({
  backgroundColor: alpha(theme.palette.primary.main, 0.08),
  color: theme.palette.text.primary,
  borderLeft: `4px solid ${theme.palette.primary.light}`,
  '& .MuiAccordionSummary-expandIconWrapper': {
    color: theme.palette.primary.main
  },
  '&.Mui-expanded': {
    minHeight: 48,
    backgroundColor: theme.palette.primary.main,
    color: 'white',
    borderLeftColor: theme.palette.primary.main,
    '& .MuiAccordionSummary-expandIconWrapper': {
      color: 'white'
    }
  }
}));

const StyledDetails = styled(AccordionDetails)(({ theme }) => ({
  padding: theme.spacing(3),
  '& a': {
    color: theme.palette.primary.main,
    textDecoration: 'underline'
  }
}));

const FAQ_ITEMS = [
  'protection',
  'quality',
  'help',
  'buddy',
  'who',
  'data-sharing'
];

const Faq = () => {
  const { formatMessage } = useIntl();
  const { locale } = useSelector(state => state.intl);
  const contributeLink =
    contributeLinks[locale] !== undefined
      ? contributeLinks[locale]
      : contributeLinks['*'];

  const [expanded, setExpanded] = React.useState(FAQ_ITEMS[0]);

  const handleChange = panel => (_event, isExpanded) => {
    setExpanded(isExpanded ? panel : false);
  };

  return (
    <FaqRoot aria-label={formatMessage({ id: 'Frequently asked questions' })}>
      <Container maxWidth="md">
        <PageHeader>
          <Typography variant="h4" component="h1" color="primary" fontWeight={600} gutterBottom>
            {formatMessage({ id: 'Frequently asked questions' })}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {formatMessage({ id: 'Find answers to common questions about GrottoCenter' })}
          </Typography>
        </PageHeader>

        <Box component="section">
          <StyledAccordion
            expanded={expanded === 'protection'}
            onChange={handleChange('protection')}>
            <StyledSummary expandIcon={<ExpandMoreIcon />}>
              <Typography component="h2" variant="subtitle1" fontWeight={500}>
                {formatMessage({
                  id: 'I would like to share some of my work but some caves should remain protected. How are you planning to protect them?'
                })}
              </Typography>
            </StyledSummary>
            <StyledDetails>
              <Typography variant="body2" paragraph>
                {formatMessage({
                  id: 'Cave protection is a priority. A procedure has been defined for sensitive locations.'
                })}
              </Typography>
              <Link href={pftGdLink} target="_blank" rel="noopener noreferrer">
                {formatMessage({ id: 'View the protection procedure document' })}
              </Link>
            </StyledDetails>
          </StyledAccordion>

          <StyledAccordion
            expanded={expanded === 'quality'}
            onChange={handleChange('quality')}>
            <StyledSummary expandIcon={<ExpandMoreIcon />}>
              <Typography component="h2" variant="subtitle1" fontWeight={500}>
                {formatMessage({
                  id: 'How can you guarantee the quality of the data on GrottoCenter?'
                })}
              </Typography>
            </StyledSummary>
            <StyledDetails>
              <Typography variant="body2">
                {formatMessage({
                  id: 'The Wikicaves association collaborates with clubs and federations to validate data. Automated quality checks run regularly.'
                })}
              </Typography>
            </StyledDetails>
          </StyledAccordion>

          <StyledAccordion
            expanded={expanded === 'help'}
            onChange={handleChange('help')}>
            <StyledSummary expandIcon={<ExpandMoreIcon />}>
              <Typography component="h2" variant="subtitle1" fontWeight={500}>
                {formatMessage({
                  id: 'I find your project interesting: How can I help?'
                })}
              </Typography>
            </StyledSummary>
            <StyledDetails>
              <Typography variant="body2" paragraph>
                {formatMessage({
                  id: 'You can help as an active member, translator, developer, or partner organisation.'
                })}
              </Typography>
              <GCLink href={contributeLink}>
                {formatMessage({ id: 'Contributors page' })}
              </GCLink>
            </StyledDetails>
          </StyledAccordion>

          <StyledAccordion
            expanded={expanded === 'buddy'}
            onChange={handleChange('buddy')}>
            <StyledSummary expandIcon={<ExpandMoreIcon />}>
              <Typography component="h2" variant="subtitle1" fontWeight={500}>
                {formatMessage({
                  id: 'One of my caving buddies told me I should NOT post anything at all on GrottoCenter. That sometimes makes it hard to contribute!'
                })}
              </Typography>
            </StyledSummary>
            <StyledDetails>
              <Typography variant="body2">
                {formatMessage({
                  id: 'It can feel daunting, but the caving world is evolving. Sharing data responsibly helps the whole community.'
                })}
              </Typography>
            </StyledDetails>
          </StyledAccordion>

          <StyledAccordion
            expanded={expanded === 'who'}
            onChange={handleChange('who')}>
            <StyledSummary expandIcon={<ExpandMoreIcon />}>
              <Typography component="h2" variant="subtitle1" fontWeight={500}>
                {formatMessage({ id: 'Who is behind GrottoCenter?' })}
              </Typography>
            </StyledSummary>
            <StyledDetails>
              <Typography variant="body2" paragraph>
                {formatMessage({
                  id: 'GrottoCenter is built and maintained by the Wikicaves association and a community of volunteer contributors.'
                })}
              </Typography>
              <InternationalizedLink links={contributorsLink}>
                {formatMessage({ id: 'Contributors page' })}
              </InternationalizedLink>
            </StyledDetails>
          </StyledAccordion>

          <StyledAccordion
            expanded={expanded === 'data-sharing'}
            onChange={handleChange('data-sharing')}>
            <StyledSummary expandIcon={<ExpandMoreIcon />}>
              <Typography component="h2" variant="subtitle1" fontWeight={500}>
                {formatMessage({
                  id: 'I want to share my data only with fellow cavers. Is it possible on GrottoCenter?'
                })}
              </Typography>
            </StyledSummary>
            <StyledDetails>
              <Typography variant="body2">
                {formatMessage({
                  id: 'On GrottoCenter, data is published under a free licence and is accessible to anyone who needs it.'
                })}
              </Typography>
            </StyledDetails>
          </StyledAccordion>
        </Box>
      </Container>
    </FaqRoot>
  );
};

export default Faq;
