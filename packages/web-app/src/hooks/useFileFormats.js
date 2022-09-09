import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchFormats } from '../actions/FileFormats';

export const useFileFormats = () => {
  const { data, loading, error } = useSelector(state => state.fileFormats);
  const dispatch = useDispatch();
  const [state, setState] = useState({
    mimeTypes: [],
    extensions: []
  });

  useEffect(() => {
    if (data) {
      const mimeList = [];
      const extensionList = [];
      data.forEach(type => {
        mimeList.push(type.mimeType);
        extensionList.push(type.extension);
      });
      setState({
        mimeTypes: mimeList,
        extensions: extensionList
      });
    }
  }, [data]);

  useEffect(() => {
    // Avoid uselesses requests if we already have the data
    if (!data) {
      dispatch(fetchFormats());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    mimeTypes: state.mimeTypes,
    extensions: state.extensions,
    loading,
    error
  };
};
