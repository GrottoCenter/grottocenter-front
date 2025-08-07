import React, { useState } from 'react';

import Process from './process'

const AIService = () => {

    const [ process, setProcess ] = useState([{
        name: "Analyze data 1 ",
        state: 'success',
    },
    {
        name: "Analyze data 2",
        state: 'pending',
    }])



  return (
    <Box>
        <Typography variant="h6">AI Processing</Typography>
        {process.map((item, index) => (
            <Box key={index}>
                <Process name={item.name} state={item.state} />
            </Box>
        ))}
    </Box>
  );
};

export default AIService;
