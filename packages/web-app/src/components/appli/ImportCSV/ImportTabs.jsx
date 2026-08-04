import { useContext } from 'react';
import { styled } from '@mui/material/styles';
import { Tab, Tabs } from '@mui/material';
import Translate from '../../common/Translate';
import { ImportPageContentContext } from './Provider';
import { DOCUMENT, ENTRANCE } from './constants';
import { entranceIcon, bibliographyIcon } from '../../../assets/icons';

const TabIcon = styled('img')`
  height: 1.25rem;
  margin-right: 5px;
  vertical-align: middle;
  width: 1.25rem;
`;

const ImportTabs = () => {
  const { currentStep, selectedType, updateAttribute } = useContext(
    ImportPageContentContext
  );

  const handleSelectType = (_event, value) => {
    updateAttribute('selectedType', value);
    updateAttribute('importData', []);
    updateAttribute('validatedSteps', [currentStep]);
  };

  return (
    <Tabs variant="standard" value={selectedType} onChange={handleSelectType}>
      <Tab
        label={
          <>
            <TabIcon src={entranceIcon} alt="Entry icon" />
            <Translate>Entrances</Translate>
          </>
        }
        disabled={currentStep > 1 && selectedType === DOCUMENT}
      />
      <Tab
        label={
          <>
            <TabIcon src={bibliographyIcon} alt="Bibliography icon" />
            <Translate>Documents</Translate>
          </>
        }
        disabled={currentStep > 1 && selectedType === ENTRANCE}
      />
    </Tabs>
  );
};
ImportTabs.propTypes = {};

export default ImportTabs;
