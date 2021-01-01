// import { encrypt, decrypt } from '../../helpers/parser.js'
class Broadcast {
  constructor ({ worker, command, responds, socketNode, log = console }) {
    this.worker = worker
    this.command = command
    this.responds = responds || false
    this.socketNode = socketNode
    this.log = log
  }

  call (data = {}) {
    if (this.responds) return this.callPromise(data)
    const connections = this.socketNode.connections.connected(this.worker)
    // this.log.info(`Calling broadcast command ${this.command} to all connected ${this.worker} workers`)
    connections.forEach(connection => {
      if (connection.command) {
        connection.command(this.command, data)
      }
    })
  }

  callPromise (data = {}) {
    const connections = this.socketNode.connections.connected(this.worker)
    // this.log.info(`Calling broadcast command promise ${this.command} to all connected ${this.worker} workers`)
    return Promise.all(connections.map(connection => {
      if (connection.command) {
        return connection.commandResponse(this.command, data)
      }
    }))
  }
}
export default Broadcast
