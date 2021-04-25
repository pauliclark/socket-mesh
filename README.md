# socket-mesh
A libraries that utilises socketio to build and manage inter-node communications over sockets with response management

To accomodate node identification, access control and broadcast/balancing, a Master Node needs to be created.

## Master Node

In a dedicated node worker, you will need the schema you will defined to identify what commands, to which node(s) and how. This should be returned by function as described in [Schema](#schema).

```javascript
import { Manager } from 'socket-mesh'
import schema from './schema.js'
import { publicKey, privateKey } from './keys.js'
const port = process.env.MASTER_SOCKET_PORT || undefined

const nodes = {}
const startManager = async () => {
  nodes.masterNode = new Manager({
    schema: await schema(),
    publicKey,
    privateKey,
    port
  })
}
startManager()
```

This will start a master node that will listen on the port for Socket connections. 

If the Port is undefined, then an available port will be chosen, but a REST port will be opened for detecting the selected port for the socket. Though this is could be useful, it is not recommended if the port can be defined, as Docker & Kubenetes such environments make this difficult to work around.

As the Mesh encrypts the content over socket, a Public and Private keys must be defined. These keys must be the same for all connected nodes. These keys can be any string you wish.


## Client Nodes

Each node type has an identifier (string). This will define the access from the [Schema](#schema).



```javascript
import { SocketNode } from 'socket-mesh'
import schema from './schema.js'
import { publicKey, privateKey } from './keys.js'
export default async(worker) => {
  const workerSchema = await schema(worker)

  return new Promise((resolve) => {
    const node = new SocketNode({
      redis: {
        host: '127.0.0.1',
        port: 6379
      },
      logLevel: 'trace',
      managerHost: process.env.MASTER_HOST,
      port: process.env.MASTER_SOCKET_PORT,
      ip: process.env.MY_POD_IP ||'127.0.0.1',
      worker,
      schema: workerSchema,
      publicKey,
      privateKey,
      onConnected: () => {
        // Might be wise to create a wait routine to check for
        // !!(node.meshServer && node.meshServer.listening)
        // and then run resolve()
        // This identifies that the socketnode is listening for incoming connection from other nodes.
         resolve(node)
      },
      onConnection: connection => {
        // When a connection has been established between nodes
        console.log({ add: `${connection.worker} [${connection.variant}]` })

        // Possibly run a test request to the newly connected node which would have a 'status' method in the Schema
        node.call[connection.worker].status.call({ test: 'data' }).then(({ status }) => {
          console.log(status)
        })
      },
      onDisconnection: connection => {
        // When a connection has been dropped between nodes, maybe due to and issue or deployment.
        console.log({ drop: `${connection.worker} [${connection.variant}]` })
      }
    })
  })


}
```

## Schema