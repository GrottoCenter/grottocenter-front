import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import CloseIcon from '@mui/icons-material/Close';
import { DontShowContext } from './AppTour';

// ContentComponent for @reactour/tour.
// Receives: currentStep, steps (full array), setCurrentStep, setIsOpen.
// step.title is a custom field added in each XxxTour steps definition.
const TourTooltip = ({ currentStep, steps, setCurrentStep, setIsOpen }) => {
  const { formatMessage } = useIntl();
  const { dontShowAgain, setDontShowAgain } = useContext(DontShowContext);
  const step = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;

  return (
    <Card sx={{ maxWidth: 320 }} elevation={8}>
      <CardContent sx={{ pb: 0.5 }}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            mb: 0.5
          }}>
          <Typography variant="subtitle2">{step.title}</Typography>
          <IconButton
            size="small"
            onClick={() => setIsOpen(false)}
            aria-label={formatMessage({ id: 'Tour - Skip' })}
            sx={{
              ml: 0.5
            }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
        <Typography variant="body2" color="text.secondary">
          {step.content}
        </Typography>
        {isLastStep && (
          <FormControlLabel
            sx={{ mt: 0.5 }}
            control={
              <Checkbox
                size="small"
                checked={dontShowAgain}
                onChange={e => setDontShowAgain(e.target.checked)}
              />
            }
            label={
              <Typography variant="caption">
                {formatMessage({ id: 'Tour - Do not show again' })}
              </Typography>
            }
          />
        )}
      </CardContent>
      <CardActions sx={{ justifyContent: 'flex-end', pt: 0.25 }}>
        {currentStep > 0 && (
          <Button size="small" onClick={() => setCurrentStep(s => s - 1)}>
            {formatMessage({ id: 'Tour - Back' })}
          </Button>
        )}
        <Button
          size="small"
          variant="contained"
          onClick={() =>
            isLastStep ? setIsOpen(false) : setCurrentStep(s => s + 1)
          }>
          {isLastStep
            ? formatMessage({ id: 'Tour - Finish' })
            : formatMessage({ id: 'Tour - Next' })}
        </Button>
      </CardActions>
    </Card>
  );
};

TourTooltip.propTypes = {
  currentStep: PropTypes.number.isRequired,
  steps: PropTypes.arrayOf(
    PropTypes.shape({
      title: PropTypes.node,
      content: PropTypes.node
    })
  ).isRequired,
  setCurrentStep: PropTypes.func.isRequired,
  setIsOpen: PropTypes.func.isRequired
};

export default TourTooltip;
