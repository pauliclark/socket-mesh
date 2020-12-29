
import {encrypt, decrypt} from '../helpers/parser.js'
import {emitPromise, promiseResponded} from './emitPromise.js'
class InboundClient{
  constructor({
    localWorker,
worker,
variant,
connection,
connections,
schema,
log = console
  }) {
    this.worker = worker
    this.variant = variant
    this.connection = connection
    this.connections = connections
    this.commands = schema.getCommands(localWorker)
    // console.log('inbound command',worker,this.commands)
    this.log = log
    
    connection.on("disconnect",() => {
      this.connections.dropClient(connection)
    })
    connection.on("response",async data => {
      data = decrypt(data)
      if (data.uid) {
        promiseResponded(data)
      }
    })
    connection.on("command",async data => {
      data = decrypt(data)
      // console.log({commands:this.commands})
      if (this.commands) {
        const uid = data.uid
        delete data.uid
        if (uid) {
          const response = {}
          await Promise.all(Object.keys(data).map(async command => {
            let method = this.commands[command]
            // console.log({method})
            if (typeof method === 'function') {
              response[command] = await method(data)
            }else{
              this.log.error(new Error(`Command ${command} is not defined`))
              response[command] = `Command ${command} is not defined`
            }
          }))
          this.socket.emit("response",encrypt({
            uid,
            ...response
          }))
        }else{
          Object.keys(data).forEach(command => {
            let method = this.commands[command]
            // console.log({method})
            if (typeof method === 'function') {
                method(data)
            }else{
              this.log.error(new Error(`Command ${command} is not defined`))
            }
          })
        }
      }
      this.log.log(data)
    })
  }
  commandResponse(command,data) {
    const {uid,promise} = emitPromise()
    this.log.log(`Emitting ${command} from server`)
    this.connection.emit('command',encrypt({
      uid,
      [command]:data
    }))
    return promise
  }
  command(command,data) {
    this.log.log(`Emitting ${command} from server`)
    this.connection.emit('command',encrypt({
      [command]:data
    }))
  }
}
export default InboundClient