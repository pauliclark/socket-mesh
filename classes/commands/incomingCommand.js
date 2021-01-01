
import { createQueue } from '../containers/queues.js'
const commandWithResponse = (socketNode, name, method) => {
  if (!socketNode) throw new Error('socketNode in undefined')
  // console.log(`commandWithResponse ${name}`)
  return async (...args) => {
    return await method.bind(socketNode)(...args)
  }
}
const commandToQueue = async (socketNode, name, method) => {
  if (!socketNode) throw new Error('socketNode in undefined')
  // console.log(`commandToQueue ${name}`)
  const queue = await createQueue(name, method.bind(socketNode))
  return async (...args) => {
    queue.add(...args)
  }
}
const commandNoResponseNoQueue = (socketNode, name, method) => {
  if (!socketNode) throw new Error('socketNode in undefined')
  // console.log(`commandNoResponseNoQueue ${name}`)
  return method.bind(socketNode)
}

export const wrapCommandSchema = (socketNode, name, schema) => {
  if (typeof (schema) === 'function') return commandNoResponseNoQueue(socketNode, name, schema)
  if (typeof (schema.method) === 'function') {
    if (schema.responds) return commandWithResponse(socketNode, name, schema.method)
    if (schema.queued) return commandToQueue(socketNode, name, schema.method)
    return commandNoResponseNoQueue(socketNode, name, schema.method)
  }
  throw new Error(`Command ${name} is not a function or does not have a method defined`)
}
const wrapCommandsSchema = (socketNode, schemas) => {
  if (!socketNode) throw new Error('socketNode in undefined')
  const commands = {}
  Object.keys(schemas).forEach(async command => {
    commands[command] = await wrapCommandSchema(socketNode, command, schemas[command])
  })
  return commands
}
export default wrapCommandsSchema
