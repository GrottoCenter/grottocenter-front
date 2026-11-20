import { countMultiPolygonVertices } from '@/helpers/vertexCount';
import {
  analyzeSimplificationCurve,
  simplifyPolygon
} from '@/utils/geometrySimplification';

let geometry;

globalThis.onmessage = ({ data }) => {
  try {
    let sliderParams;
    if (data.type === 'load') {
      geometry = data.geometry;
      sliderParams = analyzeSimplificationCurve(
        geometry,
        countMultiPolygonVertices(geometry.coordinates)
      );
    }
    const simplifiedData = simplifyPolygon(geometry, data.tolerance);
    globalThis.postMessage({
      requestId: data.requestId,
      sliderParams,
      simplifiedData,
      vertexCount: countMultiPolygonVertices(simplifiedData.coordinates)
    });
  } catch (error) {
    globalThis.postMessage({
      requestId: data.requestId,
      error: error.message
    });
  }
};
