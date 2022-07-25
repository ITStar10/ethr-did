/* eslint-disable prettier/prettier */
import { Resolver, Resolvable } from 'did-resolver'
import { JsonRpcProvider } from '@ethersproject/providers'
import { Wallet } from '@ethersproject/wallet'
import { getResolver } from '@verida/vda-did-resolver'

import { VdaDID, DelegateTypes, KeyPair } from '../index'
import { verifyJWT } from 'did-jwt'

import { privateKey } from '/mnt/Work/Sec/test.json'


// Imports for test
import { hexlify, hexValue, isBytes } from '@ethersproject/bytes'
import * as base64 from '@ethersproject/base64'
import { Base58 } from '@ethersproject/basex'
import { toUtf8Bytes } from '@ethersproject/strings'

// const rpcUrl = 'https://speedy-nodes-nyc.moralis.io/bd1c39d7c8ee1229b16b4a97/bsc/testnet'
const rpcUrl = 'https://speedy-nodes-nyc.moralis.io/20cea78632b2835b730fdcf4/bsc/testnet'
// Paid BSC RPC
// https://speedy-nodes-nyc.moralis.io/24036fe0cb35ad4bdc12155f/bsc/mainnet
// https://speedy-nodes-nyc.moralis.io/20cea78632b2835b730fdcf4/bsc/testnet


const currentNet = process.env.RPC_TARGET_NET != undefined ? process.env.RPC_TARGET_NET : 'RPC_URL_POLYGON_MAINNET'
const registry = process.env[`CONTRACT_ADDRESS_${currentNet}_DidRegistry`]
// const registry = '0x17dFd83eFDD2D0c430E2cA4b01d1df93cDa9960b'
if (registry === undefined) {
  throw new Error("Registry address not defined in env")
}

const identity = '0x599b3912A63c98dC774eF3E60282fBdf14cda748'.toLowerCase()
const owner = identity;

const provider = new JsonRpcProvider(rpcUrl);

const txSigner = new Wallet(privateKey, provider)
    
const vdaDid = new VdaDID({
  identifier: identity,
  chainNameOrId : '0x61',     
  
  callType: 'web3',
  web3Options: {
    provider: provider,
    signer: txSigner
  }
})

let didResolver

function decodeAttrValue(value: string, encoding: string | undefined) {
  const matchHexString = value.match(/^0x[0-9a-fA-F]*$/)
  if (encoding && !matchHexString) {
    if (encoding === 'base64') {
      console.log('Encoding = base64')
      return hexlify(base64.decode(value))
    }
    if (encoding === 'base58') {
      console.log('Encoding = base58')
      return hexlify(Base58.decode(value))
    }
  } else if (matchHexString) {
    console.log('Encoding = NoEncoding but hexString')
    return <string>value
  }

  return hexlify(toUtf8Bytes(value))
}

function attributeToHex(key: string, value: string | Uint8Array): string {
  if (value instanceof Uint8Array || isBytes(value)) {
    return hexlify(value)
  }
  const matchKeyWithEncoding = key.match(/^did\/(pub|auth|svc)\/(\w+)(\/(\w+))?(\/(\w+))?$/)

  // const matchValueWithContext = matchKeyWithEncoding?.[1] === 'svc' ? 
  //   (<string>value).match(/(.*)\?context=(.*)&type=(\w+)/) :
  //   (<string>value).match(/(.*)\?context=(.*)/)
  const matchValueWithContext = (<string>value).match(/(\w+)(\?context=(\w+))?(&type=(\w+))?/)

  const attrVal = matchValueWithContext ? matchValueWithContext?.[1] : <string>value
  const attrContext = matchValueWithContext?.[3]
  const attrType = matchValueWithContext?.[5]
  
  console.log('key = ', key);
  console.log('value = ', value);
  console.log('key match = ', matchKeyWithEncoding)

  const encoding = matchKeyWithEncoding?.[6]
  
  let returnValue = decodeAttrValue(attrVal, encoding)
  if (attrContext)
    returnValue = `${returnValue}?context=${decodeAttrValue(attrContext, encoding)}`
  if (attrType)
    returnValue = `${returnValue}&type=${attrType}`
  
  return returnValue
}


