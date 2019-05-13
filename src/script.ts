import { SimpleDrawDocument } from './document'
import { Interpreter } from './interpreter';
import { CanvasRender, SVGRender } from './render';
import { Shape } from 'shape';

var canvasrenderers: CanvasRender[] = []
var svgrenderers: SVGRender[] = []

const sdd = new SimpleDrawDocument()
const interpreter = new Interpreter(sdd);

function addZoomListener(render: CanvasRender | SVGRender, object: HTMLCanvasElement | SVGSVGElement) {
    object.addEventListener('DOMMouseScroll', (evt: any) => {
        evt.preventDefault()
        var delta = evt.wheelDelta ? evt.wheelDelta / 40 : evt.detail ? -evt.detail : 0;
        if (delta) { render.applyZoom(delta); sdd.draw(render) }
    }, false)
    object.addEventListener('mousewheel', (evt: any) => {
        evt.preventDefault()
        var delta = evt.wheelDelta ? evt.wheelDelta / 40 : evt.detail ? -evt.detail : 0;
        if (delta) { render.applyZoom(delta); sdd.draw(render) }
    }, false)
}

function addMouseClickListener(render: CanvasRender | SVGRender, object: HTMLCanvasElement | SVGSVGElement) {
    object.addEventListener('click', (e: any) => {
        e.preventDefault()
        var mx = e.clientX
        var my = e.clientY
        var rect = e.target.getBoundingClientRect()
        for (var s of sdd.objects) {
            if (s.checkIfHit(mx - rect.left, my - rect.top, render)) {
                s.color = 'red'
                drawAll()
            } else {
                s.color = 'black'
                drawAll()
            }
        }
    })
}

var lastX: number = 0
var lastY: number = 0
var selected: Shape;
function onMouseDown(e: any, render: CanvasRender | SVGRender, object: HTMLCanvasElement | SVGSVGElement) {
    e.preventDefault()
    console.log(e)
    var mx = e.clientX
    var my = e.clientY
    lastX = mx
    lastY = my
    var rect = e.target.getBoundingClientRect()
    for (var x of sdd.objects)
        x.color = 'black'
    for (var s of sdd.objects) {
        if (s.checkIfHit(mx - rect.left, my - rect.top, render)) {
            s.color = 'red'
            selected = s
            drawAll()
            break
        } else {
            s.color = 'black'
            selected = null
            drawAll()
        }
    }
}

function addMouseDownListener(render: CanvasRender | SVGRender, object: HTMLCanvasElement | SVGSVGElement) {
    object.addEventListener('mousedown', (e: any) => onMouseDown(e, render, object))
}

function onMouseUp(e: any, render: CanvasRender | SVGRender) {
    e.preventDefault()
    if(selected == null)
        return
    var rect = e.target.getBoundingClientRect()
    var mx = e.clientX
    var my = e.clientY
    var didMouseMove = (mx != lastX && my != lastY) ? true : false
    if (didMouseMove) {
        console.log("Selected: " + selected)
        // experimentar onMouseMove com o translate sem action para se conseguir ver o objeto a mover, mas não ser guardado como uma action para undo/redo
        sdd.translate(selected, mx - rect.left - selected.x - (selected.centerX - selected.x), my - rect.top - selected.y - (selected.centerY - selected.y))
        //selected.translate(mx-rect.left-selected.x-(selected.centerX-selected.x), my-rect.top-selected.y-(selected.centerY-selected.y))
        selected.color = 'black'
        selected = null
        drawAll()
    }
}

function addMouseUpListener(render: CanvasRender | SVGRender, object: HTMLCanvasElement | SVGSVGElement) {
    object.addEventListener('mouseup', (e: any) => onMouseUp(e, render))
}

function createCanvas(width: number) {
    var drawSpace = document.getElementById('draw_space')
    var newCanvas = document.createElement('canvas')
    newCanvas.width = width
    newCanvas.height = drawSpace.clientHeight * 0.95
    newCanvas.id = 'canvas'
    newCanvas.style.border = "1px solid red"
    drawSpace.appendChild(newCanvas)
    var render = new CanvasRender(newCanvas)
    canvasrenderers.push(render)
    addZoomListener(render, newCanvas)
    addMouseDownListener(render, newCanvas)
    addMouseUpListener(render, newCanvas)
    drawAll()
}

function drawAll() {
    for (var render of svgrenderers)
        sdd.draw(render)
    for (var renderc of canvasrenderers)
        sdd.draw(renderc)
}

