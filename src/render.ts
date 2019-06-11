import { Shape, Circle, Rectangle, AreaSelected } from "./shape"
import { getCoordWithZoom } from "./utils";

export interface Render {
    draw(...objs: Array<Shape>): void

    applyZoom(val: number): void
    translateScene(xd: number, yd: number): void
}

export class SVGRender implements Render {
    svg: SVGSVGElement
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
    }

    draw(...objs: Array<Shape>): void {
        while (this.svg.firstChild != null)
            this.svg.firstChild.remove()
        for (const shape of objs) {
            if (shape instanceof Rectangle || shape instanceof AreaSelected) {
                const e = document.createElementNS("http://www.w3.org/2000/svg", "rect")
                e.setAttribute('style', 'stroke: ' + shape.color + '; fill: none')
                e.setAttribute('x', (getCoordWithZoom(shape.x, this.originalCenterX, this.centerX, this.zoom)).toString())
                e.setAttribute('y', (getCoordWithZoom(shape.y, this.originalCenterY, this.centerY, this.zoom)).toString())
                e.setAttribute('width', (shape.width * this.zoom).toString())
                e.setAttribute('height', (shape.height * this.zoom).toString())
                this.svg.appendChild(e)
            } else if (shape instanceof Circle) {
                var circle = document.createElementNS("http://www.w3.org/2000/svg", 'circle');
                circle.setAttributeNS(null, 'cx', (getCoordWithZoom(shape.x, this.originalCenterX, this.centerX, this.zoom)).toString());
                circle.setAttributeNS(null, 'cy', (getCoordWithZoom(shape.y, this.originalCenterY, this.centerY, this.zoom)).toString());
                circle.setAttributeNS(null, 'r', (shape.radius * this.zoom).toString());
                circle.setAttributeNS(null, 'style', 'fill: none; stroke: ' + shape.color + '; stroke-width: 1px;');
                this.svg.appendChild(circle);
            }
        }
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
    }

    draw(...objs: Array<Shape>): void {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
        this.ctx.fillRect(this.centerX, this.centerY, 1, 1); // fill in the pixel at (10,10)
        for (const shape of objs) {
            if (shape instanceof Circle) {
                this.ctx.beginPath()
                this.ctx.strokeStyle = shape.color
                this.ctx.ellipse(
                    getCoordWithZoom(shape.x, this.originalCenterX, this.centerX, this.zoom),
                    getCoordWithZoom(shape.y, this.originalCenterY, this.centerY, this.zoom),
                    shape.radius * this.zoom,
                    shape.radius * this.zoom,
                    0, 0, 2 * Math.PI)
                this.ctx.stroke()
            } else if (shape instanceof Rectangle) {
                this.ctx.strokeStyle = shape.color
                this.ctx.strokeRect(
                    getCoordWithZoom(shape.x, this.originalCenterX, this.centerX, this.zoom),
                    getCoordWithZoom(shape.y, this.originalCenterY, this.centerY, this.zoom),
                    shape.width * this.zoom,
                    shape.height * this.zoom
                )
            } else if (shape instanceof AreaSelected) {
                this.ctx.strokeStyle = shape.color
                this.ctx.strokeRect(
                    getCoordWithZoom(shape.x, this.originalCenterX, this.centerX, this.zoom),
                    getCoordWithZoom(shape.y, this.originalCenterY, this.centerY, this.zoom),
                    shape.width * this.zoom,
                    shape.height * this.zoom
                )
            }
        }
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