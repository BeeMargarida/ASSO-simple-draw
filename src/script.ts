import { SimpleDrawDocument } from './document'
import { Interpreter } from './interpreter';
import { CanvasRender, SVGRender } from './render';
import { Shape, AreaSelected } from './shape';
import { ColorCanvasRender, WireframeCanvasRender, ColorSVGRender, WireframeSVGRender } from './styles';
import { UndoManager } from './undo';

var canvasrenderers: CanvasRender[] = []
var svgrenderers: SVGRender[] = []

const sdd = new SimpleDrawDocument()
const interpreter = new Interpreter(sdd);

var selectedLabel = document.getElementById('selected')

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
var lastRightX: number = 0
var lastRightY: number = 0
var areaSelected: boolean = false
var selected: Shape;
function onMouseDown(e: any, render: CanvasRender | SVGRender, object: HTMLCanvasElement | SVGSVGElement) {
    e.preventDefault()
    e.stopPropagation()
    switch (e.which) {
        case 1:
            onMouseDownLeft(e, render, object)
            break;
        case 3:
            onMouseDownRight(e, render, object)
            break;
    }
}

function onMouseDownLeft(e: any, render: CanvasRender | SVGRender, object: HTMLCanvasElement | SVGSVGElement) {
    var rect = object.getBoundingClientRect()
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
        selectedLabel.innerHTML = 'none'
        sdd.selectedArea = null
        areaSelected = false
    }

    for (var x of sdd.layers[sdd.selectedLayer])
        x.color = 'black'
    for (var s of sdd.layers[sdd.selectedLayer]) {
        if (s.checkIfHit(mx - rect.left, my - rect.top, render)) {
            s.color = 'red'
            selected = s
            selectedLabel.innerHTML = '' + s.id
            sdd.drawAll()
            break
        } else {
            s.color = 'black'
            selected = null
            selectedLabel.innerHTML = 'none'
            sdd.drawAll()
        }
    }
}

function onMouseDownRight(e: any, render: CanvasRender | SVGRender, object: HTMLCanvasElement | SVGSVGElement) {
    var rect = e.target.getBoundingClientRect()
    var mx = e.clientX
    var my = e.clientY
    lastRightX = mx
    lastRightY = my
}

function addMouseDownListener(render: CanvasRender | SVGRender, object: HTMLCanvasElement | SVGSVGElement) {
    object.addEventListener('mousedown', (e: any) => onMouseDown(e, render, object))
}

function onMouseUp(e: any, render: CanvasRender | SVGRender) {
    e.preventDefault()
    switch (e.which) {
        case 1:
            onMouseUpLeft(e, render)
            break;
        case 3:
            onMouseUpRight(e, render)
            break;
    }

}

function onMouseUpLeft(e: any, render: CanvasRender | SVGRender) {
    var rect = e.target.getBoundingClientRect()
    var mx = e.clientX
    var my = e.clientY
    var deltaX = mx - lastX
    var deltaY = my - lastY
    var upperLeftX = (lastX < mx) ? (lastX - rect.left) : (mx - rect.left)
    var upperLeftY = (lastY < my) ? (lastY - rect.top) : (my - rect.top)

    var didMouseMove = (deltaX != 0 && deltaY != 0) ? true : false

    if (selected == null) {
        if (didMouseMove) {
            // Area Selection
            var upperLeftX = ((lastX - rect.left) + (deltaX) / 2) - Math.abs(deltaX) / 2
            var upperLeftY = ((lastY - rect.top) + (deltaY) / 2) - Math.abs(deltaY) / 2

            var selectedShapes: Array<Shape> = new Array<Shape>()
            // Get all selected shapes
            for (var x of sdd.layers[sdd.selectedLayer]) {
                if (x.checkIfBetween(upperLeftX, upperLeftY, Math.abs(deltaX), Math.abs(deltaY), render)) {
                    x.color = 'red'
                    selectedShapes.push(x)
                } else {
                    x.color = 'black'
                }
            }

            if (selectedShapes.length != 0) {
                areaSelected = true
                upperLeftX = (upperLeftX - render.centerX) / render.zoom + render.originalCenterX
                upperLeftY = (upperLeftY - render.centerY) / render.zoom + render.originalCenterY
                selected = new AreaSelected(sdd.getShapeId(), upperLeftX, upperLeftY, Math.abs(deltaX / render.zoom), Math.abs(deltaY / render.zoom), selectedShapes)
                selectedLabel.innerHTML = '' + selected.id
                sdd.selectedArea = selected
                sdd.drawAll()
                return
            }
            areaSelected = false
            selectedLabel.innerHTML = 'none'
        }
    }
    else if (didMouseMove) {
        sdd.translate(selected, deltaX / render.zoom, deltaY / render.zoom)

        sdd.drawAll()
    }
}

function onMouseUpRight(e: any, render: CanvasRender | SVGRender) {
    var rect = e.target.getBoundingClientRect()

    var mx = e.clientX
    var my = e.clientY
    var deltaX = mx - lastRightX
    var deltaY = my - lastRightY

    render.translateScene(deltaX, deltaY)
    sdd.drawAll()
}

