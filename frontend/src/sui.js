import { SuiClient, getFullnodeUrl } from '@mysten/sui/client'

export const clients = {
  testnet: new SuiClient({ url: getFullnodeUrl('testnet') }),
  mainnet: new SuiClient({ url: getFullnodeUrl('mainnet') }),
}