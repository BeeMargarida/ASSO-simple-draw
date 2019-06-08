import { SimpleDrawDocument } from './document'
import { Interpreter } from './interpreter';
import { CanvasRender, SVGRender } from './render';
import axios from 'axios';
import { Shape, AreaSelected } from './shape';

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
        for (var s of sdd.layers[sdd.selectedLayer]) {
            if (s.checkIfHit(mx - rect.left, my - rect.top, render)) {
                s.color = 'red'
                sdd.drawAll()
            } else {
                s.color = 'black'
                sdd.drawAll()
            }
        }
    })
}

var lastX: number = 0
var lastY: number = 0
var areaSelected: boolean = false
var selected: Shape;
function onMouseDown(e: any, render: CanvasRender | SVGRender, object: HTMLCanvasElement | SVGSVGElement) {
    e.preventDefault()
    var rect = e.target.getBoundingClientRect()
    var mx = e.clientX
    var my = e.clientY
    lastX = mx
    lastY = my

    // Check if there is an selected area and if it was clicked
    if (areaSelected) {
        if (selected.checkIfHit(mx - rect.left, my - rect.top, render)) {
            return
        }
        selected = null
        sdd.selectedArea = null
        areaSelected = false
    }

    for (var x of sdd.layers[sdd.selectedLayer])
        x.color = 'black'
    for (var s of sdd.layers[sdd.selectedLayer]) {
        if (s.checkIfHit(mx - rect.left, my - rect.top, render)) {
            s.color = 'red'
            selected = s
            sdd.drawAll()
            break
        } else {
            s.color = 'black'
            selected = null
            sdd.drawAll()
        }
    }
}

function addMouseDownListener(render: CanvasRender | SVGRender, object: HTMLCanvasElement | SVGSVGElement) {
    object.addEventListener('mousedown', (e: any) => onMouseDown(e, render, object))
}

function onMouseUp(e: any, render: CanvasRender | SVGRender) {
    e.preventDefault()
    var rect = e.target.getBoundingClientRect()

    var mx = e.clientX
    var my = e.clientY
    var deltaX = mx - lastX
    var deltaY = my - lastY
    var upperLeftX = ((lastX - rect.left) + deltaX / 2) - Math.abs(deltaX) / 2
    var upperLeftY = ((lastY - rect.top) + deltaY / 2) - Math.abs(deltaY) / 2

    var didMouseMove = (deltaX != 0 && deltaY != 0) ? true : false

    if (selected == null) {
        console.log("ULX: " + upperLeftX + " UPY: " + upperLeftY)
        if (didMouseMove) {
            // Area Selection
            var selectedShapes: Array<Shape> = new Array<Shape>()
            // Get all selected shapes
            for (var x of sdd.layers[sdd.selectedLayer]) {
                if (x.checkIfBetween(upperLeftX, upperLeftY, Math.abs(deltaX), Math.abs(deltaY), render)) {
                    console.log(x)
                    x.color = 'red'
                    selectedShapes.push(x)
                } else {
                    x.color = 'black'
                }
            }

            if (selectedShapes.length != 0) {
                areaSelected = true
                selected = new AreaSelected(sdd.getShapeId(), upperLeftX, upperLeftY, Math.abs(deltaX), Math.abs(deltaY), selectedShapes)
                sdd.selectedArea = selected
                sdd.drawAll()
                return
            }
            areaSelected = false
        }
    }
    else if (didMouseMove) {
        // experimentar onMouseMove com o translate sem action para se conseguir ver o objeto a mover, mas não ser guardado como uma action para undo/redo
        sdd.translate(selected, deltaX / render.zoom, deltaY / render.zoom)
        //selected.translate(mx-rect.left-selected.x-(selected.centerX-selected.x), my-rect.top-selected.y-(selected.centerY-selected.y))

        //selected.color = 'black'
        //selected = null

        sdd.drawAll()
    }
}

function addMouseUpListener(render: CanvasRender | SVGRender, object: HTMLCanvasElement | SVGSVGElement) {
    object.addEventListener('mouseup', (e: any) => onMouseUp(e, render))
}

