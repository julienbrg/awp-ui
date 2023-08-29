export function GetNetworkColor(chain?: string) {
  if (chain === 'artheraTestnet') return 'blue'
  if (chain === 'homestead') return 'green'
  return 'gray'
}
