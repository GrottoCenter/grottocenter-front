import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { loadMassif } from '../../../actions/Massif/GetMassif';
import MassifEditContainer from './MassifEditContainer';

const MassifEdit = () => {
  const { massifId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { massif, isFetching } = useSelector(state => state.massif);

  useEffect(() => {
    dispatch(loadMassif(massifId));
  }, [massifId, dispatch]);

  return (
    <MassifEditContainer
      isFetching={isFetching}
      massif={massif}
      onCancel={() => navigate(`/ui/massifs/${massifId}`)}
    />
  );
};

export default MassifEdit;
