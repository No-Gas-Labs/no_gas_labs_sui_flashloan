import { SuiClient, getFullnodeUrl } from '@mysten/sui'

export const clients = {
  testnet: new SuiClient({ url: getFullnodeUrl('testnet') }),
  mainnet: new SuiClient({ url: getFullnodeUrl('mainnet') }),
}