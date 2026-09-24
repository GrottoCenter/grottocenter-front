import { useEffect, useState } from 'react';

import { loadSvg } from '../SvgTileLayer';

const useSvgData = url => {
  const [state, setState] = useState({ status: 'loading' });
  useEffect(() => {
    let cancelled = false;
    setState({ status: 'loading' });
    loadSvg(url)
      .then(data => {
        if (!cancelled) setState({ status: 'ready', data });
      })
      .catch(error => {
        if (!cancelled) setState({ status: 'error', error });
      });
    return () => {
      cancelled = true;
    };
  }, [url]);
  return state;
};

export default useSvgData;
