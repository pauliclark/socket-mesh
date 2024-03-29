
import getPort from 'get-port'
import ManagerClient from './manager/managerClient.js'
import MeshServer from './server/meshServer.js'
import Schema from './schema.js'
import Connections from './containers/connections.js'
import AvailableConnections from './containers/availableConnections.js'
import { contextLog } from '@pauliclark/log-context'
import { initialiseQueue } from './containers/queues.js'
import { v4 as uuidv4 } from 'uuid'
class SocketNode {
  constructor ({
    jest = false,
    logLevel,
    redis,
    worker,
    // localPort,
    managerIp = 'http://127.0.0.1',
    hostname,
    ip,
    variant = null,
    port,
    schema,
    meshPort,
    publicKey,
    privateKey,
    onConnected = () => { },
    onConnection = () => { },
    onDisconnection = () => { }
  }) {
    initialiseQueue(redis)
    this.log = contextLog(worker, logLevel)
    this.availableConnections = new AvailableConnections({ log: this.log, socketNode: this })

    this.jest = jest
    this.worker = worker
    this.variant = variant || uuidv4().toString('utf8')
    this.schema = new Schema(schema, this.log)
    // console.log({ worker, hostname, managerIp })
    this.managerIp = managerIp
    this.ip = hostname || ip
    this.port = port
    // this.localPort = localPort
    this.meshPort = meshPort
    this.publicKey = publicKey
    this.privateKey = privateKey
    this.onConnected = onConnected
    this.onConnection = onConnection
    this.onDisconnection = onDisconnection
    this.buildCommands()
    this.start()
  }

  identity () {
    return {
      worker: this.worker,
      variant: this.variant
    }
  }

  async start () {
    this.meshPort = this.meshPort || await getPort()
    this.connectToManager()
  }

  async connectToManager () {
    // Notify the manager that I am listening
    // return
    this.managerClient = new ManagerClient({
      ...this,
      // jest: this.jest,
      // worker: this.worker,
      // log: this.log,
      // managerIp: this.managerIp,
      // ip: this.ip,
      // port: this.port,
      // meshPort: this.meshPort,
      // publicKey: this.publicKey,
      // privateKey: this.privateKey,
      // availableConnections: this.availableConnections,
      onConnected: ({ worker, clientId }) => {
        this.variant = this.variant || clientId
        // this.log.debug({worker, clientId})
        this.onConnected()

        this.connections = new Connections({
          worker: this.worker,
          variant: this.variant,
          availableConnections: this.availableConnections,
          log: this.log,
          onConnection: this.onConnection,
          onDisconnection: this.onDisconnection
        })
        this.createMethods()
        this.startMeshServer()
        this.openConnections()
      }
    })
  }

  async startMeshServer () {
    if (this.meshServer) return
    try {
      this.meshServer = new MeshServer({
        ...this,
        // methods: this.methods,
        // worker: this.worker,
        // variant: this.variant,
        port: this.meshPort,
        // schema: this.schema,
        // privateKey: this.privateKey,
        // log: this.log,
        availableConnections: this.managerClient.availableConnections
        // connections: this.connections
      })
      // console.log('meshServer started', this.meshServer.variant)
    } catch (e) {
      console.error(e)
    }
  }

  destroy () {
    this.managerClient.destroy()
    if (this.meshServer) this.meshServer.destroy()
    this.connections.destroy()
  }

  async openConnections () {
    this.connections.destroy()
    this.connections.openExisting()
  }

  buildCommands () {
    this.call = this.schema.buildCommands(this)
  }

  createMethods () {
    this.methods = this.schema.getMethods(this)
  }

  getConnection ({ worker, variant }) {
    return this.connections.getConnection({ worker, variant })
  }
}
export default SocketNode
