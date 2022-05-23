import React from 'react';
import PropTypes from 'prop-types';

import { isNil } from 'ramda';
import styled from 'styled-components';
import { useIntl } from 'react-intl';
import { useWatch } from 'react-hook-form';
import Typography from '@material-ui/core/Typography';
import Layout from '../../components/common/Layouts/Fixed/FixedContent';
import { useDebounce } from '../../hooks';
import InternationalizedLink from '../../components/common/InternationalizedLink';
import { licensesODBLink } from '../../conf/Config';

const LicenceImage = styled.img`
  width: 75px;
`;

const Summary = ({ control, defautValues }) => {
  const { formatMessage } = useIntl();

  const debouncedName = useDebounce(
    useWatch({ control, name: 'user.name' }),
    300
  );
  const debouncedSurname = useDebounce(
    useWatch({ control, name: 'user.surname' }),
    300
  );
  const debouncedNickname = useDebounce(
    useWatch({ control, name: 'user.nickname' }),
    300
  );

  const debouncedMail = useDebounce(
    useWatch({ control, name: 'user.email' }),
    300
  );
  const debouncedPassword = useDebounce(
    useWatch({ control, name: 'user.password' }),
    300
  );

  const changes = fieldName => {
    switch (fieldName) {
      case 'name':
        return defautValues.name !== debouncedName;
      case 'surname':
        return defautValues.surname !== debouncedSurname;
      case 'nickname':
        return defautValues.nickname !== debouncedNickname;
      case 'email':
        return !(
          debouncedMail === undefined ||
          isNil(debouncedMail) ||
          debouncedMail === ''
        );
      case 'password':
        return !(
          debouncedPassword === undefined ||
          debouncedPassword == null ||
          debouncedPassword === ''
        );
      default:
        return false;
    }
  };

  return (
    <Layout
      title={formatMessage({ id: 'Check the veracity of the information' })}
      footer=""
      content={
        <>
          {changes('name') ? (
            <Typography variant="h2" gutterBottom>
              {formatMessage({ id: 'Name' })} : {debouncedName}
            </Typography>
          ) : (
            ''
          )}
          {changes('surname') ? (
            <Typography variant="h2" gutterBottom>
              {formatMessage({ id: 'Surname' })} : {debouncedSurname}
            </Typography>
          ) : (
            ''
          )}
          {changes('nickname') ? (
            <Typography variant="h2" gutterBottom>
              {formatMessage({ id: 'Nickname' })} : {debouncedNickname}
            </Typography>
          ) : (
            ''
          )}
          {changes('email') ? (
            <Typography variant="h2" gutterBottom>
              {formatMessage({ id: 'Email' })} : {debouncedMail}
            </Typography>
          ) : (
            ''
          )}
          {changes('password') ? (
            <Typography variant="h2" gutterBottom>
              {formatMessage({ id: 'Your password will be changed' })}
            </Typography>
          ) : (
            ''
          )}
          <InternationalizedLink links={licensesODBLink}>
            <LicenceImage
              src="/images/odbl.png"
              alt="ODBL license"
              title={formatMessage({
                id:
                  'The ODBL license applies to all data that is not copyrighted.'
              })}
            />
          </InternationalizedLink>
        </>
      }
    />
  );
};

Summary.propTypes = {
  control: PropTypes.shape({}),
  defautValues: PropTypes.shape({
    name: PropTypes.string.isRequired,
    nickname: PropTypes.string.isRequired,
    surname: PropTypes.string.isRequired
  })
};

export default Summary;