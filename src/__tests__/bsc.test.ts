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

import { ethers } from 'ethers'
import EncryptionUtils from '@verida/encryption-utils'

const rpcUrl = 'https://data-seed-prebsc-1-s1.binance.org:8545/'
// const rpcUrl = 'https://speedy-nodes-nyc.moralis.io/20cea78632b2835b730fdcf4/bsc/testnet'
// Paid BSC RPC
// https://speedy-nodes-nyc.moralis.io/24036fe0cb35ad4bdc12155f/bsc/mainnet
// https://speedy-nodes-nyc.moralis.io/20cea78632b2835b730fdcf4/bsc/testnet


const testAccounts = [{
  address : "0xFddEc248fa3FA60310c7dA7866096CA7715B604f",
  privateKey : "0xda76b33732b82c6f2a461eaf85e1bab612cff42fe4016518e975bf6cdb79542d",
  publicKey : "0x0429c00d6380b876d444478d00cad54a2c4f3d35e56c11353adc48d5c71f4c4be5a181ab837b99ba24b2a97f2761405d101d03905855ae68088eb8625af335d0b4"
},{
  address: "0x266Af2cF1622cAb50d000AaDE13198aA60ED15d6",
  privateKey : "0xab1462b223f0b84696c0b283ac1fa4b3393eea2f2f1cee191ea17788182da8f6",
  publicKey : "0x0416cfc657ecf1f178455987cbe66b5844ef52a00b992f6f1a398ebbbb07b42f11488a960987ad0d0f5cce8a9586090cfd43eee3c90d2296ac6faf8f63880ba559"
},{
  address: "0xDa6A02f01eBe37A4e5587F3E15E9621DA68fEb77",
  privateKey : "0xeced4153adc37d9a0a43a6086084f9039cf5e8a5a1367770daff0eb58c0ba514",
  publicKey : "0x04803f1319471d08167b3b3d08da6eff51fc98a09d17778a51e4e2815cecd5835fcdd634c6f376b87677fc6a60012a9a95120ca8d228143916d9559a28b384a4a6"
},{
  address: "0xB604520320aBD663574D1A408F02230740de4c08",
  privateKey : "0x39ec1cee1d45ff1b45bcf0f19c375840f1929bc2c9854f1563aec2fa6797f589",
  publicKey : "0x043de542b88b14bc9c6e24fd3454ea3ad8afbf93c7c8e05846e5cf99433b26133d35fc681ec1c78956f977c336453c7631644af4b3ab8c43661787271cc7af976d"
}]

const proofProvider = {
  address: "0xda9ca334bc4973F22c7AC805C14f3a841095Cd8B",
  privateKey: "0xb34b5a7f19f99aae525e9320999aef45e92e4f10e97518e4cb66f0bad8bd1b93",
  publicKey: "0x0485ac6924ef96e4fb771c4903763660fcd46a8c037f516955e5b153cbaf2c03733f31068998a7b331ee40835746e31ab837589d7e1facf95de45e7ef8c4c581da"
}
const zeroAddress = "0x0000000000000000000000000000000000000000"

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
  vdaKey: '0x' + privateKey,
  chainNameOrId : '0x61',
  
  callType: 'web3',
  web3Options: {
    provider: provider,
    signer: txSigner
  }
})

const createVeridaSign = (rawMsg : any, privateKey: string ) => {
  const privateKeyArray = new Uint8Array(Buffer.from(privateKey.slice(2), 'hex'))
  return EncryptionUtils.signData(rawMsg, privateKeyArray)
}

function sleep(ms) {
  return new Promise((resolve) => {
      setTimeout(resolve, ms);
  });
}

jest.setTimeout(600000)

