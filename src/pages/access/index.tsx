import { Heading, Button, Image, useToast } from '@chakra-ui/react'
import { Head } from '../../components/layout/Head'
import { LinkComponent } from '../../components/layout/LinkComponent'
import { useRouter } from 'next/router'
import { useState, useEffect } from 'react'
import { useFeeData, useSigner, useAccount, useBalance, useNetwork, useSignMessage } from 'wagmi'
import { ethers } from 'ethers'
import { NFT_CONTRACT_ADDRESS, NFT_CONTRACT_ABI } from '../../lib/consts'
import { SiweMessage } from 'siwe'

export default function Home() {
  const [loading, setLoading] = useState<boolean>(false)
  const [userBal, setUserBal] = useState<string>('')
  const [txLink, setTxLink] = useState<string>('')
  const [isNftOwner, setIsNftOwner] = useState<boolean>(false)
  const [loggedInAddress, setLoggedInAddress] = useState('')
  const [secretContent, setSecretContent] = useState('')

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
  const { signMessageAsync } = useSignMessage()

  const explorerUrl = network.chain?.blockExplorers?.default.url

  const nft = new ethers.Contract(NFT_CONTRACT_ADDRESS, NFT_CONTRACT_ABI, signer)

  useEffect(() => {
    const val = Number(bal?.formatted).toFixed(3)
    setUserBal(String(val) + ' ' + bal?.symbol)
    setIsNftOwner(true)
  }, [bal?.formatted, bal?.symbol, address])

  const checkFees = () => {
    console.log('data?.formatted:', JSON.stringify(data?.formatted))
    return JSON.stringify(data?.formatted)
  }

  const signIn = async () => {
    try {
      const chainId = network.chain?.id
      if (!address || !chainId) return

      // 1. Get random nonce from API
      const nonceRes = await fetch('/api/account/nonce')
      const nonce = await nonceRes.text()

      // 2. Create SIWE message with pre-fetched nonce and sign with wallet
      const message = new SiweMessage({
        domain: window.location.host,
        address,
        statement: `Sign in with Ethereum to W3HC.`,
        uri: window.location.origin,
        version: '1',
        chainId,
        nonce: nonce,
      })

      // 3. Sign message
      const signature = await signMessageAsync({
        message: message.prepareMessage(),
      })

      // 3. Verify signature
      const verifyRes = await fetch('/api/account/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message, signature }),
      })

      console.log('response', verifyRes)

      if (!verifyRes.ok) throw new Error('Error verifying message')

      console.log('success ✅')
      setLoggedInAddress(address)
      const data = await verifyRes.json()
      if (data.ok) {
        setSecretContent(data.secretContent)
        console.log(data.secretContent)
      } else {
        console.log('Something went wrong with that API request.')
      }
      toast({
        title: 'Verified ✅',
        position: 'bottom',
        description: 'We were able to verify the Witepaper NFT ownership in the most formal way. Enjoy your read!',
        status: 'success',
        variant: 'subtle',
        duration: 10000,
        isClosable: true,
      })
    } catch (error) {
      console.error(error)
      toast({
        title: 'Oh no!',
        position: 'bottom',
        description: "You don't own the Witepaper NFT. Sorry for that.",
        status: 'error',
        variant: 'subtle',
        duration: 10000,
        isClosable: true,
      })
      setLoggedInAddress('')
    }
  }

  const check = async () => {
    console.log('minting...')
    try {
      try {
        const res = await fetch(`https://jsonplaceholder.typicode.com/posts/1`)
        const data = await res.json()
        console.log(data)
      } catch (err) {
        console.log(err)
      }
      console.log('Checked. ✅')
      toast({
        title: 'Checked. ✅',
        position: 'bottom',
        description: 'You have the Whitepaper NFT on your wallet!',
        status: 'success',
        variant: 'subtle',
        duration: 500,
        isClosable: true,
      })
      router.push('/access')
    } catch (e) {
      setLoading(false)
      console.log('error:', e)
    }
  }

  return (
    <>
      <Head />
      <main>
        <Heading as="h2">NFT-gated content</Heading>
        <br />

        {loggedInAddress ? (
          <>
            <Image alt="old-book" src={secretContent} />
            {/* <p>
              <b>
                <LinkComponent href="/access">Download PDF</LinkComponent>
              </b>
            </p> */}
          </>
        ) : (
          <>
            <p>If you&apos;re the owner of the Whitepaper NFT, please click on the &apos;Reveal&apos; button.</p>
            <br />
            <p>
              Otherwise{' '}
              <LinkComponent href="/">
                <b>you can go mint yours there</b>
              </LinkComponent>
              .
            </p>
            <br />

            {!loading ? (
              !txLink ? (
                <Button colorScheme="green" variant="outline" onClick={signIn}>
                  Reveal
                </Button>
              ) : (
                <Button disabled colorScheme="green" variant="outline" onClick={signIn}>
                  Reveal
                </Button>
              )
            ) : (
              <Button isLoading colorScheme="green" loadingText="Revealing..." variant="outline">
                Revealing...
              </Button>
            )}
          </>
        )}
      </main>
    </>
  )
}
