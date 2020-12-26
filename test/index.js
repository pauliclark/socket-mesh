import { Manager } from '../index.js'
import waitFor from '../helpers/waitFor.js'
// import getPort from 'get-port'
import schema from './schema.js'
import SocketNode from '../classes/socketNode.js'

const publicKey = 'randomPublicKey'
const privateKey = 'randomPrivateKey'
const port = undefined

const centralNode = new Manager({
    schema,
    publicKey,
    privateKey,
    port
})

const createClient = async ({ worker = 'nodeA' }) => {
    return new Promise((resolve) => {
      
    const node =  new SocketNode({
        worker,
        schema,
        publicKey,
        privateKey,
        onConnected:() => {
            resolve(node)
        }

    })  
})
}
waitFor(() => {
    return centralNode.listening
}, async () => {
    createClient({ worker: 'nodeB' })
    setTimeout(async () => {
        createClient({ worker: 'nodeA' })
    },500)
    // setTimeout(async () => {
    //     createClient({ worker: 'nodeB' })
    // },1000)
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
