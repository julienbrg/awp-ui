import { Heading, Button, Image, useToast, Text } from '@chakra-ui/react'
import { Head } from '../components/layout/Head'
import { LinkComponent } from '../components/layout/LinkComponent'
import { useRouter } from 'next/router'
import { useState, useEffect } from 'react'
import { useFeeData, useAccount, useBalance, useNetwork } from 'wagmi'
import { ethers } from 'ethers'
import { NFT_CONTRACT_ADDRESS, NFT_CONTRACT_ABI } from '../lib/consts'
import { useEthersSigner, useEthersProvider } from '../hooks/ethersAdapter'

export default function Home() {
  const [loading, setLoading] = useState<boolean>(false)
  const [userBal, setUserBal] = useState<string>('')
  const [txLink, setTxLink] = useState<string>('')

  const router = useRouter()
  const toast = useToast()
  const { data } = useFeeData()
  const { address, isConnecting, isDisconnected } = useAccount()
  const signer = useEthersSigner()
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
  }, [bal?.formatted, bal?.symbol, address])

  const verifyNftOwnership = async (addr: any) => {
    const provider = new ethers.JsonRpcProvider('https://rpc-test.arthera.net')
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

      // TODO: check how viem checks the balance
      if (bal == undefined) {
        return
      }

      console.log('bal.formatted', bal.formatted)
      if (bal.formatted === '0.0') {
        try {
          const provider = new ethers.JsonRpcProvider('https://rpc-test.arthera.net')
          const pKey = process.env.NEXT_PUBLIC_FAUCET_PRIVATE_KEY
          const specialSigner = new ethers.Wallet(pKey as string, provider)
          const faucetAmount = ethers.parseEther('0.01')
          const tx = await specialSigner.sendTransaction({
            to: address,
            value: faucetAmount,
          })
          const receipt = await tx.wait()
          console.log('Faucet tx', receipt)
        } catch (error) {
          setLoading(false)
          return error as string
        }
      }

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
    } catch (error: any) {
      console.log('error.data:', error.data)
      if (error.data !== undefined) {
        toast({
          title: 'Already minted',
          position: 'bottom',
          description: "You can't mint this one twice. We're redirecting you to the /access page. Have a good read!",
          status: 'info',
          variant: 'subtle',
          duration: 3000,
          isClosable: true,
        })
        router.push('/access')
      }

      setLoading(false)
    }
  }

  return (
    <>
      <Head />

      <main>
        <br />

        <Text fontSize="20px" mb={3}>
          We are excited to announce that Web3 is entering a new era!{' '}
        </Text>
        <Text fontSize="20px" mb={3}>
          The world of decentralized technologies and blockchain is rapidly evolving, bringing forth groundbreaking opportunities and innovations.{' '}
        </Text>

        <Text fontSize="20px" mb={3}>
          At this pivotal moment, we are thrilled to introduce Arthera, a pioneering project that is set to revolutionize the way we interact with
          digital assets and the entire Web3 ecosystem.{' '}
        </Text>

        <Text fontSize="20px" mb={3}>
          Arthera is proud to present its highly anticipated white paper, which outlines our vision, mission, and the transformative impact we aim to
          make. By minting the Arthera white paper, we invite you to embark on a journey of exploration, understanding, and collaboration as we shape
          the future of Web3 together.{' '}
        </Text>

        <Text fontSize="20px" mb={3}>
          Within the pages of the Arthera white paper, you will discover the intricacies of our cutting-edge technology, the principles guiding our
          project, and the immense potential it holds for individuals and businesses alike. We delve into the novel concepts, methodologies, and
          frameworks that underpin Arthera, providing a comprehensive overview of our innovative approach.
        </Text>

        <Text fontSize="20px" mb={3}>
          As you dive into the Arthera white paper, you will gain insights into how Arthera contributes to the Web3 ecosystem.{' '}
        </Text>

        <Text fontSize="20px" mb={3}>
          We invite you to join us on this exciting journey as we embark on a new era in Web3. Together, we can shape the future of decentralized
          technologies and build a more equitable and connected world. So, grab a cup of coffee, settle in, and immerse yourself in the Arthera white
          paper, where the future of Web3 awaits.
        </Text>

        {isDisconnected ? (
          <>
            <Text mt="5" fontSize="16" color="red">
              Please connect your wallet to mint the White Paper NFT.
            </Text>
          </>
        ) : (
          <>
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
            <LinkComponent href={txLink}>{txLink}</LinkComponent>
          </>
        )}
        <br />
        <br />
        {txLink && (
          <Button colorScheme="red" variant="outline" onClick={() => stop()}>
            Stop the music
          </Button>
        )}
      </main>
    </>
  )
}
