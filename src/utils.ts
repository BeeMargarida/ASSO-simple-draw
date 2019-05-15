export function getCoordWithZoom(shapeCoord: number, viewCoord: number, zoom: number){
    return shapeCoord-(viewCoord-shapeCoord)*(zoom-1)
}