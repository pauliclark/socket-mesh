const {methods} = require('./methods/nodeC.js')
module.exports = {
    nodeC:{
        "identity":'nodeB',
        address:
            {
                host:'localhost',
                port:'9012'
            }
        ,
        allow:['nodeA','nodeB'], // undefined = nodeA will be a client | null = nodeA is a server and accepts all clients | array = nodeA will only accept sockets from these client identities
        connect:[], // undefined = nodeA will be a client | null = nodeA is a server and accepts all clients | array = nodeA will only accept sockets from these client identities
        methods 
    }
}