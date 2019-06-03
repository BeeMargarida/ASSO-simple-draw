import { Shape } from './shape'
import { Action, CreateCircleAction, CreateRectangleAction, TranslateAction } from './actions'
import { Render } from './render';
import { FileManager, FileManagerFactory } from './file-manager';
import { UndoManager } from "./undo";
import axios from 'axios';
import { deflateRaw } from 'zlib';

export class SimpleDrawDocument {
  static API_HOST = 'http://localhost:3000';

  //objects = new Array<Shape>()
  layers = new Array<Array<Shape>>()
  selectedLayer = 0;
  undoManager = new UndoManager();
  selectedObjects = new Array<Shape>()
  workingFilePath: string = null;

  undo() {
    this.undoManager.undo();
  }

  redo() {
    this.undoManager.redo();
  }

  draw(render: Render): void {
    var objs = new Array<Shape>()
    console.log(this.layers)
    this.layers.forEach((objects, idx) => {
      if(objects.length != 0 || idx == this.selectedLayer)
        objs.push(...objects)
    });
    objs.push(...this.layers[this.selectedLayer])

    render.draw(...objs)
  }

  add(r: Shape): void {
    this.layers[this.selectedLayer].push(r)
  }

  do<T>(a: Action<T>): T {
    this.undoManager.onActionDone(a);
    return a.do();
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

  new(): void {
    this.layers.length = 0
    this.selectedLayer = 0
    this.layers.push(new Array<Shape>())
    this.undoManager.clear();
    this.selectedObjects.length = 0;
    this.workingFilePath = null;
  }

  addLayer(): void {
    this.layers.push(new Array<Shape>())
    this.updateDisabledButtons()
  }

  deleteLayer(): void {
    this.layers.splice(this.selectedLayer, 1)
  }

  updateDisabledButtons(): void {
    if(this.selectedLayer >= this.layers.length - 1){
      document.getElementById("next_layer").classList.add("disabled")
    }
    else {
      document.getElementById("next_layer").classList.remove("disabled")
    }
    if(this.selectedLayer == 0){
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
}