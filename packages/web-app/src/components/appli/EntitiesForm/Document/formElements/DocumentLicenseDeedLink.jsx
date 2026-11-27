import PropTypes from 'prop-types';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { useIntl } from 'react-intl';
import AppLink from '@/components/common/AppLink';

const DocumentLicenseDeedLink = ({ url }) => {
  const { formatMessage } = useIntl();
  const label = formatMessage({ id: 'See the full license' });

  return (
    <AppLink
      href={url}
      variant="caption"
      color="primary"
      aria-label={`${label} (${formatMessage({ id: 'Opens in a new tab' })})`}
      sx={{
        display: 'inline-flex',
        alignSelf: 'flex-start',
        alignItems: 'center',
        gap: 0.5
      }}>
      {label}
      <OpenInNewIcon fontSize="inherit" />
    </AppLink>
  );
};

DocumentLicenseDeedLink.propTypes = { url: PropTypes.string.isRequired };

export default DocumentLicenseDeedLink;
