import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useContext
} from 'react';
import propTypes from 'prop-types';
import { Box, Typography } from '@mui/material';
import Process from './Process';
import { DocumentFormContext } from '../Provider';

const INITIAL_STEPS = [
  { id: 'analyze-1', name: 'Read files', state: 'idle' },
  { id: 'analyze-2', name: 'Extract metadata', state: 'idle' }
];

const delay = ms =>
  new Promise(resolve => {
    setTimeout(resolve, ms);
  });

const testData = {
  title: 'Sur les traces du S C A [Spéléo-Club de l’Aude]',
  author: ['Auteur inconnu'],
  subject: null,
  keywords: ['Lo Bramavenc', 'Spéléo-Club de l’Aude', 'spéléologie'],
  editor: {
    id: 2317,
    isDeleted: false,
    language: '000',
    name: "Spéléo Club de l'Aude"
  },
  producer: 'Skia/PDF m137',
  creation_date: "D:20250812151804+00'00'",
  modification_date: "D:20250812151804+00'00'",
  encrypted: false,
  pages: '12-13'
};

const AIService = ({ start, onDone }) => {
  const [steps, setSteps] = useState(INITIAL_STEPS);
  const runningRef = useRef(false);

  const setStepState = (index, state) => {
    setSteps(prev => prev.map((s, i) => (i === index ? { ...s, state } : s)));
  };

  const resetSteps = () => {
    setSteps(INITIAL_STEPS.map(s => ({ ...s, state: 'idle' })));
  };

  const { updateAttribute } = useContext(DocumentFormContext);

  const changeDocument = useCallback(
    AIDataServer => {
      if (!AIDataServer) return;
      updateAttribute('title', AIDataServer.title);
      updateAttribute('authors', AIDataServer.authors);
      updateAttribute('editor', AIDataServer.editor);
      updateAttribute('pages', AIDataServer.pages);
      updateAttribute(
        'description',
        Array.isArray(AIDataServer.keywords)
          ? AIDataServer.keywords.join(' , ')
          : ''
      );
    },
    [updateAttribute]
  );

  const runPipelineTest = useCallback(async () => {
    if (runningRef.current) return;
    runningRef.current = true;
    resetSteps();
    try {
      for (let i = 0; i < INITIAL_STEPS.length; i += 1) {
        setStepState(i, 'pending');
        // eslint-disable-next-line no-await-in-loop
        await delay(1200);
        setStepState(i, 'success');
      }
      changeDocument(testData);
    } catch (e) {
      setSteps(prev =>
        prev.map((s, i) =>
          i === prev.findIndex(p => p.state === 'pending')
            ? { ...s, state: 'error' }
            : s
        )
      );
    } finally {
      runningRef.current = false;
      onDone();
    }
  }, [onDone, changeDocument]);

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
