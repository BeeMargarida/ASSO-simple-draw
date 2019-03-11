import { Shape, Circle, Rectangle } from './shape'
import { SimpleDrawDocument } from './document'

export interface Action<T> {
    shape: Shape
    do(): T
    undo(): void
}

interface CreateAction extends Action<Shape> {
    shape: Shape
}

export class CreateCircleAction implements CreateAction {
    shape: Circle

    constructor(private doc: SimpleDrawDocument, private x: number, private y: number, private radius: number) {}

    do(): Circle {
        this.shape = new Circle(this.x, this.y, this.radius)
        this.doc.add(this.shape)        
        return this.shape
    }

    undo() {
        this.doc.objects = this.doc.objects.filter(o => o !== this.shape)
    }
}

export class CreateRectangleAction {
    shape: Rectangle

    constructor(private doc: SimpleDrawDocument, private x: number, private y: number, private width: number, private height: number) { }

    do(): Rectangle {
        this.shape = new Rectangle(this.x, this.y, this.width, this.height)
        this.doc.add(this.shape)
        return this.shape
    }

    undo() {
        this.doc.objects = this.doc.objects.filter(o => o !== this.shape)
    }
}

export class TranslateAction implements Action<void> {
    oldX: number
    oldY: number

    constructor(private doc: SimpleDrawDocument, public shape: Shape, private xd: number, private yd: number) { }

    do(): void {
        this.oldX = this.shape.x
        this.oldY = this.shape.y
        this.shape.translate(this.xd, this.yd)
    }

    undo() {
        this.shape.x = this.oldX
        this.shape.y = this.oldY
       // this.shape.translate(-this.xd, -this.yd)
    }
}