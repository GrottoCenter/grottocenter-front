import * as React from 'react';
import { Box, Chip } from '@mui/material';
import { useIntl } from 'react-intl';
import PropTypes from 'prop-types';
import { Property } from '../../../../common/Properties';
import { HighLightsLine } from '../../../../common/Highlights';
import intactDescription from '../../../../../types/intactDescription.type';
import licenseType from '../../../../../types/license.type';

const DocumentSnapshots = ({ document, previous }) => {
  const { formatMessage } = useIntl();
  const {
    type,
    datePublication,
    dateInscription,
    dateValidation,
    creator,
    editor,
    validator,
    identifier,
    license,
    parent,
    description,
    intactDescriptions,
    isValidated,
    validatorComment
  } = document;

  const creatorLabel = creator?.nickname ?? null;
  const validatorLabel =
    validator?.nickname ??
    (validator?.name ? `${validator.name} ${validator.surname}` : null);

  const desc = description ?? intactDescriptions?.[0] ?? {};
  const prevDesc = previous?.descriptions?.[0] ?? previous?.description ?? {};

  const editorLabel = editor?.name
    ? `${editor.name} ${editor.surname}`
    : (editor?.nickname ?? null);
  const prevEditorLabel = previous?.editor?.name
    ? `${previous.editor.name} ${previous.editor.surname}`
    : (previous?.editor?.nickname ?? null);

  const parentId = parent?.id ?? (typeof parent === 'number' ? parent : null);
  const prevParentId =
    previous?.parent?.id ??
    (typeof previous?.parent === 'number' ? previous.parent : null);

  const show = (a, b) => (a != null && a !== '') || (b != null && b !== '');

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
        width: '100%',
        rowGap: 0.5
      }}>
      {isValidated != null && (
        <Box sx={{ gridColumn: '1 / -1' }}>
          <Chip
            label={formatMessage({
              id: isValidated ? 'Validated' : 'Not validated'
            })}
            color={isValidated ? 'success' : 'default'}
            size="small"
          />
        </Box>
      )}
      {show(creatorLabel, null) && (
        <Property
          label={formatMessage({ id: 'Created by' })}
          value={creatorLabel}
        />
      )}
      {show(validatorLabel, null) && (
        <Property
          label={formatMessage({ id: 'Validator' })}
          value={validatorLabel}
        />
      )}
      {show(type, previous?.type) && (
        <Property
          label={formatMessage({ id: 'Document type' })}
          value={
            <HighLightsLine
              newText={type ? formatMessage({ id: type }) : undefined}
              oldText={
                previous?.type
                  ? formatMessage({ id: previous.type })
                  : undefined
              }
            />
          }
        />
      )}
      {show(license, previous?.license) && (
        <Property
          label={formatMessage({ id: 'License' })}
          value={
            <HighLightsLine
              newText={license ?? undefined}
              oldText={previous?.license ?? undefined}
            />
          }
        />
      )}
      {show(desc.language?.refName, prevDesc.language?.refName) && (
        <Property
          label={formatMessage({ id: 'Title and description language' })}
          value={
            <HighLightsLine
              newText={desc.language?.refName ?? undefined}
              oldText={prevDesc.language?.refName ?? undefined}
            />
          }
        />
      )}
      {dateInscription && (
        <Property
          label={formatMessage({ id: 'Creation date' })}
          value={`${new Date(dateInscription).toLocaleDateString()} - ${new Date(dateInscription).toLocaleTimeString()}`}
        />
      )}
      {show(dateValidation, previous?.dateValidation) && (
        <Property
          label={formatMessage({ id: 'Validation date' })}
          value={
            <HighLightsLine
              newText={
                dateValidation
                  ? `${new Date(dateValidation).toLocaleDateString()} - ${new Date(dateValidation).toLocaleTimeString()}`
                  : undefined
              }
              oldText={
                previous?.dateValidation
                  ? `${new Date(previous.dateValidation).toLocaleDateString()} - ${new Date(previous.dateValidation).toLocaleTimeString()}`
                  : undefined
              }
            />
          }
        />
      )}
      {show(datePublication, previous?.datePublication) && (
        <Property
          label={formatMessage({ id: 'Publication Date' })}
          value={
            <HighLightsLine
              newText={datePublication ?? undefined}
              oldText={previous?.datePublication ?? undefined}
            />
          }
        />
      )}
      {show(editorLabel, prevEditorLabel) && (
        <Property
          label={formatMessage({ id: 'Editor' })}
          value={
            <HighLightsLine
              newText={editorLabel ?? undefined}
              oldText={prevEditorLabel ?? undefined}
            />
          }
        />
      )}
      {show(identifier, previous?.identifier) && (
        <Property
          label={formatMessage({ id: 'Identifier' })}
          value={
            <HighLightsLine
              newText={identifier ?? undefined}
              oldText={previous?.identifier ?? undefined}
            />
          }
        />
      )}
      {show(desc.title, prevDesc.title) && (
        <Property
          flexBasis="100%"
          label={formatMessage({ id: 'Title' })}
          value={
            <HighLightsLine
              newText={desc.title ?? undefined}
              oldText={prevDesc.title ?? undefined}
            />
          }
        />
      )}
      {show(desc.body ?? desc.text, prevDesc.body ?? prevDesc.text) && (
        <Property
          flexBasis="100%"
          label={formatMessage({ id: 'Description' })}
          value={
            <HighLightsLine
              newText={desc.body ?? desc.text ?? undefined}
              oldText={prevDesc.body ?? prevDesc.text ?? undefined}
            />
          }
        />
      )}
      {show(parentId, prevParentId) && (
        <Property
          flexBasis="100%"
          label={formatMessage({ id: 'Parent document' })}
          value={
            parentId ? (
              <a href={`/ui/documents/${parentId}`}>
                <HighLightsLine
                  newText={parentId.toString()}
                  oldText={prevParentId?.toString()}
                />
              </a>
            ) : (
              <HighLightsLine
                newText={undefined}
                oldText={prevParentId?.toString()}
              />
            )
          }
        />
      )}
      {show(validatorComment, previous?.validatorComment) && (
        <Property
          flexBasis="100%"
          label={formatMessage({ id: 'Validator comment' })}
          value={validatorComment}
        />
      )}
    </Box>
  );
};

