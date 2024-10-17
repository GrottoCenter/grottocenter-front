import React from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import { Typography } from '@mui/material';
import MultilinesTypography from '../MultilinesTypography';
import AuthorAndDate from './AuthorAndDate';
import authorType from '../../../types/author.type';

const Contribution = ({
  author,
  body,
  dateInscription,
  reviewer,
  dateReviewed,
  withHours = false,
  isDeleted = false,
  isDeletedWithHeader = false
}) => {
  const { formatMessage } = useIntl();

  let bodyStyle;
  if (isDeleted || isDeletedWithHeader)
    bodyStyle = { fontStyle: 'italic', opacity: 0.6 };
  return (
    <>
      {body && isDeletedWithHeader && (
        <Typography
          variant="body1"
          component="span"
          noWrap
          sx={{ textTransform: 'uppercase', fontWeight: 'bold' }}>
          [{formatMessage({ id: 'deleted' })}]&nbsp;
        </Typography>
      )}
      {body && (
        <MultilinesTypography variant="body1" component="span" sx={bodyStyle}>
          {body}
        </MultilinesTypography>
      )}
      <br />
      {author && (
        <AuthorAndDate
          author={author}
          date={dateInscription}
          withHours={withHours}
        />
      )}
      {reviewer && (
        <>
          <br />
          <AuthorAndDate
            author={reviewer}
            date={dateReviewed}
            verb={author ? 'Updated' : ''}
            withHours={withHours}
          />
        </>
      )}
    </>
  );
};

Contribution.propTypes = {
  author: authorType,
  body: PropTypes.string,
  dateInscription: PropTypes.oneOfType([
    PropTypes.instanceOf(Date),
    PropTypes.string
  ]),
  reviewer: authorType,
  dateReviewed: PropTypes.oneOfType([
    PropTypes.instanceOf(Date),
    PropTypes.string
  ]),
  withHours: PropTypes.bool,
  isDeleted: PropTypes.bool,
  isDeletedWithHeader: PropTypes.bool
};

export default Contribution;
