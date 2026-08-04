import { Typography } from '@mui/material';
import { React } from 'react';
import { useIntl } from 'react-intl';
import { styled } from '@mui/material/styles';
import InternationalizedLink from '../../../common/InternationalizedLink';
import { licensesODBLink } from '../../../../conf/externalLinks';

// Discreet, single-line license notice shown at the bottom of contribution
// forms. Purposely low-key (small muted caption + inline text links) so it
// informs without competing with the form itself.
const LicenceBoxStyle = styled(Typography)`
  margin-top: ${({ theme }) => theme.spacing(1)};
  text-align: center;
  color: ${({ theme }) => theme.palette.text.secondary};

  a {
    color: inherit;
    text-decoration: underline;
  }
`;

const LicenceBox = () => {
  const { formatMessage } = useIntl();

  return (
    <LicenceBoxStyle variant="caption" component="p">
      {formatMessage({
        id: 'The following license will apply to your contribution:'
      })}{' '}
      <InternationalizedLink
        links={licensesODBLink}
        title={formatMessage({
          id: 'The ODBL license applies to all data that is not copyrighted.'
        })}>
        ODBL
      </InternationalizedLink>
    </LicenceBoxStyle>
  );
};

export default LicenceBox;
