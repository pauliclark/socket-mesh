class promiser {
    constructor() {
        this.promises={};
        this.uuids={};
        this.chars='abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    }
    uuid() {
        let key=this.randomisedKeys();
        while(this.uudis[key]) key=this.randomisedKeys();
        this.uuids[key]=true;
        return key;
    }
    randomisedKeys({length}) {
        length=length || 5;
        let key='';
        while(key.length<length) key=key+this.chars.substr(Math.floor(Math.random()*this.chars.length),1);
        return key;
    }
    received({uuid,payload}) {
        if (this.promises[uuid]) {
            this.promises[uuid].resolve(payload);
            return true;
        }else{
            return false;
        }
    }
    add({method,timeout}) {
        let uuid=this.uuid();
        timeout=timeout || 5000;
        return new Promise((resolve,reject) => {
            const request = {
                method,
                reject,
                uuid,
                timeout:setTimeout(() => {
                    reject('Request timed out')
                },timeout)
            };
            request.resolve=(payload) => {
                clearTimeout(request.timeout);
                resolve(payload);
            }
            this.promises[uuid]=request;
            request.method(uuid);
        });
    }
}
module.exports = {promiser}
