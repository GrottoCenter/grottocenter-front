import React from 'react';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';
import GCLink from './GCLink';

const InternationalizedLink = ({ links, className, children }) => {
  const { locale } = useSelector(state => state.intl);

  const linkUrl = links[locale] !== undefined ? links[locale] : links['*'];
  const linkText = children || linkUrl;
  return (
    <GCLink className={className} href={linkUrl}>
      {linkText}
    </GCLink>
  );
};

InternationalizedLink.propTypes = {
  // eslint-disable-next-line react/forbid-prop-types
  links: PropTypes.any.isRequired,
  className: PropTypes.string,
  children: PropTypes.node
};

export default InternationalizedLink;
