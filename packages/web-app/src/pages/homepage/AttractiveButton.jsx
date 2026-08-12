import { Button } from '@mui/material';
import { styled } from '@mui/material/styles';

// Shared look for the home page's primary calls to action — pill shape plus a
// slight lift on hover. Defined once so the header CTAs, "Create an account"
// and "Donate now" cannot drift apart. Only what the three genuinely share
// lives here; padding, weight and text casing stay at the call sites.
const AttractiveButton = styled(Button)(({ theme }) => ({
  borderRadius: 999,
  boxShadow: theme.shadows[3],
  transition: 'transform 0.15s ease, box-shadow 0.15s ease',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: theme.shadows[6]
  }
}));

export default AttractiveButton;
