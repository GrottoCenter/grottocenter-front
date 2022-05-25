import React from 'react';
import PropTypes from 'prop-types';

import { isNil } from 'ramda';
import styled from 'styled-components';
import { useIntl } from 'react-intl';
import { useWatch } from 'react-hook-form';
import { Typography } from '@material-ui/core';

import { useDebounce } from '../../../hooks';
import InternationalizedLink from '../InternationalizedLink';
import { licensesODBLink } from '../../../conf/Config';

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
    <>
      <Typography variant="h2" gutterBottom>
        {formatMessage({ id: 'Check the veracity of the information' })}
      </Typography>

      <>
        {changes('name') ? (
          <Typography variant="h3" gutterBottom>
            {formatMessage({ id: 'Previous name' })} : {defautValues.name}
            {' - '}
            {formatMessage({ id: 'Modified name' })} : {debouncedName}
          </Typography>
        ) : (
          ''
        )}
        {changes('surname') ? (
          <Typography variant="h3" gutterBottom>
            {formatMessage({ id: 'Previous surname' })} : {defautValues.surname}
            {' - '}
            {formatMessage({ id: 'Modified surname' })} : {debouncedSurname}
          </Typography>
        ) : (
          ''
        )}
        {changes('nickname') ? (
          <Typography variant="h3" gutterBottom>
            {formatMessage({ id: 'Previous nickname' })} :{' '}
            {defautValues.nickname}
            {' - '}
            {formatMessage({ id: 'Modified nickname' })} : {debouncedNickname}
          </Typography>
        ) : (
          ''
        )}
        {changes('email') ? (
          <Typography variant="h3" gutterBottom>
            {formatMessage({ id: 'New email' })} : {debouncedMail}
          </Typography>
        ) : (
          ''
        )}
        {changes('password') ? (
          <Typography variant="h3" gutterBottom>
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
    </>
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
