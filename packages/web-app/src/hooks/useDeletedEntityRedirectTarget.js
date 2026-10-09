import { useDocument } from './queries/useDocument';
import { useEntrance } from './queries/useEntrance';
import { useCave } from './queries/useCave';
import { useMassif } from './queries/useMassif';
import { useOrganization } from './queries/useOrganization';

export const useDeletedEntityRedirectTarget = (entityKind, redirectId) => {
  const document = useDocument(
    entityKind === 'Document' ? redirectId : undefined
  );
  const entrance = useEntrance(
    entityKind === 'Entrance' ? redirectId : undefined
  );
  const cave = useCave(entityKind === 'Network' ? redirectId : undefined);
  const massif = useMassif(entityKind === 'Massif' ? redirectId : undefined);
  const organization = useOrganization(
    entityKind === 'Organization' ? redirectId : undefined
  );

  return (
    {
      Document: document,
      Entrance: entrance,
      Network: cave,
      Massif: massif,
      Organization: organization
    }[entityKind] ?? null
  );
};
