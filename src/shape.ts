import { CanvasRender, SVGRender } from "render";
import { getCoordWithZoom } from "./utils";

export abstract class Shape {
    color: string
    centerX: number
    centerY: number
    constructor(public id: number, public x: number, public y: number) { }

    abstract updateCenter(): void

    translate(xd: number, yd: number): void {
        this.x += xd
        this.y += yd
        this.updateCenter()
    }

    abstract checkIfHit(mx: number, my: number, render: CanvasRender | SVGRender): boolean
    abstract checkIfBetween(startX: number, startY: number, width: number, height: number, render: CanvasRender | SVGRender): boolean
    abstract toString(): string
}

export class Rectangle extends Shape {
    constructor(public id: number, public x: number, public y: number, public width: number, public height: number) {
        super(id, x, y)
        this.centerX = x + width / 2
        this.centerY = y + height / 2
        this.color = 'black'
    }

    updateCenter() {
        this.centerX = this.x + this.width / 2
        this.centerY = this.y + this.height / 2
    }

    checkIfHit(mx: number, my: number, render: CanvasRender | SVGRender): boolean {
        var sx = getCoordWithZoom(this.x, render.originalCenterX, render.centerX, render.zoom)
        var sy = getCoordWithZoom(this.y, render.originalCenterY, render.centerY, render.zoom)
        if (mx >= sx && my >= sy && mx <= sx + this.width * render.zoom && my <= sy + this.height * render.zoom)
            return true
        return false
    }

    checkIfBetween(startX: number, startY: number, width: number, height: number, render: CanvasRender | SVGRender): boolean {
        var sx = getCoordWithZoom(this.x, render.originalCenterX, render.centerX, render.zoom)
        var sy = getCoordWithZoom(this.y, render.originalCenterY, render.centerY, render.zoom)
        var lastX = startX + width
        var lastY = startY + height
        if (startX <= sx && (sx + this.width * render.zoom) <= lastX && startY <= sy && (sy + this.height * render.zoom) <= lastY)
            return true
        return false
    }

    toString(): string {
        return 'Rectangle ' + this.id + ' ' + this.x + ' ' + this.y + ' ' + this.width + ' ' + this.height
    }
}

export class Circle extends Shape {
    constructor(public id: number, public x: number, public y: number, public radius: number) {
        super(id, x, y)
        this.color = 'black'
        this.centerX = x
        this.centerY = y
    }

    updateCenter() {
        this.centerX = this.x
        this.centerY = this.y
    }

    checkIfHit(mx: number, my: number, render: CanvasRender | SVGRender): boolean {
        var sx = getCoordWithZoom(this.x, render.originalCenterX, render.centerX, render.zoom)
        var sy = getCoordWithZoom(this.y, render.originalCenterY, render.centerY, render.zoom)
        var dx = mx - sx
        var dy = my - sy
        return dx * dx + dy * dy <= this.radius * render.zoom * this.radius * render.zoom
    }

    checkIfBetween(startX: number, startY: number, width: number, height: number, render: CanvasRender | SVGRender): boolean {
        var sx = getCoordWithZoom(this.x, render.originalCenterX, render.centerX, render.zoom)
        var sy = getCoordWithZoom(this.y, render.originalCenterY, render.centerY, render.zoom)
        var lastX = startX + width
        var lastY = startY + height
        if (startX <= sx && sx <= lastX && startY <= sy && sy <= lastY)
            return true
        return false
    }

    toString(): string {
        return 'Circle ' + this.id + ' ' + this.x + ' ' + this.y + ' ' + this.radius
    }
}

export class AreaSelected extends Shape {
    selectedShapes: Array<Shape>

    constructor(public id: number, public x: number, public y: number, public width: number, public height: number, public shapes: Array<Shape>) {
        super(id, x, y)
        this.centerX = x + width / 2
        this.centerY = y + height / 2
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
        var sx = getCoordWithZoom(this.x, render.originalCenterX, render.centerX, render.zoom)
        var sy = getCoordWithZoom(this.y, render.originalCenterY, render.centerY, render.zoom)
        if (mx >= sx && my >= sy && mx <= sx + this.width * render.zoom && my <= sy + this.height * render.zoom)
            return true
        return false
    }

    checkIfBetween(startX: number, startY: number, width: number, height: number, render: CanvasRender | SVGRender): boolean {
        var sx = getCoordWithZoom(this.x, render.originalCenterX, render.centerX, render.zoom)
        var sy = getCoordWithZoom(this.y, render.originalCenterY, render.centerY, render.zoom)
        var lastX = startX + width
        var lastY = startY + height
        if (startX <= sx && (sx + this.width * render.zoom) <= lastX && startY <= sy && (sy + this.height * render.zoom) <= lastY)
            return true
        return false
    }

    toString(): string {
        return 'Area Selected'
    }
}