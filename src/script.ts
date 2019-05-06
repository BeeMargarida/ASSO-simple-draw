import { SimpleDrawDocument } from './document'
import { Interpreter } from './interpreter';
import { CanvasRender, SVGRender } from './render';

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
}

function drawAll(){
    for (var render of svgrenderers)
        sdd.draw(render)
    for (var renderc of canvasrenderers)
        sdd.draw(renderc)
}

document.getElementById('new_canvas').addEventListener('click', () => {
    var drawSpace = document.getElementById('draw_space')
    if (drawSpace.children.length == 0) {
        createCanvas(drawSpace.clientWidth*0.95)
    } else if (drawSpace.children.length == 1) {
        console.log(drawSpace.children[0].outerHTML)
        drawSpace.children[0].setAttribute('width', (drawSpace.clientWidth / 2 * 0.9).toString())
        var width = drawSpace.clientWidth*0.95/2
        createCanvas(width)
        if (canvasrenderers.length != 0)
            canvasrenderers[0].centerX = width/2
        else if (svgrenderers.length != 0)
            svgrenderers[0].centerX = width/2
    }
    for (var render of canvasrenderers)
        sdd.draw(render)
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
    for (var render of svgrenderers)
        sdd.draw(render)
})


document.getElementById('new_rect').addEventListener('click', () => {
    sdd.createRectangle(200, 200, 80, 80)
    drawAll();
})

document.getElementById('new_circ').addEventListener('click', () => {
    sdd.createCircle(200, 200, 30)
    drawAll();
})

let consoleOut = document.getElementById('output');
let consoleIn : HTMLInputElement = document.getElementById('input') as HTMLInputElement;
let consoleMinMaxBtn : HTMLInputElement = document.getElementById('minMaxBtn') as HTMLInputElement;
let consoleClearBtn : HTMLInputElement = document.getElementById('clearBtn') as HTMLInputElement;

consoleIn.addEventListener('keydown', (event) => {
    if(event.keyCode == 13){
        consoleOut.innerHTML += consoleIn.value;
        let output = interpreter.execute(consoleIn.value);
        if(output !== "")
            consoleOut.innerHTML += '\n'+output;
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
    if(consoleMinMaxBtn.value === "open"){
        consoleMinMaxBtn.value = "closed";
        consoleStatus = "hidden";
        consoleMinMaxBtnIcon = "fa-window-maximize";
        consoleClearBtnDisabled = true;
    }
    else{
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
