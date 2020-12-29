const methods = async attachMethods => {
  return {
    sampleA:attachMethods?await import('../commands/sampleA.js'):null
  }
}
export default methods