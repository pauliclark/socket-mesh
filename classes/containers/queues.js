
import RedisSMQ from 'rsmq'
import { contextLog } from '@pauliclark/log-context'
let lastId = 0
const log = contextLog('queue', 'trace')
class SMQ {
  constructor () {
    this.queues = {}
  }

  createQueue ({ qname }, callback) {
    log.info(`Queue ${qname} being created`)
    if (!this.queues[qname]) this.queues[qname] = []
    callback(null, 1)
  }

  deleteQueue ({ qname }, callback) {
    if (!this.queues[qname]) return callback(new Error(`Cannot delete non-existant queue ${qname}`), null)
    delete this.queues[qname]
    callback(null, 1)
  }

  popMessage ({ qname }, callback) {
    if (!this.queues[qname]) return callback(new Error(`Queue ${qname} does not exist`), null)
    if (this.queues[qname].length) return callback(null, this.queues[qname].shift())
    return callback(null, null)
  }

  sendMessage ({ qname, message }, callback) {
    if (!this.queues[qname]) return callback(new Error(`Queue ${qname} does not exist`), null)
    this.queues[qname].push({ id: lastId++, message })
    return callback(null, null)
  }
}
const createQueueEngine = ({ host, port, ns = 'rsmq' }) => {
  const queue = (host && port)
    ? new RedisSMQ({
        host,
        port,
        ns
      })
    : new SMQ()
  return queue
}
class Queue {
  constructor (name, engine, payloadProcessor) {
    this.name = name
    this.busy = false
    this.engine = engine
    this.payloadProcessor = payloadProcessor
    setTimeout(() => {
      this.getPayloadOffQueue()
    }, 1000)
  }

  async getPayloadOffQueue () {
    return new Promise((resolve, reject) => {
      this.engine.popMessage({ qname: this.name }, async (err, resp) => {
        try {
          if (err) return reject(err)
          if (resp && resp.id) {
          // console.log('message', resp.message)
            log.info(`${this.name} retrieved item ${resp.id}`)
            await this.processPayload(JSON.parse(resp.message))
          } else {
            log.info(`${this.name} queue is empty`)
            this.busy = false
          }
        } catch (e) {
          log.error(`${this.name} failed with message ${e.message}`)
          this.busy = false
        }
        resolve(this.busy)
        if (this.busy) {
          setTimeout(() => {
            this.getPayloadOffQueue()
          }, 0)
        }
      })
    })
  }

  async processPayload (payload) {
    // log.warn(payload)
    this.payloadProcessor(...payload)
  }

  add (...message) {
    if (this.busy) {
      this.engine.sendMessage({ qname: this.name, message: JSON.stringify(message) }, function (err, res) {
        if (err) log.error(err)
      })
    } else {
      this.processPayload(message)
    }
  }

  clear () {
    this.engine.deleteQueue({ qname: this.name }, (err, resp) => {
      if (err) log.error(`${this.name} could not be deleted`)
      if (!err && resp === 1) {
        log.info(`${this.name} queue deleted`)

        this.engine.createQueue({ qname: this.name }, function (err, resp) {
          if (err) log.warn(`${this.name} already exists - using the existing`)
          if (resp === 1) {
            log.info(`${this.name} queue created`)
          }
        })
      }
    })
  }
}
class QueueEngine {
  constructor ({ host, port, ns }) {
    this.engine = createQueueEngine({ host, port, ns })
    // console.log(this.engine)
    this.queues = {}
  }

  async create (name, payloadProcessor) {
    return new Promise((resolve, reject) => {
      if (this.queues[name]) return resolve(this.queues[name])
      this.engine.createQueue({ qname: name }, (err, resp) => {
        if (err && err.message !== 'Queue exists') {
          reject(err)
        } else {
          this.queues[name] = new Queue(name, this.engine, payloadProcessor)
          resolve(this.queues[name])
        }
      })
    })
  }
}
let engine = null

export const initialiseQueue = ({ host, port, ns = 'rsmq' } = {}) => {
  if (!engine) engine = new QueueEngine({ host, port, ns })
}
export const createQueue = (name, payloadProcessor) => {
  if (!engine) initialiseQueue()
  return engine.create(name, payloadProcessor)
}
