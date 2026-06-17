import React from 'react';
import { action } from '@storybook/addon-actions';

import ExportFormatDropdown from './ExportFormatDropdown';

export default {
  title: 'Common/ExportFormatDropdown',
  component: ExportFormatDropdown
};

export const Default = () => (
  <ExportFormatDropdown disabled={false} onExport={action('onExport')} />
);

export const Disabled = () => (
  <ExportFormatDropdown disabled onExport={action('onExport')} />
);

export const IconOnly = () => (
  <ExportFormatDropdown
    disabled={false}
    onExport={action('onExport')}
    iconOnly
  />
);

export const IconOnlyDisabled = () => (
  <ExportFormatDropdown disabled onExport={action('onExport')} iconOnly />
);
