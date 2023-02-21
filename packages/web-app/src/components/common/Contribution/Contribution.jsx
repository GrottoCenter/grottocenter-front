import React from 'react';
import PropTypes from 'prop-types';
import MultilinesTypography from '../MultilinesTypography';
import AuthorAndDate from './AuthorAndDate';
import authorType from '../../../types/author.type';

const Contribution = ({
  author,
  body,
  creationDate,
  reviewer,
  dateReviewed,
  withHours = false
}) => (
  <>
    {body && (
      <MultilinesTypography variant="body1" component="span">
        {body}
      </MultilinesTypography>
    )}
    <br />
    {author && (
      <AuthorAndDate
        author={author}
        date={creationDate}
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

Contribution.propTypes = {
  author: authorType,
  body: PropTypes.string,
  creationDate: PropTypes.oneOfType([
    PropTypes.instanceOf(Date),
    PropTypes.string
  ]),
  reviewer: authorType,
  dateReviewed: PropTypes.oneOfType([
    PropTypes.instanceOf(Date),
    PropTypes.string
  ]),
  withHours: PropTypes.bool
};

export default Contribution;
