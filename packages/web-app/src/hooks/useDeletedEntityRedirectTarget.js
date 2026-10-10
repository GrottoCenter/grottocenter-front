import { DELETED_ENTITY_REDIRECT_KINDS } from '@/utils/deletedEntityRedirect';
import { useDocument } from './queries/useDocument';
import { useEntrance } from './queries/useEntrance';
import { useCave } from './queries/useCave';
import { useMassif } from './queries/useMassif';
import { useOrganization } from './queries/useOrganization';

export const useDeletedEntityRedirectTarget = (entityKind, redirectId) => {
  const document = useDocument(
    entityKind === DELETED_ENTITY_REDIRECT_KINDS.DOCUMENT
      ? redirectId
      : undefined
  );
  const entrance = useEntrance(
    entityKind === DELETED_ENTITY_REDIRECT_KINDS.ENTRANCE
      ? redirectId
      : undefined
  );
  const cave = useCave(
    entityKind === DELETED_ENTITY_REDIRECT_KINDS.NETWORK
      ? redirectId
      : undefined
  );
  const massif = useMassif(
    entityKind === DELETED_ENTITY_REDIRECT_KINDS.MASSIF ? redirectId : undefined
  );
  const organization = useOrganization(
    entityKind === DELETED_ENTITY_REDIRECT_KINDS.ORGANIZATION
      ? redirectId
      : undefined
  );

  return (
    {
      [DELETED_ENTITY_REDIRECT_KINDS.DOCUMENT]: document,
      [DELETED_ENTITY_REDIRECT_KINDS.ENTRANCE]: entrance,
      [DELETED_ENTITY_REDIRECT_KINDS.NETWORK]: cave,
      [DELETED_ENTITY_REDIRECT_KINDS.MASSIF]: massif,
      [DELETED_ENTITY_REDIRECT_KINDS.ORGANIZATION]: organization
    }[entityKind] ?? null
  );
};
