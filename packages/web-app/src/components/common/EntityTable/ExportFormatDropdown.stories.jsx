import React from 'react';
import { action } from '@storybook/addon-actions';

import ExportFormatDropdown from './ExportFormatDropdown';

const meta = {
  title: 'Common/ExportFormatDropdown',
  component: ExportFormatDropdown
};

export default meta;

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
