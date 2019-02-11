import {mesh} from '../index.mjs';
import {schema} from '../example/schema.mjs';
mesh.schema=schema;
import {test} from './methods'
const app = global.app={
    schema,
    mesh,
    test,
    start:async () => {
        console.log(Object.keys(app.schema).join(","))
        await app.mesh.start('nodeA');
        //await this.mesh.start('nodeB');
    }
}
app.start()