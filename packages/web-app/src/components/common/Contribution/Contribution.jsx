import React from 'react';
import PropTypes from 'prop-types';
import MultilinesTypography from '../MultilinesTypography';
import AuthorAndDate from './AuthorAndDate';
import authorType from '../../../types/author.type';

const Contribution = ({ author, body, creationDate }) => (
  <>
    <MultilinesTypography>{body}</MultilinesTypography>
    <br />
    <AuthorAndDate author={author} date={creationDate} />
  </>
);

Contribution.propTypes = {
  author: authorType,
  body: PropTypes.string.isRequired,
  creationDate: PropTypes.oneOfType([
    PropTypes.instanceOf(Date),
    PropTypes.string
  ])
};

export default Contribution;
