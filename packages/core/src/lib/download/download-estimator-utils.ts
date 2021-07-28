import area from '@turf/area';
import { LineString, Position } from '@turf/helpers';
import { getTileGeometry } from './tile-downloader';
import { Tile } from './Tile.interface';

export function getTileArea(coord: [number, number], level: number, tileGrid): number {
    const tile: Tile = {
        X: coord[0],
        Y: coord[1],
        Z: level
    };
    const tileGeometry = getTileGeometry(tile, tileGrid);
    const tileArea = area(tileGeometry);
    return area(tileGeometry);
}

export function gcd(a: number, b: number): number {
    if (b === 0) {
        return a;
    }
    return gcd(b, a % b);
}

export function getTileLength(tile: Tile, tileGrid): number {
    const tileGeometry = getTileGeometry(tile, tileGrid);
    const p0 = tileGeometry.coordinates[0][0];
    const p1 = tileGeometry.coordinates[0][1];
    let lengthSquared = 0;
    for (let dim = 0; dim < p0.length; dim++) {
        lengthSquared += (p1[dim] - p0[dim]) * (p1[dim] - p0[dim]);
    }
    const length = Math.sqrt(lengthSquared);
    return length;
}

export function getTileLengthFast(tile: Tile, tileGrid) {
    const tileGeometry = getTileGeometry(tile, tileGrid);
    const p0 = tileGeometry.coordinates[0][0];
    const p1 = tileGeometry.coordinates[0][1];
    const length = Math.abs(p0[0] - p1[0]) + Math.abs(p0[1] - p1[1]);
    return length;
}

export function getNumberOfTileLineIntersect(
    p0: Position,
    p1: Position,
    level: number,
    tileGrid
): number {
    const tile: Tile = {
        X: p0[0],
        Y: p0[1],
        Z: level
    };
    const tileLength = getTileLengthFast(tile, tileGrid);
    const dx: number = Math.ceil(Math.abs(p1[0] - p0[0]) / tileLength) + 1;
    const dy: number = Math.ceil(Math.abs(p1[1] - p0[1]) / tileLength) + 1;
    const nTiles = dx + dy - gcd(dx, dy);
    return nTiles;
}

export function getNumberOfTilesLineStringIntersect(
    lineString: LineString,
    level: number,
    tileGrid
) {
    let tiles = 0;
    const coordinates = lineString.coordinates;
    const numberOfLines: number = coordinates.length - 1;
    for (let coord = 0; coord < numberOfLines; coord++) {
        const p0 = coordinates[coord];
        const p1 = coordinates[coord + 1];
        tiles += getNumberOfTileLineIntersect(p0, p1, level, tileGrid);
    }
    return tiles - numberOfLines + 1;
}
