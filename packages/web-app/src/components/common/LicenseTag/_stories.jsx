import React from 'react';
import LicenseTag from './index';

const meta = {
  title: 'Common/LicenseTag',
  component: LicenseTag
};
export default meta;

const LICENSES = [
  { name: 'CC-BY', text: 'Attribution', url: 'https://creativecommons.org/licenses/by/3.0/' },
  { name: 'CC-BY-SA', text: 'Attribution-ShareAlike', url: 'https://creativecommons.org/licenses/by-sa/3.0/' },
  { name: 'CC BY NC', text: 'Attribution-NonCommercial', url: 'https://creativecommons.org/licenses/by-nc/4.0/' },
  { name: 'CC BY ND', text: 'Attribution-NoDerivatives', url: 'https://creativecommons.org/licenses/by-nd/4.0/' },
  { name: 'CC BY NC SA', text: 'Attribution-NonCommercial-ShareAlike', url: 'https://creativecommons.org/licenses/by-nc-sa/4.0/' },
  { name: 'CC-BY-NC-ND', text: 'Attribution-NonCommercial-NoDerivs', url: 'https://creativecommons.org/licenses/by-nc-nd/2.0/' },
  { name: 'ODbL', text: 'Open Data Commons Open Database License', url: 'https://opendatacommons.org/licenses/odbl/' },
  { name: 'ODC-BY', text: 'Open Data Commons Attribution License', url: 'https://opendatacommons.org/licenses/by/' },
  { name: 'Licence Ouverte', text: 'Licence Ouverte', url: 'https://www.etalab.gouv.fr/licence-ouverte-open-licence' }
];

export const Badge = {
  args: { license: LICENSES[1] }
};

export const LinkToDeed = {
  args: { license: LICENSES[1], linkToDeed: true, size: 31 }
};

export const NonCreativeCommons = {
  args: { license: LICENSES[6] }
};

export const WithDescription = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {LICENSES.map(license => (
        <LicenseTag key={license.name} license={license} withDescription />
      ))}
    </div>
  )
};
