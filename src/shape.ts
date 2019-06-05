import { CanvasRender, SVGRender } from "render";
import { getCoordWithZoom } from "./utils";

export abstract class Shape {
    color: string
    centerX: number
    centerY: number
    constructor(public x: number, public y: number) { }

    abstract updateCenter() : void

    translate(xd: number, yd: number): void {
        this.x += xd
        this.y += yd
        this.updateCenter()
    }

    abstract checkIfHit(mx: number, my: number, render: CanvasRender | SVGRender) : boolean
    abstract checkIfBetween(startX: number, startY: number, width: number, height: number, render: CanvasRender | SVGRender) : boolean
}

export class Rectangle extends Shape {
    centerX: number
    centerY: number

    constructor(public x: number, public y: number, public width: number, public height: number) {
        super(x, y)
        this.centerX = x + width/2
        this.centerY = y + height/2
        this.color = 'black'
    }

    updateCenter() {
        this.centerX = this.x + this.width / 2
        this.centerY = this.y + this.height / 2
    }

    checkIfHit(mx: number, my: number, render: CanvasRender | SVGRender): boolean {
        var sx = getCoordWithZoom(this.x, render.centerX, render.zoom)
        var sy = getCoordWithZoom(this.y, render.centerY, render.zoom)
        if(mx >= sx && my >= sy && mx <= sx + this.width*render.zoom && my <= sy + this.height*render.zoom)
            return true
        return false
    }

    checkIfBetween(startX: number, startY: number, width: number, height: number, render: CanvasRender | SVGRender) : boolean {
        var sx = getCoordWithZoom(this.x, render.centerX, render.zoom)
        var sy = getCoordWithZoom(this.y, render.centerY, render.zoom)
        var lastX = startX + width
        var lastY = startY + height
        if(startX <= sx && (sx + this.width*render.zoom) <= lastX && startY <= sy && (sy + this.height*render.zoom) <= lastY)
            return true
        return false
    }
}

export class Circle extends Shape {
    constructor(public x: number, public y: number, public radius: number) {
        super(x, y)
        this.color = 'black'
        this.centerX = x
        this.centerY = y
    }

    updateCenter() {
        this.centerX = this.x
        this.centerY = this.y
    }
    
    checkIfHit(mx: number, my: number, render: CanvasRender | SVGRender): boolean {
        var sx = getCoordWithZoom(this.x, render.centerX, render.zoom)
        var sy = getCoordWithZoom(this.y, render.centerY, render.zoom)
        var dx = mx - sx
        var dy = my - sy
        return dx * dx + dy * dy <= this.radius*render.zoom * this.radius*render.zoom
    }

    checkIfBetween(startX: number, startY: number, width: number, height: number, render: CanvasRender | SVGRender) : boolean {
        var sx = getCoordWithZoom(this.x, render.centerX, render.zoom)
        var sy = getCoordWithZoom(this.y, render.centerY, render.zoom)
        var lastX = startX + width
        var lastY = startY + height
        if(startX <= sx && sx <= lastX && startY <= sy && sy <= lastY)
            return true
        return false
    }
}

export class AreaSelected extends Shape {
    selectedShapes: Array<Shape>

    constructor(public x: number, public y: number, public width: number, public height: number, public shapes: Array<Shape>) {
        super(x, y)
        this.centerX = x + width/2
        this.centerY = y + height/2
        this.color = 'yellow'
        this.selectedShapes = shapes
    }

    updateCenter() {
        this.centerX = this.x + this.width / 2
        this.centerY = this.y + this.height / 2
    }

    udpateSelectedShapes(shapes: Array<Shape>): void {
        this.selectedShapes = shapes
    }

    checkIfHit(mx: number, my: number, render: CanvasRender | SVGRender): boolean {
        var sx = getCoordWithZoom(this.x, render.centerX, render.zoom)
        var sy = getCoordWithZoom(this.y, render.centerY, render.zoom)
        if(mx >= sx && my >= sy && mx <= sx + this.width*render.zoom && my <= sy + this.height*render.zoom)
            return true
        return false
    }

    translate(xd: number, yd: number): void {
        for(var shape of this.selectedShapes) {
            shape.x += xd
            shape.y += yd
            shape.updateCenter()
        }
        this.x += xd
        this.y += yd
        this.updateCenter()
    }

    checkIfBetween(startX: number, startY: number, width: number, height: number, render: CanvasRender | SVGRender) : boolean {
        var sx = getCoordWithZoom(this.x, render.centerX, render.zoom)
        var sy = getCoordWithZoom(this.y, render.centerY, render.zoom)
        var lastX = startX + width
        var lastY = startY + height
        if(startX <= sx && (sx + this.width*render.zoom) <= lastX && startY <= sy && (sy + this.height*render.zoom) <= lastY)
            return true
        return false
    }
}