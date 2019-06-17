import { Shape, AreaSelected, Rectangle, Circle } from './shape'
import { Action, CreateCircleAction, CreateRectangleAction, TranslateAction, DeleteShapeAction } from './actions'
import { Render, CanvasRender, SVGRender } from './render';
import { FileManagerFactory } from './file-manager';
import { UndoManager } from "./undo";
import { checkOverlap } from "./utils";
import axios from 'axios';
import { CommunicationManager } from './communication';

export class SimpleDrawDocument {
  static API_HOST = 'http://localhost:3000';

  canvasrenderers: CanvasRender[] = []
  svgrenderers: SVGRender[] = []
  layers = new Array<Array<Shape>>()
  selectedLayer = 0
  undoManager = new UndoManager()
  selectedArea: Shape = null
  workingFilePath: string = null
  communicationManager: CommunicationManager = new CommunicationManager(this)
  currentId: number
  upToDate: boolean = false; //True if model is saved

  constructor() {
    this.layers.push(new Array<Shape>())
    this.currentId = 0;
  }

  public getShapeId() {
    return this.currentId++
  }

  undo() {
    if (this.undoManager.doStack.length > 0)
      this.communicationManager.send(JSON.stringify({ type: 'undo' }))
    this.undoManager.undo();
  }

  redo() {
    if (this.undoManager.undoStack.length > 0)
      this.communicationManager.send(JSON.stringify({ type: 'redo' }))
    this.undoManager.redo();
  }

  drawAll() {
    for (var render of this.svgrenderers)
      this.draw(render)
    for (var renderc of this.canvasrenderers)
      this.draw(renderc)
  }

  draw(render: Render): void {
    if (this.layers.length == 0)
      this.layers.push(new Array<Shape>())

    var objs = new Array<Shape>()
    this.layers.forEach((objects, idx) => {
      if (objects.length != 0 && idx != this.selectedLayer)
        objs.push(...objects)
    });
    objs.push(...this.layers[this.selectedLayer])

    if (this.selectedArea !== null) objs.push(this.selectedArea)

    render.draw(...objs)
  }

  add(s: Shape, layer: number): void {

    // Check if layer exists otherwise create
    const maxLayerIdx = this.layers.length;
    let i = maxLayerIdx;
    for(i; i <= layer; i++){
      this.layers.push(new Array<Shape>())
    }

    if(i != maxLayerIdx)
      this.updateDisabledButtons()

    this.layers[layer].push(s)
  }

  do<T>(a: Action<T>): T {
    this.undoManager.onActionDone(a);
    this.upToDate = false;
    return a.do();
  }

  deleteShape(selected: Shape): Shape {
    let action
    if (selected instanceof AreaSelected) {
      let ids = []
      for (const s of selected.selectedShapes)
        ids.push(s.id)
      action = new DeleteShapeAction(this, ids, this.selectedLayer, new Date())
    }
    else
      action = new DeleteShapeAction(this, [selected.id], this.selectedLayer, new Date())
    this.communicationManager.send(action.serialize())
    return this.do(action)
  }

  deleteById(id: number) {
    const action = new DeleteShapeAction(this, [id], -1, new Date())
    this.communicationManager.send(action.serialize())
    return this.do(action)
  }

  delete(selected: Shape): void {
    for (const l of this.layers)
      for (let s = 0; s < l.length; s++)
        if (l[s].id == selected.id) {
          l.splice(s, 1)
          break
        }
  }

  createRectangle(x: number, y: number, width: number, height: number): Shape {
    const action = new CreateRectangleAction(this, this.selectedLayer, this.getShapeId(), x, y, width, height, new Date())
    this.communicationManager.send(action.serialize())
    return this.do(action)
  }

  createCircle(x: number, y: number, radius: number): Shape {
    const action = new CreateCircleAction(this, this.selectedLayer, this.getShapeId(), x, y, radius, new Date())
    this.communicationManager.send(action.serialize())
    return this.do(action)
  }

  translate(s: Shape, xd: number, yd: number): Shape {
    const action = new TranslateAction(this, s, xd, yd, new Date())
    this.communicationManager.send(action.serialize())
    return this.do(action)
  }

  translateScene(xd: number, yd: number): void {
    this.layers.forEach((objects) => {
      objects.forEach(shape => {
        const action = new TranslateAction(this, shape, xd, yd, new Date())
        this.communicationManager.send(action.serialize())
        this.do(action)
      });
    });

    return;
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
    this.upToDate = false;
  }

