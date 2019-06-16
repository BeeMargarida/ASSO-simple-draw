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
    id: number
    peerId: number = null
    peer: any
    running: boolean = false
    connected: boolean = false
    initiator: boolean
    document: SimpleDrawDocument
    comManager: CommunicationManager

    start(id: number, initiator: boolean, document: SimpleDrawDocument, comManager: CommunicationManager) {
        this.id = id
        this.initiator = initiator
        this.document = document
        this.comManager = comManager
        var Peer = require('simple-peer')
        this.peer = new Peer({
            initiator: initiator,
            trickle: false
        })

        this.running = true

        this.peer.on('signal', (data: string) => this.signal(data))
        this.peer.on('connect', () => this.connected = true)
        this.peer.on('data', (data: string) => this.receive(data))
        this.peer.on('error', (err: string) => this.onError(err))
    }

    signal(data: string) {
        console.log('signal')
        console.log(JSON.stringify({ id: this.peerId != null ? this.peerId : this.id, data: data }))
        this.peerId = null
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

    onError(err: string){
        console.log(err)
        this.comManager.destroyCommunicator(this.id)
    }

    destroy(){
        this.peer.destroy();
    }
}

export class CommunicationManager {
    communicators: Array<PeerCommunicator> = []
    signalCommunicator: PeerCommunicator = null
    currCommunicatorId: number = 0

    constructor(public sdd: SimpleDrawDocument) { }

    start(): void {
        let communicator = new PeerCommunicator()
        communicator.start(this.currCommunicatorId, true,this.sdd,this)
        this.communicators.push(communicator)
        this.currCommunicatorId++
    }

    signal(signalInfo: string): void {
        const info = JSON.parse(signalInfo); 
        if(info.data.type == "answer")
        {
            const communicator = this.communicators.find( (communicator: PeerCommunicator) => {
                return communicator.id == info.id
            })
            try{
                communicator.peer.signal(info.data)
                setTimeout(() => {
                    if (communicator.running){
                        this.signalCommunicator = communicator
                        communicator.sendState()
                        this.sdd.undoManager = new UndoManager()
                    }
                }, 2000)
            }
            catch(e){
                console.error(e)
            }
        }
        else if(info.data.type == "offer"){
            const communicator = new PeerCommunicator();
            communicator.start(this.currCommunicatorId,false,this.sdd,this)
            try{
                communicator.peerId = info.id
                communicator.peer.signal(info.data)
                this.communicators.push(communicator)
                this.currCommunicatorId++
            }
            catch(e){
                console.error(e)
            }
        }
    }

    destroyCommunicator(id: number){
        this.communicators.splice(id,1)
        if(this.communicators.length <= 0)
            this.disconnect()
    }

    disconnect(){
        for(const com of this.communicators){
            com.destroy()
        }
        this.communicators.length = 0
        this.currCommunicatorId = 0
        this.signalCommunicator = null
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

    isActive(){
        console.log(this.communicators)
        const activeCommunicator =  this.communicators.find( (communicator: any) => {
            return communicator.connected
        })
        return activeCommunicator != null
    }

    newConnection(signalInfo: string){
        const info = JSON.parse(signalInfo)
        return this.signalCommunicator != null && info.data.type == "offer"
    }
}
