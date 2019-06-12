import { SimpleDrawDocument } from "document";

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
        this.webSocket.onopen = function(event) {
            console.log("On open")
            self.isConnected = true
        }

        this.webSocket.onmessage = function(event) {
            console.log("On message")
            if(event.data.split(' ')[0] == 'connected')
                self.id = parseInt(event.data.split(' ')[1])
            else{
                if(event.data.split(' ')[0] != self.id)
                    self.receive('{' + event.data.split(' {')[1])
            }
        }

        this.webSocket.onclose = function(event) {
            console.log("On close")
            console.log(event)
            self.isConnected = false
        }
    }

    send(data: string) {
        if(this.webSocket != null && this.isConnected)
            this.webSocket.send(this.id + ' ' + data)
    }

    receive(data: string) {
        this.document.receiveAction(data);
    }
    
}

export class PeerCommunicator {
    peer: any
    public running: boolean = false
    document: SimpleDrawDocument

    start(initiator: boolean, document: SimpleDrawDocument) {
        this.document = document
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
        window.alert('Collab mode activated. Your id: \n' + JSON.stringify(data))
    }

    receive(data: string){
        console.log('RECEIVED');
        console.log(data.toString())
        this.document.receiveAction(data);
    }

    send(data: string){
        if(!this.peer)
            return
        console.log('SENT');
        console.log(data);
        this.peer.send(data)
        
    }
}