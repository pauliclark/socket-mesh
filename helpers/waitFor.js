export const waitFor = (
  check = () => true,
  complete = () => {},
  {
    timeout=3000,
    interval=200, 
    timedout=() => {}
  }={
    timeout:3000,
    interval:200, 
    timedout:() => {}
  }) => {
  let timingOut
  let timer
  timingOut = setTimeout(() => {
    clearTimeout(timingOut)
    clearInterval(timer)
    timedout()
  }, timeout)
  timer = setInterval(() => {
    if (check()) {
      clearTimeout(timingOut)
      clearInterval(timer)
      complete()
    }
  }, interval)
}
export default waitFor