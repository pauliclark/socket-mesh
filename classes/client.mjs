class client {
    constructor({identity,schema}) {
        this.identity=identity;
        this.schema={
            local:schema[identity],
            remote:{}
        };
        ((this.schema.local.connect instanceof Array)?this.schema.local.connect:[]).forEach(remote => {
            if (!schema[remote]) throw `${remote} node is not in the schema`
            if (remote!==identity) this.schema.remotes[remote]=schema[remote];
        })
        console.log(`${this.identity} client has been created`)
    }
}
export {client}
export default client