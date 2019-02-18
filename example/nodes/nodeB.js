const {methods} = require('./methods/nodeB.js')
module.exports = {
    nodeB:{
        "identity":'nodeB',
        address:
            {
                host:'localhost',
                port:'9011'
            }
        ,
        //allow:['nodeB'], // undefined = nodeA will be a client | null = nodeA is a server and accepts all clients | array = nodeA will only accept sockets from these client identities
        connect:['nodeA','nodeC'], // undefined = nodeA will be a client | null = nodeA is a server and accepts all clients | array = nodeA will only accept sockets from these client identities
        methods 
    }
}