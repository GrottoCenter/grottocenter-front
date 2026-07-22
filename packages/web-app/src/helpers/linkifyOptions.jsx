import React from 'react';
import MuiLink from '@mui/material/Link';

const linkifyOptions = {
  attributes: { target: '_blank', rel: 'noopener noreferrer' },
  format: (value, type) => {
    if (type !== 'url') return value;
    try {
      return decodeURIComponent(value);
    } catch {
      return value;
    }
  },
  // Render auto-detected URLs as MuiLink so they pick up the theme palette
  // (palette.primary.main = brown[700]) instead of the browser-default blue.
  render: {
    url: ({ attributes, content }) => (
      <MuiLink {...attributes} sx={{ display: 'inline' }}>
        {content}
      </MuiLink>
    )
  }
};

export default linkifyOptions;
