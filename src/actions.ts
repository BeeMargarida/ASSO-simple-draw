import { Shape, Circle, Rectangle } from './shape'
import { SimpleDrawDocument } from './document'

export interface Action<T> {
    do(): T
    undo(): void
}

abstract class CreateShapeAction<S extends Shape> implements Action<S> {
    constructor(private doc: SimpleDrawDocument, public readonly shape: S) { }

    do(): S {
        this.doc.add(this.shape)
        return this.shape
    }

    undo() {
        this.doc.objects = this.doc.objects.filter(o => o !== this.shape)
    }
}

export class CreateCircleAction extends CreateShapeAction<Circle> {
    constructor(doc: SimpleDrawDocument, private x: number, private y: number, private radius: number) {
        super(doc, new Circle(x, y, radius))
    }
}

export class CreateRectangleAction extends CreateShapeAction<Rectangle> {
    constructor(doc: SimpleDrawDocument, private x: number, private y: number, private width: number, private height: number) {
        super(doc, new Rectangle(x, y, width, height))
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