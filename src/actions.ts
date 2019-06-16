import { Shape, Circle, Rectangle, AreaSelected } from './shape'
import { SimpleDrawDocument } from './document'

export interface Action<T> {

    // saved: boolean
    do(): T
    undo(): void
    serialize(): string
    getShapesId(): Array<number>
    getTimestamp(): Date
}

abstract class CreateShapeAction<S extends Shape> implements Action<S> {
    // saved: boolean = false

    constructor(private doc: SimpleDrawDocument, public readonly shape: S, public readonly timestamp: Date) { }

    do(): S {
        this.doc.add(this.shape)
        return this.shape
    }

    undo() {
        var layers = new Array<Array<Shape>>()
        for (var layer of this.doc.layers) {
            layers.push(layer.filter(o => o !== this.shape))
        }
        this.doc.layers = layers
    }

    getShapesId(): Array<number> {
        return new Array(this.shape.id)
    }

    getTimestamp(): Date {
        return this.timestamp
    }

    abstract serialize(): string

}

export class DeleteShapeAction<S extends Shape> implements Action<S> {
    shapes: Array<Shape> = []
    constructor(private doc: SimpleDrawDocument, public shapeIds: number[], public layer: number, public readonly timestamp: Date) { }

    do(): S {
        for(const s of this.shapeIds){
            if(this.layer > -1)
                for(const shape of this.doc.layers[this.layer]){
                    if(shape.id == s){
                        this.shapes.push(shape)
                        this.doc.delete(shape)
                    }
                }
            else{
                for(const [layerIdx,layer] of this.doc.layers.entries()){
                    for(const shape of layer){
                        if(shape.id == s){
                            this.layer = layerIdx;
                            this.shapes.push(shape)
                            this.doc.delete(shape)
                        }
                    }
                }
            }
        }
        return
    }

    undo(): void {
        for(const s of this.shapes)
            this.doc.layers[this.layer].push(s)
    }

    getShapesId(): Array<number> {
        return Array.from(this.shapeIds)
    }

    getTimestamp(): Date {
        return this.timestamp
    }

    serialize(): string {
        let action = {
            type: 'delete',
            shape: this.shapeIds,
            timestamp: this.timestamp.toISOString(),
            layer: this.layer
        }
        return JSON.stringify(action)
    }
}

export class CreateCircleAction extends CreateShapeAction<Circle> {
    constructor(doc: SimpleDrawDocument, private id: number, private x: number, private y: number, private radius: number, public readonly timestamp: Date) {
        super(doc, new Circle(id, x, y, radius), timestamp)
    }

    serialize(): string {
        let action = {
            type: 'create',
            shape: 'circle',
            id: this.id,
            timestamp: this.timestamp.toISOString(),
            coords: '' + this.x + ' ' + this.y + ' ' + this.radius
        }
        return JSON.stringify(action)
    }
}

export class CreateRectangleAction extends CreateShapeAction<Rectangle> {
    constructor(doc: SimpleDrawDocument, private id: number, private x: number, private y: number, private width: number, private height: number, public readonly timestamp: Date) {
        super(doc, new Rectangle(id, x, y, width, height), timestamp)
    }

    serialize(): string {
        let action = {
            type: 'create',
            shape: 'rectangle',
            id: this.id,
            timestamp: this.timestamp.toISOString(),
            coords: '' + this.x + ' ' + this.y + ' ' + this.width + ' ' + this.height
        }
        return JSON.stringify(action)
    }
}

export class TranslateAction implements Action<void> {
    oldX: number
    oldY: number

    constructor(private doc: SimpleDrawDocument, public shape: Shape, private xd: number, private yd: number, public readonly timestamp: Date) { }

    do(): Shape {
        if (this.shape instanceof AreaSelected) {
            for (const shape of this.shape.selectedShapes) {
                shape.translate(this.xd, this.yd)
            }
        }
        this.oldX = this.shape.x
        this.oldY = this.shape.y
        this.shape.translate(this.xd, this.yd)
        return this.shape
    }

    undo() {
        if (this.shape instanceof AreaSelected) {
            for (const shape of this.shape.selectedShapes) {
                shape.translate(-this.xd, -this.yd)
            }
        }
        this.shape.x = this.oldX
        this.shape.y = this.oldY
    }

    getShapesId(): Array<number> {
        return new Array(this.shape.id)
    }

    getTimestamp(): Date {
        return this.timestamp
    }

    serialize(): string {
        let shapesIds: Array<number> = new Array<number>()
        if (this.shape instanceof AreaSelected)
            for (const s of this.shape.selectedShapes) {
                shapesIds.push(s.id)
            }
        else
            shapesIds.push(this.shape.id)

        let action = {
            type: 'translate',
            shape: shapesIds,
            timestamp: this.timestamp.toISOString(),
            coords: '' + this.xd + ' ' + this.yd
        }
        return JSON.stringify(action)
    }
}