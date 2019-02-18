class attachedClient {
    constructor({client,server,promiser}) {
        this.promiser=promiser;
        this.client=client;
        this.server=server;
        this.identity=null;
        // when the client receives the attached command, it will identify itself
        this.client.on('identify', async data => {
            if (data.identity && this.server.canConnect[data.identity]) {
                this.identity=data.identity;
                this.client.emit('approved', {});
            }else{
                this.client.emit('denied', {});
            }
        });
        // send the attached command
        this.client.emit('attached', {});
        this.client.on('request', async ({command,uuid,request}) => {
            let response=await this.server.method({client:this,command,request});
            if (!!uuid) this.client.emit('response',{command,uuid,response})
        })
    }
    
}
module.exports = {attachedClient}