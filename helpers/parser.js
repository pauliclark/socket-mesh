import Cryptr from 'cryptr'
let cryptr = null

export const setSecret = secretKey => {
  if (!cryptr) cryptr = new Cryptr(secretKey)
}
export const encrypt = data => {
  data = JSON.stringify(data).toString('utf8')
  // console.log({utf8:data})
  return cryptr.encrypt(data)
}
export const decrypt = data => {
  // console.log({ decrypt: cryptr.decrypt(data.toString('utf8')) })
  return JSON.parse(cryptr.decrypt(data.toString('utf8')))
}
