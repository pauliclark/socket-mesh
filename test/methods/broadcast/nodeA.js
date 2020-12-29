const methods = async attachMethods => {
  // console.log({nodeA_attach:attachMethods})
  const methods = {
    sampleB:null
  }
  if (attachMethods) {
    methods.sampleB = (await import('../commands/sampleB.js')).default
  }
  // console.log({methods})
  return methods
}
export default methods