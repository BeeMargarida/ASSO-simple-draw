import { Shape, AreaSelected } from './shape'
import { Action, CreateCircleAction, CreateRectangleAction, TranslateAction } from './actions'
import { Render, CanvasRender, SVGRender } from './render';
import { FileManager, FileManagerFactory } from './file-manager';
import { UndoManager } from "./undo";
import axios from 'axios';
import { deflateRaw } from 'zlib';
import { Communicator } from './communication';

export class SimpleDrawDocument {
  static API_HOST = 'http://localhost:3000';

  //objects = new Array<Shape>()
  canvasrenderers: CanvasRender[] = []
  svgrenderers: SVGRender[] = []
  layers = new Array<Array<Shape>>()
  selectedLayer = 0
  undoManager = new UndoManager()
  selectedArea: Shape = null
  workingFilePath: string = null
  communicator: Communicator = new Communicator()
  currentId: number

  constructor() {
    this.currentId = 0;
    //this.communicator.start(this)
  }

  public getShapeId() {
    return this.currentId++
  }

  undo() {
    this.undoManager.undo();
  }

  redo() {
    this.undoManager.redo();
  }

  drawAll() {
    for (var render of this.svgrenderers)
      this.draw(render)
    for (var renderc of this.canvasrenderers)
      this.draw(renderc)
  }

  draw(render: Render): void {
    var objs = new Array<Shape>()
    this.layers.forEach((objects, idx) => {
      if (objects.length != 0 || idx == this.selectedLayer)
        objs.push(...objects)
    });
    objs.push(...this.layers[this.selectedLayer])

    if (this.selectedArea !== null) objs.push(this.selectedArea)

    render.draw(...objs)
  }

  add(r: Shape): void {
    this.layers[this.selectedLayer].push(r)
  }

  do<T>(a: Action<T>): T {
    console.log(a)
    console.log(this.layers[0].length)
    this.undoManager.onActionDone(a);
    return a.do();
  }

  createRectangle(x: number, y: number, width: number, height: number): Shape {
    const action = new CreateRectangleAction(this, this.getShapeId(), x, y, width, height)
    console.log(action)
    this.communicator.send(action.serialize())
    return this.do(action)
  }

  createCircle(x: number, y: number, radius: number): Shape {
    const action = new CreateCircleAction(this, this.getShapeId(), x, y, radius)
    this.communicator.send(action.serialize())
    return this.do(action)
  }

  translate(s: Shape, xd: number, yd: number): void {
    const action = new TranslateAction(this, s, xd, yd)
    console.log(action)
    this.communicator.send(action.serialize())
    return this.do(action)
  }

  translateById(shapeId: number, xd: number, yd: number): void {
    for (const l of this.layers)
      for (const s of l)
        if (s.id === shapeId)
          this.translate(s, xd, yd)
  }

  new(): void {
    this.layers.length = 0
    this.selectedLayer = 0
    this.layers.push(new Array<Shape>())
    this.undoManager.clear();
    this.selectedArea = null;
    this.workingFilePath = null;
  }

  addLayer(): void {
    this.layers.push(new Array<Shape>())
    this.updateDisabledButtons()
  }

  deleteLayer(): void {
    if (this.layers.length != 1) {
      this.layers.splice(this.selectedLayer, 1)
      this.selectedLayer = this.selectedLayer == 0 ? 0 : this.selectedLayer - 1
      this.updateDisabledButtons()
    }
  }

  updateDisabledButtons(): void {
    if (this.selectedLayer >= this.layers.length - 1) {
      document.getElementById("next_layer").classList.add("disabled")
    }
    else {
      document.getElementById("next_layer").classList.remove("disabled")
    }
    if (this.selectedLayer == 0) {
      document.getElementById("previous_layer").classList.add("disabled")
    }
    else {
      document.getElementById("previous_layer").classList.remove("disabled")
    }
    document.getElementById("layer_id").textContent = this.selectedLayer.toString()
  }

  nextLayer(evt: Event): void {
    this.selectedLayer = this.selectedLayer >= (this.layers.length - 1) ? this.selectedLayer : this.selectedLayer + 1
    this.updateDisabledButtons()
  }

  previousLayer(evt: Event): void {
    this.selectedLayer = this.selectedLayer == 0 ? this.selectedLayer : this.selectedLayer - 1
    this.updateDisabledButtons()
  }

  hasSetWorkingFile(): boolean {
    return this.workingFilePath !== null;
  }

  async saveWorkingFile(): Promise<void> {
    return this.save(this.workingFilePath);
  }

  async save(fileName: string): Promise<void> {
    const fileManager = FileManagerFactory.getFileManager(fileName);

    let data;
    if (fileManager != null) {
      //data = fileManager.save(this.objects, fileName);
      data = fileManager.save(this.layers, fileName) // TODO: change to save all layers!
    }
    else
      throw 'Unsupported file extension';

    const res = await axios.post(SimpleDrawDocument.API_HOST + '/api/files/save', {
      path: fileName,
      data: data
    });

    if (res.status != 200)
      throw 'Unable to save file';

    this.workingFilePath = fileName;

    return;
  }

  async load(fileName: string): Promise<void> {
    const res = await axios.post(SimpleDrawDocument.API_HOST + '/api/files/load', {
      path: fileName,
    })

    const fileManager = FileManagerFactory.getFileManager(fileName);
    this.layers = fileManager.load(res.data.content);
    this.workingFilePath = fileName;
  }

  receiveAction(action: string) {
    console.log(action)
    const a = JSON.parse(action)
    const type = a.type
    const shape = a.shape
    const id = a.id
    const coords = a.coords.split(' ')
    console.log(a)
    if (type === 'create') {
      this.currentId = id
      if (shape === 'circle') {
        this.do(new CreateCircleAction(this, id, parseInt(coords[0], 10), parseInt(coords[1], 10), parseInt(coords[2], 10)))
        this.drawAll()
      } else if (shape === 'rectangle') {
        this.do(new CreateRectangleAction(this, id, parseInt(coords[0], 10), parseInt(coords[1], 10), parseInt(coords[2], 10), parseInt(coords[3], 10)))
        this.drawAll()
      }
    } else if (type === 'translate') {
      for (const shapeId of shape) {
        for (const l of this.layers)
          for (const s of l)
            if (s.id === shapeId) {
              this.do(new TranslateAction(this, s, parseInt(coords[0], 10), parseInt(coords[1], 10)))
              this.drawAll()
            }
      }
    }
  }
}