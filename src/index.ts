import { createJWT, ES256KSigner, JWTVerified, Signer as JWTSigner, verifyJWT } from 'did-jwt'
import { Signer as TxSigner } from '@ethersproject/abstract-signer'
import { CallOverrides } from '@ethersproject/contracts'
import { computeAddress } from '@ethersproject/transactions'
import { computePublicKey } from '@ethersproject/signing-key'
import { Provider } from '@ethersproject/providers'
import { Wallet } from '@ethersproject/wallet'
import * as base64 from '@ethersproject/base64'
import { hexlify, hexValue, isBytes } from '@ethersproject/bytes'
import { Base58 } from '@ethersproject/basex'
import { toUtf8Bytes } from '@ethersproject/strings'
import { EthrDidController, interpretIdentifier, REGISTRY } from 'ethr-did-resolver'
import { Resolvable } from 'did-resolver'

export enum DelegateTypes {
  veriKey = 'veriKey',
  sigAuth = 'sigAuth',
  enc = 'enc',
}

interface IConfig {
  identifier: string
  chainNameOrId?: string | number

  registry?: string

  signer?: JWTSigner
  alg?: 'ES256K' | 'ES256K-R'
  txSigner?: TxSigner
  privateKey?: string

  rpcUrl?: string
  provider?: Provider
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  web3?: any
}

export type KeyPair = {
  address: string
  privateKey: string
  publicKey: string
  identifier: string
}

type DelegateOptions = {
  delegateType?: DelegateTypes
  expiresIn?: number
}

export type BulkDelegateParam = {
  delegateType?: DelegateTypes
  delegate: string
  validity?: number
}

export type BulkSignedDelegateParam = {
  identity: string
  sigV: number
  sigR: string
  sigS: string
  delegateType: string
  delegate: string
  validity?: number
}

export type BulkAttributeParam = {
  name: string
  value: string | Uint8Array
  validity?: number
}

export type BulkSignedAttributeParam = {
  identity: string
  sigV: number
  sigR: string
  sigS: string
  name: string
  value: string | Uint8Array
  validity?: number
}

export class EthrDID {
  public did: string
  public address: string
  public signer?: JWTSigner
  public alg?: 'ES256K' | 'ES256K-R'
  private owner?: string
  private controller?: EthrDidController

  constructor(conf: IConfig) {
    const { address, publicKey, network } = interpretIdentifier(conf.identifier)
    const chainNameOrId = typeof conf.chainNameOrId === 'number' ? hexValue(conf.chainNameOrId) : conf.chainNameOrId
    if (conf.provider || conf.rpcUrl || conf.web3) {
      let txSigner = conf.txSigner
      if (conf.privateKey && typeof txSigner === 'undefined') {
        txSigner = new Wallet(conf.privateKey)
      }
      this.controller = new EthrDidController(
        conf.identifier,
        undefined,
        txSigner,
        chainNameOrId,
        conf.provider || conf.web3?.currentProvider,
        conf.rpcUrl,
        conf.registry || REGISTRY
      )
      this.did = this.controller.did
      // console.log('EthrDID class -> EthrDID controller = ', this.controller)
    } else {
      const net = network || chainNameOrId
      let networkString = net ? `${net}:` : ''
      if (networkString in ['mainnet:', '0x1:']) {
        networkString = ''
      }
      this.did =
        typeof publicKey === 'string' ? `did:ethr:${networkString}${publicKey}` : `did:ethr:${networkString}${address}`
    }
    this.address = address
    if (conf.signer) {
      this.signer = conf.signer
      this.alg = conf.alg
      if (!this.alg) {
        console.warn(
          'A JWT signer was specified but no algorithm was set. Please set the `alg` parameter when calling `new EthrDID()`'
        )
      }
    } else if (conf.privateKey) {
      this.signer = ES256KSigner(conf.privateKey, true)
      this.alg = 'ES256K-R'
    }
  }

  static createKeyPair(chainNameOrId?: string | number): KeyPair {
    const wallet = Wallet.createRandom()
    const privateKey = wallet.privateKey
    const address = computeAddress(privateKey)
    const publicKey = computePublicKey(privateKey, true)
    const net = typeof chainNameOrId === 'number' ? hexValue(chainNameOrId) : chainNameOrId
    const identifier = net ? `did:ethr:${net}:${publicKey}` : publicKey
    return { address, privateKey, publicKey, identifier }
  }

