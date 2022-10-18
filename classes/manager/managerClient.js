
import client from 'socket.io-client'
import AvailableConnections from '../containers/availableConnections.js'
import { setSecret, encrypt, decrypt } from '../../helpers/parser.js'
import axios from 'axios'
import http from 'axios/lib/adapters/http.js'
import { discoveryPort } from '../../constants/discoveryPort.js'
export class ManagerClient {
  constructor ({
    jest = false,
    managerIp,
    ip = 'http://127.0.0.1',
    worker = 'unnamed',
    hostname,
    port,
    publicKey,
    privateKey,
    meshPort,
    availableConnections,
    onConnected = () => { },
    log = console
  } = { ip: 'http://127.0.0.1', publicKey: 'not defined' }) {
    this.jest = jest // adjust adapter for jest environment
    this.log = log
    this.publicKey = publicKey
    this.managerIp = managerIp
    this.remoteIP = ip
    this.hostname = hostname
    setSecret(privateKey)
    this.meshPort = meshPort
    this.onConnected = onConnected
    this.autoReconnect = true
    this.availableConnections = availableConnections || new AvailableConnections()
    this.worker = worker
    if (!port) {
      this.discover()
    } else {
      this.connect({ port })
    }
  }

  destroy () {
    if (this.socket) {
      this.autoReconnect = false
      this.socket.off()
      this.socket.disconnect()
      this.socket = undefined
    }
  }

  async discover () {
    const ips = [this.managerIp]
    let success = false
    while (!success && ips.length) {
      // eslint-disable-next-line no-undef
      // process.stdout.write(`Checking ${ips.length} ips` + '\r')
      const ip = ips.pop()
      // console.log({ ip })
      try {
        const address = `${ip}:${discoveryPort}`
        const toSend = {
          headers: {
            discovery_key: this.publicKey
          },
          timeout: 2000
        }
        if (this.jest) toSend.adapter = http
        // console.log({ address, toSend });
        const res = await axios.get(address, toSend)
        // console.log({res})
        if (res.data) res.data = decrypt(res.data)
        if (res.data && res.data.port) {
          if (!success) this.connect({ port: res.data.port })
          success = true
        }
      } catch (e) {
        console.error(e)
        this.log.error(e.message)
      }
    }
    // if (!success) throw new Error('Cannot discover the socket manager')
  }

  connect ({ port }) {
    this.log.log(`Connect socket to ${this.managerIp}:${port}`)
    try {
      this.autoReconnect = true
      this.socket = client(`${this.managerIp}:${port}`, { rejectUnauthorized: false, transports: ['websocket'] })

      this.socket.on('connect', () => { this.declareMyself() })

      this.socket.on('addnode', (data) => {
        data = decrypt(data)
        // if (this.worker === 'nodeA') this.log.info(data)
        // console.log({addnode:data})
        data.forEach(connection => {
          this.availableConnections.addConnection(connection)
        })
        // console.log(availableConnections)
      })

      this.socket.on('removenode', (data) => {
        data = decrypt(data)
        this.availableConnections.dropConnection(data)
        // console.log(availableConnections)
      })

      this.socket.on('error', (data) => {
        const decrypted = decrypt(data)
        if (decrypted.message) {
          this.log.error(new Error(data.message))
        }
      })

      this.socket.on('connect_error', (err) => {
        this.log.error(err)
      })

      this.socket.on('reconnection_attempt', () => {
        this.log.debug('Attempting a reconnection')
      })

      this.socket.on('disconnect', (reason) => {
        this.log.warn(new Error(`disconnect - ${reason}`))
        if (!port) {
          setTimeout(() => {
            this.discover()
          }, 2000)
        } else {
          this.socket.connect()
        }
      })
    } catch (e) {
      console.error(e.message)
    }
  }

  declareMyself () {
    this.log.log(`Declaring myself as ${this.worker}`)
    this.socket.on('declared', data => {
      this.declared(decrypt(data))
    })
    this.socket.emit('declare', encrypt({ worker: this.worker, port: this.meshPort, hostname: this.hostname }))
  }

  declared ({ worker, clientId }) {
    this.log.log({ declared: { worker, clientId } })
    this.onConnected({ worker, clientId })
  }
}
export default ManagerClient
