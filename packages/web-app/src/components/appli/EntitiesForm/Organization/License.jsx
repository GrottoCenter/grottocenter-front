import { FormControl as MuiFormControl, FormLabel } from '@mui/material';
import { React } from 'react';
import { useIntl } from 'react-intl';
import styled from 'styled-components';
import InternationalizedLink from '../../../common/InternationalizedLink';
import { licenceLinks, licensesODBLink } from '../../../../conf/externalLinks';

const FormControl = styled(MuiFormControl)`
  padding-bottom: ${({ theme }) => theme.spacing(4)};
`;
const Spaced = styled.div`
  margin-left: ${({ theme }) => theme.spacing(4)};
  margin-top: ${({ theme }) => theme.spacing(2)};
`;

const License = () => {
  const { formatMessage } = useIntl();

  const LicenceImage = styled.img`
    width: 100px;
  `;
  return (
    <div>
      <FormControl component="fieldset" style={{ width: '50vh' }}>
        <FormLabel>
          {formatMessage({
            id: 'The following licenses will apply to your contribution:'
          })}
        </FormLabel>

        <Spaced>
          <InternationalizedLink links={licensesODBLink}>
            <LicenceImage
              src="/images/odbl.png"
              alt="ODBL license"
              title={formatMessage({
                id: 'The ODBL license applies to all data that is not copyrighted.'
              })}
            />
          </InternationalizedLink>
        </Spaced>
        <Spaced>
          <InternationalizedLink links={licenceLinks}>
            <LicenceImage
              src="/images/CC-BY-SA.png"
              alt="CC-BY-SA licence"
              title={formatMessage({
                id: 'Unless stated otherwise, the CC-BY-SA license applies for documents and texts subject to copyright.'
              })}
            />
          </InternationalizedLink>
        </Spaced>
      </FormControl>
    </div>
  );
};

export default License;
