import React from 'react';
import PropTypes from 'prop-types';
import MultilinesTypography from '../MultilinesTypography';
import AuthorAndDate from './AuthorAndDate';

const Contribution = ({ author, body, creationDate }) => (
  <>
    <MultilinesTypography>{body}</MultilinesTypography>
    <br />
    <AuthorAndDate author={author} date={creationDate} />
  </>
);

Contribution.propTypes = {
  author: PropTypes.shape({
    id: PropTypes.number,
    nickname: PropTypes.string,
    url: PropTypes.string
  }),
  body: PropTypes.string.isRequired,
  creationDate: PropTypes.instanceOf(Date)
};

export default Contribution;
