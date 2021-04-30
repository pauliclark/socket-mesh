import { jest } from '@jest/globals'
import SocketNode from '../classes/socketNode.js'
import Manager from '../classes/manager/manager.js'
import waitFor from '../helpers/waitFor.js'
import schema from './schema.js'
import { contextLog, levels } from '@pauliclark/log-context'
import stubs from './methods/commands/stubs'
const publicKey = 'randomPublicKey'
const privateKey = 'randomPrivateKey'
const port = undefined

const log = contextLog('test', levels.ERROR)
Object.keys(stubs).forEach(stub => {
  stubs[stub] = jest.fn()
})

const createClient = async ({ worker = 'nodeA' }) => {
  const workerSchema = await schema(worker)
  return new Promise((resolve) => {
    const node = new SocketNode({
      // redis: {
      //   host: '127.0.0.1',
      //   port: 6379
      // },
      logLevel: levels.ERROR,
      jest: true,
      worker,
      schema: workerSchema,
      publicKey,
      privateKey,
      onConnected: () => {
        waitFor(() => {
          return !!(node.meshServer && node.meshServer.listening)
        }, () => { resolve(node) })
      }

    })
  })
}
const nodes = {
  nodeB: [],
  nodeA: [],
  centralNode: null
}
const startManager = async () => {
  nodes.centralNode = new Manager({
    schema: await schema(),
    logLevel: levels.ERROR,
    publicKey,
    privateKey,
    port
  })
}
beforeAll(async (done) => {
  startManager()
  await new Promise((resolve, reject) => {
    waitFor(() => {
      return nodes.centralNode && nodes.centralNode.listening
    }, resolve)
  })
  log.log('Manager started')
  done()
})
afterEach(() => {
  jest.clearAllMocks()
})
afterAll(() => {
  const firstNode = nodes.nodeA[0]
  nodes.nodeA[0].destroy()
  nodes.nodeB[1].destroy()
  nodes.nodeB[0].destroy()
  nodes.centralNode.destroy()
  delete nodes.nodeA[0]
  delete nodes.nodeB[1]
  delete nodes.nodeB[0]
  delete nodes.centralNode
})

test('Create a nodeB worker that registers on the manager', async (done) => {
  const connection = await createClient({ worker: 'nodeB' })
  nodes.nodeB.push(connection)
  // await new Promise((resolve, reject) => {
  //   waitFor(() => {
  //     return !!(connection.meshServer && connection.meshServer.listening)
  //   }, resolve)
  // })
  log.log(connection.meshServer.connections.connections.map(con => con.worker))
  expect(connection.meshServer.listening).toBeTruthy()
  done()
})

test('Create a nodeA worker that registers on the manager and connects to NodeB', async (done) => {
  const connection = await createClient({ worker: 'nodeA' })
  nodes.nodeA.push(connection)
  // await new Promise((resolve, reject) => {
  //   waitFor(() => {
  //     return !!(connection.meshServer && connection.meshServer.listening && connection.meshServer.connections.connections.length > 0)
  //   }, resolve)
  // })
  log.log(connection.meshServer.connections.connections.map(con => con.worker))
  expect(connection.meshServer.connections.connections.map(con => con.worker)).toContain('nodeB')
  done()
})

test('Create a nodeB worker that registers on the manager', async (done) => {
  const connection = await createClient({ worker: 'nodeB' })
  nodes.nodeB.push(connection)
  await new Promise((resolve, reject) => {
    waitFor(() => {
      return connection.meshServer.connections.connections.length > 0
    }, resolve)
  })
  log.log(connection.meshServer.connections.connections.map(con => con.worker))
  expect(connection.meshServer.connections.connections.map(con => con.worker)).toContain('nodeB')
  done()
})

test('Check nodeA commands exists for NodeB', async (done) => {
  // nodes.nodeA[0].call.nodeB.sampleA({ test: 'data' })

  await new Promise((resolve, reject) => {
    waitFor(() => {
      return !!nodes.nodeA[0].call.nodeB
    }, resolve)
  })
  // log.log(Object.keys(nodes.nodeA[0].call))
  expect(Object.keys(nodes.nodeA[0].call)).toContain('nodeB')
  // log.log(Object.keys(nodes.nodeA[0].call.nodeB))
  expect(Object.keys(nodes.nodeA[0].call.nodeB)).toContain('sampleA')
  done()
})

