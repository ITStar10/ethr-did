/* eslint-disable prettier/prettier */
import { Resolver, Resolvable } from 'did-resolver'
import { Contract, ContractFactory } from '@ethersproject/contracts'
import { JsonRpcProvider, Web3Provider } from '@ethersproject/providers'
import { Wallet } from '@ethersproject/wallet'
import { getResolver } from 'ethr-did-resolver'
import { EthrDID, DelegateTypes, KeyPair } from '../index'
import { createProvider, sleep } from './testUtils'
import DidRegistryContract from 'ethr-did-registry'
import { verifyJWT } from 'did-jwt'

import { privateKey } from '/mnt/Work/Sec/mainnet_secret.json'

jest.setTimeout(30000)

describe('EthrDID', () => {
    let ethrDid: EthrDID,
    plainDid: EthrDID,
    registry: string,
    accounts: string[],
    did: string,
    identity: string,
    owner: string,
    delegate1: string,
    delegate2: string,
    resolver: Resolvable

  const provider: JsonRpcProvider = createProvider()

//   const provider = new JsonRpcProvider('https://speedy-nodes-nyc.moralis.io/bd1c39d7c8ee1229b16b4a97/polygon/mumbai');
  const signer = new Wallet('0x' + privateKey, provider)

  beforeAll(async () => {

    // const factory = ContractFactory.fromSolidity(DidRegistryContract).connect(provider.getSigner(0))
    // const factory = ContractFactory.fromSolidity(DidRegistryContract).connect(signer)

    console.log('Setting up configuration for')

    // let registryContract: Contract
    // registryContract = await factory.deploy()
    // registryContract = await registryContract.deployed()

    // await registryContract.deployTransaction.wait()

    // registry = registryContract.address
    registry = '0x44511bFfDf104fC5f61f74219f65ed4c410d4C20'

    accounts = await provider.listAccounts()

    console.log('Accounts = ', accounts)

    accounts.map((index, item) => {
      console.log(index, ' - ', item)
    })

    identity = '0x7e5f4552091a69125d5dfcb7b8c2659029395bdf'
    owner = '0x2b5ad5c4795c026514f8317c7a215e218dccd6cf' //accounts[2]
    // delegate1 = '0x6813eb9362372eef6200f3b1dbc3f819671cba69' //accounts[3]
    // delegate2 = '0x1eff47bc3a10a45d4b230b5d10e37751fe6aa718'  // accounts[4]
    // did = `did:ethr:dev:${identity}`

    resolver = new Resolver(getResolver({ name: 'dev', provider, registry, chainId: 80001 }))
    console.log('Polygon - resolver : ', resolver)
    ethrDid = new EthrDID({
    // privateKey: privateKey,
      provider,
      registry,
      identifier: identity,
      rpcUrl: 'https://rpc-mumbai.maticvigil.com',
      chainNameOrId: 80001,
    })

    console.log('ethrDID = ', ethrDid)
  })

  it('defaults owner to itself', () => {
    return expect(ethrDid.lookupOwner()).resolves.toEqual(identity.toUpperCase())
  })

//   describe('key management', () => {
//     it('test', async () => {
//       await ethrDid.changeOwner(owner)
//     //   console.log('Return = ', await ethrDid.lookupOwner())
//     //   return expect(ethrDid.lookupOwner()).resolves.toEqual(owner)
//     })
//   })
  
})