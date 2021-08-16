import React, { useState } from 'react';
import { useIntl } from 'react-intl';
import Layout from '../../components/common/Layouts/Fixed/FixedContent';
import DuplicatesList from '../../components/appli/Duplicates/DuplicatesList';
import HeaderTabs from './HeaderTabs';
import AuthChecker from '../../features/AuthChecker';
import ActionButton from '../../components/common/ActionButton';
import HydratedEntranceDuplicates from '../../components/appli/Duplicates/HydratedEntranceDuplicates';
import HydratedDocumentDuplicates from '../../components/appli/Duplicates/HydratedDocumentDuplicates';

const ENTRANCE_TAB = 'entrance';
const DOCUMENT_TAB = 'document';
const TABS = [ENTRANCE_TAB, DOCUMENT_TAB];

const DuplicateImportHandle = () => {
  const [selectedTab, setSelectedTab] = useState(0);
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedDuplicates, setSelectedDuplicates] = useState([]);

  const { formatMessage } = useIntl();

  const handleStepNext = () => {
    setCurrentStep(currentStep + 1);
  };

  const handleStepBack = () => {
    setCurrentStep(currentStep - 1);
  };

  return (
    <Layout
      title={formatMessage({ id: 'Duplicates from import handler tool' })}
      footer=""
      content={
        <AuthChecker
          componentToDisplay={
            <>
              <HeaderTabs
                selectedTab={selectedTab}
                setSelectedTab={setSelectedTab}
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
                  <ActionButton
                    label={formatMessage({ id: 'Go back' })}
                    onClick={handleStepBack}
                    color="primary"
                  />
                  {TABS[selectedTab] === ENTRANCE_TAB && (
                    <HydratedEntranceDuplicates
                      selectedDuplicates={selectedDuplicates}
                    />
                  )}
                  {TABS[selectedTab] === DOCUMENT_TAB && (
                    <HydratedDocumentDuplicates
                      selectedDuplicates={selectedDuplicates}
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
