//require("babel/register")
let {mesh} = require('../index.js')
const {schema} = require( '../example/schema.js')
mesh.schema=schema
mesh.logger=console
const {test} = require('./methods.js')
const app = global.app={
    schema,
    mesh,
    test,
    start:async function() {
        console.log(`Schemas ${Object.keys(this.schema).join(",")}`)
        await this.mesh.start('nodeA')
        await this.mesh.start('nodeB')
        await this.mesh.start('nodeC')
    }
}
app.start()