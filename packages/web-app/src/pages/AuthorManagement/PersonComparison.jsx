import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import { CircularProgress, Stack, Typography } from '@mui/material';
import { usePerson } from '@/hooks/queries/usePerson';
import EntityActionButtons from '@/components/common/EntityActionButtons';
import DuplicateComparisonPanel, {
  ComparisonField
} from '@/components/common/DuplicateComparisonPanel';
import { usePermissions } from '@/hooks';
import PersonProperties from '@/components/common/Person/PersonProperties';
import StandardDialog from '@/components/common/StandardDialog';
import FormSubmissionError from '@/components/common/FormSubmissionError';
import DocumentReferences, {
  DocumentReferencesSubheader
} from '@/components/common/DocumentsList/OrganizationDocumentReferences';
import { getPersonName } from '@/utils/personDuplicates';
import { personShape } from './personShape';
import PersonComparisonLabel from './PersonComparisonLabel';

export const PersonPreview = ({ person, onClose }) => {
  const { formatMessage } = useIntl();
  const query = usePerson(person.id);
  return (
    <StandardDialog
      open
      fullScreenOnMobile
      maxWidth="md"
      title={getPersonName(person)}
      onClose={onClose}>
      {query.isPending && <CircularProgress />}
      {query.error && <FormSubmissionError error={query.error} />}
      {query.data && (
        <Stack spacing={2}>
          <PersonProperties
            person={{ ...query.data, id: Number(query.data.id) }}
          />
          <Typography variant="h2">
            {formatMessage({ id: 'Documents' })} (
            {query.data.authoredCount ?? 0})
          </Typography>
          <DocumentReferencesSubheader
            visibleCount={query.data.documents?.length ?? 0}
            totalCount={query.data.authoredCount ?? 0}
          />
          <DocumentReferences
            documents={query.data.documents ?? []}
            totalCount={query.data.authoredCount ?? 0}
            searchFilter={{ 'authors.nickname': query.data.nickname ?? '' }}
          />
        </Stack>
      )}
    </StandardDialog>
  );
};
PersonPreview.propTypes = {
  person: personShape.isRequired,
  onClose: PropTypes.func.isRequired
};

export const getPersonComparisonValues = person => ({
  nickname: person.nickname || '—',
  name: person.name || '—',
  surname: person.surname || '—',
  documents: person.authoredCount ?? '—'
});

const PERSON_FIELDS = [
  { key: 'nickname', label: 'Nickname' },
  { key: 'name', label: 'First name' },
  { key: 'surname', label: 'Last name' },
  { key: 'documents', label: 'Documents' }
];

const PersonComparison = ({
  person,
  query,
  differingFields,
  isKept,
  onKeep,
  isDisabled,
  onPreview,
  deleteAction = null
}) => {
  const { formatMessage } = useIntl();
  const { isAdmin } = usePermissions();
  const data = query.data ?? person;
  const values = getPersonComparisonValues(data);
  const name = `${getPersonName(data)} (#${person.id})`;
  const newTab = formatMessage({ id: 'Opens in a new tab' });
  return (
    <DuplicateComparisonPanel
      testId={`author-comparison-${person.id}`}
      title={<PersonComparisonLabel person={data} />}
      headerActions={
        <EntityActionButtons
          preview={{
            label: `${formatMessage({ id: 'authorDuplicates.preview' })} — ${name}`,
            onClick: () => onPreview(data),
            testId: `preview-person-${person.id}`
          }}
          edit={
            isAdmin
              ? {
                  to: `/ui/persons/${person.id}/edit`,
                  label: `${formatMessage({ id: 'Edit properties' })} — ${name} (${newTab})`
                }
              : null
          }
          open={{
            to: `/ui/persons/${person.id}`,
            label: `${formatMessage({ id: 'authorDuplicates.openProfile' })} — ${name} (${newTab})`,
            testId: `open-person-${person.id}`
          }}
          isDisabled={isDisabled}
        />
      }
      isPending={query.isPending}
      error={query.error}
      onRetry={() => query.refetch()}
      isKept={isKept}
      onKeep={onKeep}
      isDisabled={isDisabled}
      deleteAction={deleteAction}>
      {PERSON_FIELDS.map(({ key, label }) => (
        <ComparisonField
          key={key}
          label={formatMessage({ id: label })}
          isDifferent={differingFields.has(key)}
          testId={
            key === 'documents'
              ? 'author-document-count'
              : `comparison-field-${key}`
          }>
          {values[key]}
        </ComparisonField>
      ))}
    </DuplicateComparisonPanel>
  );
};
PersonComparison.propTypes = {
  person: personShape.isRequired,
  query: PropTypes.shape({
    data: personShape,
    isPending: PropTypes.bool,
    error: FormSubmissionError.propTypes.error,
    refetch: PropTypes.func
  }).isRequired,
  differingFields: PropTypes.instanceOf(Set).isRequired,
  isKept: PropTypes.bool.isRequired,
  onKeep: PropTypes.func,
  isDisabled: PropTypes.bool.isRequired,
  onPreview: PropTypes.func.isRequired,
  deleteAction: PropTypes.node
};

export default PersonComparison;
