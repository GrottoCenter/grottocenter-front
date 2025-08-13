import React, { useState, useEffect } from 'react';

import { Box, Typography } from '@mui/material';

import Process from './Process'

const AIService = ({
    start,
    files,
    onDone
}) => {

    const [ process, setProcess ] = useState([{
        name: "Analyze files",
        state: 'idle',
    },
    {
        name: "Analyze files 2",
        state: 'idle',
    },
    {
        name: "Analyze files 3",
        state: 'idle',
    }])

    const ChangeStatut = (index, status) => {
        setProcess(prevProcess => {
            const newProcess = [...prevProcess];
            newProcess[index].state = status;
            return newProcess;
        });
    }

    const runFakeCall = (ms = 2000) => new Promise(resolve => setTimeout(resolve, ms));

    const runPipeline = async () => {
        for(let i = 0; i < process.length; i++) {
            ChangeStatut(i, 'pending');
            try {
                await runFakeCall();
                if (i == 2) {
                    throw new Error("Fake error");
                }
                ChangeStatut(i, 'success');
            } catch (error) {
                ChangeStatut(i, 'error');
            }
        }
        onDone()
    }

    useEffect(() => {
        if (start) {
            runPipeline();
        }
    }, [start])

  return (
    <Box>
        {start && (
            <>
                <Typography variant="h6">AI Processing</Typography>
                <Box>
                    {process.map((item, index) => (
                        <Box key={index}>
                            <Process name={item.name} state={item.state} />
                        </Box>
                    ))}
                </Box>
            </>
        )}
    </Box>
  );
};

export default AIService;
