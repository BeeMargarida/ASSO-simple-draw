import { SimpleDrawDocument } from "./document";
import { Rectangle, Circle } from "./shape";
import { UndoManager } from './undo';

//ligar sockets a mandar mensagens random entre 2 browsers
//fazer serialize das actions DONE
//mandar actions DONE
//decidir qual action a mais recente para atualizar o projeto

export class Communicator {

    webSocket: WebSocket
    isConnected: boolean = false
    document: SimpleDrawDocument
    id: number

    start(sdd: SimpleDrawDocument, socket: string) {
        this.document = sdd
        this.webSocket = new WebSocket(socket)
        // this.webSocket = new WebSocket('ws://localhost:3000')

        var self = this
        this.webSocket.onopen = function (event) {
            console.log("On open")
            self.isConnected = true
        }

        this.webSocket.onmessage = function (event) {
            console.log("On message")
            if (event.data.split(' ')[0] == 'connected')
                self.id = parseInt(event.data.split(' ')[1])
            else {
                if (event.data.split(' ')[0] != self.id)
                    self.receive('{' + event.data.split(' {')[1])
            }
        }

        this.webSocket.onclose = function (event) {
            console.log("On close")
            console.log(event)
            self.isConnected = false
        }
    }

    send(data: string) {
        if (this.webSocket != null && this.isConnected)
            this.webSocket.send(this.id + ' ' + data)
    }

    receive(data: string) {
        this.document.receiveAction(data);
    }

}

export class PeerCommunicator {
    peer: any
    public running: boolean = false
    public initiator: boolean
    document: SimpleDrawDocument
    public comManager: CommunicationManager

    start(initiator: boolean, document: SimpleDrawDocument, comManager: CommunicationManager) {
        this.document = document
        this.comManager = comManager
        this.initiator = initiator
        var Peer = require('simple-peer')
        this.peer = new Peer({
            initiator: initiator,
            trickle: false
        })

        this.running = true

        this.peer.on('signal', (data: string) => this.signal(data))
        this.peer.on('data', (data: string) => this.receive(data))
    }

    signal(data: string) {
        console.log('signal')
        console.log(JSON.stringify(data))

        //window.alert('Collab mode activated. Your id: \n' + JSON.stringify(data))
    }

    receive(data: string) {
        console.log('RECEIVED');
        console.log(data.toString())
        this.document.receiveAction(data.toString());
        this.comManager.sendExceptSelf(data,this);
    }

    send(data: string) {
        if (!this.peer)
            return
        console.log('SENT');
        console.log(data);
        this.peer.write(data)
    }

    sendState() {
        if (!this.peer)
            return

        let layers = []
        for (const layer of this.document.layers) {
            let shapes = []
            for (const shape of layer) {
                if (shape instanceof Rectangle) {
                    shapes.push(shape.toString())
                } else if (shape instanceof Circle) {
                    shapes.push(shape.toString())
                }
            }
            layers.push(shapes)
        }
        let msg = {
            type: 'state',
            layers: layers
        }
        this.send(JSON.stringify(msg))
    }
}

export class CommunicationManager {
    communicators: Array<PeerCommunicator> = [];

    constructor(public sdd: SimpleDrawDocument) { }

    start(): void {
        let communicator = new PeerCommunicator()
        communicator.start(true,this.sdd,this)
        this.communicators.push(communicator)
    }

    signal(signalInfo: string): void {
        if(this.communicators.length > 0 && 
        this.communicators[this.communicators.length-1].initiator)
        {
            const communicator = this.communicators[this.communicators.length-1]  
            communicator.peer.signal(signalInfo)
            setTimeout(() => {
                if (communicator.running){
                    communicator.sendState()
                    this.sdd.undoManager = new UndoManager()
                }
            }, 2000)
        }
        else{
            const communicator = new PeerCommunicator();
            communicator.start(false,this.sdd,this)
            communicator.peer.signal(signalInfo)
            this.communicators.push(communicator);
        }
    }

    send(data: string): void{
        for(const com of this.communicators){
            com.send(data);
        }
    }

    sendExceptSelf(data: string, communicator: PeerCommunicator): void{
        for(const com of this.communicators){
            if(com != communicator)
                com.send(data);
        }
    }

    sendState(){
        for(const com of this.communicators){
            com.sendState();
        }
    }
}
