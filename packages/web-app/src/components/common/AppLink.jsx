import React from 'react';
import PropTypes from 'prop-types';
import { Link as RouterLink } from 'react-router-dom';
import { isMobile } from 'react-device-detect';

/**
 * Single link component for the whole app.
 *
 * Contract — the prop you use is the signal:
 *  - `to` → internal route. Always navigates in-app on mobile. On desktop it
 *    stays in the same tab by default; pass `openInNewTabDesktop` to open a new
 *    tab instead (explicit, per-usage control).
 *  - `href` → external URL. Always opens in a new tab.
 *
 * It renders a bare anchor / React Router `<Link>` (no MUI styling) so callers
 * keep controlling the look through `className` — including `styled(AppLink)`.
 *
 * For imperative navigation (non-anchor elements) use the `useOpenLink` hook
 * instead.
 */
const AppLink = React.forwardRef(
  ({ to = null, href = null, openInNewTabDesktop = false, children, ...rest }, ref) => {
    if (href != null) {
      return (
        <a
          ref={ref}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          {...rest}>
          {children}
        </a>
      );
    }

    // Neither prop passed: render inert children rather than a
    // <RouterLink to={null}>, which would navigate to the current page.
    if (to == null) {
      return (
        <span ref={ref} {...rest}>
          {children}
        </span>
      );
    }

    if (openInNewTabDesktop && !isMobile) {
      return (
        <a
          ref={ref}
          href={to}
          target="_blank"
          rel="noopener noreferrer"
          {...rest}>
          {children}
        </a>
      );
    }

    return (
      <RouterLink ref={ref} to={to} {...rest}>
        {children}
      </RouterLink>
    );
  }
);

AppLink.displayName = 'AppLink';

// At least one of `to` / `href` must be provided — otherwise the link has no
// destination. Both are strings; this validator adds the "one is required" rule.
const linkTarget = (props, propName, componentName) => {
  const { to, href } = props;
  if (to == null && href == null) {
    return new Error(
      `One of \`to\` or \`href\` is required in \`${componentName}\`.`
    );
  }
  if (props[propName] != null && typeof props[propName] !== 'string') {
    return new Error(
      `Invalid prop \`${propName}\` of type \`${typeof props[
        propName
      ]}\` supplied to \`${componentName}\`, expected \`string\`.`
    );
  }
  return null;
};

AppLink.propTypes = {
  // Internal app route (e.g. '/ui/entrances/42'). Mutually exclusive with href.
  to: linkTarget,
  // External URL. Always rendered as a new-tab anchor.
  href: linkTarget,
  // For internal links only: open a new tab on desktop instead of same-tab nav.
  openInNewTabDesktop: PropTypes.bool,
  children: PropTypes.node.isRequired
};

export default AppLink;
