import { anyNode } from '../constants/identifiers.js'
import Balanced from './commands/balanced.js'
import Broadcast from './commands/broadcast.js'
import wrapCommandsSchema from './commands/incomingCommand.js'
export default class Schema {
  constructor (schema, log) {
    // console.log('constructor', schema.nodeA._commands._broadcast)
    this.log = log
    this.schema = schema
  }

  validWorker (worker) {
    return !!this.schema[worker]
  }

  allow (from, to) {
    if (!this.validWorker(from)) throw new Error(`${from} is not a valid worker`)
    if (!this.validWorker(to)) throw new Error(`${to} is not a valid worker`)
    const isConnect = (this.schema[from]._connect &&
      (this.schema[from]._connect === anyNode ||
        this.schema[from]._connect.includes(to)
      ))
    const isAllow = (this.schema[to]._allow &&
      (this.schema[to]._allow === anyNode ||
        this.schema[to]._allow.includes(from)
      ))
    // console.log({from, to, isConnect, isAllow})
    return isConnect && isAllow
  }

  buildCommands (socketNode) {
    const thisWorker = socketNode.worker
    const commands = {}
    const workers = Object.keys(this.schema)
    const thisSchema = this.schema[thisWorker]
    workers.forEach(worker => {
      const schema = this.schema[worker]
      if (thisSchema._allow === anyNode || thisSchema._connect === anyNode ||
        (thisSchema._allow instanceof Array && thisSchema._allow.includes(worker)) ||
        (thisSchema._connect instanceof Array && thisSchema._connect.includes(worker))
      ) {
        // this worker does connect with other [worker]
        commands[worker] = {}
        if (schema._commands?._balanced) {
          Object.keys(schema._commands._balanced).forEach(command => {
            const definition = schema._commands._balanced[command] || {}
            commands[worker][command] = new Balanced({ worker, command, responds: definition.responds, socketNode, log: this.log })
          })
        }
        if (schema._commands?._broadcast) {
          // this.log.log({ broadcast: schema._commands._broadcast })
          Object.keys(schema._commands._broadcast).forEach(command => {
            const definition = schema._commands._broadcast[command] || {}
            // console.log({ [command]: definition })
            if (commands[worker][command]) throw new Error(`Worker ${worker} has the command ${command} as a broadcast and a balanced method`)
            commands[worker][command] = new Broadcast({ worker, command, responds: definition.responds, socketNode, log: this.log })
          })
        }
      }
    })
    return commands
  }

  getMethods (socketNode) {
    const { worker } = socketNode
    if (!this.schema[worker]) throw new Error(`Schema for worker ${worker} is not defined`)
    // console.log('getMethods', worker, this.schema[worker]._commands._broadcast)
    // if (worker === "nodeA") console.log(worker, this.schema[worker]._commands._broadcast)
    return wrapCommandsSchema(socketNode, { ...this.schema[worker]._commands._broadcast, ...this.schema[worker]._commands._balanced })
  }

  getCommands (worker) {
    if (!this.schema[worker]) throw new Error(`Schema for worker ${worker} is not defined`)
    // console.log('getCommands', worker, this.schema[worker]._commands._broadcast)
    // if (worker === "nodeA") console.log(worker, this.schema[worker]._commands._broadcast)
    return { ...this.schema[worker]._commands._broadcast, ...this.schema[worker]._commands._balanced }
  }
}
