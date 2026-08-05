import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';
import AppLink from './AppLink';

const InternationalizedLink = ({ links, className, children, title }) => {
  const { locale } = useSelector(state => state.intl);

  const linkUrl = links[locale] !== undefined ? links[locale] : links['*'];
  const linkText = children || linkUrl;
  return (
    <AppLink className={className} href={linkUrl} title={title}>
      {linkText}
    </AppLink>
  );
};

InternationalizedLink.propTypes = {
  // eslint-disable-next-line react/forbid-prop-types
  links: PropTypes.any.isRequired,
  className: PropTypes.string,
  title: PropTypes.string,
  children: PropTypes.node
};

export default InternationalizedLink;
