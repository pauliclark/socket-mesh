import { Manager } from '../index.js'
import waitFor from '../helpers/waitFor.js'
// import getPort from 'get-port'
import schema from './schema.js'
import SocketNode from '../classes/socketNode.js'

const publicKey = 'randomPublicKey'
const privateKey = 'randomPrivateKey'
const port = undefined

let centralNode = null
const startManager = async () => {
    centralNode = new Manager({
    schema:await schema(),
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
      
        const node =  new SocketNode({
            worker,
            schema:workerSchema,
            publicKey,
            privateKey,
            onConnected:() => {
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
        // createClient({ worker: 'nodeB' })
    },500)
    setTimeout(async () => {
        // console.log(firstNode.call)
        const response = await firstNode.call.nodeA.sampleB.callPromise({
            data:'random stuff'
        })
        console.log(response)
    },5000)
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
