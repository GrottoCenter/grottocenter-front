import React, { useContext, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { Fade } from '@material-ui/core';
import { Skeleton } from '@material-ui/lab';
import { includes } from 'ramda';
import { useIntl } from 'react-intl';
import LanguageAutoComplete from '../../../Form/LanguageAutoCompleteWithProvider';
import { loadDocumentTypes } from '../../../../../actions/DocumentType';
import { DocumentFormContext } from '../Provider';

import DescriptionEditor from '../formElements/DescriptionEditor';
import DocumentTypeSelect from '../formElements/DocumentTypeSelect';
import PublicationDatePicker from '../formElements/PublicationDatePicker';
import TitleEditor from '../formElements/TitleEditor';

import { useDocumentTypes } from '../../../../../hooks';

const FlexWrapper = styled.div`
  display: flex;
  flex-wrap: wrap;
`;

const FlexItemWrapper = styled.div`
  flex: 1;
`;

const BigFlexItemWrapper = styled.div`
  flex: 2;
`;

const TitleAndDescriptionLanguageWrapper = styled.div`
  display: flex;
  flex: 1;
  flex-basis: 600px;
  flex-wrap: wrap;
`;

const PublicationDateWrapper = styled.div`
  flex: 1;
  flex-basis: 350px;
`;

const Step1 = ({ stepId }) => {
  const {
    docAttributes: { documentType },
    validatedSteps
  } = useContext(DocumentFormContext);
  const dispatch = useDispatch();
  const { formatMessage } = useIntl();
  const { isLoading, documentTypes: allDocumentTypes, error } = useSelector(
    state => state.documentType
  );
  const {
    isCollection,
    isImage,
    isIssue,
    isOther,
    isUnknown
  } = useDocumentTypes();

  useEffect(() => {
    dispatch(loadDocumentTypes());
  }, [dispatch]);

  /**
   * Performance improvement to avoid useless re-rendering
   * Step1 needs to re-render only if :
   * - it becomes valid
   * - the DocumentType changes
   * - all the document types are loaded
   */
  const memoizedValues = [
    allDocumentTypes,
    documentType,
    isLoading,
    includes(stepId, validatedSteps)
  ];

  return useMemo(
    () =>
      isLoading || error ? (
        <Skeleton variant="rect" height={200} />
      ) : (
        <>
          <FlexWrapper>
            <FlexItemWrapper>
              <DocumentTypeSelect
                allDocumentTypes={allDocumentTypes}
                helperText="Choose from the types of documents available."
                required
              />
            </FlexItemWrapper>
            <Fade in={!isUnknown(documentType) && !isImage(documentType)}>
              <FlexItemWrapper>
                {!isUnknown(documentType) && !isImage(documentType) && (
                  <LanguageAutoComplete
                    contextValueName="documentMainLanguage"
                    helperContent={formatMessage({
                      id: 'Language used in the document.'
                    })}
                    labelText="Document main language"
                    required={!isOther(documentType)}
                    searchLabelText={formatMessage({
                      id: 'Search for a language...'
                    })}
                  />
                )}
              </FlexItemWrapper>
            </Fade>
          </FlexWrapper>

          <Fade in={!isUnknown(documentType)}>
            <div>
              {!isUnknown(documentType) && (
                <>
                  <TitleAndDescriptionLanguageWrapper>
                    <BigFlexItemWrapper>
                      <TitleEditor required />
                    </BigFlexItemWrapper>
                    <FlexItemWrapper style={{ minWidth: '300px' }}>
                      <LanguageAutoComplete
                        contextValueName="titleAndDescriptionLanguage"
                        helperContent={formatMessage({
                          id:
                            'Language used for the title and the description you are writing.'
                        })}
                        labelText="Title and description language"
                        required
                        searchLabelText={formatMessage({
                          id: 'Search for a language...'
                        })}
                      />
                    </FlexItemWrapper>
                  </TitleAndDescriptionLanguageWrapper>

                  <FlexWrapper>
                    <FlexItemWrapper>
                      <DescriptionEditor required />
                      {!isCollection(documentType) && (
                        <PublicationDateWrapper>
                          <PublicationDatePicker
                            required={isIssue(documentType)}
                          />
                        </PublicationDateWrapper>
                      )}
                    </FlexItemWrapper>
                  </FlexWrapper>
                </>
              )}
            </div>
          </Fade>
        </>
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    memoizedValues
  );
};

Step1.propTypes = {
  stepId: PropTypes.number.isRequired
};

export default Step1;
