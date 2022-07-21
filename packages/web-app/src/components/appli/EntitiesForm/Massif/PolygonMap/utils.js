const getMultiPolygonCentroid = function(coordinates) {
  const result = coordinates.reduce(
    (x, y) => [
      x[0] + y[0] / coordinates.length,
      x[1] + y[1] / coordinates.length
    ],
    [0, 0]
  );
  return {
    lat: result[1],
    lng: result[0]
  };
};

export default getMultiPolygonCentroid;
