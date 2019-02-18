//require("babel/register");
const { client } = require('./classes/client.js')
const { server } = require('./classes/server.js')
const { promiser } = require('./classes/wrappers/promiser.js')
module.exports = {
    mesh: {
        schema: {},
        servers: {},
        httpserver:null,
        clients: {},
        logger: require('./classes/logger.js'),
        promiser: null,
        start: async function (identity) {
            if (!this.promiser) this.promiser = new promiser();
            try {
                if (!this.schema[identity]) throw `${identity} is not defined in the mesh schema`
                if (this.schema[identity].allow !== undefined) {
                    if (this.servers[identity]) throw `Server ${identity} already started`
                    this.servers[identity] = new server({
                        logger: this.logger,
                        identity,
                        schema: this.schema,
                        promiser: this.promiser,
                        httpserver: this.httpserver
                    });
                }
                if (this.schema[identity].connect instanceof Array) {
                    if (this.clients[identity]) throw `Client ${identity} already started`
                    //this.logger.log(this.schema[identity].connect);
                    this.schema[identity].connect.forEach(function(server) {
                        this.logger.log(`Client ${identity} for ${server}`);
                        this.clients[identity]=new client({
                            logger:this.logger,
                            identity,
                            server,
                            schema:this.schema,
                            promiser:this.promiser
                        });
                    }.bind(this))
                }
            } catch (e) {
                console.error(e);
            }
        }
    }
}