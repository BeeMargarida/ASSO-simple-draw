import { Shape } from './shape'
import { Action, CreateCircleAction, CreateRectangleAction, TranslateAction } from './actions'
import { Render } from './render';
import { FileManager, FileManagerFactory } from './file-manager';
import { UndoManager } from "./undo";
import axios from 'axios';

export class SimpleDrawDocument {
  static API_HOST = 'http://localhost:3000';

  objects = new Array<Shape>()
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
    render.draw(...this.objects)
  }

  add(r: Shape): void {
    this.objects.push(r)
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

  new(): void{
    this.objects.length = 0;
    this.undoManager.clear();
    this.selectedObjects.length = 0;
    this.workingFilePath = null;
  }

  hasSetWorkingFile(): boolean{
    return this.workingFilePath !== null;
  }

  async saveWorkingFile(): Promise<void>{
    return this.save(this.workingFilePath);
  }

  async save(fileName: string): Promise<void>{
    const fileManager = FileManagerFactory.getFileManager(fileName);

    let data;
    if(fileManager != null)
      data = fileManager.save(this.objects, fileName);
    else
      throw 'Unsupported file extension';

    const res = await axios.post(SimpleDrawDocument.API_HOST+'/api/files/save', {
        path: fileName,
        data: data
    });

    if(res.status != 200)
      throw 'Unable to save file';

    this.workingFilePath = fileName;

    return;
  }

  async load(fileName: string): Promise<void>{
    const res = await axios.post(SimpleDrawDocument.API_HOST+'/api/files/load', {
        path: fileName,
    })

    const fileManager = FileManagerFactory.getFileManager(fileName);
    this.objects = fileManager.load(res.data.content);
    this.workingFilePath = fileName;
  }
}