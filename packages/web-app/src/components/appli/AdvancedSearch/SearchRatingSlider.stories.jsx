import { useState } from 'react';
import { Box } from '@mui/material';

import SearchRatingSlider from './SearchRatingSlider';

const DefaultSlider = () => {
  const [value, setValue] = useState(null);
  return (
    <Box sx={{ display: 'flex', width: '100%', maxWidth: 420 }}>
      <SearchRatingSlider
        label="Interest of the visit"
        value={value}
        onChange={setValue}
      />
    </Box>
  );
};

const SelectedSlider = () => {
  const [value, setValue] = useState([6, 10]);
  return (
    <Box sx={{ display: 'flex', width: '100%', maxWidth: 420 }}>
      <SearchRatingSlider
        label="Interest of the visit"
        value={value}
        onChange={setValue}
      />
    </Box>
  );
};

const meta = {
  title: 'AdvancedSearch/SearchRatingSlider',
  component: SearchRatingSlider
};
export default meta;

export const Default = { render: () => <DefaultSlider /> };
export const Selected = { render: () => <SelectedSlider /> };
