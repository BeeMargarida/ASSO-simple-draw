# SimpleDraw

## Introduction
SimpleDraw is a project developed for the subject of Software Systems Architecture of the Integrated Masters in Informatics and Computing Engineering.

SimpleDraw consists of a collaborative painting tool, developed in typescript, with as few external packages as possible, to allow the application of as much knowledge as possible.

The main objective was to develop a graphical editor to draw basic geometric objects, manipulate and persist them, with the possibility to add collaborators to a project and have multiple collaborators drawing on the same project, conflict free.

## Goals

Develop a graphical editor to draw basic geometric objects, manipulate and persist them.

* Develop using HTML-related technologies (SVG, Canvas)
* All client-side (running in the browser)
* Use Typescript instead of pure javascript
* Zero-dependencies for the engine
* Libraries for non-engine stuff only (sass, bootstrap)

## Functionalities

To have an extendible tool, well designed and ready to be improved, the following functionalities were set as system requiremtents:

* [x] SimpleDraw is based on the notion of documents
* [x] Documents are rendered either in SVG or HTMLCanvas
* [x] Support persistence in multiple formats: TXT, XML, BIN
* [x] Extendible with different objects (triangles, arrows, etc)
* [x] Extendible with new tools (rotate, translate shapes)
* [x] Support area selections
* [x] Support layers of objects
* [x] Multiple views of the same model in the screen
* [x] Viewport tools (translate, zoom on the viewport)
* [x] Different view styles per viewport (wireframe, color)
* [x] Two interaction modes: *point-n-click* and *REPLs*
* [x] Support (un)limited Undo/Redo of all operations
* [ ] **OP MODE** Collaborate using multiple browsers and no backend/server

## Implementation Details

In this section, we describe our approach on the development of each requirement, as detailed as possible.

#### SVG & Canvas
To make it possible to have 2 methods of rendering each object - SVG and HTMLCanvas - it was used the **Strategy Pattern**. Each of this methods have a *draw* method, that draws each object in its specific way.
The following diagram shows how the renders are structured.

