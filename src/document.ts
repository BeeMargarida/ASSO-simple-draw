import { Shape } from './shape'
import { Action, CreateCircleAction, CreateRectangleAction, TranslateAction } from './actions'
import { Render } from './render';

export class SimpleDrawDocument {
    objects = new Array<Shape>()
    doStack = new Array<Action<any>>()
    undoStack = new Array<Action<any>>()

    undo() {
        if (this.doStack.length > 0) {
            const a1 = this.doStack.pop()
            a1.undo()
            this.undoStack.push(a1)
        }
    }

    redo() {
        if (this.undoStack.length > 0) {
            const a1 = this.undoStack.pop()
            a1.do()
            this.doStack.push(a1)
        }
    }

    draw(render: Render): void {
        // this.objects.forEach(o => o.draw(ctx))
        render.draw(...this.objects)
    }

    add(r: Shape): void {
        this.objects.push(r)
    }

    do<T>(a: Action<T>): T {
        this.doStack.push(a)
        this.undoStack.length = 0
        return a.do()
    }

    createRectangle(x: number, y: number, width: number, height: number): Shape {
        return this.do(new CreateRectangleAction(this, x, y, width, height))
    }

    createCircle(x: number, y: number, radius: number): Shape {
        return this.do(new CreateCircleAction(this, x, y, radius))
    }

    translate(s: Shape, xd: number, yd: number): void {
        return this.do(new TranslateAction(this, s, xd, yd))
    }
}