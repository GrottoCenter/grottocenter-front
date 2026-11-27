import { useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import { Alert, Box, Button, Card, Stack, Typography } from '@mui/material';
import CompareIcon from '@mui/icons-material/Compare';
import CloseIcon from '@mui/icons-material/Close';
import DoNotDisturbIcon from '@mui/icons-material/DoNotDisturb';
import DeleteRoundedIcon from '@mui/icons-material/DeleteRounded';
import { useQueries, useQueryClient } from '@tanstack/react-query';
import { apiGet } from '@/api/client';
import { personKeys } from '@/api/queryKeys';
import { getCaverUrl } from '@/conf/apiRoutes';
import { STALE } from '@/conf/queryClient';
import { useDeletePerson, useOnlineStatus } from '@/hooks';
import StandardDialog from '@/components/common/StandardDialog';
import FormSubmissionError from '@/components/common/FormSubmissionError';
import {
  canMergeAuthor,
  getPersonName,
  isMergeAuthorSource
} from '@/utils/personDuplicates';
import {
  COMPARISON_GRID_SX,
  COMPARISON_ACTIONS_SX
} from '@/components/common/DuplicateComparisonPanel';
import PersonComparison, {
  PersonPreview,
  getPersonComparisonValues
} from './PersonComparison';
import { pairShape } from './personShape';
import PersonComparisonLabel from './PersonComparisonLabel';

const DuplicatePair = ({ pair, isLocked, onLock, onIgnore, onMerged }) => {
  const { formatMessage } = useIntl();
  const queryClient = useQueryClient();
  const isOnline = useOnlineStatus();
  const mutation = useDeletePerson();
  const submitting = useRef(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [source, setSource] = useState(() =>
    pair.persons.find(isMergeAuthorSource)
  );
  const [target, setTarget] = useState(
    () => pair.persons.find(person => !isMergeAuthorSource(person)) ?? null
  );
  const [isConfirming, setIsConfirming] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [preview, setPreview] = useState(null);
  const isBusy = isSubmitting || mutation.isPending;
  const details = useQueries({
    queries: isExpanded
      ? pair.persons.map(person => ({
          queryKey: personKeys.detail(person.id),
          queryFn: () => apiGet(`${getCaverUrl}${person.id}`),
          staleTime: STALE.STANDARD
        }))
      : []
  });
  const areDetailsReady =
    details.length === 2 &&
    details.every(query => query.data && !query.error && !query.isPending);
  const differingFields = new Set();
  if (areDetailsReady) {
    const [left, right] = details.map(query =>
      getPersonComparisonValues(query.data)
    );
    Object.keys(left).forEach(key => {
      if (left[key] !== right[key]) differingFields.add(key);
    });
  }
  const handleKeep = person => {
    const nextSource = pair.persons.find(candidate =>
      canMergeAuthor(candidate, person)
    );
    if (!nextSource || isLocked) return;
    setSource(nextSource);
    setTarget(person);
    setError(null);
  };
  const handleClose = () => {
    if (submitting.current) return;
    setIsConfirming(false);
    setError(null);
    onLock(false);
  };
  const handleMerge = async () => {
    if (submitting.current || !isOnline || !canMergeAuthor(source, target))
      return;
    submitting.current = true;
    setIsSubmitting(true);
    setError(null);
    try {
      const [freshSource, freshTarget] = await Promise.all([
        apiGet(`${getCaverUrl}${source.id}`),
        apiGet(`${getCaverUrl}${target.id}`)
      ]);
      if (
        String(freshSource?.id) !== String(source.id) ||
        String(freshTarget?.id) !== String(target.id) ||
        !canMergeAuthor(freshSource, freshTarget)
      ) {
        throw new Error(formatMessage({ id: 'authorDuplicates.changed' }));
      }
      await mutation.mutateAsync({
        id: String(source.id),
        entityId: String(target.id)
      });
      setIsConfirming(false);
      onMerged(freshSource, freshTarget);
    } catch (failure) {
      // Always reread both profiles on retry, including after an uncertain
      // network result. Never retry the destructive mutation automatically.
      setError(failure);
      queryClient.invalidateQueries({ queryKey: personKeys.detail(source.id) });
      queryClient.invalidateQueries({ queryKey: personKeys.detail(target.id) });
    } finally {
      submitting.current = false;
      setIsSubmitting(false);
    }
  };
  return (
    <Card
      variant="outlined"
      data-testid={`author-pair-${pair.key}`}
      sx={{ p: { xs: 1.5, sm: 2 }, mb: 2 }}>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
        {formatMessage({ id: `authorDuplicates.${pair.reason}` })}
      </Typography>
      {!isExpanded &&
        pair.persons.map(person => (
          <Typography
            key={person.id}
            sx={{
              py: 0.5,
              overflowWrap: 'anywhere'
            }}>
            <PersonComparisonLabel person={person} />
          </Typography>
        ))}
      {isExpanded && (
        <Box sx={COMPARISON_GRID_SX}>
          {pair.persons.map((person, index) => (
            <PersonComparison
              key={person.id}
              person={person}
              query={details[index]}
              differingFields={differingFields}
              isKept={String(person.id) === String(target?.id)}
              onKeep={
                pair.persons.every(isMergeAuthorSource)
                  ? () => handleKeep(person)
                  : undefined
              }
              isDisabled={isLocked}
              onPreview={setPreview}
              deleteAction={
                target && String(person.id) === String(source.id) ? (
                  <Button
                    variant="contained"
                    color="error"
                    startIcon={<DeleteRoundedIcon />}
                    disabled={
                      isLocked ||
                      !isOnline ||
                      !areDetailsReady ||
                      !canMergeAuthor(source, target)
                    }
                    onClick={() => {
                      setError(null);
                      setIsConfirming(true);
                      onLock(true);
                    }}>
                    {formatMessage({ id: 'authorDuplicates.merge' })}
                  </Button>
                ) : null
              }
            />
          ))}
        </Box>
      )}
      <Box sx={{ ...COMPARISON_ACTIONS_SX, mt: 2 }}>
        <Button
          variant={isExpanded ? 'outlined' : 'contained'}
          startIcon={isExpanded ? <CloseIcon /> : <CompareIcon />}
          disabled={isLocked}
          onClick={() => setIsExpanded(value => !value)}>
          {formatMessage({ id: isExpanded ? 'Close' : 'duplicates.compare' })}
        </Button>
        <Button
          variant="outlined"
          color="secondary"
          startIcon={<DoNotDisturbIcon />}
          aria-describedby="author-ignore-notice"
          disabled={isLocked}
          onClick={() => onIgnore(pair.key)}>
          {formatMessage({ id: 'duplicates.ignoreInBrowser' })}
        </Button>
      </Box>
      {isConfirming && (
        <StandardDialog
          open
          fullScreenOnMobile
          isBusy={isBusy}
          onClose={handleClose}
          title={formatMessage({ id: 'authorDuplicates.confirmTitle' })}
          actions={
            <>
              <Button
                variant="outlined"
                disabled={isBusy}
                onClick={handleClose}>
                {formatMessage({ id: 'Cancel' })}
              </Button>
              <Button
                variant="contained"
                color="error"
                startIcon={<DeleteRoundedIcon />}
                loading={isBusy}
                loadingPosition="start"
                disabled={isBusy || !isOnline}
                onClick={handleMerge}>
                {formatMessage({ id: 'authorDuplicates.merge' })}
              </Button>
            </>
          }>
          <Stack spacing={2}>
            <Typography sx={{ overflowWrap: 'anywhere' }}>
              {formatMessage(
                { id: 'authorDuplicates.confirm' },
                {
                  source: `${getPersonName(source)} (#${source.id})`,
                  target: `${getPersonName(target)} (#${target.id})`
                }
              )}
            </Typography>
            <Alert severity="warning">
              {formatMessage({ id: 'authorDuplicates.permanentNotice' })}
            </Alert>
            <FormSubmissionError error={error} />
          </Stack>
        </StandardDialog>
      )}
      {preview && (
        <PersonPreview person={preview} onClose={() => setPreview(null)} />
      )}
    </Card>
  );
};

DuplicatePair.propTypes = {
  pair: pairShape.isRequired,
  isLocked: PropTypes.bool.isRequired,
  onLock: PropTypes.func.isRequired,
  onIgnore: PropTypes.func.isRequired,
  onMerged: PropTypes.func.isRequired
};

export default DuplicatePair;
