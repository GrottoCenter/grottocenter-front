import React, { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import {
  Badge,
  BottomNavigation,
  BottomNavigationAction,
  Box,
  Card,
  Chip,
  Paper,
  Tab,
  Tabs,
  useMediaQuery
} from '@mui/material';
import { styled, useTheme } from '@mui/material/styles';
import { useSearchParams } from 'react-router-dom';

const BOTTOM_NAV_HEIGHT = 56;

const StickyTabsBar = styled(Card, {
  shouldForwardProp: prop => prop !== 'isStuck'
})(({ theme, isStuck }) => ({
  position: 'sticky',
  top: theme.appBarHeight,
  zIndex: theme.zIndex.appBar - 1,
  transition: 'margin 150ms ease, border-radius 150ms ease',
  ...(isStuck
    ? // Stuck: break out of PageContainer's frame padding (negative x-margin
      // cancels it) so the bar spans edge to edge under the app bar.
      { margin: theme.spacing(0, -1), borderRadius: 0 }
    : // Flowing: no horizontal margin (PageContainer's frame insets it, so it
      // lines up with the sections); no top margin (PageHeader's mb provides
      // the gap above); just an 8px gap below before the panel content.
      { margin: theme.spacing(0, 0, 1) }),
  '@media print': { display: 'none' }
}));

const TabPanel = styled(Box)`
  @media print {
    display: block !important;
  }
`;

const PageTabs = ({ tabs, children }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [searchParams, setSearchParams] = useSearchParams();
  const sentinelRef = useRef(null);
  const [isStuck, setIsStuck] = useState(false);
  const childrenArray = React.Children.toArray(children);
  const slugParam = searchParams.get('tab') ?? tabs?.[0]?.id ?? '0';
  const activeTab = Math.max(0, tabs?.findIndex(t => t.id === slugParam) ?? 0);
  const prevActiveTabRef = useRef(activeTab);

  const appBarPx =
    typeof theme.appBarHeight === 'number'
      ? theme.appBarHeight
      : parseInt(theme.appBarHeight, 10);

  useEffect(() => {
    if (isMobile) return;
    const sentinel = sentinelRef.current;
    if (!sentinel || !tabs?.length) return;
    const observer = new IntersectionObserver(
      ([entry]) => setIsStuck(!entry.isIntersecting),
      { rootMargin: `-${appBarPx}px 0px 0px 0px` }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [tabs, appBarPx, isMobile]);

  useEffect(() => {
    if (prevActiveTabRef.current === activeTab) return;
    prevActiveTabRef.current = activeTab;

    if (isMobile) {
      window.scrollTo({ top: 0, behavior: 'instant' });
    } else if (sentinelRef.current) {
      const sentinelTop = sentinelRef.current.getBoundingClientRect().top;
      if (sentinelTop < appBarPx) {
        window.scrollTo({
          top: window.scrollY + sentinelTop - appBarPx + 1,
          behavior: 'instant'
        });
      }
    }
  }, [activeTab, isMobile, appBarPx]);

  if (!tabs || tabs.length === 0) {
    return <>{children}</>;
  }

  const handleChange = (_, newValue) => {
    setSearchParams(
      prev => {
        prev.set('tab', tabs[newValue].id);
        return prev;
      },
      { replace: true }
    );
  };

  const badgeIcon = tab =>
    tab.count != null ? (
      <Badge
        badgeContent={tab.count}
        sx={{
          '& .MuiBadge-badge': {
            bgcolor: 'grey.200',
            color: 'text.secondary',
            fontSize: '1rem',
            minWidth: 18,
            height: 18,
            padding: 0.25
          }
        }}>
        {tab.icon}
      </Badge>
    ) : (
      tab.icon
    );

  return (
    <>
      {/* height: 0 (not 1) — a taller sentinel would break margin collapsing
          between PageHeader's bottom margin and StickyTabsBar's top margin,
          doubling the visual gap instead of merging them into one. */}
      {!isMobile && <div ref={sentinelRef} style={{ height: 0 }} />}
      {!isMobile && (
        <StickyTabsBar isStuck={isStuck}>
          <Tabs
            value={activeTab}
            onChange={handleChange}
            variant="scrollable"
            scrollButtons="auto"
            sx={{ minHeight: 36 }}>
            {tabs.map((tab, i) => (
              <Tab
                key={tab.id}
                id={`page-tab-${i}`}
                aria-controls={`page-tabpanel-${i}`}
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {tab.label}
                    {tab.count != null && (
                      <Chip
                        label={tab.count}
                        size="small"
                        sx={{
                          fontWeight: 600,
                          pointerEvents: 'none'
                        }}
                      />
                    )}
                  </Box>
                }
                aria-label={tab.label}
                icon={tab.icon}
                disabled={tab.disabled}
                iconPosition="start"
                sx={{
                  minHeight: 36
                }}
              />
            ))}
          </Tabs>
        </StickyTabsBar>
      )}
      {childrenArray.map((child, i) => (
        <TabPanel
          key={i}
          role="tabpanel"
          id={`page-tabpanel-${i}`}
          aria-labelledby={`page-tab-${i}`}
          sx={{
            display: activeTab !== i ? 'none' : 'block',
            // Mobile keeps clearance for the fixed bottom nav; desktop adds
            // nothing — PageContainer's frame already provides the bottom gutter.
            pb: isMobile
              ? `calc(${BOTTOM_NAV_HEIGHT}px + env(safe-area-inset-bottom) + 8px)`
              : 0
          }}>
          {child}
        </TabPanel>
      ))}
      {isMobile && (
        <Paper
          elevation={3}
          sx={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: theme.zIndex.appBar - 1,
            '@media print': { display: 'none' }
          }}>
          <BottomNavigation
            value={activeTab}
            onChange={handleChange}
            showLabels
            sx={{ height: BOTTOM_NAV_HEIGHT, bgcolor: 'primary.main' }}>
            {tabs.map((tab, i) => (
              <BottomNavigationAction
                key={tab.id}
                id={`page-tab-${i}`}
                aria-controls={`page-tabpanel-${i}`}
                aria-label={tab.label}
                label={tab.label}
                icon={badgeIcon(tab)}
                disabled={tab.disabled}
                sx={{
                  color: 'primary.contrastText',
                  minWidth: 0,
                  '& svg': { width: '2.2rem', height: '2.2rem' },
                  '& .MuiBottomNavigationAction-label': {
                    fontSize: '0.9rem !important'
                  },
                  '&.Mui-selected': { color: 'secondary.main' },
                  '&.Mui-disabled': {
                    opacity: 0.35,
                    color: 'primary.contrastText'
                  }
                }}
              />
            ))}
          </BottomNavigation>
          <Box
            sx={{
              height: 'env(safe-area-inset-bottom)',
              bgcolor: 'primary.main'
            }}
          />
        </Paper>
      )}
    </>
  );
};

PageTabs.propTypes = {
  tabs: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      icon: PropTypes.node,
      count: PropTypes.number,
      disabled: PropTypes.bool
    })
  ),
  children: PropTypes.node.isRequired
};

export default PageTabs;
