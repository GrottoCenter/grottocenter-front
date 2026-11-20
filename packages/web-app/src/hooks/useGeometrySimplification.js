import { useEffect, useRef, useState } from 'react';
import { useDebounce } from './useDebounce';

const INITIAL_TOLERANCE = 0;
const DEFAULT_SLIDER_PARAMS = {
  maxTolerance: 0.01,
  step: 0.0001,
  minAchievableCount: 0
};

export const useGeometrySimplification = (geometry, onError) => {
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
  const debouncedTolerance = useDebounce(tolerance, 100);

  useEffect(() => {
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
    workerReadyRef.current = false;
    lastToleranceRef.current = null;
    const handleError = message => {
      if (worker && workerRef.current !== worker) return;
      worker?.terminate();
      workerRef.current = null;
      workerReadyRef.current = false;
      lastToleranceRef.current = null;
      onError(message);
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
  }, [geometry, onError]);

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
  }, [debouncedTolerance, tolerance, isAnalyzing]);

  const reset = () => {
    requestRef.current += 1;
    workerReadyRef.current = false;
    lastToleranceRef.current = null;
    setSimplifiedData(null);
    setIsSimplifying(false);
    setTolerance(INITIAL_TOLERANCE);
  };

  const updateTolerance = value => {
    if (value === tolerance) return;
    requestRef.current += 1;
    setIsSimplifying(true);
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
