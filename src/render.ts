import { Shape, Circle, Rectangle } from "./shape"

export interface Render {
    draw(...objs: Array<Shape>): void

    applyZoom(val: number): void
}

export class SVGRender implements Render {
    svg: SVGSVGElement
    zoom: number
    centerX: number
    centerY: number

    constructor(svg: SVGSVGElement) {
        this.svg = svg
        this.centerX = this.svg.clientWidth / 2
        this.centerY = this.svg.clientHeight / 2
        this.zoom = 1
    }

    draw(...objs: Array<Shape>): void {
        while (this.svg.firstChild != null)
            this.svg.firstChild.remove()
        for (const shape of objs) {
            if (shape instanceof Rectangle) {
                const e = document.createElementNS("http://www.w3.org/2000/svg", "rect")
                e.setAttribute('style', 'stroke: black; fill: none')
                e.setAttribute('x', (shape.x > this.centerX ? shape.x*this.zoom : shape.x-(this.centerX-shape.x)*(this.zoom-1)).toString())
                e.setAttribute('y', (shape.y > this.centerY ? shape.y*this.zoom : shape.y-(this.centerY-shape.y)*(this.zoom-1)).toString())
                e.setAttribute('width', (shape.width * this.zoom).toString())
                e.setAttribute('height', (shape.height * this.zoom).toString())
                this.svg.appendChild(e)
            } else if (shape instanceof Circle) {
                var circle = document.createElementNS("http://www.w3.org/2000/svg", 'circle');
                circle.setAttributeNS(null, 'cx', (shape.x > this.centerX ? shape.x*this.zoom : shape.x-(this.centerX-shape.x)*(this.zoom-1)).toString());
                circle.setAttributeNS(null, 'cy', (shape.y > this.centerY ? shape.y*this.zoom : shape.y-(this.centerY-shape.y)*(this.zoom-1)).toString());
                circle.setAttributeNS(null, 'r', (shape.radius * this.zoom).toString());
                circle.setAttributeNS(null, 'style', 'fill: none; stroke: black; stroke-width: 1px;');
                this.svg.appendChild(circle);
            }
        }
    }

    applyZoom(val: number): void {
        val = val > 0 ? 6/5 : 5/6
        this.zoom *= val
    }
}

export class CanvasRender implements Render {
    canvas: HTMLCanvasElement
    ctx: CanvasRenderingContext2D
    zoom: number
    centerX: number
    centerY: number

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas
        this.centerX = this.canvas.width / 2
        this.centerY = this.canvas.height / 2
        console.log(this.centerX + " " + this.centerY)
        this.ctx = this.canvas.getContext('2d')
        this.zoom = 1
    }

    draw(...objs: Array<Shape>): void {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
        for (const shape of objs) {
            if (shape instanceof Circle) {
                this.ctx.beginPath()
                this.ctx.ellipse(
                    shape.x > this.centerX ? shape.x*this.zoom : shape.x-(this.centerX-shape.x)*(this.zoom-1),
                    shape.y > this.centerY ? shape.y*this.zoom : shape.y-(this.centerY-shape.y)*(this.zoom-1),
                    shape.radius * this.zoom,
                    shape.radius * this.zoom,
                    0, 0, 2 * Math.PI)
                this.ctx.stroke()
            } else if (shape instanceof Rectangle) {
                this.ctx.strokeRect(
                    shape.x > this.centerX ? shape.x*this.zoom : shape.x-(this.centerX-shape.x)*(this.zoom-1),
                    shape.y > this.centerY ? shape.y*this.zoom : shape.y-(this.centerY-shape.y)*(this.zoom-1),
                    shape.width * this.zoom,
                    shape.height * this.zoom
                )
            }
        }
    }

    applyZoom(val: number): void {
        val = val > 0 ? 6/5 : 5/6
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
        this.zoom *= val;
    }
}