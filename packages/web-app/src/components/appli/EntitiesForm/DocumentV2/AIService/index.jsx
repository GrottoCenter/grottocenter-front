import React, { useState, useEffect, useCallback, useRef } from 'react';
import propTypes from 'prop-types';
import { Box, Typography } from '@mui/material';
import Process from './Process';

const INITIAL_STEPS = [
  { id: 'analyze-1', name: 'Analyze files', state: 'idle' },
  { id: 'analyze-2', name: 'Analyze files 2', state: 'idle' },
  { id: 'analyze-3', name: 'Analyze files 3', state: 'idle' }
];

const delay = ms =>
  new Promise(resolve => {
    setTimeout(resolve, ms);
  });

const AIService = ({ start, onDone }) => {
  const [steps, setSteps] = useState(INITIAL_STEPS);
  const runningRef = useRef(false);

  const setStepState = (index, state) => {
    setSteps(prev => prev.map((s, i) => (i === index ? { ...s, state } : s)));
  };

  const resetSteps = () => {
    setSteps(INITIAL_STEPS.map(s => ({ ...s, state: 'idle' })));
  };

  const runPipelineTest = useCallback(async () => {
    if (runningRef.current) return;
    runningRef.current = true;

    resetSteps();

    for (let i = 0; i < INITIAL_STEPS.length; i += 1) {
      setStepState(i, 'pending');
      try {
        // eslint-disable-next-line no-await-in-loop
        await delay(1200);
        if (i === 2) {
          throw new Error('Fake error');
        }
        setStepState(i, 'success');
      } catch (e) {
        setStepState(i, 'error');
        break;
      }
    }

    runningRef.current = false;
    onDone();
  }, [onDone]);

  useEffect(() => {
    if (start) {
      runPipelineTest();
    }
  }, [start, runPipelineTest]);

  if (!start) return null;

  return (
    <Box>
      <Typography variant="h6">AI Processing</Typography>
      <Box>
        {steps.map(item => (
          <Box key={item.id}>
            <Process name={item.name} state={item.state} />
          </Box>
        ))}
      </Box>
    </Box>
  );
};

AIService.propTypes = {
  start: propTypes.bool.isRequired,
  onDone: propTypes.func.isRequired
};

export default AIService;
