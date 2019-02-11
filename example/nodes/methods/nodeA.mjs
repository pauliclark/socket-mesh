const methods={
        test:{
            allow:null, // allow from any node, otherwise provide an array of whitelisted node idenitifers
            callback:true,
            method:async(data) => {
                try{
                    return await app.testAsync(data);
                }catch(e) {
                    throw e;
                }
            }
        }
    };
export {methods}
export default methods