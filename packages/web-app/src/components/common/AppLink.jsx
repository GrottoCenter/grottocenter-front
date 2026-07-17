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

AppLink.propTypes = {
  // Internal app route (e.g. '/ui/entrances/42'). Mutually exclusive with href.
  to: PropTypes.string,
  // External URL. Always rendered as a new-tab anchor.
  href: PropTypes.string,
  // For internal links only: open a new tab on desktop instead of same-tab nav.
  openInNewTabDesktop: PropTypes.bool,
  children: PropTypes.node.isRequired
};

export default AppLink;
