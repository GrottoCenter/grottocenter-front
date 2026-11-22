import { useEffect, useRef, useState } from 'react';
import { useDebounce } from './useDebounce';

const INITIAL_TOLERANCE = 0;
const DEFAULT_SLIDER_PARAMS = {
  maxTolerance: 0.01,
  step: 0.0001,
  minAchievableCount: 0
};

export const useGeometrySimplification = (geometry, onError) => {
  const onErrorRef = useRef(onError);
  const requestRef = useRef(0);
  const workerRef = useRef(null);
  const workerReadyRef = useRef(false);
  const lastToleranceRef = useRef(null);
  const [tolerance, setTolerance] = useState(INITIAL_TOLERANCE);
  const [simplifiedData, setSimplifiedData] = useState(null);
  const [vertexCount, setVertexCount] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSimplifying, setIsSimplifying] = useState(false);
  const [sliderParams, setSliderParams] = useState(DEFAULT_SLIDER_PARAMS);
  const [resetVersion, setResetVersion] = useState(0);
  const debouncedTolerance = useDebounce(tolerance, 100);

  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  useEffect(() => {
    workerReadyRef.current = false;
    lastToleranceRef.current = null;
    setTolerance(INITIAL_TOLERANCE);
    setSimplifiedData(null);
    setVertexCount(0);
    setIsSimplifying(false);
    if (!geometry) {
      setSliderParams(DEFAULT_SLIDER_PARAMS);
      setIsAnalyzing(false);
      return undefined;
    }
    setIsAnalyzing(true);
    let worker;
    const handleError = message => {
      if (worker && workerRef.current !== worker) return;
      worker?.terminate();
      workerRef.current = null;
      workerReadyRef.current = false;
      lastToleranceRef.current = null;
      onErrorRef.current?.(message);
      setIsAnalyzing(false);
      setIsSimplifying(false);
      setSimplifiedData(null);
    };
    try {
      worker = new Worker(
        new URL('../workers/geometryImport.worker.js', import.meta.url),
        { type: 'module' }
      );
    } catch (error) {
      handleError(error.message);
      return undefined;
    }
    workerRef.current = worker;
    worker.onmessage = ({ data }) => {
      if (
        workerRef.current !== worker ||
        data.requestId !== requestRef.current
      ) {
        return;
      }
      if (data.error) {
        handleError(data.error);
        return;
      }
      if (data.sliderParams) {
        setSliderParams(data.sliderParams);
        workerReadyRef.current = true;
      }
      lastToleranceRef.current = data.tolerance;
      setSimplifiedData(data.simplifiedData);
      setVertexCount(data.vertexCount);
      setIsAnalyzing(false);
      setIsSimplifying(false);
    };
    worker.onerror = event => handleError(event.message);
    worker.onmessageerror = () => handleError();
    worker.postMessage({
      type: 'load',
      requestId: ++requestRef.current,
      geometry,
      tolerance: INITIAL_TOLERANCE
    });
    return () => {
      workerRef.current = null;
      worker.terminate();
    };
  }, [geometry]);

  useEffect(() => {
    if (
      !workerRef.current ||
      !workerReadyRef.current ||
      isAnalyzing ||
      debouncedTolerance !== tolerance
    ) {
      return;
    }
    if (debouncedTolerance === lastToleranceRef.current) {
      setIsSimplifying(false);
      return;
    }
    setIsSimplifying(true);
    workerRef.current.postMessage({
      type: 'simplify',
      requestId: ++requestRef.current,
      tolerance: debouncedTolerance
    });
  }, [debouncedTolerance, tolerance, isAnalyzing, resetVersion]);

  const reset = () => {
    // Keep an initial load valid: it already computes the reset tolerance.
    if (workerReadyRef.current) requestRef.current += 1;
    lastToleranceRef.current = null;
    setSimplifiedData(null);
    setIsSimplifying(workerReadyRef.current);
    setTolerance(INITIAL_TOLERANCE);
    setResetVersion(version => version + 1);
  };

  const updateTolerance = value => {
    if (value === tolerance) return;
    if (workerReadyRef.current) requestRef.current += 1;
    setIsSimplifying(
      workerReadyRef.current && value !== lastToleranceRef.current
    );
    setTolerance(value);
  };

  return {
    tolerance,
    updateTolerance,
    reset,
    simplifiedData,
    vertexCount,
    isAnalyzing,
    isSimplifying,
    sliderParams
  };
};
