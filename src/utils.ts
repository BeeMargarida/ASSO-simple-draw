export function getCoordWithZoom(shapeCoord: number, originalViewCoord: number, viewCoord: number, zoom: number) {
    //return (shapeCoord - (-viewCoord + originalViewCoord)) - (viewCoord - (shapeCoord - (-viewCoord + originalViewCoord))) * (zoom - 1)

    console.log("v: " + viewCoord);
    console.log("o: " + originalViewCoord);
    console.log("s: " + shapeCoord);
    console.log("z: " + zoom)

    
    return 3*viewCoord - 2*originalViewCoord + (-2*viewCoord + shapeCoord + originalViewCoord)*zoom

}