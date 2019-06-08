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

    start(sdd: SimpleDrawDocument) {
        this.document = sdd
        this.webSocket = new WebSocket('ws://localhost:3000')

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