import React from 'react';
import { useIntl } from 'react-intl';
import PropTypes from 'prop-types';
import { Typography } from '@mui/material';
import GCLink from '../GCLink';
import authorType from '../../../types/author.type';

const AuthorLink = ({ author, verb = 'Posted' }) => {
  const { formatMessage } = useIntl();
  if (!author?.id || !author?.nickname)
    return <span>{formatMessage({ id: `${verb} by an unknown author` })}</span>;

  return (
    <span>
      {verb && (
        <Typography variant="caption">
          {formatMessage({ id: `${verb} by` })}&nbsp;
        </Typography>
      )}
      <GCLink internal href={`/ui/persons/${author?.id}`}>
        {author.nickname}
      </GCLink>
    </span>
  );
};

AuthorLink.propTypes = {
  author: authorType,
  verb: PropTypes.string
};

export default AuthorLink;
