class server {
    constructor({identity,schema}) {
        this.identity=identity;
        this.schema={
            local:schema[identity],
            remote:{}
        };
        ((this.schema.local.allow instanceof Array)?this.schema.local.allow:Object.keys(schema)).forEach(remote => {
            if (!schema[remote]) throw `${remote} node is not in the schema`
            if (remote!==identity) this.schema.remotes[remote]=schema[remote];
        })
        console.log(`${this.identity} server has been created`)
    }
}
export {server}
export default server