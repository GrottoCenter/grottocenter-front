import React from 'react';
import PropTypes from 'prop-types';

import { isNil } from 'ramda';
import styled from 'styled-components';
import { useIntl } from 'react-intl';
import { useWatch } from 'react-hook-form';
import { Box, Typography } from '@material-ui/core';

import InternationalizedLink from '../InternationalizedLink';
import { licensesODBLink } from '../../../conf/externalLinks';
import Property from './Property';

const LicenceImage = styled.img`
  width: 75px;
`;

const Summary = ({ control, defautValues }) => {
  const { formatMessage } = useIntl();

  const newName = useWatch({ control, name: 'user.name' });
  const newSurname = useWatch({ control, name: 'user.surname' });
  const newNickname = useWatch({ control, name: 'user.nickname' });
  const newMail = useWatch({ control, name: 'user.email' });
  const newPassword = useWatch({ control, name: 'user.password' });
  const changes = fieldName => {
    switch (fieldName) {
      case 'name':
        return defautValues.name !== newName;
      case 'surname':
        return defautValues.surname !== newSurname;
      case 'nickname':
        return defautValues.nickname !== newNickname;
      case 'email':
        return !(newMail === undefined || isNil(newMail) || newMail === '');
      case 'password':
        return !(
          newPassword === undefined ||
          newPassword == null ||
          newPassword === ''
        );
      default:
        return false;
    }
  };

  return (
    <>
      <Typography variant="h2" gutterBottom>
        {formatMessage({ id: 'Modifications summary' })}
      </Typography>

      <Box my={3}>
        {changes('name') && (
          <Property
            newValue={newName}
            oldValue={defautValues.name}
            valueName="Name"
          />
        )}
        {changes('surname') && (
          <Property
            newValue={newSurname}
            oldValue={defautValues.surname}
            valueName="Surname"
          />
        )}
        {changes('nickname') && (
          <Property
            newValue={newNickname}
            oldValue={defautValues.nickname}
            valueName="Nickname"
          />
        )}
        {changes('email') && (
          <Property newValue={newMail} valueName="New email" />
        )}
        {changes('password') && (
          <Typography
            align="center"
            gutterBottom
            style={{ fontWeight: 'bold' }}>
            {formatMessage({ id: 'Your password will be changed' })}
          </Typography>
        )}
      </Box>
      <Box flexDirection="column" display="flex" alignItems="center" mb={3}>
        <Typography>{formatMessage({ id: 'License' })}</Typography>
        <InternationalizedLink links={licensesODBLink}>
          <LicenceImage
            src="/images/odbl.png"
            alt="ODBL license"
            title={formatMessage({
              id: 'The ODBL license applies to all data that is not copyrighted.'
            })}
          />
        </InternationalizedLink>
      </Box>
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
