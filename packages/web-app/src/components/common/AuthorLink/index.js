import React from 'react';
import { useIntl, defineMessages } from 'react-intl';
import PropTypes from 'prop-types';
import { Typography } from '@mui/material';
import GCLink from '../GCLink';
import authorType from '../../../types/author.type';

const verbMessages = defineMessages({
  Posted: { id: 'Posted' },
  Created: { id: 'Created' },
  Updated: { id: 'Updated' },
  Deleted: { id: 'Deleted' }
});

const AuthorLink = ({ author, verb = 'Posted' }) => {
  const { formatMessage } = useIntl();
  const verbLabel = formatMessage(verbMessages[verb] ?? { id: verb });
  if (!author?.id || !author?.nickname)
    return <span>{formatMessage({ id: 'author.unknown' }, { verb: verbLabel })}</span>;

  return (
    <span>
      {verb && (
        <Typography variant="caption">
          {formatMessage({ id: 'author.by' }, { verb: verbLabel })}&nbsp;
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
