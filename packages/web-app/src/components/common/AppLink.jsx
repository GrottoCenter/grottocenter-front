import React from 'react';
import PropTypes from 'prop-types';
import { Link as RouterLink } from 'react-router-dom';
import { isMobile } from 'react-device-detect';
import MuiLink from '@mui/material/Link';

/**
 * Single link component for the whole app.
 *
 * Contract — the prop you use is the signal:
 *  - `to` → internal route. Always navigates in-app on mobile. On desktop it
 *    stays in the same tab by default; pass `openInNewTabDesktop` to open a new
 *    tab instead (explicit, per-usage control).
 *  - `href` → external URL. Always opens in a new tab.
 *
 * Renders MUI's `<Link>` so links pick up the theme's palette (no more
 * browser-default blue). Callers can still refine the look via `className` —
 * including `styled(AppLink)`.
 *
 * For imperative navigation (non-anchor elements) use the `useOpenLink` hook
 * instead.
 */
// `target` and `rel` are placed AFTER `...rest` on purpose: callers must not
// be able to weaken the new-tab security defaults (`noopener noreferrer`) by
// accident.
const AppLink = React.forwardRef(
  (
    { to = null, href = null, openInNewTabDesktop = false, children, ...rest },
    ref
  ) => {
    if (href != null) {
      return (
        <MuiLink
          ref={ref}
          href={href}
          {...rest}
          target="_blank"
          rel="noopener noreferrer">
          {children}
        </MuiLink>
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
        <MuiLink
          ref={ref}
          href={to}
          {...rest}
          target="_blank"
          rel="noopener noreferrer">
          {children}
        </MuiLink>
      );
    }

    return (
      <MuiLink ref={ref} component={RouterLink} to={to} {...rest}>
        {children}
      </MuiLink>
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
