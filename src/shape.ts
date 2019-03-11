
export abstract class Shape {
    constructor(public x: number, public y: number) { }

    abstract draw(ctx: CanvasRenderingContext2D): void

    translate(xd: number, yd: number): void {
        this.x += xd
        this.y += yd
    }
}

export class Rectangle extends Shape {
    constructor(public x: number, public y: number, public width: number, public height: number) {
        super(x, y)
    }

    draw(ctx: CanvasRenderingContext2D): void {
        ctx.strokeRect(this.x, this.y, this.width, this.height)
    }
}

export class Circle extends Shape {
    constructor(public x: number, public y: number, public radius: number) {
        super(x, y)
    }

    draw(ctx: CanvasRenderingContext2D): void {
        ctx.ellipse(this.x, this.y, this.radius, this.radius, 0, 0, 2 * Math.PI)
        ctx.stroke()
    }
}