document.getElementById('new_canvas').addEventListener('click', () => {
    var drawSpace = document.getElementById('draw_space')
    if (drawSpace.children.length == 0) {
        createCanvas(drawSpace.clientWidth * 0.95)
    } else if (drawSpace.children.length == 1) {
        drawSpace.children[0].setAttribute('width', (drawSpace.clientWidth / 2 * 0.9).toString())
        var width = drawSpace.clientWidth * 0.95 / 2
        createCanvas(width)
        if (canvasrenderers.length != 0)
            canvasrenderers[0].centerX = width / 2
        else if (svgrenderers.length != 0)
            svgrenderers[0].centerX = width / 2
    }
    drawAll()
})

function createSVG(width: number) {
    var drawSpace = document.getElementById('draw_space')
    var newSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg")
    newSvg.setAttribute('width', (width).toString())
    newSvg.setAttribute('height', (drawSpace.clientHeight * 0.95).toString())
    newSvg.style.verticalAlign = 'top'
    newSvg.setAttribute('version', '1.1')
    newSvg.id = 'svgcanvas'
    newSvg.setAttributeNS("http://www.w3.org/2000/xmlns/", "xmlns:xlink", "http://www.w3.org/1999/xlink")
    newSvg.style.border = "1px solid blue"
    drawSpace.appendChild(newSvg)
    var render = new SVGRender(newSvg)
    svgrenderers.push(render)
    addZoomListener(render, newSvg)
    addMouseDownListener(render, newSvg)
    addMouseUpListener(render, newSvg)
    drawAll()
}

document.getElementById('new_svg').addEventListener('click', () => {
    var drawSpace = document.getElementById('draw_space')
    if (drawSpace.children.length == 0) {
        createSVG(drawSpace.clientWidth * 0.95)
    } else if (drawSpace.children.length == 1) {
        drawSpace.children[0].setAttribute('width', (drawSpace.clientWidth / 2 * 0.9).toString())
        var width = drawSpace.clientWidth / 2 * 0.95
        createSVG(width)
        if (canvasrenderers.length != 0)
            canvasrenderers[0].centerX = width / 2
        else if (svgrenderers.length != 0)
            svgrenderers[0].centerX = width / 2
    }
    drawAll()
})


document.getElementById('new_rect').addEventListener('click', () => {
    sdd.createRectangle(200, 200, 80, 80)
    drawAll()
})

document.getElementById('new_circ').addEventListener('click', () => {
    sdd.createCircle(200, 200, 30)
    drawAll()
})

document.getElementById('undo').addEventListener('click', () => {
    sdd.undo()
    drawAll()
})

document.getElementById('redo').addEventListener('click', () => {
    sdd.redo()
    drawAll()
})

let consoleOut = document.getElementById('output');
let consoleIn: HTMLInputElement = document.getElementById('input') as HTMLInputElement;
let consoleMinMaxBtn: HTMLInputElement = document.getElementById('minMaxBtn') as HTMLInputElement;
let consoleClearBtn: HTMLInputElement = document.getElementById('clearBtn') as HTMLInputElement;

consoleIn.addEventListener('keydown', (event) => {
    if (event.keyCode == 13) {
        consoleOut.innerHTML += consoleIn.value;
        let output = interpreter.execute(consoleIn.value);
        if (output !== "")
            consoleOut.innerHTML += '\n' + output;
        consoleOut.innerHTML += '\n>> ';
        consoleOut.scrollTop = consoleOut.scrollHeight;
        consoleIn.value = "";
        drawAll();
    }
});

consoleClearBtn.addEventListener('click', () => {
    consoleOut.innerHTML = ">> ";
});

consoleMinMaxBtn.addEventListener('click', () => {
    let consoleStatus, consoleMinMaxBtnIcon, consoleClearBtnDisabled;
    if (consoleMinMaxBtn.value === "open") {
        consoleMinMaxBtn.value = "closed";
        consoleStatus = "hidden";
        consoleMinMaxBtnIcon = "fa-window-maximize";
        consoleClearBtnDisabled = true;
    }
    else {
        consoleMinMaxBtn.value = "open";
        consoleStatus = "visible";
        consoleMinMaxBtnIcon = "fa-window-minimize";
        consoleClearBtnDisabled = false;
    }
    consoleOut.style.visibility = consoleStatus;
    consoleIn.style.visibility = consoleStatus;
    consoleClearBtn.disabled = consoleClearBtnDisabled;

    let icon = consoleMinMaxBtn.children[0];
    icon.classList.remove(icon.classList[1]);
    icon.classList.add(consoleMinMaxBtnIcon);
});