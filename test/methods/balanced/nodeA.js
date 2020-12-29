const methods = async attachMethods => {
  return {
    sampleA:attachMethods?(await import('../commands/sampleA.js')).default:null
  }
}
export default methods