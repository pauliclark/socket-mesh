import Schema from './schema.js'
import md5 from 'md5'
// import createServer from './httpServer.js'
import {createServer} from 'http'
import { Server } from "socket.io"
import { autoPort } from '../constants/identifiers.js'
import getPort from 'get-port'
import { discoveryPort } from '../constants/discoveryPort.js'
import { setSecret, encrypt, decrypt } from '../helpers/parser.js'
import { contextLog } from '@pauliclark/log-context'
const connections = {}
const log = contextLog('socket manager')
export class Manager {

  constructor ({
    schema, // node identifiers and methods
    publicKey, // common key for all nodes but is publicly visible
    privateKey, // common key for all nodes but is NOT publicly visible,
    port = autoPort, // the port to listen on, will find an available port if not defined
  }) {
    if (!schema) throw new Error('The socket manager requires a schema')
    if (!publicKey) throw new Error('The socket manager requires a publicKey')
    if (!privateKey) throw new Error('The socket manager requires a privateKey')
    this.listening = false
    this.schema = new Schema(schema)
    this.privateKey = privateKey
    setSecret(privateKey)
    this.hashkey = md5(`${publicKey}${privateKey}`)
    this.start(port)
    // if (port===autoPort) this.startDiscovery()

    //   this.server.on('connection', client => {
    //     new attachedClient({
    //         client,
    //         server:this,
    //         promiser:this.promiser
    //     })
    // })
  }
  addNode({ worker, clientId, ip, port }) {
    // log.log(`added ${worker}[${clientId}]`)
    Object.keys(connections).forEach(conWorker => {
      // log.log(`checking ${conWorker}`)
      Object.keys(connections[conWorker]).forEach(conClientId => {
        if (clientId !== conClientId && this.schema.allow(conWorker,worker)) {
          // log.log(`${conWorker}[${conClientId}] -> ${worker}[${clientId}]`)
          connections[conWorker][conClientId].emit("addnode", encrypt([{ worker, variant: clientId, ip, port }]))
        }
      })
    })
  }
  allNodes({worker,variant}) {
    const nodes = []
    Object.keys(connections).forEach(conWorker => {
      // console.log('allow check',worker, conWorker)
      if (this.schema.allow(worker, conWorker)) {
        // console.log('allowed')
        Object.keys(connections[conWorker]).forEach(conClientId => {
          if (conClientId !== variant) {
            const con = connections[conWorker][conClientId]
            nodes.push({
              worker: con.worker,
              variant: con.variant,
              port: con.meshPort,
              ip: con.meshIP
            })
          }
        })
      }
    })
    return nodes
  }
  tellNodesOfDisconnectedNode(con) {
    const data = JSON.stringify({
      worker: con.worker,
      variant: con.variant,
    })
    Object.keys(connections).forEach(conWorker => {
      Object.keys(connections[conWorker]).forEach(conClientId => {
        connections[conWorker][conClientId].emit("removenode", encrypt(data))
      })
    })
  }
  sendConnectionsToNewNode(connection) {
    const cons = this.allNodes(connection)
    // if (connection.worker === 'nodeA') {
    //   log.log(`${connection.worker} just connected`)
    //   log.log(cons)
    // }
    if (cons.length) connection.emit("addnode", encrypt(cons))
  }
  async start(port) {

    this.port = (port === autoPort) ? await getPort() : port
    const httpserver = createServer()
    this.server = new Server(httpserver, { port: this.port })
    this.server.on("connection", (connection) => {
      let worker, clientId
      clientId = connection.client.id
      // console.log(connection.client.id)

      connection.on("declare", data => {
        data = decrypt(data)
        worker = data.worker
        if (!this.schema.validWorker(worker)) return connection.emit("error", encrypt({ message: `${worker} is not defined in the Schema` }))
        // console.log(connection.client.conn.remoteAddress)
        const ip = connection.client.conn.remoteAddress.replace(/^::ffff:/, '')
        const port = data.port
        // console.log({worker})
        if (worker) {
          if (!connections[worker]) connections[worker] = {}
          connections[worker][clientId] = connection

          connection.worker = worker
          connection.variant = clientId
          connection.meshPort = port
          connection.meshIP = ip

          // console.log(Object.keys(connections[worker]))
          connection.emit("declared", encrypt({ worker, clientId, port, ip }))
          this.sendConnectionsToNewNode(connection)
          this.addNode({ worker, clientId, port, ip })
        } else {
          connection.emit("declared", { error: 'Worker is not defined' })
        }
        // console.log(JSON.parse(data))
      })
      connection.on("disconnect", () => {
        if (connections[worker] && connections[worker][clientId]) {
          delete connections[worker][clientId]
          this.tellNodesOfDisconnectedNode(connection)
          // console.log(Object.keys(connections[worker]))
        }
        log.log(`disconnected ${worker}`)
      })
      // connection.on("message",(...args) => {
      //   console.log(args)
      // })
    })
    httpserver.listen({ port: this.port })
    log.info(`Sockets listening on port ${this.port}`)
    if (port === autoPort) this.startDiscovery()

    this.listening = true
  }
  validateKey(publicKey) {
    return this.hashkey === md5(`${publicKey}${this.privateKey}`)
  }
  startDiscovery() {
    // this.discoveryServer = dgram.createSocket('udp4',(msg, info) => {
    //   console.log(msg, info)
    // })
    // this.discoveryServer.bind(discoveryPort)
    this.discoveryServer = createServer((req, res) => {
      log.info(`Received on ${discoveryPort}`)
      if (req.method === 'GET') {
        // console.log(req.headers.discovery_key)
        if (req.headers?.discovery_key && this.validateKey(req.headers.discovery_key)) {
          res.writeHead(200, { 'Content-Type': 'application/json' })
          res.end(encrypt({
            port: this.port
          }));
          return
        }
      }
      res.writeHead(401, { 'Content-Type': 'text/html' })
      res.end('Invalid request');
    })
    this.discoveryServer.listen({ port: discoveryPort })
    log.info(`Discovery server listening on port ${discoveryPort}`)
  }
}
export default Manager