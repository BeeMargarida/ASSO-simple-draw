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

    constructor(private doc: SimpleDrawDocument, public layer: number, public readonly shape: S, public readonly timestamp: Date) { }

    do(): S {
        this.doc.add(this.shape, this.layer)
        return this.shape
    }

    undo() {
        let layers = new Array<Array<Shape>>()
        for (let layer of this.doc.layers) {
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
    constructor(doc: SimpleDrawDocument, public layer: number, private id: number, private x: number, private y: number, private radius: number, public readonly timestamp: Date) {
        super(doc, layer, new Circle(id, x, y, radius), timestamp)
    }

    serialize(): string {
        let action = {
            type: 'create',
            shape: 'circle',
            layer: this.layer,
            id: this.id,
            timestamp: this.timestamp.toISOString(),
            coords: '' + this.x + ' ' + this.y + ' ' + this.radius
        }
        return JSON.stringify(action)
    }
}

export class CreateRectangleAction extends CreateShapeAction<Rectangle> {
    constructor(doc: SimpleDrawDocument, public layer: number, private id: number, private x: number, private y: number, private width: number, private height: number, public readonly timestamp: Date) {
        super(doc, layer, new Rectangle(id, x, y, width, height), timestamp)
    }

    serialize(): string {
        let action = {
            type: 'create',
            shape: 'rectangle',
            layer: this.layer,
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

export class DeleteLayerAction implements Action<void> {
    layer: Array<Shape>

    constructor(private doc: SimpleDrawDocument, public layerIdx: number, public readonly timestamp: Date) { 
        this.layer = doc.layers[layerIdx]
    }

    do() {
        if (this.doc.layers.length != 1) {
          this.doc.layers.splice(this.layerIdx, 1)
          this.doc.selectedLayer = this.doc.selectedLayer == 0 ? 0 : this.doc.selectedLayer - 1
          this.doc.updateDisabledButtons()
        }
    }

    undo() {
      this.doc.layers.splice(this.layerIdx, 0, this.layer)
      this.doc.updateDisabledButtons()
    }

    getShapesId(): Array<number> {
        return this.layer.map( (s: Shape) => { return s.id })
    }

    getTimestamp(): Date {
        return this.timestamp
    }

    serialize(): string {
        let action = {
            type: 'deleteLayer',
            layerIdx: this.layerIdx,
            shape: this.getShapesId(),
            timestamp: this.timestamp.toISOString()
        }
        return JSON.stringify(action)
    }
}