function createCanvas(width: number) {
    sdd.new()
    var drawSpace = document.getElementById('draw_space')
    var newCanvas = document.createElement('canvas')
    newCanvas.width = width
    newCanvas.height = drawSpace.clientHeight * 0.95
    newCanvas.id = 'canvas'
    newCanvas.style.border = "1px solid red"
    drawSpace.appendChild(newCanvas)
    var render = new CanvasRender(newCanvas)
    sdd.canvasrenderers.push(render)
    addZoomListener(render, newCanvas)
    addMouseDownListener(render, newCanvas)
    addMouseUpListener(render, newCanvas)
    sdd.drawAll()
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
    sdd.drawAll()
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
    sdd.svgrenderers.push(render)
    addZoomListener(render, newSvg)
    addMouseDownListener(render, newSvg)
    addMouseUpListener(render, newSvg)
    sdd.drawAll()
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
    sdd.drawAll()
})


document.getElementById('new_rect').addEventListener('click', () => {
    sdd.createRectangle(200, 200, 80, 80)
    sdd.drawAll()
})

document.getElementById('new_circ').addEventListener('click', () => {
    sdd.createCircle(200, 200, 30)
    sdd.drawAll()
})

document.getElementById('undo').addEventListener('click', () => {
    sdd.undo()
    sdd.drawAll()
})

document.getElementById('redo').addEventListener('click', () => {
    sdd.redo()
    sdd.drawAll()
})


// LAYER
document.getElementById('new_layer').addEventListener('click', () => sdd.addLayer())
document.getElementById('delete_layer').addEventListener('click', () => { sdd.deleteLayer(); sdd.drawAll() })
document.getElementById('previous_layer').addEventListener('click', (evt) => { sdd.previousLayer(evt); sdd.drawAll() })
document.getElementById('next_layer').addEventListener('click', (evt) => { sdd.nextLayer(evt); sdd.drawAll() })


// CONSOLE

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
        sdd.drawAll();
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

// FILE

let newBtn: HTMLInputElement = document.getElementById('newBtn') as HTMLInputElement;
let loadBtn: HTMLInputElement = document.getElementById('loadBtn') as HTMLInputElement;
let saveBtn: HTMLInputElement = document.getElementById('saveBtn') as HTMLInputElement;
let saveAsBtn: HTMLInputElement = document.getElementById('saveAsBtn') as HTMLInputElement;
let modalSaveBtn: HTMLInputElement = document.getElementById('modalSaveBtn') as HTMLInputElement;
let modalCancelBtn: HTMLInputElement = document.getElementById('modalCancelBtn') as HTMLInputElement;
let loadFile: HTMLInputElement = document.getElementById('loadFile') as HTMLInputElement;
let fileNameSelection: HTMLInputElement = document.getElementById('fileNameSelection') as HTMLInputElement;
let extensionSelection: HTMLInputElement = document.getElementById('extensionSelection') as HTMLInputElement;
let saveModal: any = document.getElementById('saveModal');

newBtn.addEventListener('click', () => {
    sdd.new();
    sdd.drawAll();
})

loadBtn.addEventListener('click', () => {
    loadFile.click();
})

loadFile.addEventListener('change', () => {
    sdd.load(loadFile.files[0].name).then(() => {
        modalCancelBtn.click();
        sdd.drawAll();
        sdd.updateDisabledButtons()
    }).catch((err) => window.alert(err));
})

saveBtn.addEventListener('click', () => {
    if (sdd.hasSetWorkingFile())
        sdd.saveWorkingFile();
    else {
        saveAsBtn.click();
    }
})

modalSaveBtn.addEventListener('click', () => {
    const fileName = fileNameSelection.value + "." + extensionSelection.value.toLowerCase();
    sdd.save(fileName).then(() => {
        modalCancelBtn.click();
    }).catch((err) => {
        window.alert(err)
    });
})


// CONNECTION
let collabBtn: HTMLInputElement = document.getElementById('collabBtn') as HTMLInputElement;
collabBtn.addEventListener('click', async () => {
    await axios.post(SimpleDrawDocument.API_HOST + '/api/collab');
    sdd.communicator.start(sdd)
})

let conBtn: HTMLInputElement = document.getElementById('conBtn') as HTMLInputElement;
conBtn.addEventListener('click', async () => {
    sdd.communicator.start(sdd)
})