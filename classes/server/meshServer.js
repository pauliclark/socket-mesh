// const {remote} = require('./wrappers/remote.js')
// const {attachedClient} = require('./wrappers/attachedClient.js')
// import createServer from './httpServer.js'
import { setSecret, encrypt, decrypt } from '../../helpers/parser.js'
import { createServer } from 'http'
import { Server } from 'socket.io'
import InboundClient from '../client/inbound.js'
import waitFor from '../../helpers/waitFor.js'
class MeshServer {
  constructor ({
    methods,
    worker,
    variant,
    schema,
    port,
    privateKey,
    connections,
    onConnection,
    log = console
  }) {
    // console.log(identity,schema[identity])
    this.methods = methods
    this.log = log
    this.worker = worker
    this.variant = variant
    this.schema = schema
    this.port = port
    this.connections = connections
    this.onConnection = onConnection
    this.listening = false
    setSecret(privateKey)
    this.start()
  }

  start () {
    const httpserver = createServer()
    try {
      this.server = new Server(httpserver, { port: this.port })
      this.log.log(`${this.worker} Mesh server listening on ${this.port}`)

      // if (this.worker ==='nodeA') console.log(this.server)
      this.server.on('connection', connection => {
        this.log.log('Incoming connection')
        connection.on('declare', data => {
          data = decrypt(data)
          if (this.allow(data)) {
            this.log.log(`declared as ${data.worker}[${data.variant}]`)
            this.connections.addClient(data, new InboundClient({
              ...data,
              localWorker: this.worker,
              methods: this.methods,
              schema: this.schema,
              connection,
              connections: this.connections,
              log: this.log
            }))
          } else {
            connection.disconnect()
          }
        })
      })
      httpserver.listen({ port: this.port })
      this.listening = true
    } catch (e) {
      this.log.error(`${this.worker} failed to start the Mesh server listening on ${this.port},  will try again in 1s`)
      setTimeout(() => {
        this.start()
      }, 1000)
    }
  }

  allow ({ worker, variant }) {
    // console.log({ worker: this.worker, variant: this.variant, allow: { worker, variant, allow: this.schema.allow(worker, this.worker) && variant !== this.variant } })
    return this.schema.allow(worker, this.worker) && variant !== this.variant
  }

  // canConnect(identity) {
  //     return (this.schema.local.allow===null || (this.schema.local.allow instanceof Array && this.schema.local.allow.includes(client.identity)))
  // }
  // async method({client,command,request}) {
  //     if (this.schema.local.allow===null || (this.schema.local.allow instanceof Array && this.schema.local.allow.includes(client.identity))) {
  //         if (this.schema.local.methods && this.schema.local.methods[command]) {
  //             const method = this.schema.local.methods[command];
  //             if (method.allow===null || (method.allow instanceof Array && method.allow.includes(client.identity))) {
  //                 if (method.callback) {
  //                     return await method.method(request);
  //                 }else{
  //                     method.method(request);
  //                 }
  //             }else{
  //                 return {error:`${client.identity} client does not access to method ${command} on this $(this.identity} server`}
  //             }
  //         }else{
  //             return {error:`Method ${command} is not defined on this $(this.identity} server`}
  //         }
  //     }else{
  //         return {error:`${client.identity} client does not access to this $(this.identity} server`}
  //     }
  // }
  // received({payload}) {
  //     this.promiser.received({payload}) || this.method({payload})
  // }
  // send({identity,method,payload}) {
  //     // if (this.schema.remotes[identity])
  // }
  destroy () {
    this.connections.destroy()
    this.server.close()
    this.server.httpServer.close()
  }
}
export default MeshServer
