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

function sleep(ms) {
  return new Promise((resolve) => {
      setTimeout(resolve, ms);
  });
}

jest.setTimeout(600000)

describe('VdaDID', () => {
  let doc
  let didResolver

  beforeAll(async () => {
    const providerConfig = { 
      rpcUrl, 
      registry,
      chainId : 97,
    }
    const vdaDidResolver = getResolver(providerConfig)
    didResolver = new Resolver(vdaDidResolver)
  })

  it('defaults owner to itself', async () => {
    const prevOwner = await vdaDid.lookupOwner()
    console.log('Prev Owner = ', prevOwner)
    
    // Don't test continuously. Require private key
    const tx = await vdaDid.changeOwner(owner)
    console.log('ChangeOwner() : ', tx)

    const newOwner = await vdaDid.lookupOwner()
    console.log('New Owner = ', newOwner)

  })

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
})