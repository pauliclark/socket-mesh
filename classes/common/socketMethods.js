
import { encrypt, decrypt } from '../../helpers/parser.js'
import {
  emitPromise,
  promiseResponded
} from '../containers/emitPromise.js'

const socketMethods = (socket, methods, commands, { log = console, connections } = {}) => {
  socket.on('connect_error', (error) => {
    // console.log(socket)
    log.error(error.message)
  })
  socket.on('reconnect', (attemptNumber) => {
    log.info({ attemptNumber })
  })
  socket.on('connect_timeout', (timeout) => {
    log.info({ timeout })
  })

  socket.on('error', (data) => {
    data = decrypt(data)
    if (data.message) {
      log.error(new Error(data.message))
    } else {
      log.error(data)
    }
  })

  socket.on('response', async data => {
    data = decrypt(data)
    if (data.uid) {
      promiseResponded(data)
    }
  })
  socket.on('command', async data => {
    data = decrypt(data)

    // log.log({ called: Object.keys(data) })
    // console.log({commands:this.commands})
    if (methods) {
      const uid = data.uid
      delete data.uid
      if (uid) {
        const response = {}
        await Promise.all(Object.keys(data).map(async command => {
          const method = methods[command]
          // console.log({method})
          if (typeof method === 'function') {
            response[command] = await method(data)
          } else {
            this.log.error(new Error(`Command ${command} is not defined`))
            response[command] = `Command ${command} is not defined`
          }
        }))
        socket.emit('response', encrypt({
          uid,
          ...response
        }))
      } else {
        Object.keys(data).forEach(command => {
          const method = methods[command]
          // console.log({method})
          if (typeof method === 'function') {
            method(data)
          } else {
            log.error(new Error(`Command ${command} is not defined`))
          }
        })
      }
    }
    // log.log(data)
  })

  socket.on('disconnect', () => {
    if (connections && connections.dropClient) connections.dropClient(socket)
    // this.log.log(`${this.identity.worker} disconnecting from ${address}`)
  })

  const commandResponse = (command, data) => {
    const { uid, promise } = emitPromise({ socket, command })
    // log.log(`Emitting ${command} from server and awaiting response`, data)
    socket.emit('command', encrypt({
      uid,
      [command]: data
    }))
    return promise
  }

  const command = (command, data) => {
    // log.log(`Emitting ${command} from server`, data)
    socket.emit('command', encrypt({
      [command]: data
    }))
  }
  return {
    commandResponse,
    command
  }
}

export default socketMethods
