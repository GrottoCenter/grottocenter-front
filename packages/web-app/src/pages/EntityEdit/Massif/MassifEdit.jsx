import { useParams, useNavigate } from 'react-router-dom';
import { useMassif } from '../../../hooks';
import MassifEditContainer from './MassifEditContainer';

const MassifEdit = () => {
  const { massifId } = useParams();
  const navigate = useNavigate();
  const { data: massif, isPending } = useMassif(massifId);

  return (
    <MassifEditContainer
      isFetching={isPending}
      massif={massif}
      onCancel={() => navigate(`/ui/massifs/${massifId}`)}
    />
  );
};

export default MassifEdit;
