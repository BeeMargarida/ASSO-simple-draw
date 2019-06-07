import { Shape, Circle, Rectangle, AreaSelected } from './shape'
import { SimpleDrawDocument } from './document'

export interface Action<T> {
    do(): T
    undo(): void
    serialize(): string
}

abstract class CreateShapeAction<S extends Shape> implements Action<S> {
    constructor(private doc: SimpleDrawDocument, public readonly shape: S) { }

    do(): S {
        this.doc.add(this.shape)
        return this.shape
    }

    undo() {
        var layers = new Array<Array<Shape>>()
        for(var layer of this.doc.layers){
            layers.push(layer.filter(o => o !== this.shape))
        }
        this.doc.layers = layers
    }

    abstract serialize() : string
}

export class CreateCircleAction extends CreateShapeAction<Circle> {
    constructor(doc: SimpleDrawDocument, private x: number, private y: number, private radius: number) {
        super(doc, new Circle(x, y, radius))
    }

    serialize() : string {
        let action = {
            type: 'create',
            shape: 'circle',
            coords: ''+this.x+' '+this.y+' '+this.radius
        }
        return JSON.stringify(action)
    }
}

export class CreateRectangleAction extends CreateShapeAction<Rectangle> {
    constructor(doc: SimpleDrawDocument, private x: number, private y: number, private width: number, private height: number) {
        super(doc, new Rectangle(x, y, width, height))
    }

    serialize() : string {
        let action = {
            type: 'create',
            shape: 'rectangle',
            coords: ''+this.x+' '+this.y+' '+this.width+' '+this.height
        }
        return JSON.stringify(action)
    }
}

export class TranslateAction implements Action<void> {
    oldX: number
    oldY: number

    constructor(private doc: SimpleDrawDocument, public shape: Shape, private xd: number, private yd: number) { }

    do(): void {
        if(this.shape instanceof AreaSelected){
            for(const shape of this.shape.selectedShapes){
                shape.translate(this.xd, this.yd)
            }
        }
        this.oldX = this.shape.x
        this.oldY = this.shape.y
        this.shape.translate(this.xd, this.yd)
    }

    undo() {
        if(this.shape instanceof AreaSelected){
            for(const shape of this.shape.selectedShapes){
                shape.translate(-this.xd, -this.yd)
            }
        }
        this.shape.x = this.oldX
        this.shape.y = this.oldY
    }

    serialize() : string {
        let action = {
            type: 'translate',
            shape: this.shape,
            coords: ''+this.xd+' '+this.yd
        }
        return JSON.stringify(action)
    }
}