import React, { useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { useWatch } from 'react-hook-form';
import { useIntl } from 'react-intl';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  CircularProgress,
  ClickAwayListener,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Link,
  List,
  ListItemButton,
  ListItemText,
  Paper,
  Popper,
  Typography
} from '@mui/material';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { useNameDuplicateSuggestions } from '../../../../hooks';

const entranceDetailPath = id => `/ui/entrances/${id}`;

// Best-effort human-readable location context for a search result.
// `region` is a name string; `country` may be an id, so only use it if textual.
const getLocationContext = entrance => {
  const { region, country } = entrance;
  if (typeof region === 'string' && region.trim()) return region.trim();
  if (typeof country === 'string' && country.trim()) return country.trim();
  return '';
};

/**
 * Wraps a name input with an informational autocomplete of existing entrances
 * sharing a similar name, to help the user avoid creating a duplicate.
 *
 * The dropdown never mutates form state. Selecting a suggestion opens a
 * confirmation dialog that guides the user:
 *  - "It's the same cave"  → leaves the creation page and opens the existing
 *                            entrance (so the user doesn't create a duplicate).
 *  - "It's a different cave" → just dismisses the dialog and keeps creating.
 *
 * Renders nothing extra when `enabled` is false (e.g. edit mode).
 */
const NameSuggestionDropdown = ({ control, formKey, enabled, children }) => {
  const { formatMessage } = useIntl();
  const navigate = useNavigate();
  const anchorRef = useRef(null);
  const [isFocused, setIsFocused] = useState(false);
  // The entrance the user is asked to confirm as a duplicate (drives the dialog).
  const [candidate, setCandidate] = useState(null);

  const name = useWatch({ control, name: formKey });
  const { suggestions, isLoading } = useNameDuplicateSuggestions(name, enabled);

  const closeDropdown = () => setIsFocused(false);
  const openConfirmation = entrance => {
    setCandidate(entrance);
    closeDropdown();
  };
  const dismissConfirmation = () => setCandidate(null);
  const confirmSameCave = () => {
    if (candidate) navigate(entranceDetailPath(candidate.id));
    setCandidate(null);
  };

  const isOpen = enabled && isFocused && (isLoading || suggestions.length > 0);
  const candidateLocation = candidate ? getLocationContext(candidate) : '';

  return (
    <>
      <ClickAwayListener onClickAway={closeDropdown}>
        <Box
          ref={anchorRef}
          // Wraps the name field; must size like the bare field it replaced so
          // it shares the flex row with the language selector. `flex: 1` here
          // sets flex-basis:0 and, next to a width:100% sibling, collapsed the
          // field to min-content (~24px) — i.e. the name input "disappeared".
          sx={{ position: 'relative', minWidth: 0, width: '100%' }}
          onFocus={() => setIsFocused(true)}
          onInput={() => setIsFocused(true)}
          onKeyDown={e => {
            if (e.key === 'Escape') closeDropdown();
          }}
        >
          {children}

          <Popper
            open={isOpen}
            anchorEl={anchorRef.current}
            placement="bottom-start"
            disablePortal
            style={{ zIndex: 1300, width: anchorRef.current?.clientWidth }}
          >
            <Paper
              elevation={3}
              aria-live="polite"
              sx={{ maxHeight: 320, overflow: 'auto' }}
            >
              {isLoading ? (
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    p: '12px'
                  }}
                >
                  <CircularProgress size={18} />
                  <Typography variant="body2" color="text.secondary">
                    {formatMessage({ id: 'Searching for similar entrances…' })}
                  </Typography>
                </Box>
              ) : (
                <>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ display: 'block', px: '12px', pt: 1 }}
                  >
                    {formatMessage({
                      id: 'Existing entrances with a similar name:'
                    })}
                  </Typography>
                  <List
                    dense
                    disablePadding
                    role="listbox"
                    aria-label={formatMessage({
                      id: 'Existing entrances with a similar name:'
                    })}
                  >
                    {suggestions.map(entrance => {
                      const location = getLocationContext(entrance);
                      return (
                        <ListItemButton
                          key={entrance.id}
                          role="option"
                          onClick={() => openConfirmation(entrance)}
                        >
                          <ListItemText
                            primary={entrance.name}
                            secondary={location || undefined}
                          />
                          <OpenInNewIcon
                            fontSize="small"
                            color="action"
                            sx={{ ml: 1 }}
                          />
                        </ListItemButton>
                      );
                    })}
                  </List>
                </>
              )}
            </Paper>
          </Popper>
        </Box>
      </ClickAwayListener>

      <Dialog
        open={!!candidate}
        onClose={dismissConfirmation}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>
          {formatMessage({ id: 'Is this the same cave?' })}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            {formatMessage({
              id: 'An entrance with a similar name already exists. Please check whether it is the same cave before creating a new one.'
            })}
          </Typography>
          {candidate && (
            <>
              <Typography variant="h6">{candidate.name}</Typography>
              {candidateLocation && (
                <Typography variant="body2" color="text.secondary">
                  {candidateLocation}
                </Typography>
              )}
              <Link
                href={entranceDetailPath(candidate.id)}
                target="_blank"
                rel="noopener"
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  mt: 1
                }}
              >
                {formatMessage({ id: 'View full details' })}
                <OpenInNewIcon fontSize="inherit" />
              </Link>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={dismissConfirmation} color="inherit">
            {formatMessage({ id: "It's a different cave" })}
          </Button>
          <Button onClick={confirmSameCave} variant="contained">
            {formatMessage({ id: "It's the same cave" })}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

NameSuggestionDropdown.propTypes = {
  control: PropTypes.shape({}).isRequired,
  formKey: PropTypes.string.isRequired,
  enabled: PropTypes.bool,
  children: PropTypes.node.isRequired
};

export default NameSuggestionDropdown;
