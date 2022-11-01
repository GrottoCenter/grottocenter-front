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
  dateReviewed
}) => (
  <>
    {body && (
      <MultilinesTypography variant="body1" component="div">
        {body}
      </MultilinesTypography>
    )}
    <div>
      <AuthorAndDate author={author} date={creationDate} />
    </div>
    {reviewer && (
      <div>
        <AuthorAndDate author={reviewer} date={dateReviewed} verb="Updated" />
      </div>
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
  ])
};

export default Contribution;
