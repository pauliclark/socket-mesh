
import getPort from 'get-port'
import { ManagerClient } from '../index.js'
import MeshServer from './meshServer.js'
import Schema from './schema.js'
import Connections from './connections.js'
import AvailableConnections from './availableConnections.js'
import { contextLog } from '@pauliclark/log-context'
class SocketNode {
  constructor ({
    worker,
    localPort,
    port,
    schema,
    meshPort,
    publicKey,
    privateKey,
    onConnected = () => { } 
  }) {
    this.log = contextLog(worker)
    this.availableConnections = new AvailableConnections({log:this.log,socketNode:this})
    
      this.worker = worker
      this.variant = null
      this.schema = new Schema(schema)
      // if (worker === 'nodeA') console.log(this.schema.schema.nodeA._commands)
      this.port = port
      this.localPort = localPort
      this.meshPort = meshPort
      this.publicKey = publicKey
      this.privateKey = privateKey
      this.onConnected = onConnected
      this.buildCommands()
      this.start()
  }
  identity() {
    return {
      worker:this.worker,
      variant:this.variant
    }
  }
  async start() {
    this.meshPort = this.meshPort || await getPort()
    this.connectToManager()
  }
  async connectToManager() {
    // Notify the manager that I am listening
    this.managerClient = new ManagerClient({
      worker: this.worker, 
      log:this.log,
      port: this.port, 
      meshPort: this.meshPort, 
      publicKey: this.publicKey, 
      privateKey: this.privateKey, 
      availableConnections: this.availableConnections,
      onConnected: ({worker, clientId}) => {
        this.variant = clientId
        // this.log.debug({worker, clientId})
        // console.log('client connected')
        this.onConnected()
        
        this.connections = new Connections({
          worker: this.worker,
          variant: this.variant, 
          availableConnections:this.availableConnections,
          log: this.log
        })

        this.startMeshServer()
        this.openConnections()
      }
    })
  }
  async startMeshServer() {
    try{
      this.meshServer = new MeshServer({
        worker:this.worker, 
        variant: this.variant,
        port: this.meshPort, 
        schema:this.schema,
        privateKey: this.privateKey,
        log:this.log,
        availableConnections:this.managerClient.availableConnections,
        connections: this.connections
      })
    }catch(e) {
      console.error(e)
    }
  }
  async openConnections() {
    this.connections.openExisting()
  }
  buildCommands() {
    this.call = this.schema.buildCommands(this)
  }
}
export default SocketNode