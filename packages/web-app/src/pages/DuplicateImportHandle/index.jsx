import React, { useState } from 'react';
import { useIntl } from 'react-intl';
import styled from 'styled-components';
import ArrowBackIcon from '@material-ui/icons/ArrowBack';
import Layout from '../../components/common/Layouts/Fixed/FixedContent';
import DuplicatesList from '../../components/appli/Duplicates/DuplicatesList';
import HeaderTabs from './HeaderTabs';
import AuthChecker from '../../features/AuthChecker';
import ActionButton from '../../components/common/ActionButton';
import HydratedEntranceDuplicates from '../../components/appli/Duplicates/HydratedEntranceDuplicates';
import HydratedDocumentDuplicates from '../../components/appli/Duplicates/HydratedDocumentDuplicates';
import { useNotification } from '../../hooks';

const ENTRANCE_TAB = 'entrance';
const DOCUMENT_TAB = 'document';
const TABS = [ENTRANCE_TAB, DOCUMENT_TAB];

const StyledActionButton = styled(ActionButton)`
  margin-top: ${({ theme }) => theme.spacing(1)}px;
  margin-bottom: ${({ theme }) => theme.spacing(1)}px;
`;

const DuplicateImportHandle = () => {
  const { onSuccess } = useNotification();
  const [selectedTab, setSelectedTab] = useState(0);
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedDuplicates, setSelectedDuplicates] = useState([]);

  const { formatMessage } = useIntl();

  const handleStepNext = () => {
    setCurrentStep(currentStep + 1);
  };

  const handleStepBack = () => {
    if (currentStep === 2) {
      setSelectedDuplicates([]);
    }
    setCurrentStep(currentStep - 1);
  };

  const updateTab = newTab => {
    setSelectedDuplicates([]);
    setSelectedTab(newTab);
  };

  return (
    <Layout
      title={formatMessage({ id: 'Duplicates from CSV import tool' })}
      footer=""
      content={
        <AuthChecker
          componentToDisplay={
            <>
              <HeaderTabs
                selectedTab={selectedTab}
                setSelectedTab={updateTab}
                disabledAllTabs={currentStep !== 1}
              />
              {currentStep === 1 && (
                <DuplicatesList
                  duplicateType={TABS[selectedTab]}
                  nextStep={handleStepNext}
                  selectedDuplicates={selectedDuplicates}
                  setSelectedDuplicates={setSelectedDuplicates}
                />
              )}
              {currentStep === 2 && (
                <>
                  <StyledActionButton
                    startIcon={<ArrowBackIcon />}
                    label={formatMessage({ id: 'Go back' })}
                    onClick={handleStepBack}
                    color="primary"
                  />
                  {TABS[selectedTab] === ENTRANCE_TAB && (
                    <HydratedEntranceDuplicates
                      onSuccessSubmit={() =>
                        onSuccess(
                          formatMessage({ id: 'Modification completed' })
                        )
                      }
                      onSuccessNotDuplicateSubmit={() =>
                        onSuccess(formatMessage({ id: 'Creation completed' }))
                      }
                      selectedDuplicates={selectedDuplicates}
                      goBack={() => handleStepBack()}
                    />
                  )}
                  {TABS[selectedTab] === DOCUMENT_TAB && (
                    <HydratedDocumentDuplicates
                      onSuccessSubmit={() =>
                        onSuccess(
                          formatMessage({ id: 'Modification completed' })
                        )
                      }
                      onSuccessNotDuplicateSubmit={() =>
                        onSuccess(formatMessage({ id: 'Creation completed' }))
                      }
                      selectedDuplicates={selectedDuplicates}
                      goBack={() => handleStepBack()}
                    />
                  )}
                </>
              )}
            </>
          }
        />
      }
    />
  );
};

export default DuplicateImportHandle;
