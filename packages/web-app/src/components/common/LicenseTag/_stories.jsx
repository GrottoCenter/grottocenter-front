import React from 'react';
import LicenseTag, { LicenseBadge } from './index';

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
  { name: 'CC0', text: 'Public Domain Dedication', url: 'https://creativecommons.org/publicdomain/zero/1.0/' },
  { name: 'ODbL', text: 'Open Data Commons Open Database License', url: 'https://opendatacommons.org/licenses/odbl/' },
  { name: 'ODC-BY', text: 'Open Data Commons Attribution License', url: 'https://opendatacommons.org/licenses/by/' },
  { name: 'Licence Ouverte', text: 'Licence Ouverte', url: 'https://www.etalab.gouv.fr/licence-ouverte-open-licence' }
];

// LicenseBadge — the bare badge, optionally linked to the deed.
export const Badge = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {LICENSES.map(license => (
        <LicenseBadge key={license.name} license={license} />
      ))}
    </div>
  )
};

export const BadgeLinkedToDeed = {
  render: () => <LicenseBadge license={LICENSES[1]} linkToDeed size={40} />
};

// LicenseTag — badge + plain-language description (the selectable option row).
export const Options = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {LICENSES.map(license => (
        <LicenseTag key={license.name} license={license} />
      ))}
    </div>
  )
};

export const RecommendedOption = {
  args: { license: LICENSES[1], recommended: true }
};
