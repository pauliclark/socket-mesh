# socketmesh
A libraries that utilises socketio to build and manage inter-node communications over sockets with response management

To accomodate node identification, access control and broadcast/balancing, a Master Node needs to be created.

## Master Node

The Master Node is connected to by every node attached to the network. It will then register each node worker and record the variant (for broadcast or load-balancing).

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

As the Mesh encrypts the content over socket, therefore Public and Private keys must be defined. These keys must be the same for all connected nodes. These keys can be any string you wish.


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
      port: process.env.MASTER_SOCKET_PORT,
      ip: process.env.MASTER_HOST,
      meshPort: process.env.LOCAL_SOCKET_PORT,
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

The Schema defines which Nodes can access which other Nodes. The Manager Node then registers each attached Node, and then informs any new or existing attaching Nodes, which other Nodes it can access, and what the ip/address and port is for the connection to be established.

As each Node loads the Schema, each individual Node knows what methods it can call.

To call a method on another Node, (using the example above), says 'NodeA' calls the 'status' method on 'NodeB', where NodeA is the instance of the 'SocketNode'.

```javascript
NodeA.call.NodeB.status.call({
  test:'data'
}).then(({status}) => {
  console.log(status)
})
```

A basic Schema may look like this:
```javascript
  {

    NodeA: {
      _allow: 'anyNode',
      _connect: ['nodeB'],
      _commands: {
        _balanced: {
          sampleRespondingMethod: ({test}) => {
            return { command: test }
          }
        },
        _broadcast: {
          sampleRespondingBroadcastMethod: {
            responds: true,
            method: ({test}) => {
              return { command: test }
            }
          },
          sampleQueuedBroadcastMethod: {
            queued: true,
            method: ({test}) => {
              console.log({ command: test })
            }
          }
        }
      }
    },

    NodeB: {
      _allow: ['nodeB'],
      _connect: ['NodeA'],
      _commands: {
        _balanced: {
          sampleRespondingMethod: ({test}) => {
            return { command: test }
          }
        },
        _broadcast: {
          sampleRespondingBroadcastMethod: {
            responds: true,
            method: ({test}) => {
              return { command: test }
            }
          },
          sampleQueuedBroadcastMethod: {
            queued: true,
            method: ({test}) => {
              console.log({ command: test })
            }
          }
        }
      }
    }

  }
```

***_allow***

_allow lists the Node names that this Node will allow a connection from.
If set to the string 'anyNode', then all connection will be allowed.

***_connect***

_connect lists the Node names that this Node will connect to.

***_commands***

The _commands definition is where each method is defined, by the following:

****_balanced****

'_balanced' methods are only requested from the defined Node name once. If there more than one Node attached, then a simple balancing is performed, where each Node attached, receives the methods request sequentially through the list of attached Node.

'_balanced' methods expect there to be a response

****_broadcast****

'_broadcast' methods are sent to all attached Nodes for this Node Name. There the behaviour of the methods needs to be defined.

*****responds*****

Optional parameter for the method, which when true, then the requests responds and all values from the broadcast request are returned in an Array.

*****queued*****

Optional parameter for the method, which when true, then puts the request in to a queue. The methods will then be performed on each 'shifted' request.

If a Redis connection has been defined in the constructor of the SocketNode, then Redis will be used for the queue. If not, then an array is kept in memory. This is obviously not suitable for very heavy methods. Therefore, a Redis connection is preferable.