describe('VdaDID', () => {
  let doc
  let didResolver
  let proof

  beforeAll(async () => {
    const providerConfig = { 
      rpcUrl, 
      registry,
      chainId : 97,
    }
    const vdaDidResolver = getResolver(providerConfig)
    didResolver = new Resolver(vdaDidResolver)

    const proofRawMsg = ethers.utils.solidityPack(
      ['address', 'address'],
      [identity, proofProvider.address]
    )
    proof = createVeridaSign(proofRawMsg, proofProvider.privateKey)
  })

  /*
  it('defaults owner to itself', async () => {
    const prevOwner = await vdaDid.lookupOwner()
    console.log('Prev Owner = ', prevOwner)
    
    // Don't test continuously. Require private key
    const tx = await vdaDid.changeOwner(owner)
    console.log('ChangeOwner() : ', tx)

    const newOwner = await vdaDid.lookupOwner()
    console.log('New Owner = ', newOwner)

  })
  */

  describe ('crete a complete DIDDocument', () => {
    it ('add delegates',async () => {
      const delegate1 = '0x01298a7ec3e153dac8d0498ea9b40d3a40b51900'
      await vdaDid.addDelegate(
        delegate1,
        {
          expiresIn: 86400
        }
      )
    })

    /*
    it('add attributes',async () => {
      const keyAlgorithm = [
        'Secp256k1',
        'Rsa',
        'Ed25519'
      ]
  
      const keyPurpose = [
        'sigAuth',
        'veriKey',
        'veriKey'
      ]
  
      const encoding = [
        'hex',
        'base64',
        'base58'
      ]
  
      const pubKeyList = [
        '0x12345bb792710e80b7605fe4ac680eb7f070ffadcca31aeb0312df80f7300001',
        base64.encode('0x12345638eff201f684e5a9e0ad79373a1ebe14e1d369c0cee1f6914792d00002'),
        Base58.encode('0x123453320fcff32043e20d75727958e25d3613119058f9be77916c6357600003')       
      ]
  
      const contextList = [
        '0x678904eb5c3f53d8506e7085dfbb0ef333c5f7d0769bcaf4ca2dc0ca46d00001',
        '0x67890621af64386c92c0badd0aa3ae3877a6ea6e298dfa54aa6b1ebe00700002',
        '0x67890c45e3ad1ba47c69f266d6c49c589b9d70de837e318c78ff43c7f0b00003'
      ]

      for (let i = 0; i < 3; i++) {
        const paramKey = `did/pub/${keyAlgorithm[i]}/${keyPurpose[i]}/${encoding[i]}`
        const paramVale = `${pubKeyList[i]}?context=${contextList[i]}`
        if (i < 2) {
          // set attribute with proof
          await vdaDid.setAttribute(
            paramKey,
            paramVale,
            proofProvider.address,
            proof
          )
        } else {
          // set attribute without proof
          await vdaDid.setAttribute(
            paramKey,
            paramVale,
            zeroAddress,
            ""
          )
        }
      }
    })
    */

    /*
    it('add services',async () => {
      const keyList = [
        'did/svc/VeridaMessage',
        'did/svc/VeridaDatabase',
      ]
      const typeList = [
        'message',
        'database'
      ]
      const contextList = [
        '0x84e5fb4eb5c3f53d8506e7085dfbb0ef333c5f7d0769bcaf4ca2dc0ca4698fd4',
        '0xcfbf4621af64386c92c0badd0aa3ae3877a6ea6e298dfa54aa6b1ebe00769b28'
      ]
  
      const serviceEndPoint = 'https://db.testnet.verida.io:5002'

      for (let i = 0; i < keyList.length; i++) {
        const paramVale = `${serviceEndPoint}?context=${contextList[i]}&type=${typeList[i]}`
        await vdaDid.setAttribute(
          keyList[i],
          paramVale
        )
      }
    })
    */

    it('resolve document',async () => {
      doc = await didResolver.resolve(vdaDid.did)
      console.log('Entire Document : ', doc.didDocument);

      console.log("verificationMethod : ", doc.didDocument.verificationMethod)
      console.log("AssertionMethod : ", doc.didDocument.assertionMethod)
      console.log("Authentication : ", doc.didDocument.authentication)
      console.log("keyAgreement : ", doc.didDocument.keyAgreement)
      console.log("service : ", doc.didDocument.service)
    })
  })

  /*
  describe('delegates', () => {
    const delegate1 = '0x01298a7ec3e153dac8d0498ea9b40d3a40b51900'

    it('add signing delegate', async () => {
      const orgDoc = await didResolver.resolve(vdaDid.did)
      
      await vdaDid.addDelegate(
        delegate1,
        {
          expiresIn: 86400
        }
      )

      const newDoc = await didResolver.resolve(vdaDid.did)

      console.log('OrgDoc: ', orgDoc.didDocument)
      console.log('NewDoc: ', newDoc.didDocument)

      // expect(newDoc.didDocument.verificationMethod.length).toEqual(orgDoc.didDocument.verificationMethod.length + 1)
      // expect(newDoc.didDocument.assertionMethod.length).toEqual(orgDoc.didDocument.assertionMethod.length + 1)

    })

    it('revoke signing delegate', async () => {
      const orgDoc = await didResolver.resolve(vdaDid.did)

      await vdaDid.revokeDelegate(delegate1)
      // Need to wait after revoke run because of block time stamp on parsing.
      await sleep(5000);

      const newDoc = await didResolver.resolve(vdaDid.did)

      console.log('OrgDoc: ', orgDoc.didDocument)
      console.log('NewDoc: ', newDoc.didDocument)

      // expect(newDoc.didDocument.verificationMethod.length).toEqual(orgDoc.didDocument.verificationMethod.length - 1)
      // expect(newDoc.didDocument.assertionMethod.length).toEqual(orgDoc.didDocument.assertionMethod.length - 1)
     
    })
  })

  describe('attributes', () => {
    const keyAlgorithm = [
      'Secp256k1',
      'Rsa',
      'Ed25519'
    ]

    const keyPurpose = [
      'sigAuth',
      'veriKey',
      'veriKey'
    ]

    const encoding = [
      'hex',
      'base64',
      'base58'
    ]

    const pubKeyList = [
      '0x12345bb792710e80b7605fe4ac680eb7f070ffadcca31aeb0312df80f7300001',
      base64.encode('0x12345638eff201f684e5a9e0ad79373a1ebe14e1d369c0cee1f6914792d00002'),
      Base58.encode('0x123453320fcff32043e20d75727958e25d3613119058f9be77916c6357600003')       
    ]

    const contextList = [
      '0x678904eb5c3f53d8506e7085dfbb0ef333c5f7d0769bcaf4ca2dc0ca46d00001',
      '0x67890621af64386c92c0badd0aa3ae3877a6ea6e298dfa54aa6b1ebe00700002',
      '0x67890c45e3ad1ba47c69f266d6c49c589b9d70de837e318c78ff43c7f0b00003'
    ]

    it ('set Attributes',async () => {
      doc = await didResolver.resolve(vdaDid.did)

      console.log("verificationMethod : ", doc.didDocument.verificationMethod)
      console.log("AssertionMethod : ", doc.didDocument.assertionMethod)
      console.log("Authentication : ", doc.didDocument.authentication)
      console.log("keyAgreement : ", doc.didDocument.keyAgreement)

      for (let i = 0; i < 3; i++) {
        const paramKey = `did/pub/${keyAlgorithm[i]}/${keyPurpose[i]}/${encoding[i]}`
        const paramVale = `${pubKeyList[i]}?context=${contextList[i]}`
        await vdaDid.setAttribute(
          paramKey,
          paramVale
        )
      }
      
      console.log('resolve')
      const newDoc = await didResolver.resolve(vdaDid.did)

      console.log("verificationMethod : ", newDoc.didDocument.verificationMethod)
      console.log("AssertionMethod : ", newDoc.didDocument.assertionMethod)
      console.log("Authentication : ", newDoc.didDocument.authentication)
      console.log("keyAgreement : ", newDoc.didDocument.keyAgreement)
    })

    it ('revoke Attributes', async () => {
      doc = await didResolver.resolve(vdaDid.did)

      console.log("verificationMethod : ", doc.didDocument.verificationMethod)
      console.log("AssertionMethod : ", doc.didDocument.assertionMethod)
      console.log("Authentication : ", doc.didDocument.authentication)
      console.log("keyAgreement : ", doc.didDocument.keyAgreement)

      for (let i = 0; i < 3; i++) {
        const paramKey = `did/pub/${keyAlgorithm[i]}/${keyPurpose[i]}/${encoding[i]}`
        const paramVale = `${pubKeyList[i]}?context=${contextList[i]}`
        await vdaDid.revokeAttribute(
          paramKey,
          paramVale
        )
      }

      const newDoc = await didResolver.resolve(vdaDid.did)

      console.log("verificationMethod : ", newDoc.didDocument.verificationMethod)
      console.log("AssertionMethod : ", newDoc.didDocument.assertionMethod)
      console.log("Authentication : ", newDoc.didDocument.authentication)
      console.log("keyAgreement : ", newDoc.didDocument.keyAgreement)
    })
  })

  describe('services', () => {
    const keyList = [
      'did/svc/VeridaMessage',
      'did/svc/VeridaDatabase',
    ]
    const typeList = [
      'message',
      'database'
    ]
    const contextList = [
      '0x84e5fb4eb5c3f53d8506e7085dfbb0ef333c5f7d0769bcaf4ca2dc0ca4698fd4',
      '0xcfbf4621af64386c92c0badd0aa3ae3877a6ea6e298dfa54aa6b1ebe00769b28'
    ]

    const serviceEndPoint = 'https://db.testnet.verida.io:5002'

    it ('add sevices', async () => {
      doc = await didResolver.resolve(vdaDid.did)
      console.log("Org service : ", doc.didDocument.service)

      const orgServiceCount = doc.didDocument.service?.length ?? 0

      for (let i = 0; i < keyList.length; i++) {
        const paramVale = `${serviceEndPoint}?context=${contextList[i]}&type=${typeList[i]}`
        await vdaDid.setAttribute(
          keyList[i],
          paramVale
        )
      }

      const newDoc = await didResolver.resolve(vdaDid.did)
      console.log("New service : ", newDoc.didDocument.service)

      // expect(newDoc.didDocument.service.length).toEqual(orgServiceCount + keyList.length)
    })

    it ('revoke sevices', async () => {
      doc = await didResolver.resolve(vdaDid.did)
      console.log("Org service : ", doc.didDocument.service)

      const orgServiceCount = doc.didDocument.service?.length ?? 0

      for (let i = 0; i < 2; i++) {
        const paramVale = `${serviceEndPoint}?context=${contextList[i]}&type=${typeList[i]}`
        await vdaDid.revokeAttribute(
          keyList[i],
          paramVale
        )
      }

      const newDoc = await didResolver.resolve(vdaDid.did)
      console.log("New service : ", newDoc.didDocument.service)

      const newServiceCount = newDoc.didDocument.service?.length ?? 0

      // expect(newServiceCount).toBeLessThanOrEqual(orgServiceCount)
    })
  })
  */
})