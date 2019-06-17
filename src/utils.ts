export function getCoordWithZoom(shapeCoord: number, originalViewCoord: number, viewCoord: number, zoom: number) {
    return viewCoord + (shapeCoord - originalViewCoord)*zoom

}

export function checkOverlap(array1: Array<number>, array2: Array<number>) {
    for (let el of array1) {
        if(array2.indexOf(el) !== -1){
            return true
        }
    }
    return false
}