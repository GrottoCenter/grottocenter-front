import { FormLabel } from '@mui/material';
import { React } from 'react';
import { useIntl } from 'react-intl';
import { styled } from '@mui/material/styles';
import InternationalizedLink from '../../../common/InternationalizedLink';
import { licenceLinks, licensesODBLink } from '../../../../conf/externalLinks';

const LicenceBoxStyle = styled('div')`
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 10px 0;
`;

const LicenceImage = styled('img')`
  width: 100px;
  margin-left: 10px;
`;

const LicenceBox = () => {
  const { formatMessage } = useIntl();

  return (
    <LicenceBoxStyle>
      <FormLabel>
        {formatMessage({
          id: 'The following licenses will apply to your contribution:'
        })}
      </FormLabel>

      <InternationalizedLink links={licensesODBLink}>
        <LicenceImage
          src="/images/odbl.png"
          alt="ODBL license"
          title={formatMessage({
            id: 'The ODBL license applies to all data that is not copyrighted.'
          })}
        />
      </InternationalizedLink>
      <InternationalizedLink links={licenceLinks}>
        <LicenceImage
          src="/images/CC-BY-SA.png"
          alt="CC-BY-SA licence"
          title={formatMessage({
            id: 'Unless stated otherwise, the CC-BY-SA license applies for documents and texts subject to copyright.'
          })}
        />
      </InternationalizedLink>
    </LicenceBoxStyle>
  );
};

export default LicenceBox;
