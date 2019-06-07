//ligar sockets a mandar mensagens random entre 2 browsers
//fazer serialize das actions
//mandar actions
//decidir qual action a mais recente para atualizar o projeto

import * as WebSocket from 'ws';
import * as http from 'http';
import { ModuleResolutionKind } from 'typescript';

export class communicator {

    constructor() { 
        var server = http.createServer((req, res) => {})
        var wss = new WebSocket.Server({ server: server })
        wss.on('connection', function connection(ws: WebSocket){
            console.log('connected')
            ws.send('Connected')

            ws.on('message', data => {
                console.log('Message incoming...')
                console.log(data)
                console.log('here')
            })

            ws.on('close', msg => {
                console.log('closing...')                
                console.log(msg)
            })
        })
    }
    
}

module.exports.communicator = communicator;