import client from './classes/client.mjs'
import server from './classes/client.mjs'
const mesh={
    schema:{},
    servers:{},
    clients:{},
    start:async function(identity) {
        try{
            if (!this.schema[identity]) throw `${identity} is not defined in the mesh schema`
            if (this.schema[identity].allow!==undefined) {
                if (this.servers[identity]) throw `Server ${identity} already started`
                this.servers[identity]=new server({identity,schema:this.schema});
            }
            if (this.schema[identity].connect instanceof Array) {
                if (this.clients[identity]) throw `Client ${identity} already started`
                this.clients[identity]=new client({identity,schema:this.schema});
            }
        }catch(e) {
            console.error(e);
        }
    }
}
export {
    mesh
}
export default mesh