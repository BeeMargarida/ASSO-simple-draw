
export abstract class Shape {
    constructor(public x: number, public y: number) { }

    translate(xd: number, yd: number): void {
        this.x += xd
        this.y += yd
    }
}

export class Rectangle extends Shape {
    centerX: number
    centerY: number
    constructor(public x: number, public y: number, public width: number, public height: number) {
        super(x, y)
        this.centerX = x + width/2
        this.centerY = y + height/2
    }
}

export class Circle extends Shape {
    constructor(public x: number, public y: number, public radius: number) {
        super(x, y)
    }
}