import client from 'socket.io-client'
import { setSecret, encrypt, decrypt } from '../../helpers/parser.js'
// import { emitPromise, promiseResponded } from '../containers/emitPromise.js'
import socketMethods from '../common/socketMethods.js'
export class Client {
  constructor ({ log = console, ip, port, worker, variant, localWorker, methods, identity, schema, privateKey, socketNode }) {
    // console.log(`Client created for ${worker}`)
    this.methods = methods
    this.log = log
    this.ip = ip
    this.port = port
    this.worker = worker
    this.localWorker = localWorker
    this.variant = variant
    this.identity = identity
    this.commands = schema.getCommands(this.localWorker)
    // console.log(this.commands)
    this.socketNode = socketNode
    setSecret(privateKey)
    this.connect()
  }

  connect () {
    const address = `http://${this.ip}:${this.port}`
    this.socket = client(address)

    this.log.log(`${this.identity.worker} connecting to ${address}`)
    this.socket.on('connect', () => {
      this.log.log(this.identity)
      this.declareMyself()
    })
    const { commandResponse, command } = socketMethods(this.socket, this.methods, this.commands, { log: this.log })
    this.commandResponse = commandResponse
    this.command = command
  }

  declareMyself () {
    // this.log.log('declareMyself')
    this.socket.on('declared', data => {
      this.declared(decrypt(data))
    })
    this.socket.emit('declare', encrypt(this.identity))
  }

  declared (data) {
    this.log.log(data)
  }
}
export default Client
