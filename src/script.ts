import { SimpleDrawDocument } from './document'
import { CanvasRender, SVGRender } from './render';

const canvasrender = new CanvasRender()
const svgrender = new SVGRender()

const sdd = new SimpleDrawDocument()
const c1 = sdd.createCircle(50, 50, 30)
const r1 = sdd.createRectangle(10, 10, 80, 80)
const r2 = sdd.createRectangle(30, 30, 40, 40)

/* const s1 = sdd.createSelection(c1, r1, r2)
sdd.translate(s1, 10, 10) */

sdd.draw(canvasrender)
sdd.draw(svgrender)