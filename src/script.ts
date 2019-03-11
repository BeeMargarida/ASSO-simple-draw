import { SimpleDrawDocument } from './document'

const canvas = <HTMLCanvasElement>document.getElementById('canvas')
const ctx = canvas.getContext('2d')

const sdd = new SimpleDrawDocument()
const c1 = sdd.createCircle(50, 50, 30)
sdd.translate(c1, 50, 50)
const r1 = sdd.createRectangle(10, 10, 80, 80)
sdd.undo()
sdd.undo()
sdd.undo()
sdd.undo()
const r2 = sdd.createRectangle(10, 10, 80, 80)
sdd.undo()
sdd.redo()
sdd.redo()

sdd.draw(ctx)