  async lookupOwner(cache = true): Promise<string> {
    if (typeof this.controller === 'undefined') {
      throw new Error('a web3 provider configuration is needed for network operations')
    }
    if (cache && this.owner) return this.owner
    return this.controller?.getOwner(this.address)
  }

  async changeOwner(newOwner: string, txOptions?: CallOverrides): Promise<string> {
    if (typeof this.controller === 'undefined') {
      throw new Error('a web3 provider configuration is needed for network operations')
    }
    const owner = await this.lookupOwner()

    // console.log('ethr-did controller = ', this.controller)

    console.log('txOptions = ', txOptions)

    const receipt = await this.controller.changeOwner(newOwner, {
      ...txOptions,
      from: owner,
    })
    console.log('txResult = ', receipt)

    this.owner = newOwner
    return receipt.transactionHash
  }

  async addDelegate(
    delegate: string,
    delegateOptions?: DelegateOptions,
    txOptions: CallOverrides = {}
  ): Promise<string> {
    if (typeof this.controller === 'undefined') {
      throw new Error('a web3 provider configuration is needed for network operations')
    }
    const owner = await this.lookupOwner()
    const receipt = await this.controller.addDelegate(
      delegateOptions?.delegateType || DelegateTypes.veriKey,
      delegate,
      delegateOptions?.expiresIn || 86400,
      { ...txOptions, from: owner }
    )
    return receipt.transactionHash
  }

  async revokeDelegate(
    delegate: string,
    delegateType = DelegateTypes.veriKey,
    txOptions: CallOverrides = {}
  ): Promise<string> {
    if (typeof this.controller === 'undefined') {
      throw new Error('a web3 provider configuration is needed for network operations')
    }
    const owner = await this.lookupOwner()
    const receipt = await this.controller.revokeDelegate(delegateType, delegate, { ...txOptions, from: owner })
    return receipt.transactionHash
  }

  async setAttribute(
    key: string,
    value: string | Uint8Array,
    expiresIn = 86400,
    /** @deprecated, please use txOptions.gasLimit */
    gasLimit?: number,
    txOptions: CallOverrides = {}
  ): Promise<string> {
    if (typeof this.controller === 'undefined') {
      throw new Error('a web3 provider configuration is needed for network operations')
    }
    const owner = await this.lookupOwner()
    const receipt = await this.controller.setAttribute(key, attributeToHex(key, value), expiresIn, {
      gasLimit,
      ...txOptions,
      from: owner,
    })
    return receipt.transactionHash
  }

  async revokeAttribute(
    key: string,
    value: string | Uint8Array,
    /** @deprecated please use `txOptions.gasLimit` */
    gasLimit?: number,
    txOptions: CallOverrides = {}
  ): Promise<string> {
    if (typeof this.controller === 'undefined') {
      throw new Error('a web3 provider configuration is needed for network operations')
    }
    const owner = await this.lookupOwner()
    const receipt = await this.controller.revokeAttribute(key, attributeToHex(key, value), {
      gasLimit,
      ...txOptions,
      from: owner,
    })
    return receipt.transactionHash
  }

  async nonce(signer: string, gasLimit?: number, txOptions: CallOverrides = {}): Promise<BigInt> {
    if (typeof this.controller === 'undefined') {
      throw new Error('a web3 provider configuration is needed for network operations')
    }
    const owner = await this.lookupOwner()
    const receipt = await this.controller.nonce(signer, {
      gasLimit,
      ...txOptions,
      from: owner,
    })
    console.log('Ethr-DID : Nonce = ', receipt)
    return receipt
  }

  // Create a temporary signing delegate able to sign JWT on behalf of identity
  async createSigningDelegate(
    delegateType = DelegateTypes.veriKey,
    expiresIn = 86400
  ): Promise<{ kp: KeyPair; txHash: string }> {
    const kp = EthrDID.createKeyPair()
    this.signer = ES256KSigner(kp.privateKey, true)
    const txHash = await this.addDelegate(kp.address, {
      delegateType,
      expiresIn,
    })
    return { kp, txHash }
  }

