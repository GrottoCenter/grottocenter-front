import WizardProgress from './WizardProgress';

const steps = [
  { id: 'upload', label: 'Upload' },
  { id: 'devices', label: 'Device & Sensors' },
  { id: 'mapping', label: 'Map Columns' },
  { id: 'validation', label: 'Validation' },
  { id: 'context', label: 'Context' },
  { id: 'submit', label: 'Submit' }
];

const meta = {
  title: 'Common/Form/WizardProgress',
  component: WizardProgress,
  args: { activeStep: 2, steps }
};

export default meta;

export const Default = {};

export const Compact = {
  parameters: { viewport: { defaultViewport: 'mobile1' } }
};

export const LongLabels = {
  args: {
    steps: [
      { id: 'upload', label: 'Chargement' },
      { id: 'devices', label: 'Appareils & Capteurs' },
      { id: 'mapping', label: 'Mappage des colonnes' },
      { id: 'validation', label: 'Validation' },
      { id: 'context', label: 'Contexte' },
      { id: 'submit', label: 'Envoi' }
    ]
  }
};
