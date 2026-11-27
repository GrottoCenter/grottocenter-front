import { useContext, useEffect, useState } from 'react';
import { useIntl } from 'react-intl';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Typography
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import OrganizationSelect from '@/components/appli/OrganizationSelect';
import StringInput from '@/components/common/Form/StringInput';
import InternationalizedLink from '@/components/common/InternationalizedLink';
import { wikiBBSChaptersLinks } from '@/conf/externalLinks';
import { TEXT_LENGTH_LIMITS } from '@/utils/textLengthLimits';
import { getDefaultOrganizationType } from '@/utils/organizationTypes';
import { getDocumentTypeRules } from '@/utils/documentTypeHelpers';
import { FormRow } from '../utils/FormContainers';
import { DocumentFormContext } from './Provider';
import MultipleSubjectsSelect from './formElements/MultipleSubjectsSelect';
import IdentifierEditor from './formElements/IdentifierEditor';
import DocumentRegions from './formElements/DocumentRegions';

const AdvancedDocumentMetadata = () => {
  const { formatMessage } = useIntl();
  const {
    document,
    lengthErrors,
    updateAttribute,
    allowEntityCreation = true
  } = useContext(DocumentFormContext);
  const [isExpanded, setIsExpanded] = useState(false);
  const rules = getDocumentTypeRules(document.type);
  const hasLengthError = lengthErrors.some(({ field }) =>
    ['identifier', 'creatorComment'].includes(field)
  );

  useEffect(() => {
    if (hasLengthError) setIsExpanded(true);
  }, [hasLengthError]);

  return (
    <Accordion
      data-testid="document-advanced-metadata"
      expanded={isExpanded || hasLengthError}
      onChange={(_event, expanded) => setIsExpanded(expanded)}
      disableGutters
      elevation={0}
      sx={{
        mt: 2,
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 1,
        '&:before': { display: 'none' }
      }}>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Typography
          variant="body2"
          sx={{
            color: 'text.secondary'
          }}>
          {formatMessage({ id: 'Advanced metadata' })}
        </Typography>
      </AccordionSummary>
      <AccordionDetails
        sx={{
          pt: 0.25,
          display: 'flex',
          flexDirection: 'column',
          gap: 1.5
        }}>
        <Box>
          <IdentifierEditor />
        </Box>
        <FormRow>
          <Box
            sx={{ width: '100%', minWidth: 0 }}
            data-testid="document-editor">
            <OrganizationSelect
              value={document.editor}
              onChange={organization => updateAttribute('editor', organization)}
              allowCreation={allowEntityCreation}
              defaultType={getDefaultOrganizationType('editor')}
              creationTestId="create-editor-search-button"
              helperContent={formatMessage({
                id: 'entityCreation.editorHelp'
              })}
              label={formatMessage({ id: 'Editor' })}
              placeholder={formatMessage({
                id: 'Search for an editor...'
              })}
            />
          </Box>

          {rules.parentType && (
            <Box
              sx={{ width: '100%', minWidth: 0 }}
              data-testid="document-library">
              <OrganizationSelect
                value={document.library}
                onChange={organization =>
                  updateAttribute('library', organization)
                }
                allowCreation={allowEntityCreation}
                defaultType={getDefaultOrganizationType('library')}
                creationTestId="create-library-search-button"
                helperContent={formatMessage({
                  id: 'entityCreation.libraryHelp'
                })}
                label={formatMessage({ id: 'Library' })}
                placeholder={formatMessage({
                  id: 'Search for a library...'
                })}
              />
            </Box>
          )}
        </FormRow>

        <Box>
          <DocumentRegions />
        </Box>

        <Box>
          <MultipleSubjectsSelect
            computeHasError={() => false}
            contextValueName="subjects"
            labelName="BBS subjects"
          />
          <Typography variant="caption" sx={{ display: 'block', mt: 0.5 }}>
            <InternationalizedLink links={wikiBBSChaptersLinks}>
              {formatMessage({ id: 'documentForm.bbsSubjectList' })}
            </InternationalizedLink>
          </Typography>
        </Box>

        <StringInput
          hasError={false}
          helperText={formatMessage({
            id: 'Additional information about the document.'
          })}
          onValueChange={newValue =>
            updateAttribute('creatorComment', newValue)
          }
          value={document.creatorComment ?? ''}
          maxLength={TEXT_LENGTH_LIMITS.DOCUMENT_COMMENT}
          valueName={formatMessage({ id: 'Comment' })}
        />
      </AccordionDetails>
    </Accordion>
  );
};

export default AdvancedDocumentMetadata;
