import Client from './client.js'
class Connection{
  constructor({ip,port,worker,variant, socketNode,log=console}) {
    this.socketNode = socketNode
    this.log = log
    this.ip = ip
    this.port = port
    this.worker = worker
    this.variant = variant
  }
  connect() {
    this.log.info(`${this.socketNode.worker}[${this.socketNode.variant}] opening ${this.worker}[${this.variant}]`)
    this.client = new Client({
      ip:this.ip,
      port:this.port,
      worker:this.worker,
      variant:this.variant,
      identity:this.socketNode.identity(),
      schema:this.socketNode.schema,
      privateKey:this.socketNode.privateKey
    })
  }
  disconnect() {

  }
}
class AvailableConnections{
  constructor({
    log = console,
    socketNode
  } = {}){
    this.socketNode = socketNode
    this.log = log
    this.events={
      add:() => {},
      drop:() => {}
    }
    this.availableConnections = {

    }
  }
  addConnection ({ip,port,worker,variant})  {
    // console.log({ip,port,worker,variant})
    if (!this.availableConnections[worker]) this.availableConnections[worker] = {}
    const newConnection = new Connection({ip,port,worker,variant,socketNode:this.socketNode,log:this.log})
    this.availableConnections[worker][variant] = newConnection
    this.events.add(newConnection)
  }
  getConnections() {
    const cons = []
    Object.keys(this.availableConnections).forEach(worker => {
      Object.keys(this.availableConnections[worker]).forEach(variant => {
        cons.push(this.availableConnections[worker][variant])
      })
    })
    return cons
  }
  dropConnection ({worker,variant}) {
    if (this.availableConnections[worker] && this.availableConnections[worker][variant]) {
      this.availableConnections[worker][variant].disconnect()
      this.events.drop(this.availableConnections[worker][variant])
      delete this.availableConnections[worker][variant]
    }
  }
  on(event, callback) {
    this.events[event] = callback
  }
}
export default AvailableConnections