![image](https://user-images.githubusercontent.com/22330550/59570414-b2713f00-908f-11e9-82ae-d3cdc4f341cd.png)

#### Support persistence in multiple formats: TXT, XML, BIN
In order to be able to export/import the model in different formats the **Strategy pattern** was used. First, the FileManager interface was defined with two methods: save and load, meaning export and import respectively. In order to add support to a new file format, it is only required to create a class that implements the interface such as the currently implemented XMLFileManager and TXTFileManager. Finally, to simplify the creation and usage of the correct strategy whenever needed a simple string based factory FileManagerFactory was added. On the diagram below, it is visible the use of the pattern and how the classes are organized.

![image](https://user-images.githubusercontent.com/22330550/59570430-f49a8080-908f-11e9-93dc-a8e791098633.png)

#### Extendible with different objects
The system must use of different objects, allowing the same actions (create, delete, translate, etc) to be applied to all of them. To do so, we users the **Strategy Pattern** to have multiple objects (shapes) descending from one class Shape. If there is the need to add new objects, e.g. a triangle, we need to create a class Triangle that extends Shape, and complete the methods that it needs. The diagram below displays the structure of the object classes.

![image](https://user-images.githubusercontent.com/22330550/59570230-f0b92f00-908c-11e9-94c0-b664b88442d4.png)

#### Extendible with new tools
The shape tools implementation is modular, so to add new tools, e.g. rotation of shapes, we must create a new RotateAction that implements Action, and add on the SimpleDrawDocument a function to create the action and call its do().

#### Area Selection
The system allows the user to temporarily select an area that can contain several shapes. With this, the user can make actions to the selected number. To make this possible and very modular, we used the **Composite Pattern**, so that a AreaSelected is a Shape that contains several Shapes, as we can see in the code below:
![Area Selection Composite](./prints/composite.png)
With this, it is possible to do shape actions, like translate, and the class AreaSelected specifies this action for itself. This allows the selection to be modular and iterate above the Shape class.
The diagram below shows the relation between the AreaSelected and the shapes. It is important to refer that an AreaSelected cannot contain another AreaSelected inside it, because it makes no sense in the context.

![image](https://user-images.githubusercontent.com/22330550/59570513-2fe97f00-9091-11e9-91d6-6e49dfce1e67.png)

#### Support layers of objects
SimpleDraw as the functionality of creating and deleting layers. These layers allow to create objects that are independent from objects in other layers. These makes it easy to only make actions of the selected layer. Besides this, it allows for the deletion of several objects at once, by deleting their layer.

#### Multiple views of the same model in the screen
The system should allow the user to create new views in run time and still have all objects that were created before and all operations that have happened.
To do this, the objects and operations are not stored on the views, but on a class which contains the objects and operations' information. By doing so, the views can then access the information and know where and how to position each object, regardless of the view's zoom, axis position, etc.
This approach consists of a **MVC** application, in which the Shape class is the model, the Render class is the view and the controller, although not being completely defined and separated in a single class, is split through some classes that have the need to work on the shapes.

#### Viewport tools (translate, zoom on the viewport)
To support viewport tools, we use mouse events, such as the scroll event to zoom in or zoom out on the scene, or the click and drag (mousedown + mouseup with different coordinates) to translate the whole scene. This problem takes advantage of the previous one (**Multiple views of the same model in the screen**), in the sense that it only applies the viewport tool to the viewport where the mouse is, not affecting the others.

#### Different view styles per viewport
To make the styling possible we used the **Strategy Pattern**, where each render has a *Style*. We also used the **State Pattern** to change the style when the user clicks in the *Color/Stroke* button. We currently have 2 styles: *Wireframe* and *Color*. However, it is easy to expand and add more: create 2 classes (one for SVG and other for Canvas) that implement the interface *Style*, and the method *draw* is the one responsible for implementing the drawing logic. 
There was also a possibility of doing this with the *Decorator Pattern*, however we didn't want to implement one or more styles at the same time and we wanted to be able to change styles at runtime.
Below we can see the *Style* interface and an implemention of the Color mode for Canvas as well as the functionality in action:
![ViewStyles Code](./prints/styles.png)
![ViewStyles](./prints/styles_imp.png)

#### Two interaction modes: *point-n-click* and *REPLs*
For the REPL, a simple interpreter was created based on the **Interpreter pattern**. First, the string inserted by the user in the frontend is passed to the interpreter which starts by tokenizing it using a set of valid regex string patterns. Then, the tokens are parsed and converted into a simple abstract syntax tree (AST) matching the interpreter's expected structure (grammar validations are made during this process). Finally, the interpreter is ready to execute the corresponding command by running the interpret method of the root of the tree which collects the required information in a context and calls the corresponding action. The grammar includes creation and deletion expressions for the different shapes and the operations applied to them such as translations and accepts the following commands:

* circle x y radius
* rectangle x y width height
* translate fig_id dx dy
* delete fig_id

The grammar is very simple only containing terminal expressions but could easily be expanded to be more complex with multiple compound expressions. However, this would also require more effort regarding the parsing and building of the AST to match the more complex grammar, which even though can parse multiple expressions only interprets the first one at the moment.

#### Undo/Redo 
It must be possible to undo/redo any action made in the editor. First of all, every change made in the document had to be translated to an action. This corresponds to the **Command Patter**.
To apply the undo/redo, there are 2 stacks, the *doStack* and the *undoStack*. When an action is made (create shape, translate shape, etc), the action is added to the *doStack* and the *undoStack* is emptied, so that it doesn't create problems if a redo was made before. Each action has a *do* and *redo* method, the first when an action is first made or when the redo is of the *undoManager* is called. The *redo* method of the action is the reverse of said action and is called when the *undo* method of the *undoManager* is called. 

#### **OP MODE** Collaborate using multiple browsers and no backend/server
The system should allow users to collaborate on a project, using multiple browsers/machines. To do so, we used webRTC to communicate between peers, on a peer2peer basis. When a user makes an action on the project, it is sent to all his peers, in order for them to update the project's state. To ensure consistency in all instances, we applied a consensus method based on the timestamps of actions, so that if multiple users touch the same object at the same time, only 1 action is applied, and not all of them. When a new peer connects to a peer that is sharing his project, he receives the actual state of the project all at once, to become up-to-date and from there on receives and sends actions. In case of failure, if a peer loses connection to another, it must reconnect and the process is the same, it receives the actual state of the project and from there on, receives and sends actions.
