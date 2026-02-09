import { countMultiPolygonVertices } from './vertexCount';

describe('countMultiPolygonVertices', () => {
  it('counts vertices in a simple polygon with one ring', () => {
    const coordinates = [
      [
        // One ring with 4 unique vertices + closing point
        [
          [0, 0],
          [1, 0],
          [1, 1],
          [0, 1],
          [0, 0]
        ]
      ]
    ];
    expect(countMultiPolygonVertices(coordinates)).toBe(4);
  });

  it('counts vertices in an open ring (no closing point)', () => {
    const coordinates = [
      [
        [
          [0, 0],
          [1, 0],
          [1, 1],
          [0, 1]
        ]
      ]
    ];
    expect(countMultiPolygonVertices(coordinates)).toBe(4);
  });

  it('counts vertices across multiple polygons', () => {
    const coordinates = [
      [
        [
          [0, 0],
          [1, 0],
          [1, 1],
          [0, 0]
        ] // 3 vertices (closed triangle)
      ],
      [
        [
          [2, 2],
          [3, 2],
          [3, 3],
          [2, 3],
          [2, 2]
        ] // 4 vertices (closed square)
      ]
    ];
    expect(countMultiPolygonVertices(coordinates)).toBe(7);
  });

  it('counts vertices in polygon with holes', () => {
    const coordinates = [
      [
        // Outer ring: 4 unique vertices
        [
          [0, 0],
          [10, 0],
          [10, 10],
          [0, 10],
          [0, 0]
        ],
        // Hole: 3 unique vertices
        [
          [2, 2],
          [4, 2],
          [3, 4],
          [2, 2]
        ]
      ]
    ];
    expect(countMultiPolygonVertices(coordinates)).toBe(7);
  });

  it('handles { lat, lng } objects', () => {
    const coordinates = [
      [
        [
          { lat: 0, lng: 0 },
          { lat: 1, lng: 0 },
          { lat: 1, lng: 1 },
          { lat: 0, lng: 0 }
        ]
      ]
    ];
    expect(countMultiPolygonVertices(coordinates)).toBe(3);
  });

  it('returns 0 for empty coordinates', () => {
    expect(countMultiPolygonVertices([])).toBe(0);
  });

  it('handles polygon with empty ring', () => {
    const coordinates = [[[]]];
    expect(countMultiPolygonVertices(coordinates)).toBe(0);
  });
});
