import { Shape, Circle, Rectangle, AreaSelected } from "./shape"
import { Style, WireframeCanvasRender, WireframeSVGRender } from "./styles"

export interface Render {
    draw(...objs: Array<Shape>): void

    setStyle(style: Style): void
    applyZoom(val: number): void
    translateScene(xd: number, yd: number): void
}

export class SVGRender implements Render {
    svg: SVGSVGElement
    style: Style
    zoom: number
    originalCenterX: number
    originalCenterY: number
    centerX: number
    centerY: number

    constructor(svg: SVGSVGElement) {
        this.svg = svg
        this.originalCenterX = parseInt(this.svg.getAttribute("width")) / 2
        this.originalCenterY = parseInt(this.svg.getAttribute("height")) / 2
        this.centerX = parseInt(this.svg.getAttribute("width")) / 2
        this.centerY = parseInt(this.svg.getAttribute("height")) / 2
        this.zoom = 1
        this.style = new WireframeSVGRender()
    }

    draw(...objs: Array<Shape>): void {
        this.style.draw(this, ...objs)
    }

    setStyle(style: Style): void {
        this.style = style
    }

    applyZoom(val: number): void {
        val = val > 0 ? 6 / 5 : 5 / 6
        this.zoom *= val
    }

    translateScene(xd: number, yd: number): void {
        this.centerX += xd
        this.centerY += yd
    }
}

export class CanvasRender implements Render {
    canvas: HTMLCanvasElement
    ctx: CanvasRenderingContext2D
    style: Style
    zoom: number
    originalCenterX: number
    originalCenterY: number
    centerX: number
    centerY: number

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas
        this.originalCenterX = this.canvas.width / 2
        this.originalCenterY = this.canvas.height / 2
        this.centerX = this.canvas.width / 2
        this.centerY = this.canvas.height / 2
        this.ctx = this.canvas.getContext('2d')
        this.zoom = 1
        this.style = new WireframeCanvasRender()
    }
    
    draw(...objs: Array<Shape>): void {
        this.style.draw(this, ...objs)
    }
    
    setStyle(style: Style): void {
        this.style = style
    }

    applyZoom(val: number): void {
        val = val > 0 ? 6 / 5 : 5 / 6
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
        this.zoom *= val;
    }

    translateScene(xd: number, yd: number): void {
        this.centerX += xd
        this.centerY += yd
    }
}


