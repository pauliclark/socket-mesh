
import getPort from 'get-port'
import ManagerClient from './manager/managerClient.js'
import MeshServer from './server/meshServer.js'
import Schema from './schema.js'
import Connections from './containers/connections.js'
import AvailableConnections from './containers/availableConnections.js'
import { contextLog } from '@pauliclark/log-context'
import { initialiseQueue } from './containers/queues.js'
class SocketNode {
  constructor ({
    jest = false,
    logLevel,
    redis,
    worker,
    localPort,
    port,
    schema,
    meshPort,
    publicKey,
    privateKey,
    onConnected = () => { },
    onConnection = () => { },
    onDisconnection = () => {}
  }) {
    initialiseQueue(redis)
    this.log = contextLog(worker, logLevel)
    this.availableConnections = new AvailableConnections({ log: this.log, socketNode: this })

    this.jest = jest
    this.worker = worker
    this.variant = null
    this.schema = new Schema(schema, this.log)
    // if (worker === 'nodeA') console.log(this.schema.schema.nodeA._commands)
    this.port = port
    this.localPort = localPort
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
    this.managerClient = new ManagerClient({
      jest: this.jest,
      worker: this.worker,
      log: this.log,
      port: this.port,
      meshPort: this.meshPort,
      publicKey: this.publicKey,
      privateKey: this.privateKey,
      availableConnections: this.availableConnections,
      onConnected: ({ worker, clientId }) => {
        this.variant = clientId
        // this.log.debug({worker, clientId})
        // console.log('client connected')
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
    try {
      this.meshServer = new MeshServer({
        methods: this.methods,
        worker: this.worker,
        variant: this.variant,
        port: this.meshPort,
        schema: this.schema,
        privateKey: this.privateKey,
        log: this.log,
        availableConnections: this.managerClient.availableConnections,
        connections: this.connections
      })
    } catch (e) {
      console.error(e)
    }
  }

  async openConnections () {
    this.connections.openExisting()
  }

  buildCommands () {
    this.call = this.schema.buildCommands(this)
  }

  createMethods () {
    this.methods = this.schema.getMethods(this)
  }
}
export default SocketNode
