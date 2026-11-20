import React from 'react';
import PropTypes from 'prop-types';
import {
  Link as RouterLink,
  useHref,
  useInRouterContext
} from 'react-router-dom';
import { isMobile } from 'react-device-detect';
import MuiLink from '@mui/material/Link';

// A destination is external when it carries its own scheme (`https:`, `mailto:`,
// `blob:`, `tel:`, …) or is protocol-relative (`//host/path`). Everything else —
// `/ui/entrances/42`, `#anchor`, `foo` — is a route this app owns.
const isExternalUrl = url => /^[a-z][a-z0-9+.-]*:|^\/\//i.test(url);

const RoutedInternalNewTabLink = React.forwardRef(
  ({ url, children, ...rest }, ref) => (
    <MuiLink
      ref={ref}
      href={useHref(url)}
      {...rest}
      target="_blank"
      rel="noopener noreferrer">
      {children}
    </MuiLink>
  )
);

RoutedInternalNewTabLink.propTypes = {
  url: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired
};

const InternalNewTabLink = React.forwardRef(
  ({ url, children, ...rest }, ref) => {
    const isInRouterContext = useInRouterContext();

    if (isInRouterContext) {
      return (
        <RoutedInternalNewTabLink ref={ref} url={url} {...rest}>
          {children}
        </RoutedInternalNewTabLink>
      );
    }

    return (
      <MuiLink
        ref={ref}
        href={url}
        {...rest}
        target="_blank"
        rel="noopener noreferrer">
        {children}
      </MuiLink>
    );
  }
);

InternalNewTabLink.propTypes = {
  url: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired
};

/**
 * Single link component for the whole app.
 *
 * Contract — the prop you use states the intent:
 *  - `to` → internal route. Always navigates in-app on mobile. On desktop it
 *    stays in the same tab by default; pass `openInNewTabDesktop` to open a new
 *    tab instead (explicit, per-usage control).
 *  - `href` → external URL. Always opens in a new tab.
 *
 * What gets rendered is decided by the destination's *value*, not by which prop
 * carried it. The prop name alone cannot be trusted: MUI's polymorphic
 * components derive one from the other before handing the props to their
 * `component` — ListItemButton passes `href: other.href || other.to` down — so a
 * plain route arrived here as an `href` and turned every side-menu entry into a
 * new browser tab. Reading the value keeps that class of bug away from callers,
 * and leaves every correct usage of the contract above behaving exactly as it
 * reads.
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
    {
      to = null,
      href = null,
      openInNewTabDesktop = false,
      children,
      nativeButton: _nativeButton,
      ...rest
    },
    ref
  ) => {
    // React 19 no longer checks propTypes at runtime, so the "exactly one
    // destination" rule is enforced here or nowhere. Both props holding the SAME
    // value is MUI deriving one from the other, not a caller mistake — only a
    // genuine disagreement is worth reporting.
    if (import.meta.env.DEV) {
      if (to == null && href == null) {
        console.error('AppLink: one of `to` or `href` is required.');
      } else if (to != null && href != null && to !== href) {
        console.error(
          `AppLink: \`to\` (${to}) and \`href\` (${href}) disagree — \`href\` wins. Pass only one.`
        );
      }
    }
    const url = href ?? to;

    // No destination: render inert children rather than a <RouterLink to={null}>,
    // which would navigate to the current page.
    if (url == null) {
      return (
        <span ref={ref} {...rest}>
          {children}
        </span>
      );
    }

    // External links are plain anchors, never router navigations.
    if (isExternalUrl(url)) {
      return (
        <MuiLink
          ref={ref}
          href={url}
          {...rest}
          target="_blank"
          rel="noopener noreferrer">
          {children}
        </MuiLink>
      );
    }

    if (openInNewTabDesktop && !isMobile) {
      return (
        <InternalNewTabLink ref={ref} url={url} {...rest}>
          {children}
        </InternalNewTabLink>
      );
    }

    return (
      <MuiLink ref={ref} component={RouterLink} to={url} {...rest}>
        {children}
      </MuiLink>
    );
  }
);

AppLink.displayName = 'AppLink';

AppLink.propTypes = {
  // Internal app route (e.g. '/ui/entrances/42'). Mutually exclusive with
  // `href` — one of the two is required. Both rules are checked at runtime in
  // dev (see above), since propTypes no longer are.
  to: PropTypes.string,
  // External URL. Rendered as a new-tab anchor.
  href: PropTypes.string,
  // For internal links only: open a new tab on desktop instead of same-tab nav.
  openInNewTabDesktop: PropTypes.bool,
  // Consumed by MUI button components that render this link.
  nativeButton: PropTypes.bool,
  children: PropTypes.node.isRequired
};

export default AppLink;
