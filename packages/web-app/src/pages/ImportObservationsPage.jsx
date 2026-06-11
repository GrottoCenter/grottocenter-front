import React from 'react';
import { useSearchParams } from 'react-router-dom';
import ImportObservationsWizard from '../components/appli/ImportObservationsWizard';

const ImportObservationsPage = () => {
  const [searchParams] = useSearchParams();
  const caveIdParam = searchParams.get('caveId');
  const lockedParam = searchParams.get('locked');

  const initialCaveId = caveIdParam ? parseInt(caveIdParam, 10) : null;
  const caveIdLocked = lockedParam === 'true';

  return (
    <ImportObservationsWizard
      initialCaveId={Number.isFinite(initialCaveId) ? initialCaveId : null}
      caveIdLocked={caveIdLocked}
    />
  );
};

export default ImportObservationsPage;
