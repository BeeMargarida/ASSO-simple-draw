import { SimpleDrawDocument } from "document";

//ligar sockets a mandar mensagens random entre 2 browsers
//fazer serialize das actions
//mandar actions
//decidir qual action a mais recente para atualizar o projeto

export class Communicator {

    webSocket: WebSocket
    isConnected: boolean = false
    document: SimpleDrawDocument

    start(sdd: SimpleDrawDocument) {
        this.document = sdd
        this.webSocket = new WebSocket('ws://localhost:3000')

        var self = this
        this.webSocket.onopen = function(event) {
            console.log("On open")
            console.log(event)
            self.isConnected = true
        }

        this.webSocket.onmessage = function(event) {
            console.log("On message")
            self.receive(event.data)
        }

        this.webSocket.onclose = function(event) {
            console.log("On close")
            console.log(event)
            self.isConnected = false
        }
    }

    send(data: string) {
        if(this.webSocket != null && this.isConnected)
            this.webSocket.send(data)
    }

    receive(data: string) {
        this.document.receiveAction(data);
    }
    
}