import { useIntl } from 'react-intl';
import MultipleISORegionsSelect from './MultipleISORegionsSelect';

const DocumentRegions = () => {
  const { formatMessage } = useIntl();
  return (
    <MultipleISORegionsSelect
      computeHasError={() => false}
      contextValueName="iso3166"
      helperText={formatMessage({
        id: 'If the document relates to one or more countries or regions.'
      })}
      labelName="ISO countries or regions"
      required={false}
    />
  );
};

export default DocumentRegions;
