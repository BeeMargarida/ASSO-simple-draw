export function getCoordWithZoom(shapeCoord: number, viewCoord: number, zoom: number){
    return (viewCoord - shapeCoord)-shapeCoord*(zoom-1)
}