  safeNew(): any {
    let res: any = {}
    res.safe = true
    if (this.communicationManager.isActive()) {
      res.safe = false
      res.msg = "Connection to peers will be closed."
    }
    else if (!this.upToDate) {
      res.safe = false
      res.msg = "Unsaved changes will be discarded."
    }
    else {
      res.msg = ""
    }
    return res
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

  nextLayer(): void {
    this.selectedLayer = this.selectedLayer >= (this.layers.length - 1) ? this.selectedLayer : this.selectedLayer + 1
    this.updateDisabledButtons()
  }

  previousLayer(): void {
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
    this.upToDate = true;

    return;
  }

  async load(fileName: string): Promise<void> {
    const res = await axios.post(SimpleDrawDocument.API_HOST + '/api/files/load', {
      path: fileName,
    })

    const fileManager = FileManagerFactory.getFileManager(fileName);
    this.layers = fileManager.load(res.data.content);
    this.workingFilePath = fileName;
    this.upToDate = true;
  }

  receiveState(action: string) {
    const layers = JSON.parse(action).layers

    // Clear internal state
    this.layers.length = 0
    this.layers.push(new Array<Shape>())

    let newLayer = false;
    let layerIdx = 0;
    for (const layer of layers) {
      if(newLayer)
        this.addLayer()
      
      for (const shape of layer) {
        const type = shape.split(' ')[0]
        const id = parseInt(shape.split(' ')[1])
        const x = parseInt(shape.split(' ')[2])
        const y = parseInt(shape.split(' ')[3])
        if (type === 'Rectangle')
          this.add(new Rectangle(id, x, y, parseInt(shape.split(' ')[4]), parseInt(shape.split(' ')[5])), layerIdx)
        else if (type === 'Circle')
          this.add(new Circle(id, x, y, parseInt(shape.split(' ')[4])), layerIdx)
        this.currentId = id
      }
      if (!newLayer)
        newLayer = true;
      layerIdx++;
    }
    this.currentId++
  }

  receiveAction(action: string) {
    const a = JSON.parse(action)
    const type = a.type
    const shape = a.shape

    const lastAction = this.undoManager.doStack[this.undoManager.doStack.length - 1]

    if (type === 'create') {

      if (lastAction !== undefined) {
        const lastActionShapesId = lastAction.getShapesId()
        // If the received action has conflict with a new action made by the user
        if (lastActionShapesId.indexOf(shape.id) == -1 && new Date(a.timestamp) < lastAction.getTimestamp()) {
          return
        }
      }

      const id = a.id
      const layerId = a.layer
      const coords = a.coords.split(' ')
      this.currentId = id
      if (shape === 'circle') {
        const act = new CreateCircleAction(this, layerId, this.getShapeId(), parseInt(coords[0], 10), parseInt(coords[1], 10), parseInt(coords[2], 10), new Date())
        this.do(act)
      } else if (shape === 'rectangle') {
        const act = new CreateRectangleAction(this, layerId, this.getShapeId(), parseInt(coords[0], 10), parseInt(coords[1], 10), parseInt(coords[2], 10), parseInt(coords[3], 10), new Date())
        this.do(act)
      }
    } else if (type === 'translate') {

      if (lastAction !== undefined && shape.length !== 0) {
        const lastActionShapesId = lastAction.getShapesId()
        if (checkOverlap(Array.from(shape), lastActionShapesId) && new Date(a.timestamp) < lastAction.getTimestamp()) {
          return
        }
      }

      let shapes: Array<Shape> = new Array<Shape>()
      const coords = a.coords.split(' ')
      for (const shapeId of shape) {
        for (const l of this.layers)
          for (const s of l)
            if (s.id === shapeId) {
              shapes.push(s)
            }
      }

      let act: any
      if (shapes.length === 1)
        act = new TranslateAction(this, shapes[0], parseInt(coords[0], 10), parseInt(coords[1], 10), new Date())
      else if (shapes.length === 0)
        return
      else if (shapes.length > 1) {
        const sel = new AreaSelected(this.currentId, 0, 0, 0, 0, shapes)
        act = new TranslateAction(this, sel, parseInt(coords[0], 10), parseInt(coords[1], 10), new Date())
      }
      this.do(act)
    } else if (type === 'delete') {
      const layer = a.layer
      const act = new DeleteShapeAction(this, shape, layer, new Date())
      this.do(act)
    } else if (type === 'undo') {
      if (this.undoManager.doStack.length > 0)
        this.undoManager.undo();
    } else if (type === 'redo') {
      if (this.undoManager.undoStack.length > 0)
        this.undoManager.redo();
    } else if (type === 'state') {
      this.receiveState(action)
    } else if (type === 'incrementId') {
      this.currentId = a.id
    }
    this.drawAll()
  }
}