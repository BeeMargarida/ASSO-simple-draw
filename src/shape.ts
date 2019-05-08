import { CanvasRender, SVGRender } from "render";
import { getCoordWithZoom } from "./utils";

export abstract class Shape {
    color: string
    constructor(public x: number, public y: number) { }

    translate(xd: number, yd: number): void {
        this.x += xd
        this.y += yd
    }

    abstract checkIfHit(mx: number, my: number, render: CanvasRender | SVGRender) : boolean
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

    checkIfHit(mx: number, my: number, render: CanvasRender | SVGRender): boolean {
        var sx = getCoordWithZoom(this.x, render.centerX, render.zoom)
        var sy = getCoordWithZoom(this.y, render.centerY, render.zoom)
        if(mx >= sx && my >= sy && mx <= sx + this.width*render.zoom && my <= sy + this.height*render.zoom)
            return true
        return false
    }
}

export class Circle extends Shape {
    constructor(public x: number, public y: number, public radius: number) {
        super(x, y)
        this.color = 'black'
    }
    
    checkIfHit(mx: number, my: number, render: CanvasRender | SVGRender): boolean {
        var sx = getCoordWithZoom(this.x, render.centerX, render.zoom)
        var sy = getCoordWithZoom(this.y, render.centerY, render.zoom)
        var dx = mx - sx
        var dy = my - sy
        return dx * dx + dy * dy <= this.radius*render.zoom * this.radius*render.zoom
    }
}