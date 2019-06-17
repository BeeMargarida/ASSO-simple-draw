import { Shape, Circle, Rectangle, AreaSelected } from './shape'
import { SimpleDrawDocument } from './document'

export interface Action<T> {
    // saved: boolean
    do(): T
    undo(): void
    serialize(): string
}

abstract class CreateShapeAction<S extends Shape> implements Action<S> {
    
    constructor(private doc: SimpleDrawDocument, public layer: number, public readonly shape: S) { }

    do(): S {
        this.doc.add(this.shape, this.layer)
        return this.shape
    }

    undo() {
        var layers = new Array<Array<Shape>>()
        for (var layer of this.doc.layers) {
            layers.push(layer.filter(o => o !== this.shape))
        }
        this.doc.layers = layers
    }

    abstract serialize(): string
}

export class DeleteShapeAction<S extends Shape> implements Action<S> {
    shapes: Array<Shape> = []
    constructor(private doc: SimpleDrawDocument, public shapeIds: number[], public layer: number) { }

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

    serialize(): string {
        let action = {
            type: 'delete',
            shape: this.shapeIds,
            layer: this.layer
        }
        return JSON.stringify(action)
    }
}

export class CreateCircleAction extends CreateShapeAction<Circle> {
    constructor(doc: SimpleDrawDocument, public layer: number, private id: number, private x: number, private y: number, private radius: number) {
        super(doc, layer, new Circle(id, x, y, radius))
    }

    serialize(): string {
        let action = {
            type: 'create',
            shape: 'circle',
            layer: this.layer,
            id: this.id,
            coords: '' + this.x + ' ' + this.y + ' ' + this.radius
        }
        return JSON.stringify(action)
    }
}

export class CreateRectangleAction extends CreateShapeAction<Rectangle> {
    constructor(doc: SimpleDrawDocument, private id: number, public layer: number, private x: number, private y: number, private width: number, private height: number) {
        super(doc, layer, new Rectangle(id, x, y, width, height))
    }

    serialize(): string {
        let action = {
            type: 'create',
            shape: 'rectangle',
            layer: this.layer,
            id: this.id,
            coords: '' + this.x + ' ' + this.y + ' ' + this.width + ' ' + this.height
        }
        return JSON.stringify(action)
    }
}

export class TranslateAction implements Action<void> {
    oldX: number
    oldY: number

    constructor(private doc: SimpleDrawDocument, public shape: Shape, private xd: number, private yd: number) { }

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
            coords: '' + this.xd + ' ' + this.yd
        }
        return JSON.stringify(action)
    }
}