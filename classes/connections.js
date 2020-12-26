// class Connection{
//   constructor(container,details){
//     this.container = container
//     this.detail= details
//   }
// }
class Connections{
  constructor({
    worker,
    variant,
    availableConnections,
    log = console
  }){
    this.worker = worker
    this.variant=variant
    this.log = log
    // this.log.info(`Connections for ${this.worker}[${this.variant}]`)
    this.connections = availableConnections.getConnections()
    this.clients= []
    availableConnections.on('add',connection => {
      this.add(connection)
      // this.log.log(this.connections)
    })
    availableConnections.on('drop',connection => {
      this.drop(connection)
      // this.log.log(this.connections)
    })
  }
  openExisting() {
    this.connections.forEach(connection => {
      connection.connect()
    })
  }
  addClient({worker,variant}, connection) {
    this.clients.push({
      worker,variant,connection
    })
  }
  dropClient(connection) {
    for(let i = this.clients.length-1;i>=0;i--) {
      if (this.clients[i].connection === connection) this.clients.splice(i,1)
    }
    this.clients.push({
      worker,variant,connection
    })
  }
  add(connection) {
    this.connections.push(connection)
    connection.connect()
  }
  drop(connection) {
    for(let i = this.connections.length-1;i>=0;i--) {
      if (this.connections[i] === connection) {
        const toClose = this.connections.splice(i,1)
        toClose.disconnect()
      }
    }
  }
}
export default Connections