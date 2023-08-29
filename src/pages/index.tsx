import { Heading, Button, Image, useToast } from '@chakra-ui/react'
import { Head } from '../components/layout/Head'
import { LinkComponent } from '../components/layout/LinkComponent'
import { useRouter } from 'next/router'
import { useState, useEffect } from 'react'
import { useFeeData, useSigner, useAccount, useBalance, useNetwork } from 'wagmi'
import { ethers } from 'ethers'
import { NFT_CONTRACT_ADDRESS, NFT_CONTRACT_ABI } from '../lib/consts'

export default function Home() {
  const [loading, setLoading] = useState<boolean>(false)
  const [userBal, setUserBal] = useState<string>('')
  const [txLink, setTxLink] = useState<string>('')

  const router = useRouter()
  const toast = useToast()
  const { data } = useFeeData()
  const { address, isConnecting, isDisconnected } = useAccount()
  const { data: signer } = useSigner()
  const {
    data: bal,
    isError,
    isLoading,
  } = useBalance({
    address: address,
  })
  const network = useNetwork()

  const explorerUrl = network.chain?.blockExplorers?.default.url

  const nft = new ethers.Contract(NFT_CONTRACT_ADDRESS, NFT_CONTRACT_ABI, signer)

  useEffect(() => {
    const val = Number(bal?.formatted).toFixed(3)
    setUserBal(String(val) + ' ' + bal?.symbol)
    // const verifOneTime = verifyNftOwnership(address)
    // console.log('verifOneTime', verifOneTime)

    // if (verifOneTime) {
    //   router.push('/access')
    // }
  }, [bal?.formatted, bal?.symbol, address])

  const verifyNftOwnership = async (addr) => {
    const provider = new ethers.providers.JsonRpcProvider('https://rpc-test.arthera.net')
    const nft = new ethers.Contract(NFT_CONTRACT_ADDRESS, NFT_CONTRACT_ABI, provider)
    const nftBal = await nft.balanceOf(addr)
    console.log('nftBal', nftBal)
    if (Number(nftBal) > 0) {
      return true
    } else {
      return false
    }
  }

  const mint = async () => {
    console.log('minting...')
    try {
      setLoading(true)
      const call = await nft.safeMint()
      const nftReceipt = await call.wait(1)
      console.log('tx:', nftReceipt)
      setTxLink(explorerUrl + '/tx/' + nftReceipt.transactionHash)
      setLoading(false)
      console.log('Minted. ✅')
      toast({
        title: 'Successful mint',
        position: 'bottom',
        description: 'You have the Whitepaper NFT on your wallet!',
        status: 'success',
        variant: 'subtle',
        duration: 500,
        isClosable: true,
      })
      router.push('/access')
    } catch (e) {
      if ((e.data.message = 'execution reverted: Caller already minted')) {
        toast({
          title: 'Already minted',
          position: 'bottom',
          description: "You can't mint this one twice.",
          status: 'error',
          variant: 'subtle',
          duration: 1000,
          isClosable: true,
        })
      }

      setLoading(false)
      console.log('error:', e)
    }
  }

  return (
    <>
      <Head />

      <main>
        {/* <Heading as="h2">Basic Minter</Heading> */}
        {isDisconnected ? (
          <>
            <br />
            <p>Please connect your wallet.</p>
          </>
        ) : (
          <>
            <br />

            <p>
              We&apos;re living pretty exciting times. <LinkComponent href="/access">Discover Atrthera Whitepaper right now!</LinkComponent>
            </p>
            <br />
            <p>
              You&apos;re connected to <strong>Arthera Testnet</strong> and your wallet currently holds
              <strong> {userBal}</strong>.
            </p>
            <br />
            <p>You can go ahead and click on the &apos;Mint&apos; button below: </p>
            <br />

            {!loading ? (
              !txLink ? (
                <Button colorScheme="green" variant="outline" onClick={mint}>
                  Mint
                </Button>
              ) : (
                <Button disabled colorScheme="green" variant="outline" onClick={mint}>
                  Mint
                </Button>
              )
            ) : (
              <Button isLoading colorScheme="green" loadingText="Minting" variant="outline">
                Mint
              </Button>
            )}
          </>
        )}

        {txLink && (
          <>
            <br />
            <br />
            <p>Done! You can view your transaction on Etherscan:</p>
            <br />
            <LinkComponent target="blank" href={txLink}>
              {txLink}
            </LinkComponent>
          </>
        )}
        <br />
        <br />
        {txLink && (
          <Button colorScheme="red" variant="outline" onClick={() => stop()}>
            Stop the music
          </Button>
        )}
        {/* <Image height="800" width="800" alt="contract-image" src="/thistle-contract-feb-15-2023.png" /> */}
      </main>
    </>
  )
}