jest.setTimeout(600000)

describe('VdaDID', () => {
  /*
  it('defaults owner to itself', async () => {
    const prevOwner = await vdaDid.lookupOwner()
    console.log('Prev Owner = ', prevOwner)
    
    // Don't test continuously. Require private key
    await vdaDid.changeOwner(owner)

    const newOwner = await vdaDid.lookupOwner()
    console.log('New Owner = ', newOwner)

  })
  */

  describe('Document', () => {
    // let didResolver,
    let doc

    /*
    it('conversion test',async () => {
      // const t = Buffer.from('abc?context=def', 'utf-8').toString('hex')
      // console.log('Encoded = ', t)

      // const decoded = Buffer.from(t, 'hex').toString()
      // console.log('Decoded = ', decoded)

      // const contextTag = Buffer.from('?context=', 'utf-8').toString('hex')
      // console.log('contextTag : ', contextTag)
      // const TypeTag = Buffer.from('&type=', 'utf-8').toString('hex')
      // console.log('typeTag : ', TypeTag)

      console.log(hexlify(Base58.decode('9wnDMjPNyfNb7hZGRFzpQYMRSF6sThMBPSeoRzKHUKW3')))
      console.log(hexlify(Base58.decode('HruRwZVeWMbwpsm6adWqfHvQoiGbu3ta9PQwNsw4pE5u')))
      

    })
    */

    /*
    beforeAll(async () => {
      const providerConfig = { 
        rpcUrl, 
        registry,
        chainId : 97,
      }
      const vdaDidResolver = getResolver(providerConfig)
      didResolver = new Resolver(vdaDidResolver)

      // doc = await didResolver.resolve(vdaDid.did)

      // console.log("###################Resolved Doc###########", doc)
      // console.log("###################Verification###########", doc.didDocument.verificationMethod)
      // console.log("####.toString()###############Authentication###########", doc.didDocument.authentication)
      // console.log("###################Service###########", doc.didDocument.service)
    })
    */

    /*
    it ('Test', async () => {
      const delegate1 = '0x01398a7ec3e153dac8d0498ea9b40d3a40b51900'

      doc = await didResolver.resolve(vdaDid.did)
      console.log("verificationMethod : ", doc.didDocument.verificationMethod)
      console.log("AssertionMethod : ", doc.didDocument.assertionMethod)
      console.log("Authentication : ", doc.didDocument.authentication)
      console.log("keyAgreement : ", doc.didDocument.keyAgreement)
      

      // const txHash = await (vdaDid.addDelegate(
      //   delegate1,
      //   ));

      // doc = await didResolver.resolve(vdaDid.did)

      // console.log("verificationMethod : ", doc.didDocument.verificationMethod)
      // console.log("Authentication : ", doc.didDocument.authentication)


      // console.log('TxHash -- ', txHash)
      
      // await provider.waitForTransaction(txHash)
    })
    */

    // it ('Add verification method - Delegate', async () => {
    //   const delegate1 = '0x01298a7ec3e153dac8d0498ea9b40d3a40b51900'

    //   const txHash = await (vdaDid.addDelegate(
    //     delegate1,
    //     {
    //       expiresIn: 86400,
    //     }));

    //   console.log('TxHash -- ', txHash)

    //   doc = await didResolver.resolve(vdaDid.did)

    //   console.log("AssertionMethod : ", doc.didDocument.assertionMethod)
    //   console.log("Authentication : ", doc.didDocument.authentication)
      
    //   // await provider.waitForTransaction(txHash)
    // })

    /*
    it ('Add verification method', async() => {

      doc = await didResolver.resolve(vdaDid.did)

      console.log("verificationMethod : ", doc.didDocument.verificationMethod)
      console.log("AssertionMethod : ", doc.didDocument.assertionMethod)
      console.log("Authentication : ", doc.didDocument.authentication)
      console.log("keyAgreement : ", doc.didDocument.keyAgreement)

      // Add publicKey
      const  pubKeyList = [
        '0xfa83bbb792710e80b7605fe4ac680eb7f070ffadcca31aeb0312df80f7361938',
        '0x029d3638eff201f684e5a9e0ad79373a1ebe14e1d369c0cea0e1f6914792d1f60e',
        '0x6a3043320fcff32043e20d75727958e25d3613119058f9be77916c635769dc70',
        // '0x027f68efbb37abae2e3d4ef61f2a7c8e2d74b50db6d57791cd0fe7261abfe07862',
        // '0x83f18992724ea6be59c315f1ea6202ce1ec37bed772e12bab9eff2b64decc074',
      ]

      const keyPurpose = [
        'sigAuth',
        'enc',
        'veriKey'
      ]

      const contextList = [
        '0x84e5fb4eb5c3f53d8506e7085dfbb0ef333c5f7d0769bcaf4ca2dc0ca4698fd4',
        '0xcfbf4621af64386c92c0badd0aa3ae3877a6ea6e298dfa54aa6b1ebe00769b28',
        '0x55418c45e3ad1ba47c69f266d6c49c589b9d70de837e318c78ff43c7f0ba89c8'
      ]

      for (let i = 0; i < 1; i++ ){     
        // Base58 Test
        const key = `did/pub/Secp256k1/${keyPurpose[i]}/base58`
        // const value = `${pubKeyList[i]}`
        // const value = `${Base58.encode(pubKeyList[i])}?context=${contextList[i]}`
        const value = `${Base58.encode(pubKeyList[i])}?context=${Base58.encode(contextList[i])}`

        // // No Encoding test
        // const key = `did/pub/Secp256k1/${keyPurpose[i]}`
        // // const value = `${pubKeyList[i]}?context=${contextList[i]}`
        // const value = 'abc?context=def&type=message'
        
        const txHash = await vdaDid.setAttribute(
          key,
          value,
          // 86400 * (i + 1)
        )
        // console.log(`TxHash for ${i} :`, txHash)
      }

      console.log('===== Document after attribute added =====')
      
      doc = await didResolver.resolve(vdaDid.did)
      console.log("verificationMethod : ", doc.didDocument.verificationMethod)
      console.log("AssertionMethod : ", doc.didDocument.assertionMethod)
      console.log("Authentication : ", doc.didDocument.authentication)
      console.log("keyAgreement : ", doc.didDocument.keyAgreement)
    })

    it ('Revoke verification method', async() => {

      doc = await didResolver.resolve(vdaDid.did)

      console.log("verificationMethod : ", doc.didDocument.verificationMethod)
      console.log("AssertionMethod : ", doc.didDocument.assertionMethod)
      console.log("Authentication : ", doc.didDocument.authentication)
      console.log("keyAgreement : ", doc.didDocument.keyAgreement)

      // Add publicKey
      const  pubKeyList = [
        '0xfa83bbb792710e80b7605fe4ac680eb7f070ffadcca31aeb0312df80f7361938',
        '0x029d3638eff201f684e5a9e0ad79373a1ebe14e1d369c0cea0e1f6914792d1f60e',
        '0x6a3043320fcff32043e20d75727958e25d3613119058f9be77916c635769dc70',
        // '0x027f68efbb37abae2e3d4ef61f2a7c8e2d74b50db6d57791cd0fe7261abfe07862',
        // '0x83f18992724ea6be59c315f1ea6202ce1ec37bed772e12bab9eff2b64decc074',
      ]

      const keyPurpose = [
        'sigAuth',
        'enc',
        'veriKey'
      ]

      const contextList = [
        '0x84e5fb4eb5c3f53d8506e7085dfbb0ef333c5f7d0769bcaf4ca2dc0ca4698fd4',
        '0xcfbf4621af64386c92c0badd0aa3ae3877a6ea6e298dfa54aa6b1ebe00769b28',
        '0x55418c45e3ad1ba47c69f266d6c49c589b9d70de837e318c78ff43c7f0ba89c8'
      ]

      for (let i = 0; i < 3; i++ ){     
        // Base58 Test
        const key = `did/pub/Secp256k1/${keyPurpose[i]}/base58`
        // const value = `${pubKeyList[i]}`
        // const value = `${Base58.encode(pubKeyList[i])}?context=${contextList[i]}`
        const value = `${Base58.encode(pubKeyList[i])}?context=${Base58.encode(contextList[i])}`

        // // No Encoding test
        // const key = `did/pub/Secp256k1/${keyPurpose[i]}`
        // // const value = `${pubKeyList[i]}?context=${contextList[i]}`
        // const value = 'abc?context=def&type=message'
        
        const txHash = await vdaDid.revokeAttribute(
          key,
          value,
          // 86400 * (i + 1)
        )
        console.log(`TxHash for ${i} :`, txHash)
      }
      console.log('===== Document after attribute revoked =====')
      
      doc = await didResolver.resolve(vdaDid.did)
      console.log("verificationMethod : ", doc.didDocument.verificationMethod)
      console.log("AssertionMethod : ", doc.didDocument.assertionMethod)
      console.log("Authentication : ", doc.didDocument.authentication)
      console.log("keyAgreement : ", doc.didDocument.keyAgreement)
    })
    */
    
    /*
    it('Add multiple service by for loop',async () => {

      doc = await didResolver.resolve(vdaDid.did)
      console.log(doc.didDocument.verificationMethod)
      console.log(doc.didDocument.service)

      const keyList = [
        'did/svc/VeridaMessage',
        'did/svc/VeridaDatabase',
      ]

      const contextList = [
        '0x84e5fb4eb5c3f53d8506e7085dfbb0ef333c5f7d0769bcaf4ca2dc0ca4698fd4',
        // '0xcfbf4621af64386c92c0badd0aa3ae3877a6ea6e298dfa54aa6b1ebe00769b28',
        // '0x55418c45e3ad1ba47c69f266d6c49c589b9d70de837e318c78ff43c7f0ba89c8'
      ]

      const serviceEndPoint = 'https://db.testnet.verida.io:5002'

      // console.log("==========vdaDID", vdaDid)

      for (let i = 0; i < contextList.length; i++) {
        const context = contextList[i]

        // console.log('value - ', context)
        const msgHash = await vdaDid.setAttribute(
          keyList[0], 
          `${serviceEndPoint}?context=${context}&type=messaging`, 
          86400
        )
        // console.log('messaging : ', msgHash)
    
        const txHash = await vdaDid.setAttribute(
          keyList[1],
          `${serviceEndPoint}?context=${context}&type=database`, 
          86400
        )
        // console.log('database : ', txHash)
      }  

      console.log('===== Document after service added =====')
      doc = await didResolver.resolve(vdaDid.did)
      console.log(doc.didDocument.verificationMethod)
      console.log(doc.didDocument.service)
    })
    */
    
    /*
    it('Time measure for adding service', async () => {
      const msgHash = await vdaDid.setAttribute(
        'did/svc/VeridaMessage', 
        'https://db.testnet.verida.io:5002##0x84e5fb4eb5c3f53d8506e7085dfbb0ef333c5f7d0769bcaf4ca2dc0ca4600003##messaging', 
        86400
      )
      console.log(msgHash)
      // await provider.waitForTransaction(msgHash)
  
      const startTime = Date.now()
      console.log('Start : ', startTime)
      const txHash = await vdaDid.setAttribute(
        'did/svc/VeridaDatabase',
        'https://db.testnet.verida.io:5002##0x84e5fb4eb5c3f53d8506e7085dfbb0ef333c5f7d0769bcaf4ca2dc0ca4600004##database',
        86400
      )
      console.log(txHash)
      // await provider.waitForTransaction(txHash)
      const endTime = Date.now()
      console.log('End : ', endTime)
  
      console.log('Time Consumed: ', endTime - startTime)
    })
    */
  })

  

//   describe('key management', () => {
//     it('test', async () => {
//       await vdaDid.changeOwner(owner)
//     //   console.log('Return = ', await vdaDid.lookupOwner())
//     //   return expect(vdaDid.lookupOwner()).resolves.toEqual(owner)
//     })
//   })
  
})