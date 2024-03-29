// class Connection{
//   constructor(container,details){
//     this.container = container
//     this.detail= details
//   }
// }
class Connections {
  constructor ({
    worker,
    variant,
    availableConnections,
    log = console,
    onConnection = () => {},
    onDisconnection = () => {}
  }) {
    this.onConnection = onConnection
    this.onDisconnection = onDisconnection
    this.worker = worker
    this.variant = variant
    this.log = log
    // this.log.info(`Connections for ${this.worker}[${this.variant}]`)
    this.connections = availableConnections.getConnections()
    this.clients = []
    availableConnections.on('add', connection => {
      this.add(connection)
      // this.log.log(this.connections)
    })
    availableConnections.on('drop', connection => {
      this.drop(connection)
      // this.log.log(this.connections)
    })
  }

  openExisting () {
    this.connections.forEach(connection => {
      connection.connect()
    })
  }

  addClient ({ worker, variant }, connection) {
    this.log.log(`Client ${worker} connected to ${this.worker}`)
    this.clients.push({
      worker, variant, connection
    })
  }

  dropClient (socket) {
    this.log.log('Dropping client')
    const toDrop = this.clients.find(client => client.connection.connection === socket)

    this.clients = this.clients.filter(client => client !== toDrop)
    // toDrop.connection.destroy()
    // console.log(connection)
    // connection.destroy()
  }

  list () {
    const workers = {}
    this.clients.forEach(client => {
      if (!workers[client.worker]) workers[client.worker] = {}
      workers[client.worker][client.variant] = client
    })
    return workers
  }

  add (connection) {
    this.connections.push(connection)
    connection.connect()
    this.onConnection(connection)
  }

  drop (connection) {
    const toClose = this.connections.find(c => c === connection)
    if (toClose) {
      this.log.log('Dropping connection')
      toClose.destroy()
      this.connections = this.connections.filter(con => con !== toClose)
      this.onDisconnection(toClose)
    }
    // for (let i = this.connections.length - 1; i >= 0; i--) {
    //   if (this.connections[i] === connection) {
    //     const [toClose] = this.connections.splice(i, 1)
    //     toClose.destroy()
    //     this.onDisconnection(toClose)
    //   }
    // }
  }

  connected (worker) {
    const clients = [...this.clients, ...this.connections].map(client => client.client || client.connection || client)
    // console.log({ clients, worker })
    return [...clients.filter(client => client.worker === worker)]
  }

  destroy () {
    while (this.connections.length) {
      const con = this.connections.shift()
      con.destroy()
      this.onDisconnection(con)
    }
  }

  getConnection ({ worker, variant }) {
    const cons = this.connected(worker)
    return cons.find(con => con.variant === variant)
  }
}
export default Connections
