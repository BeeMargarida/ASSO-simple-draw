type UndoableAction<S> = { do(): S; undo(): void, getShapesId(): Array<number>, getTimestamp(): Date }

export class UndoManager<S, A extends UndoableAction<S>> {
  doStack = new Array<A>();
  undoStack = new Array<A>();

  clear() {
    this.doStack.length = 0;
    this.undoStack.length = 0;
  }

  undo() {
    if (this.doStack.length > 0) {
      const a1 = this.doStack.pop();
      console.log(a1)
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

  onActionDone(a: A): void {
    this.doStack.push(a);
    this.undoStack.length = 0;
  }

}