DocumentSnapshots.propTypes = {
  document: PropTypes.shape({
    type: PropTypes.string,
    datePublication: PropTypes.string,
    dateInscription: PropTypes.string,
    dateValidation: PropTypes.string,
    isValidated: PropTypes.bool,
    validatorComment: PropTypes.string,
    creator: PropTypes.shape({
      id: PropTypes.number,
      nickname: PropTypes.string
    }),
    validator: PropTypes.oneOfType([
      PropTypes.number,
      PropTypes.shape({
        id: PropTypes.number,
        name: PropTypes.string,
        surname: PropTypes.string,
        nickname: PropTypes.string
      })
    ]),
    editor: PropTypes.shape({
      name: PropTypes.string,
      surname: PropTypes.string,
      nickname: PropTypes.string
    }),
    identifier: PropTypes.string,
    license: PropTypes.string,
    parent: PropTypes.oneOfType([PropTypes.number, PropTypes.shape({})]),
    description: intactDescription,
    intactDescriptions: intactDescription
  }),
  previous: PropTypes.shape({
    type: PropTypes.string,
    datePublication: PropTypes.string,
    dateInscription: PropTypes.string,
    dateValidation: PropTypes.string,
    validatorComment: PropTypes.string,
    editor: PropTypes.shape({
      name: PropTypes.string,
      surname: PropTypes.string,
      nickname: PropTypes.string
    }),
    identifier: PropTypes.string,
    license: licenseType,
    parent: PropTypes.oneOfType([PropTypes.number, PropTypes.shape({})]),
    descriptions: intactDescription,
    description: intactDescription
  })
};

export default DocumentSnapshots;