function addMouseUpListener(render: CanvasRender | SVGRender, object: HTMLCanvasElement | SVGSVGElement) {
    object.addEventListener('mouseup', (e: any) => onMouseUp(e, render))
}

function createCanvas(width: number) {
    var drawSpace = document.getElementById('draw_space')
    var drawSpaceList = document.getElementById("draw-list-canvas")
    var newCanvas = document.createElement('canvas')
    newCanvas.width = width
    newCanvas.height = drawSpace.clientHeight * 0.95
    newCanvas.id = `canvas-${sdd.canvasrenderers.length}`
    newCanvas.style.border = "1px solid red"
    drawSpace.appendChild(newCanvas)

    let currentId = sdd.canvasrenderers.length
    var newItemDiv = document.createElement("div")
    newItemDiv.style.margin = "5px 0 5px 10px"
    var newItem = document.createElement("span")
    newItem.innerText = `Canvas ${currentId}`
    var canvasButton = document.createElement("button")
    canvasButton.innerText = "Color"
    canvasButton.id = `button-canvas-${currentId}`
    canvasButton.className = "btn btn-info ml-2"
    canvasButton.style.display = "inline"
    canvasButton.addEventListener('click', (e) => activateColorCanvas(e, currentId))
    newItemDiv.appendChild(newItem)
    newItemDiv.appendChild(canvasButton)
    drawSpaceList.appendChild(newItemDiv)

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
    var drawSpaceList = document.getElementById("draw-list-svg")
    var newSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg")
    newSvg.setAttribute('width', (width).toString())
    newSvg.setAttribute('height', (drawSpace.clientHeight * 0.95).toString())
    newSvg.style.verticalAlign = 'top'
    newSvg.setAttribute('version', '1.1')
    newSvg.id = `svgcanvas-${sdd.svgrenderers.length}`
    newSvg.setAttributeNS("http://www.w3.org/2000/xmlns/", "xmlns:xlink", "http://www.w3.org/1999/xlink")
    newSvg.style.border = "1px solid blue"
    drawSpace.appendChild(newSvg)

    let currentId = sdd.svgrenderers.length
    var newItemDiv = document.createElement("div")
    newItemDiv.style.margin = "5px 0 5px 10px"
    var newItem = document.createElement("span")
    newItem.innerText = `SVG ${currentId}`
    var svgButton = document.createElement("button")
    svgButton.innerText = "Color"
    svgButton.id = `button-svg-${currentId}`
    svgButton.className = "btn btn-info ml-2"
    svgButton.style.display = "inline"
    svgButton.addEventListener('click', (e) => activateColorSVG(e, currentId))
    newItemDiv.appendChild(newItem)
    newItemDiv.appendChild(svgButton)
    drawSpaceList.appendChild(newItemDiv)

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

document.getElementById('delete_shape').addEventListener('click', () => {
    if (selected) {
        sdd.deleteShape(selected)
        selected = null
        selectedLabel.innerHTML = 'none'
        sdd.selectedArea = null
        areaSelected = false
    }

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


// VIEW STYLES
function activateColorCanvas(evt: Event, id: number): void {
    evt.preventDefault()
    let button = document.getElementById(`button-canvas-${id}`)
    let canvas = document.getElementById(`canvas-${id}`)
    if (button == null || canvas == null) {
        console.log("Canvas or Button not found")
        return
    }
    if (button.innerText == "Color") {
        // Activate Color Style
        button.innerText = "Stroke"
        sdd.canvasrenderers[id].setStyle(new ColorCanvasRender())
    }
    else {
        button.innerText = "Color"
        sdd.canvasrenderers[id].setStyle(new WireframeCanvasRender())
    }
    sdd.drawAll()
}

function activateColorSVG(evt: Event, id: number): void {
    evt.preventDefault()
    let button = document.getElementById(`button-svg-${id}`)
    let svg = document.getElementById(`svgcanvas-${id}`)
    if (button == null || svg == null) {
        console.log("Canvas or Button not found")
        return
    }
    if (button.innerText == "Color") {
        // Activate Color Style
        button.innerText = "Stroke"
        sdd.svgrenderers[id].setStyle(new ColorSVGRender())
    }
    else {
        button.innerText = "Color"
        sdd.svgrenderers[id].setStyle(new WireframeSVGRender())
    }
    sdd.drawAll()
}



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
    sdd.communicator.start(true, sdd)
})

let conBtn: HTMLInputElement = document.getElementById('conBtn') as HTMLInputElement;
conBtn.addEventListener('click', () => {
    var peer: string = window.prompt('Enter peer id:')
    if (!sdd.communicator.running) {
        sdd.communicator.start(false, sdd)
        sdd.communicator.peer.signal(peer)
    } else {
        sdd.communicator.peer.signal(peer)
        setTimeout(() => {
            if (sdd.communicator.running){
                sdd.communicator.sendState()
                sdd.undoManager = new UndoManager()
            }
        }, 2000)
    }
})