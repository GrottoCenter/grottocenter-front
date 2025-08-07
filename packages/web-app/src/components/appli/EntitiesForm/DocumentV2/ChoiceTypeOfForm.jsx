import React, { useState, useContext } from 'react'
import { Box, Typography } from '@mui/material';
import { useDocumentTypes } from '../../../../hooks';

import { DocumentFormContext } from './Provider';

import ButtonChoice from './ButtonChoice'
import FormContent from './FormContent'
import DocumentTypeSelect from './formElements/DocumentTypeSelect';

const ChoiceTypeOfForm = ({}) => {
    const [ hasFileToUpload, setHasFileToUpload ] = useState(null)
    const { document, updateAttribute } = useContext(DocumentFormContext);
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
            {(isArticle(document.type) || isIssue(document.type)) ? (
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

                    {hasFileToUpload ? 
                        <FormContent />
                    :
                        <Typography variant="body1" sx={{ mt: 2 }}>
                            Vous pouvez continuer sans télécharger de fichier.
                        </Typography>
                    }
                </Box>
            ) : (
                <Box sx={{ textAlign: 'center', mt: 4 }}>
                    <Typography variant="body1" color="text.secondary">
                        Veuillez sélectionner un type de document valide (Article ou Issue).
                    </Typography>
                </Box>
            )}
        </Box>
    )
}

export default ChoiceTypeOfForm;