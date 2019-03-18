import { Action } from "./actions";

export class UndoManager {
  doStack = new Array<Action<any>>();
  undoStack = new Array<Action<any>>();

  undo() {
    if (this.doStack.length > 0) {
      const a1 = this.doStack.pop();
      a1.undo();
      this.undoStack.push(a1);
    }
  }

  redo() {
    if (this.undoStack.length > 0) {
      const a1 = this.undoStack.pop();
      a1.do();
      this.doStack.push(a1);
    }
  }

  onActionDone(a: Action<any>): void {
    this.doStack.push(a);
    this.undoStack.length = 0;
  }
}
