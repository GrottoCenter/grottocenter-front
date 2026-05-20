import { useState, useEffect, useCallback } from 'react';

const PREF_KEY = 'preferredCoordinateSystem';
export const WGS84_DD = 'WGS84_DD';
export const DMS_CODE = 'DMS';

const listeners = new Set();

const getStored = () => localStorage.getItem(PREF_KEY) || WGS84_DD;

const setStored = code => {
  localStorage.setItem(PREF_KEY, code);
  listeners.forEach(fn => fn(code));
};

export const getCRSLabel = (code, projections = []) => {
  if (code === WGS84_DD) return 'WGS84';
  if (code === DMS_CODE) return 'DMS';
  return projections.find(p => p.code === code)?.title ?? code;
};

export const useCoordinatePreference = () => {
  const [preferred, setPreferred] = useState(getStored);

  useEffect(() => {
    listeners.add(setPreferred);
    return () => listeners.delete(setPreferred);
  }, []);

  const setPref = useCallback(code => {
    setStored(code);
  }, []);

  return [preferred, setPref];
};
