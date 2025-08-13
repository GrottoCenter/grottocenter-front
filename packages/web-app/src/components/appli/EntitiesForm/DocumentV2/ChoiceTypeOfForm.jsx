import React, { useState, useContext } from 'react'
import { Box, Typography } from '@mui/material';
import { useDocumentTypes } from '../../../../hooks';

import { DocumentFormContext } from './Provider';

import ButtonChoice from './ButtonChoice';
import FormWithAiContent from './FormWithAIContent';
import ParentDocument from './ParentDocument';
import DocumentTypeSelect from './formElements/DocumentTypeSelect';

const ChoiceTypeOfForm = ({}) => {
    const [ hasFileToUpload, setHasFileToUpload ] = useState(null)
    const { document, updateAttribute, isNewDocument } = useContext(DocumentFormContext);
    const { isArticle, isIssue } = useDocumentTypes();


    const handleYes = () => {
        setHasFileToUpload(true);
    }

    const handleNo = () => {
        setHasFileToUpload(false);
        updateAttribute('files', []);
    }

    return (
        <Box>
            <DocumentTypeSelect helperText="Choose the type of document you want to create." />
            {((isArticle(document.type) || isIssue(document.type))) ? (
                <Box>
                    <ButtonChoice 
                        text='Avez-vous un fichier à télécharger ?'
                        buttons={[
                            {
                                label: 'Oui',
                                onClick: handleYes,
                                selectedColor: 'success'
                            },
                            {
                                label: 'Non',
                                onClick: handleNo,
                                selectedColor: 'error'
                            }
                        ]}
                    />

                    {hasFileToUpload !== null && (
                        hasFileToUpload ? 
                            <FormWithAiContent />
                        :
                            <ParentDocument />
                    )}
                </Box>
            ) : (document?.type && document?.type !== -1 && (
                <Box sx={{ textAlign: 'center', mt: 4 }}>
                    <ParentDocument />
                </Box>
                )
            )}
        </Box>
    )
}

export default ChoiceTypeOfForm;