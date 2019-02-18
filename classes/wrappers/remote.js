class remote {
    constructor({identity,schema,promiser}) {
        this.identity=identity;
        this.promiser=promiser;
        this.methods={};
        Object.keys(schema).forEach(method => {
            if (schema[method].allow==null || schema[method].includes(identity)) {
                this.methods[method]=schema[method]
            }
        })
    }
    async send({method,payload}) {
        if (!this.methods[method]) return false
        
    }
}
module.exports = {remote}