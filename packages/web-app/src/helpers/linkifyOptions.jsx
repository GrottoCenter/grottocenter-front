import MuiLink from '@mui/material/Link';

const renderMuiLink = ({ attributes, content }) => (
  <MuiLink {...attributes} sx={{ display: 'inline' }}>
    {content}
  </MuiLink>
);

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
  // Render auto-detected links as MuiLink so they pick up the theme palette
  // (palette.primary.main = brown[700]) instead of the browser-default blue.
  // Linkify dispatches by token type — url, email are separate — so both need
  // to be handled explicitly.
  render: {
    url: renderMuiLink,
    email: renderMuiLink
  }
};

export default linkifyOptions;
