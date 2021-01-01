import { Manager, SocketNode } from '../index.js'
import waitFor from '../helpers/waitFor.js'
// import getPort from 'get-port'
import schema from './schema.js'
// import SocketNode from '../classes/socketNode.js'
import { contextLog } from '@pauliclark/log-context'

const publicKey = 'randomPublicKey'
const privateKey = 'randomPrivateKey'
const port = undefined

const log = contextLog('test')

let centralNode = null
const startManager = async () => {
  centralNode = new Manager({
    schema: await schema(),
    publicKey,
    privateKey,
    port
  })
}
startManager()

const createClient = async ({ worker = 'nodeA' }) => {
  const workerSchema = await schema(worker)
  // if (worker === 'nodeA') console.log(workerSchema[worker]._commands._broadcast)
  // if (worker === 'nodeA') console.log(JSON.stringify(workerSchema[worker],null,2))
  return new Promise((resolve) => {
    const node = new SocketNode({
      redis: {
        host: '127.0.0.1',
        port: 6379
      },
      worker,
      schema: workerSchema,
      publicKey,
      privateKey,
      onConnected: () => {
        resolve(node)
      }

    })
  })
}
waitFor(() => {
  return centralNode && centralNode.listening
}, async () => {
  const firstNode = await createClient({ worker: 'nodeB' })
  setTimeout(async () => {
    createClient({ worker: 'nodeA' })
    createClient({ worker: 'nodeB' })
  }, 500)
  setTimeout(async () => {
    // console.log(firstNode.call)
    let count = 0
    const sendToQueue = i => {
      setTimeout(() => {
        log.log(`Sending broadcast queued ${i}`)
        firstNode.call.nodeA.queued.call({
          data: `Call number ${i}`
        })
      }, 10)
    }
    while (count < 5) {
      sendToQueue(1 * count++)
    }
    log.log('Sending broadcast sampleB')
    const response = await firstNode.call.nodeA.sampleB.call({
      data: 'random stuff'
    })
    log.log({ response })
  }, 5000)
  // setTimeout(async () => {
  //     const con = await createClient({ worker: 'nodeA' })
  //     setTimeout(() => {
  //         con.managerClient.disconnect()
  //     }, 1000)
  // }, 5000)
  // setTimeout(() => {
  //     createClient({ worker: 'nodeB' })
  // }, 10000)
})
