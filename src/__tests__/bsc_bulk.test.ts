/* eslint-disable prettier/prettier */
import { Resolver, Resolvable } from 'did-resolver'
import { Contract, ContractFactory } from '@ethersproject/contracts'
import { InfuraProvider, JsonRpcProvider, Web3Provider } from '@ethersproject/providers'
import { Wallet } from '@ethersproject/wallet'
// import { getResolver } from 'ethr-did-resolver'
import { getResolver } from 'ethr-did-resolver'

import { EthrDID, BulkDelegateParam, BulkAttributeParam, BulkSignedDelegateParam, BulkSignedAttributeParam, DelegateTypes } from '../index'

import { privateKey } from '/mnt/Work/Sec/test.json'

import {
  arrayify,
  BytesLike,
  concat,
  formatBytes32String,
  hexConcat,
  hexlify,
  hexZeroPad,
  keccak256,
  parseBytes32String,
  SigningKey,
  toUtf8Bytes,
  zeroPad,
} from 'ethers/lib/utils'

jest.setTimeout(600000)

describe('EthrDID', () => {

  const rpcUrl = 'https://speedy-nodes-nyc.moralis.io/bd1c39d7c8ee1229b16b4a97/bsc/testnet'

  // Contract address deployed
  // bulkAdd with 2 param
  // const registry = '0x258A75E9DF2F3BfB8b0854A7A7003044B3d94e0E'
  const registry = '0x713A5Db664297195061b9558f40e88434cb79C77'

  // Wallet addresses
  const delegate1 = '0x01298a7ec3e153dac8d0498ea9b40d3a40b51900'

  let ethrDid: EthrDID,
    identity: string,
   
    provider: JsonRpcProvider,
    txSigner: Wallet

  // Data for Signing Transaction
  const signerPrivateKey = arrayify('0xa285ab66393c5fdda46d6fbad9e27fafd438254ab72ad5acb681a0e9f20f5d7b')
  const signerAddress = '0x2036C6CD85692F0Fb2C26E6c6B2ECed9e4478Dfd'

  // Function to sign data
  const signData = async (
    identity: string,
    // signerAddress: string,
    privateKeyBytes: Uint8Array,
    dataBytes: Uint8Array,
    nonce: number
  ) => {
    const paddedNonce = zeroPad(arrayify(nonce), 32)
    const dataToSign = hexConcat(['0x1900', registry, paddedNonce, identity, dataBytes])
    const hash = keccak256(dataToSign)
    return new SigningKey(privateKeyBytes).signDigest(hash)
  }
    

  beforeAll(async () => {
    // Public key
    identity = '0x599b3912A63c98dC774eF3E60282fBdf14cda748'.toLowerCase()

    provider = new JsonRpcProvider(rpcUrl);

    txSigner = new Wallet(privateKey, provider)
    
    ethrDid = new EthrDID({
      // privateKey,
      txSigner,

      provider,
      
      identifier: identity,
      chainNameOrId : '0x61',

      rpcUrl,
      registry,
    })
  })

  /*
  it('nonceTest',async () => {
    const result = await ethrDid.nonce(signerAddress);
    console.log("Returns : ", Number(result))
  })
  */

  describe('bulkAdd', () => {
    // let didResolver,
    let doc

    beforeAll(async () => {
      const providerConfig = { 
        rpcUrl, 
        registry,
        chainId : 97,
  
        provider,
        txSigner,
      }
      const ethrDidResolver = getResolver(providerConfig)
      const didResolver = new Resolver(ethrDidResolver)

      doc = await didResolver.resolve(ethrDid.did)
    })

    /*
    // Simple test: Working 
    it('addDelegate',async () => {
      const startTime = Date.now()
      console.log('Start : ', startTime)

      const txHash = await ethrDid.addDelegate(
        delegate1
      )
      await provider.waitForTransaction(txHash)

      const endTime = Date.now()
      console.log('End : ', endTime)
  
      console.log('Time Consumed: ', endTime - startTime)
    })
    */

    it ('bulkAdd test', async () => {
      // Verification Method
      const dParams : BulkDelegateParam[] = []
      // Add keyagreement
      dParams.push(
        {
          delegate: delegate1,
          delegateType: DelegateTypes.enc,
        }
      )

      /*
      dParams.push(
      // Verification method
      {
        // delegateType: = DelegateTypes.veriKey // By default
        delegate: delegate1,
        // expiresIn: = 86400 // By default
      }, 
      // Authentication method
      {
        delegateType: DelegateTypes.sigAuth,
        delegate: delegate1
      })
      */

      const context = '0x84e5fb4eb5c3f53d8506e7085dfbb0ef333c5f7d0769bcaf4ca2dc0ca4698fd4'

      const aParams: BulkAttributeParam[] = []
      
      aParams.push(
        // Service
        {
          name: 'did/svc/VeridaDatabase',
          value: 'https://db.testnet.verida.io:5002##' + context + '##database'
          // expiresIn? 
        },{
          name: 'did/svc/VeridaMessage',
          value: 'https://db.testnet.verida.io:5002##' + context + '##messaging'
        },{
          name: 'did/svc/VeridaNotification',
          value: 'https://notification.testnet.verida.io:5002##' + context + '##notification'
        },{
          name: 'did/svc/VeridaStorage',
          value: 'https://storage.testnet.verida.io:5002##' + context + '##storage'
        },{
          name: 'did/svc/BlockchainAddress',
          value: '0x01298a7ec3e153dac8d0498ea9b40d3a40b51900##' + context + '##ethereum:eip155-1'
        },
      )
      

      let nonce = Number(await ethrDid.nonce(signerAddress));

      const sig = await signData(
        signerAddress,
        signerPrivateKey,
        concat([
          toUtf8Bytes('addDelegate'),
          formatBytes32String('attestor'),
          delegate1,
          zeroPad(hexlify(86400), 32),
        ]),
        nonce++
      )
      
      const signedDParams : BulkSignedDelegateParam[] = [
        {
          identity: signerAddress,
          sigV: sig.v,
          sigR: sig.r,
          sigS: sig.s,
          delegateType: formatBytes32String('attestor'),
          delegate: delegate1,
          validity: 86400,
        }
      ]


      const sig2 = await signData(
        signerAddress,
        // signerAddress,
        signerPrivateKey,
        concat([
          toUtf8Bytes('setAttribute'),
          formatBytes32String('encryptionKey'),
          toUtf8Bytes('mykey'),
          zeroPad(hexlify(86400), 32),
        ]),
        nonce++
      )

      const signedAParams : BulkSignedAttributeParam[] = [
        {
          identity: signerAddress,
          sigV: sig2.v,
          sigR: sig2.r,
          sigS: sig2.s,
          name: formatBytes32String('encryptionKey'),
          value: toUtf8Bytes('mykey'),
          validity: 86400,
        }
      ]

      
      const startTime = Date.now()
      console.log('Start : ', startTime)

      const txHash = await ethrDid.bulkAdd(
        dParams,
        aParams,
        signedDParams,
        signedAParams
      )
      await provider.waitForTransaction(txHash)

      const endTime = Date.now()
      console.log('End : ', endTime)
  
      console.log('Time Consumed: ', endTime - startTime)
      
     
      console.log("Result:", doc)
      // console.log(doc.didDocument.verificationMethod)
      // console.log(doc.didDocument.service)
    })

    /*
    it ('Add verification method - Delegate', async () => {
      const delegate1 = '0x01298a7ec3e153dac8d0498ea9b40d3a40b51900'

      const txHash = await ethrDid.addDelegate(
        delegate1,
        {
          expiresIn: 86400,
        });
      
      await provider.waitForTransaction(txHash)
    })

    it ('Add verification method', async() => {
      // Add publicKey
      const  pubKeyList = [
        '0xfa83bbb792710e80b7605fe4ac680eb7f070ffadcca31aeb0312df80f7361938',
        '0x029d3638eff201f684e5a9e0ad79373a1ebe14e1d369c0cea0e1f6914792d1f60e',
        '0x6a3043320fcff32043e20d75727958e25d3613119058f9be77916c635769dc70',
        '0x027f68efbb37abae2e3d4ef61f2a7c8e2d74b50db6d57791cd0fe7261abfe07862',
        '0x83f18992724ea6be59c315f1ea6202ce1ec37bed772e12bab9eff2b64decc074',
      ]

      for (const key in pubKeyList) {
        const txHash = await ethrDid.setAttribute(
          'did/pub/Secp256k1/veriKey',
          key,
          86400
        )
        await provider.waitForTransaction(txHash)
      }

      // const txHash = await ethrDid.setAttribute(
      //   'did/pub/Secp256k1/veriKey',
      //   '0x83f18992724ea6be59c315f1ea6202ce1ec37bed772e12bab9eff2b64decc074',
      //   86400
      // )
      // await provider.waitForTransaction(txHash)

      console.log(doc)

      console.log(doc.didDocument.verificationMethod)
    })

    it('Add multiple service by for loop',async () => {
      const keyList = [
        'did/svc/VeridaMessage',
        'did/svc/VeridaDatabase',
      ]

      const contextList = [
        '0x84e5fb4eb5c3f53d8506e7085dfbb0ef333c5f7d0769bcaf4ca2dc0ca4698fd4',
        '0xcfbf4621af64386c92c0badd0aa3ae3877a6ea6e298dfa54aa6b1ebe00769b28',
        '0x55418c45e3ad1ba47c69f266d6c49c589b9d70de837e318c78ff43c7f0ba89c8'
      ]

      const serviceEndPoint = 'https://db.testnet.verida.io:5002'

      for (const context in contextList) {
        const msgHash = await ethrDid.setAttribute(
          keyList[0], 
          serviceEndPoint + '##' + context + '##messaging', 
          86400
        )
        await provider.waitForTransaction(msgHash)
    
        const txHash = await ethrDid.setAttribute(
          keyList[1],
          serviceEndPoint + '##' + context + '##database',
          86400
        )
        await provider.waitForTransaction(txHash)
      }  

      // console.log(doc)
      // console.log(doc.didDocument.verificationMethod)
      console.log(doc.didDocument.service)
    })

    it('Time measure for adding service', async () => {
      const msgHash = await ethrDid.setAttribute(
        'did/svc/VeridaMessage', 
        'https://db.testnet.verida.io:5002##0x84e5fb4eb5c3f53d8506e7085dfbb0ef333c5f7d0769bcaf4ca2dc0ca4600003##messaging', 
        86400
      )
      await provider.waitForTransaction(msgHash)
  
      const startTime = Date.now()
      console.log('Start : ', startTime)
      const txHash = await ethrDid.setAttribute(
        'did/svc/VeridaDatabase',
        'https://db.testnet.verida.io:5002##0x84e5fb4eb5c3f53d8506e7085dfbb0ef333c5f7d0769bcaf4ca2dc0ca4600004##database',
        86400
      )
      await provider.waitForTransaction(txHash)
      const endTime = Date.now()
      console.log('End : ', endTime)
  
      console.log('Time Consumed: ', endTime - startTime)
    })
    */
  })

  

//   describe('key management', () => {
//     it('test', async () => {
//       await ethrDid.changeOwner(owner)
//     //   console.log('Return = ', await ethrDid.lookupOwner())
//     //   return expect(ethrDid.lookupOwner()).resolves.toEqual(owner)
//     })
//   })
  
})