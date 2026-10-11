export interface Point {
  x: number;
  y: number;
}

export interface Rect {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

export function samePoint(a: Point, b: Point): boolean {
  return a.x === b.x && a.y === b.y;
}

export function rectBetween(a: Point, b: Point): Rect {
  return {
    minX: Math.min(a.x, b.x),
    minY: Math.min(a.y, b.y),
    maxX: Math.max(a.x, b.x),
    maxY: Math.max(a.y, b.y),
  };
}

export function tilesIn(rect: Rect): Point[] {
  const tiles: Point[] = [];
  for (let y = rect.minY; y <= rect.maxY; y++) {
    for (let x = rect.minX; x <= rect.maxX; x++) tiles.push({ x, y });
  }
  return tiles;
}

export function clampPoint(p: Point, size: number): Point {
  return {
    x: Math.min(Math.max(p.x, 0), size - 1),
    y: Math.min(Math.max(p.y, 0), size - 1),
  };
}
