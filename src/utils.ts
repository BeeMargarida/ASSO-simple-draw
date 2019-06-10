export function getCoordWithZoom(shapeCoord: number, viewCoord: number, zoom: number){
    let zoomDiff = 0
    if(zoom != 1)
        zoomDiff = shapeCoord*(zoom-1)
    return (viewCoord - shapeCoord)-zoomDiff
}