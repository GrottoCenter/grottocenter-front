import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchProjections } from '../actions/Projections';

const EMPTY = [];

const useProjections = () => {
  const dispatch = useDispatch();
  const rawProjections = useSelector(
    state => state.projections?.projections ?? null
  );

  const isLoading = useSelector(state => state.projections?.loading ?? false);

  useEffect(() => {
    if (rawProjections === null && !isLoading) dispatch(fetchProjections());
  }, [dispatch, rawProjections, isLoading]);

  return rawProjections ?? EMPTY;
};

export default useProjections;
