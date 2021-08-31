import React, { useContext, useMemo } from 'react';
import { includes } from 'ramda';
import AddFileForm from '../../../../common/AddFileForm';
import { DocumentFormContext } from '../Provider';

const Step4 = ({ stepId }) => {
  const {
    docAttributes: { files, option, license, authorizationDocument },
    validatedSteps,
    updateAttribute
  } = useContext(DocumentFormContext);
  const memoizedValues = [
    files,
    option,
    license,
    authorizationDocument,
    includes(stepId, validatedSteps)
  ];
  return useMemo(
    () => (
      <AddFileForm
        files={files}
        setFiles={newFiles => updateAttribute('files', newFiles)}
        option={option}
        setOption={newOption => updateAttribute('option', newOption)}
        license={license}
        setLicense={newLicense => updateAttribute('license', newLicense)}
        authorizationDocument={authorizationDocument}
        setAuthorizationDocument={newAuthorizationDocument =>
          updateAttribute('authorizationDocument', newAuthorizationDocument)
        }
      />
    ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    memoizedValues
  );
};

export default Step4;
