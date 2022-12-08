// import { encrypt, decrypt } from '../../helpers/parser.js'
class Broadcast {
  constructor({ worker, command, responds, socketNode, log = console }) {
    this.worker = worker
    this.command = command
    this.responds = responds || false
    this.socketNode = socketNode
    this.log = log
  }

  call(data = {}, { exclude = [] } = { exclude: [] }) {
    if (this.responds) return this.callPromise(data)
    const connections = this.socketNode.connections.connected(this.worker)
    // this.log.info(`Calling broadcast command ${this.command} to all connected ${this.worker} workers`)
    connections.filter(connection => {
      return connection.worker && connection.variant && !exclude.find(ex => {
        return ex.worker === connection.worker && ex.variant === connection.variant
      })
    }).forEach(connection => {
      if (connection.command) {
        connection.command(this.command, data)
      }
      return null
    })
  }

  callPromise(data = {}, { exclude = [] } = { exclude: [] }) {
    const connections = this.socketNode.connections.connected(this.worker)
    // this.log.info(`Calling broadcast command promise ${this.command} to all connected ${this.worker} workers`)
    const toCall = connections.filter(connection => {
      return connection.worker && connection.variant && !exclude.find(ex => {
        return ex.worker === connection.worker && ex.variant === connection.variant
      })
    })
    // console.log({
    //   calling: toCall.map(conn => {
    //     return {
    //       worker: conn.worker,
    //       variant: conn.variant
    //     }
    //   })
    // })
    return Promise.all(toCall.map(connection => {
      if (connection.command) {
        return connection.commandResponse(this.command, data)
      }
      return null
    }))
  }
}
export default Broadcast
