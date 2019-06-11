export function getCoordWithZoom(shapeCoord: number, originalViewCoord: number, viewCoord: number, zoom: number) {
    return viewCoord + (shapeCoord - originalViewCoord)*zoom

}