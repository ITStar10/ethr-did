import { Resolver, Resolvable } from 'did-resolver'
import { Contract, ContractFactory } from '@ethersproject/contracts'
import { JsonRpcProvider } from '@ethersproject/providers'
import { getResolver } from 'ethr-did-resolver'
import { EthrDID, DelegateTypes, KeyPair } from '../index'
import { createProvider, sleep } from './testUtils'
import DidRegistryContract from 'ethr-did-registry'
import { verifyJWT } from 'did-jwt'

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

  beforeAll(async () => {
    const factory = ContractFactory.fromSolidity(DidRegistryContract).connect(provider.getSigner(0))

    console.log('Setting up configuration for')

    let registryContract: Contract
    registryContract = await factory.deploy()
    registryContract = await registryContract.deployed()

    await registryContract.deployTransaction.wait()

    registry = registryContract.address

    accounts = await provider.listAccounts()

    // accounts.map((index, item) => {
    //   console.log(index, ' - ', item)
    // })

    identity = accounts[1]
    console.log('Identity = ', identity)
    owner = accounts[2]
    delegate1 = accounts[3]
    delegate2 = accounts[4]
    did = `did:ethr:dev:${identity}`

    resolver = new Resolver(getResolver({ name: 'dev', provider, registry, chainId: 1337 }))
    ethrDid = new EthrDID({
      provider,
      registry,
      identifier: identity,
      chainNameOrId: 'dev',
    })

    // console.log('ethrDID = ', ethrDid)
  })

  
  it('defaults owner to itself', async () => {
    expect(ethrDid.lookupOwner()).resolves.toEqual(identity)
    await ethrDid.changeOwner(owner)
    expect(ethrDid.lookupOwner()).resolves.toEqual(owner)
  })
})
