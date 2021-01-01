const methods = async attachMethods => {
  return {
    sampleB: {
      responds: true,
      method: attachMethods ? (await import('../commands/sampleB.js')).default : null
    },
    queued: {
      queued: true,
      method: attachMethods ? (await import('../commands/queued.js')).default : null
    }
  }
}
export default methods
