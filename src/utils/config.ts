import { ThemingProps } from '@chakra-ui/react'
import { Chain } from '@wagmi/core'

export const SITE_NAME = 'Arthera White Paper'
export const SITE_DESCRIPTION = 'Web3 is entering a new era.'
export const SITE_URL = 'https://whitepaper.arthera.net'
export const THEME_INITIAL_COLOR = 'dark'
export const THEME_COLOR_SCHEME: ThemingProps['colorScheme'] = 'gray'
export const THEME_CONFIG = {
  initialColorMode: THEME_INITIAL_COLOR,
}

export const SOCIAL_TWITTER = 'artherachain'
export const SOCIAL_GITHUB = 'artheranet'

export const arthera: Chain = {
  id: 10242,
  name: 'Arthera',
  network: 'arthera',
  nativeCurrency: {
    decimals: 18,
    name: 'AA',
    symbol: 'AA',
  },
  rpcUrls: {
    public: { http: ['https://rpc.arthera.net'] },
    default: { http: ['https://rpc.arthera.net'] },
  },
  blockExplorers: {
    etherscan: { name: 'Arthera Explorer', url: 'https://explorer.arthera.net' },
    default: { name: 'Arthera Explorer', url: 'https://explorer.arthera.net' },
  },
} as const satisfies Chain

export const ETH_CHAINS = [arthera]

export const SERVER_SESSION_SETTINGS = {
  cookieName: SITE_NAME,
  password: process.env.SESSION_PASSWORD ?? 'UPDATE_TO_complex_password_at_least_32_characters_long',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
  },
}
