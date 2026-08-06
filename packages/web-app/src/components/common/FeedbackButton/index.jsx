import { Box, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';
import FeedbackIcon from '@mui/icons-material/Feedback';
import { FormattedMessage, useIntl } from 'react-intl';
import { useEffect, useState } from 'react';
import { contactLinks } from '../../../conf/externalLinks';

const FloatingAnchor = styled('a', {
  shouldForwardProp: prop => prop !== 'isHidden'
})(({ theme, isHidden }) => ({
  position: 'fixed',
  bottom: theme.spacing(3),
  right: theme.spacing(3),
  zIndex: 1200,
  display: 'inline-flex',
  width: 'fit-content',
  alignItems: 'center',
  gap: theme.spacing(1),
  backgroundColor: theme.palette.secondary.main,
  color: '#fff',
  borderRadius: '50px',
  padding: `${theme.spacing(1)} ${theme.spacing(2)}`,
  boxShadow: '0 4px 20px rgba(0,0,0,0.35)',
  textDecoration: 'none',
  transition: 'box-shadow 0.2s ease, transform 0.2s ease, opacity 0.2s ease',
  opacity: isHidden ? 0 : 1,
  pointerEvents: isHidden ? 'none' : 'auto',
  '&:hover': {
    backgroundColor: theme.palette.secondary.dark,
    boxShadow: '0 8px 28px rgba(0,0,0,0.4)',
    transform: 'translateY(-3px)'
  },
  [theme.breakpoints.down('sm')]: {
    bottom: theme.spacing(1),
    right: theme.spacing(1),
    padding: `${theme.spacing(0.5)} ${theme.spacing(1)}`
  }
}));

const FeedbackButton = () => {
  const { formatMessage, locale } = useIntl();
  const contactUrl = contactLinks[locale] ?? contactLinks['*'];
  const [isFooterVisible, setIsFooterVisible] = useState(false);

  useEffect(() => {
    const footer = document.querySelector('footer');
    if (!footer) return undefined;
    const observer = new IntersectionObserver(
      ([entry]) => setIsFooterVisible(entry.isIntersecting),
      { threshold: 0 }
    );
    observer.observe(footer);
    return () => observer.disconnect();
  }, []);

  return (
    <FloatingAnchor
      href={contactUrl}
      target="_blank"
      rel="noopener noreferrer"
      isHidden={isFooterVisible}
      tabIndex={isFooterVisible ? -1 : 0}
      aria-label={formatMessage({ id: 'Give feedback' })}>
      <FeedbackIcon
        sx={{ fontSize: 24, flexShrink: 0, alignSelf: 'center', mt: '2px' }}
      />
      <Box>
        <Typography
          variant="subtitle1"
          fontWeight="bold"
          lineHeight={1.3}
          sx={{ whiteSpace: 'nowrap', color: '#fff' }}>
          <FormattedMessage id="Give feedback" />
        </Typography>
        <Typography
          variant="caption"
          lineHeight={1.3}
          sx={{
            whiteSpace: 'nowrap',
            color: 'rgba(255,255,255,0.85)',
            display: { xs: 'none', sm: 'block' }
          }}>
          <FormattedMessage id="Something broken or missing? Tell us!" />
        </Typography>
      </Box>
    </FloatingAnchor>
  );
};

export default FeedbackButton;
