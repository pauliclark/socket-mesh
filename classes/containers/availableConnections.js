import Client from '../client/outbound.js'
class Connection {
  constructor ({ ip, port, worker, variant, socketNode, methods, log = console }) {
    this.socketNode = socketNode
    this.methods = methods
    this.log = log
    this.ip = ip
    this.port = port
    this.worker = worker
    this.variant = variant
  }

  connect () {
    this.log.info(`${this.socketNode.worker}[${this.socketNode.variant}] opening ${this.worker}[${this.variant}]`)
    this.client = new Client({
      ip: this.ip,
      port: this.port,
      worker: this.worker,
      localWorker: this.socketNode.worker,
      variant: this.variant,
      methods: this.methods,
      socketNode: this.socketNode,
      identity: this.socketNode.identity(),
      schema: this.socketNode.schema,
      privateKey: this.socketNode.privateKey,
      log: this.log
    })
  }

  disconnect () {
    this.client.disconnect()
  }

  destroy () {
    this.client.destroy()
  }
}
class AvailableConnections {
  constructor ({
    log = console,
    socketNode
  } = {}) {
    this.socketNode = socketNode
    this.log = log
    this.events = {
      add: () => {},
      drop: () => {}
    }
    this.availableConnections = {

    }
  }

  addConnection ({ ip, port, worker, variant }) {
    // console.log({ip,port,worker,variant})
    if (!this.availableConnections[worker]) this.availableConnections[worker] = {}
    const newConnection = new Connection({ ip, port, worker, variant, socketNode: this.socketNode, methods: this.socketNode.methods, log: this.log })
    this.availableConnections[worker][variant] = newConnection
    this.events.add(newConnection)
  }

  getConnections () {
    const cons = []
    Object.keys(this.availableConnections).forEach(worker => {
      Object.keys(this.availableConnections[worker]).forEach(variant => {
        cons.push(this.availableConnections[worker][variant])
      })
    })
    return cons
  }

  dropConnection ({ worker, variant }) {
    if (this.availableConnections[worker] && this.availableConnections[worker][variant]) {
      this.availableConnections[worker][variant].off()
      this.availableConnections[worker][variant].disconnect()
      this.events.drop(this.availableConnections[worker][variant])
      delete this.availableConnections[worker][variant]
    }
  }

  on (event, callback) {
    this.events[event] = callback
  }
}
export default AvailableConnections
