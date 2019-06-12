import { Shape, Circle, Rectangle, AreaSelected } from "./shape"
import { Render, CanvasRender, SVGRender } from "./render"
import { getCoordWithZoom } from "./utils";

export interface Style {
    draw(render: Render, ...objs: Array<Shape>): void
}

export class ColorCanvasRender implements Style {

    draw(render: CanvasRender, ...objs: Array<Shape>): void {
        render.ctx.clearRect(0, 0, render.canvas.width, render.canvas.height)
        render.ctx.fillRect(render.centerX, render.centerY, 1, 1); // fill in the pixel at (10,10)
        for (const shape of objs) {
            if (shape instanceof Circle) {
                render.ctx.beginPath()
                render.ctx.fillStyle = shape.color
                render.ctx.ellipse(
                    getCoordWithZoom(shape.x, render.originalCenterX, render.centerX, render.zoom),
                    getCoordWithZoom(shape.y, render.originalCenterY, render.centerY, render.zoom),
                    shape.radius * render.zoom,
                    shape.radius * render.zoom,
                    0, 0, 2 * Math.PI)
                render.ctx.fill()
            } else if (shape instanceof Rectangle) {
                render.ctx.fillStyle = shape.color
                render.ctx.fillRect(
                    getCoordWithZoom(shape.x, render.originalCenterX, render.centerX, render.zoom),
                    getCoordWithZoom(shape.y, render.originalCenterY, render.centerY, render.zoom),
                    shape.width * render.zoom,
                    shape.height * render.zoom
                )
            }
            else if (shape instanceof AreaSelected) {
                render.ctx.strokeStyle = shape.color
                render.ctx.strokeRect(
                    getCoordWithZoom(shape.x, render.originalCenterX, render.centerX, render.zoom),
                    getCoordWithZoom(shape.y, render.originalCenterY, render.centerY, render.zoom),
                    shape.width * render.zoom,
                    shape.height * render.zoom
                )
            }
        }
    }
}

export class WireframeCanvasRender implements Style {

    draw(render: CanvasRender, ...objs: Array<Shape>): void {
        render.ctx.clearRect(0, 0, render.canvas.width, render.canvas.height)
        render.ctx.fillRect(render.centerX, render.centerY, 1, 1); // fill in the pixel at (10,10)
        for (const shape of objs) {
            if (shape instanceof Circle) {
                render.ctx.beginPath()
                render.ctx.strokeStyle = shape.color
                render.ctx.ellipse(
                    getCoordWithZoom(shape.x, render.originalCenterX, render.centerX, render.zoom),
                    getCoordWithZoom(shape.y, render.originalCenterY, render.centerY, render.zoom),
                    shape.radius * render.zoom,
                    shape.radius * render.zoom,
                    0, 0, 2 * Math.PI)
                render.ctx.stroke()
            } else if (shape instanceof Rectangle || shape instanceof AreaSelected) {
                render.ctx.strokeStyle = shape.color
                render.ctx.strokeRect(
                    getCoordWithZoom(shape.x, render.originalCenterX, render.centerX, render.zoom),
                    getCoordWithZoom(shape.y, render.originalCenterY, render.centerY, render.zoom),
                    shape.width * render.zoom,
                    shape.height * render.zoom
                )
            }
        }
    }
}

export class ColorSVGRender implements Style {

    draw(render: SVGRender, ...objs: Array<Shape>): void {
        while (render.svg.firstChild != null)
            render.svg.firstChild.remove()
        for (const shape of objs) {
            if (shape instanceof Rectangle || shape instanceof AreaSelected) {
                const e = document.createElementNS("http://www.w3.org/2000/svg", "rect")
                shape instanceof AreaSelected ? e.setAttribute('style', 'stroke: ' + shape.color + '; fill: none') : e.setAttribute('style', 'fill: ' + shape.color + '; stroke: none')
                e.setAttribute('x', (getCoordWithZoom(shape.x, render.originalCenterX, render.centerX, render.zoom)).toString())
                e.setAttribute('y', (getCoordWithZoom(shape.y, render.originalCenterY, render.centerY, render.zoom)).toString())
                e.setAttribute('width', (shape.width * render.zoom).toString())
                e.setAttribute('height', (shape.height * render.zoom).toString())
                render.svg.appendChild(e)
            } else if (shape instanceof Circle) {
                var circle = document.createElementNS("http://www.w3.org/2000/svg", 'circle');
                circle.setAttributeNS(null, 'cx', (getCoordWithZoom(shape.x, render.originalCenterX, render.centerX, render.zoom)).toString());
                circle.setAttributeNS(null, 'cy', (getCoordWithZoom(shape.y, render.originalCenterY, render.centerY, render.zoom)).toString());
                circle.setAttributeNS(null, 'r', (shape.radius * render.zoom).toString());
                circle.setAttributeNS(null, 'style', 'fill: ' + shape.color + '; stroke: none; stroke-width: 1px;');
                render.svg.appendChild(circle);
            }
        }
    }
}

export class WireframeSVGRender implements Style {

    draw(render: SVGRender, ...objs: Array<Shape>): void {
        while (render.svg.firstChild != null)
            render.svg.firstChild.remove()
        for (const shape of objs) {
            if (shape instanceof Rectangle || shape instanceof AreaSelected) {
                const e = document.createElementNS("http://www.w3.org/2000/svg", "rect")
                e.setAttribute('style', 'stroke: ' + shape.color + '; fill: none')
                e.setAttribute('x', (getCoordWithZoom(shape.x, render.originalCenterX, render.centerX, render.zoom)).toString())
                e.setAttribute('y', (getCoordWithZoom(shape.y, render.originalCenterY, render.centerY, render.zoom)).toString())
                e.setAttribute('width', (shape.width * render.zoom).toString())
                e.setAttribute('height', (shape.height * render.zoom).toString())
                render.svg.appendChild(e)
            } else if (shape instanceof Circle) {
                var circle = document.createElementNS("http://www.w3.org/2000/svg", 'circle');
                circle.setAttributeNS(null, 'cx', (getCoordWithZoom(shape.x, render.originalCenterX, render.centerX, render.zoom)).toString());
                circle.setAttributeNS(null, 'cy', (getCoordWithZoom(shape.y, render.originalCenterY, render.centerY, render.zoom)).toString());
                circle.setAttributeNS(null, 'r', (shape.radius * render.zoom).toString());
                circle.setAttributeNS(null, 'style', 'fill: none; stroke: ' + shape.color + '; stroke-width: 1px;');
                render.svg.appendChild(circle);
            }
        }
    }
}