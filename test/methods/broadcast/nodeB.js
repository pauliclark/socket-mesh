const methods = async attachMethods => {
  // console.log({nodeB_attach:attachMethods})
  return {
    sampleB:attachMethods?await import('../commands/sampleB.js'):null
  }
}
export default methods