  // eslint-disable-next-line
  async signJWT(payload: any, expiresIn?: number): Promise<string> {
    if (typeof this.signer !== 'function') {
      throw new Error('No signer configured')
    }
    const options = {
      signer: this.signer,
      alg: 'ES256K-R',
      issuer: this.did,
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (expiresIn) (<any>options)['expiresIn'] = expiresIn
    return createJWT(payload, options)
  }

  async verifyJWT(jwt: string, resolver: Resolvable, audience = this.did): Promise<JWTVerified> {
    return verifyJWT(jwt, { resolver, audience })
  }

  // Newly Added
  async bulkAdd(
    delegateParams: BulkDelegateParam[],
    attributeParams: BulkAttributeParam[],
    signedDelegateParams: BulkSignedDelegateParam[],
    signedAttributeParams: BulkSignedAttributeParam[],
    /** @deprecated, please use txOptions.gasLimit */
    gasLimit?: number,
    txOptions: CallOverrides = {}
  ): Promise<string> {
    if (typeof this.controller === 'undefined') {
      throw new Error('a web3 provider configuration is needed for network operations')
    }

    const controllerDParams = delegateParams.map((item) => {
      return {
        delegateType: item.delegateType ?? DelegateTypes.veriKey,
        delegate: item.delegate,
        validity: item.validity ?? 86400,
      }
    })

    const controllerAParams = attributeParams.map((item) => {
      return {
        name: item.name,
        value: attributeToHex(item.name, item.value),
        validity: item.validity ?? 86400,
      }
    })

    const controllerSignedDParams = signedDelegateParams.map((item) => {
      return {
        ...item,
        // delegateType: item.delegateType ?? DelegateTypes.veriKey,
        validity: item.validity ?? 86400,
      }
    })

    const controllerSignedAParams = signedAttributeParams.map((item) => {
      return {
        ...item,
        // value: attributeToHex(item.name, item.value),
        validity: item.validity ?? 86400,
      }
    })

    const owner = await this.lookupOwner()
    const receipt = await this.controller.bulkAdd(
      controllerDParams,
      controllerAParams,
      controllerSignedDParams,
      controllerSignedAParams,
      { ...txOptions, from: owner }
    )
    return receipt.transactionHash
  }

  async bulkRevoke(
    delegateParams: BulkDelegateParam[],
    attributeParams: BulkAttributeParam[],
    signedDelegateParams: BulkSignedDelegateParam[],
    signedAttributeParams: BulkSignedAttributeParam[],
    /** @deprecated, please use txOptions.gasLimit */
    gasLimit?: number,
    txOptions: CallOverrides = {}
  ): Promise<string> {
    if (typeof this.controller === 'undefined') {
      throw new Error('a web3 provider configuration is needed for network operations')
    }

    const controllerDParams = delegateParams.map((item) => {
      return {
        delegateType: item.delegateType ?? DelegateTypes.veriKey,
        delegate: item.delegate,
      }
    })

    const controllerAParams = attributeParams.map((item) => {
      return {
        name: item.name,
        value: attributeToHex(item.name, item.value),
      }
    })

    const controllerSignedDParams = signedDelegateParams.map((item) => {
      delete item.validity
      return item
    })

    const controllerSignedAParams = signedAttributeParams.map((item) => {
      delete item.validity
      return item
    })

    const owner = await this.lookupOwner()
    const receipt = await this.controller.bulkRevoke(
      controllerDParams,
      controllerAParams,
      controllerSignedDParams,
      controllerSignedAParams,
      { ...txOptions, from: owner }
    )
    return receipt.transactionHash
  }
}

function attributeToHex(key: string, value: string | Uint8Array): string {
  if (value instanceof Uint8Array || isBytes(value)) {
    return hexlify(value)
  }
  const matchKeyWithEncoding = key.match(/^did\/(pub|auth|svc)\/(\w+)(\/(\w+))?(\/(\w+))?$/)

  // Added for service name. Need to be updated for supporting UTF-8, later
  // if (matchKeyWithEncoding?.[1] === 'svc') {
  //   console.log('ethr-did: attributeToHex : ', <string>value)
  //   return <string>value
  // }

  const encoding = matchKeyWithEncoding?.[6]
  const matchHexString = (<string>value).match(/^0x[0-9a-fA-F]*$/)
  if (encoding && !matchHexString) {
    if (encoding === 'base64') {
      return hexlify(base64.decode(value))
    }
    if (encoding === 'base58') {
      return hexlify(Base58.decode(value))
    }
  } else if (matchHexString) {
    return <string>value
  }

  return hexlify(toUtf8Bytes(value))
}
