import { jest, beforeAll, afterEach, afterAll, expect, test } from '@jest/globals'
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

const nodes = {
  nodeB: [],
  nodeA: [],
  centralNode: null
}
const createClient = async ({ worker = 'nodeA', variant } = { worker: 'nodeA' }) => {
  const workerSchema = await schema(worker)
  const connectedNode = await new Promise((resolve) => {
    const node = new SocketNode({
      // redis: {
      //   host: '127.0.0.1',
      //   port: 6379
      // },
      logLevel: levels.ERROR,
      jest: true,
      worker,
      variant,
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
  if (!nodes[worker]) nodes[worker] = []
  nodes[worker].push(connectedNode)
  return connectedNode
}
const createNodes = async () => {
  const nodeB1 = await createClient({ worker: 'nodeB', variant: 'testNodeB' })
  const nodeB2 = await createClient({ worker: 'nodeB' })
  const nodeA = await createClient({ worker: 'nodeA', variant: 'testNodeA' })
  await new Promise((resolve, reject) => {
    waitFor(() => {
      return nodeA.connections.connections.length > 1 && nodeB2.connections.connections.length > 1 && nodeB1.connections.connections.length > 1
    }, resolve)
  })
  return {
    nodeB1,
    nodeB2,
    nodeA
  }
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
  while (nodes.nodeA.length) {
    const node = nodes.nodeA.shift()
    node.destroy()
  }
  while (nodes.nodeB.length) {
    const node = nodes.nodeB.shift()
    node.destroy()
  }
  jest.clearAllMocks()
})
afterAll(() => {
  // const firstNode = nodes.nodeA[0]
  nodes.centralNode.destroy()
  delete nodes.centralNode
})

test('Create a nodeB worker that listens', async (done) => {
  const connection = await createClient({ worker: 'nodeB' })
  // await new Promise((resolve, reject) => {
  //   waitFor(() => {
  //     return !!(connection.meshServer && connection.meshServer.listening)
  //   }, resolve)
  // })
  log.log(connection.meshServer.connections.connections.map(con => con.worker))
  expect(connection.meshServer.listening).toBeTruthy()
  done()
})
test('Create a nodeB worker that registers on the manager with Variant', async (done) => {
  const variant = 'testNodeB'
  const connection = await createClient({ worker: 'nodeB', variant })
  // await new Promise((resolve, reject) => {
  //   waitFor(() => {
  //     return !!(connection.meshServer && connection.meshServer.listening)
  //   }, resolve)
  // })
  const connections = nodes.centralNode.connections()
  const variants = Object.keys(connections.nodeB).map(client => connections.nodeB[client].variant)
  expect(variants.includes(variant)).toBeTruthy()
  log.log(connection.meshServer.connections.connections.map(con => con.variant))
  expect(connection.meshServer.listening).toBeTruthy()
  done()
})

test('Create a nodeA worker that registers on the manager and connects to NodeB', async (done) => {
  await createClient({ worker: 'nodeB', variant: 'testNodeB' })
  const connection = await createClient({ worker: 'nodeA', variant: 'testNodeA' })
  // await new Promise((resolve, reject) => {
  //   waitFor(() => {
  //     return !!(connection.meshServer && connection.meshServer.listening && connection.meshServer.connections.connections.length > 0)
  //   }, resolve)
  // })
  log.log(connection.meshServer.connections.connections.map(con => con.worker))
  expect(connection.meshServer.connections.connections.map(con => con.worker)).toContain('nodeB')
  done()
})

test('Create a nodeB worker that registers on the manager and connects to another nodeB', async (done) => {
  await createClient({ worker: 'nodeB' })
  const connection = await createClient({ worker: 'nodeB' })

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
  await createClient({ worker: 'nodeB', variant: 'testNodeB' })
  await createClient({ worker: 'nodeA', variant: 'testNodeA' })

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
  const {
    nodeB1,
    nodeB2,
    nodeA
  } = await createNodes()

  const connections = nodes.centralNode.connections()
  // nodes.nodeA.getConnection()
  // console.log({ nodes })
  expect(Object.keys(connections.nodeB).length).toBe(2)
  expect(Object.keys(connections.nodeA).length).toBe(1)
  done()
})

test('Is nodeA connected to both nodeBs', async (done) => {
  const {
    nodeB1,
    nodeB2,
    nodeA
  } = await createNodes()
  expect(nodeA.connections.connections.length).toBe(2)
  expect(nodeB1.connections.connections.length).toBe(2)
  done()
})

test('Is nodeA connected to both nodeBs and then drops one of them', async (done) => {
  const {
    nodeB1,
    nodeB2: toRemove,
    nodeA: toCheck
  } = await createNodes()
  // await createClient({ worker: 'nodeB', variant: 'testNodeB' })
  // const toRemove = await createClient({ worker: 'nodeB' })
  // const toCheck = await createClient({ worker: 'nodeA', variant: 'testNodeA' })
  expect(toCheck.connections.connections.length).toBe(2)
  try {
    await toRemove.destroy()
  } catch (e) {
    console.error(e)
  }
  nodes.nodeB = nodes.nodeB.filter(n => n !== toRemove)

  await new Promise((resolve, reject) => {
    waitFor(() => {
      return toCheck.connections.connections.length < 2
    }, resolve)
  })

  expect(toCheck.connections.connections.length).toBe(1)
  done()
})

test('Is nodeA connected to both nodeBs and then drops one of them and then reconnects', async (done) => {
  const {
    nodeB1,
    nodeB2: toRemove,
    nodeA: toCheck
  } = await createNodes()
  expect(toCheck.connections.connections.length).toBe(2)

  await toRemove.destroy()

  nodes.nodeB = nodes.nodeB.filter(n => n !== toRemove)

  await new Promise((resolve, reject) => {
    waitFor(() => {
      return toCheck.connections.connections.length < 2
    }, resolve)
  })

  expect(toCheck.connections.connections.length).toBe(1)

  await createClient({ worker: 'nodeB' })
  expect(toCheck.connections.connections.length).toBe(2)

  done()
})

test('Does nodeA have the methods', async (done) => {
  const {
    nodeB1,
    nodeB2,
    nodeA
  } = await createNodes()
  // log.log(nodes.nodeA[0].methods)
  expect(nodeA.methods.sampleA !== undefined).toBeTruthy()
  expect(nodeA.methods.sampleB !== undefined).toBeTruthy()
  expect(nodeA.methods.queued !== undefined).toBeTruthy()
  done()
})
test('Is nodeB available to nodeA', async (done) => {
  const {
    nodeB1,
    nodeB2,
    nodeA
  } = await createNodes()
  const cons = nodeA.connections.connected('nodeB')
  // log.log(cons)
  const clientCommands = cons.filter(con => con.command)
  expect(cons.length).toBe(2)
  expect(cons.length === clientCommands.length).toBeTruthy()
  done()
})
test('Send balanced message from NodeA to a NodeB', async (done) => {
  const {
    nodeB1,
    nodeB2,
    nodeA
  } = await createNodes()
  nodeA.call.nodeB.sampleA.call({ test: 'data' })
  await new Promise((resolve, reject) => {
    waitFor(() => {
      return stubs.sampleA.mock.calls.length > 0
    }, resolve)
  })
  expect(stubs.sampleA.mock.calls.length).toBe(1)
  done()
}, 10000)
test('Send balanced message from NodeA to both NodeBs', async (done) => {
  const {
    nodeB1,
    nodeB2,
    nodeA
  } = await createNodes()
  nodeA.call.nodeB.sampleA.call({ test: 'data' })
  nodeA.call.nodeB.sampleA.call({ test: 'data' })
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
}, 10000)
test('Send broadcast message from NodeA to a NodeB with responses', async (done) => {
  const {
    nodeB1,
    nodeB2,
    nodeA
  } = await createNodes()
  await nodeA.call.nodeB.sampleB.call({ test: 'data' })

  // log.log({ responses })
  expect(stubs.sampleB.mock.calls.length).toBe(2)
  done()
}, 10000)

test('Send broadcast queued message from NodeA to a NodeB', async (done) => {
  const {
    nodeB1,
    nodeB2,
    nodeA
  } = await createNodes()
  await nodeA.call.nodeB.queued.call({ test: 'data' })

  await new Promise((resolve, reject) => {
    waitFor(() => {
      return stubs.queued.mock.calls.length > 0
    }, resolve)
  })
  expect(stubs.queued.mock.calls.length).toBe(2)
  done()
}, 10000)

test('Send balanced message from NodeB to a NodeA', async (done) => {
  const {
    nodeB1,
    nodeB2,
    nodeA
  } = await createNodes()
  await nodeB2.call.nodeA.sampleA.call({ test: 'data' })
  await new Promise((resolve, reject) => {
    waitFor(() => {
      return stubs.sampleA.mock.calls.length > 0
    }, resolve)
  })
  expect(stubs.sampleA.mock.calls.length).toBe(1)
  done()
}, 10000)

test('Send broadcast message from NodeB to NodeA with responses', async (done) => {
  const {
    nodeB1,
    nodeB2,
    nodeA
  } = await createNodes()
  await nodeB2.call.nodeA.sampleB.call({ test: 'data' })

  await new Promise((resolve, reject) => {
    waitFor(() => {
      return stubs.sampleB.mock.calls.length > 0
    }, resolve)
  })
  expect(stubs.sampleB.mock.calls.length).toBe(1)
  done()
}, 10000)

test('Send broadcast queued message from NodeB to NodeA', async (done) => {
  const {
    nodeB1,
    nodeB2,
    nodeA
  } = await createNodes()
  await nodeB1.call.nodeA.queued.call({ test: 'data' })

  await new Promise((resolve, reject) => {
    waitFor(() => {
      return stubs.queued.mock.calls.length > 0
    }, resolve)
  })
  expect(stubs.queued.mock.calls.length).toBe(1)
  done()
}, 10000)

test('NodeA can identify the connection NodeB with variant testNodeB', async (done) => {
  const {
    nodeB1,
    nodeB2,
    nodeA
  } = await createNodes()
  const variantConnection = nodeA.getConnection({
    worker: 'nodeB',
    variant: 'testNodeB'
  })
  expect(variantConnection.variant === 'testNodeB').toBeTruthy()
  done()
})