test('Are 3 nodes connected to the Manager', async (done) => {
  const connections = nodes.centralNode.connections()
  expect(Object.keys(connections.nodeB).length).toBe(2)
  expect(Object.keys(connections.nodeA).length).toBe(1)
  done()
})

test('Is nodeA connected to both nodeBs', async (done) => {
  expect(nodes.nodeA[0].connections.connections.length).toBe(2)
  done()
})

test('Does nodeA have the methods', async (done) => {
  log.log(nodes.nodeA[0].methods)
  expect(nodes.nodeA[0].methods.sampleA !== undefined).toBeTruthy()
  expect(nodes.nodeA[0].methods.sampleB !== undefined).toBeTruthy()
  expect(nodes.nodeA[0].methods.queued !== undefined).toBeTruthy()
  done()
})
test('Is nodeB available to nodeA', async (done) => {
  const cons = nodes.nodeA[0].connections.connected('nodeB')
  // log.log(cons)
  const clientCommands = cons.filter(con => con.command)
  expect(cons.length).toBe(2)
  expect(cons.length === clientCommands.length).toBeTruthy()
  done()
})
test('Send balanced message from NodeA to a NodeB', async (done) => {
  nodes.nodeA[0].call.nodeB.sampleA.call({ test: 'data' })
  await new Promise((resolve, reject) => {
    waitFor(() => {
      return stubs.sampleA.mock.calls.length > 0
    }, resolve)
  })
  expect(stubs.sampleA.mock.calls.length).toBe(1)
  done()
})
test('Send balanced message from NodeA to both NodeBs', async (done) => {
  nodes.nodeA[0].call.nodeB.sampleA.call({ test: 'data' })
  nodes.nodeA[0].call.nodeB.sampleA.call({ test: 'data' })
  await new Promise((resolve, reject) => {
    waitFor(() => {
      return stubs.sampleA.mock.calls.length > 1
    }, resolve)
  })
  expect(stubs.sampleA.mock.calls.length).toBe(2)
  // log.log(stubs.sampleA.mock.calls.map(call => call[0].variant))
  // log.log(stubs.sampleA.mock.calls.map(call => call[0].worker))
  expect(stubs.sampleA.mock.calls[0][0].variant !== stubs.sampleA.mock.calls[1][0].variant).toBeTruthy()
  done()
})
test('Send broadcast message from NodeA to a NodeB with responses', async (done) => {
  const responses = await nodes.nodeA[0].call.nodeB.sampleB.call({ test: 'data' })

  // log.log({ responses })
  expect(stubs.sampleB.mock.calls.length).toBe(2)
  done()
})
test('Send broadcast queued message from NodeA to a NodeB', async (done) => {
  await nodes.nodeA[0].call.nodeB.queued.call({ test: 'data' })

  await new Promise((resolve, reject) => {
    waitFor(() => {
      return stubs.queued.mock.calls.length > 0
    }, resolve)
  })
  expect(stubs.queued.mock.calls.length).toBe(2)
  done()
})
test('Send balanced message from NodeB to a NodeA', async (done) => {
  nodes.nodeB[0].call.nodeA.sampleA.call({ test: 'data' })
  await new Promise((resolve, reject) => {
    waitFor(() => {
      return stubs.sampleA.mock.calls.length > 0
    }, resolve)
  })
  expect(stubs.sampleA.mock.calls.length).toBe(1)
  done()
})
test('Send broadcast message from NodeB to NodeA with responses', async (done) => {
  const responses = await nodes.nodeB[0].call.nodeA.sampleB.call({ test: 'data' })

  log.log({ responses })
  expect(stubs.sampleB.mock.calls.length).toBe(1)
  done()
})
test('Send broadcast queued message from NodeB to NodeA', async (done) => {
  await nodes.nodeB[0].call.nodeA.queued.call({ test: 'data' })

  await new Promise((resolve, reject) => {
    waitFor(() => {
      return stubs.queued.mock.calls.length > 0
    }, resolve)
  })
  expect(stubs.queued.mock.calls.length).toBe(1)
  done()
})
