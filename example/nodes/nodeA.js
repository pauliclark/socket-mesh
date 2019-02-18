const {methods} = require('./methods/nodeA.js')
module.exports = {
    nodeA:{
        "identity":'nodeA',
        address:
            {
                host:'localhost',
                port:'9010'
            }
        ,
        allow:['nodeB'], // undefined = nodeA will be a client | null = nodeA is a server and accepts all clients | array = nodeA will only accept sockets from these client identities
        connect:['nodeC'], // undefined = nodeA will be a client | null = nodeA is a server and accepts all clients | array = nodeA will only accept sockets from these client identities
        methods 
    }
}