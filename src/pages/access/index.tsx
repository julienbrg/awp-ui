import { Heading, Button, Image, useToast, Text, Box } from '@chakra-ui/react'
import { Head } from '../../components/layout/Head'
import { LinkComponent } from '../../components/layout/LinkComponent'
import { useRouter } from 'next/router'
import { useState, useEffect } from 'react'
import { useFeeData, useSigner, useAccount, useBalance, useNetwork, useSignMessage } from 'wagmi'
import { ethers } from 'ethers'
import { NFT_CONTRACT_ADDRESS, NFT_CONTRACT_ABI } from '../../lib/consts'
import { SiweMessage } from 'siwe'
import { chakra } from '@chakra-ui/react'
import { motion, isValidMotionProp } from 'framer-motion'

const ChakraBox = chakra(motion.div, {
  shouldForwardProp: isValidMotionProp,
})

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

      const nonceRes = await fetch('/api/account/nonce')
      const nonce = await nonceRes.text()

      const message = new SiweMessage({
        domain: window.location.host,
        address,
        statement: `Sign this message to prove you're the owner of Arthera White Paper NFT.`,
        uri: window.location.origin,
        version: '1',
        chainId,
        nonce: nonce,
      })

      const signature = await signMessageAsync({
        message: message.prepareMessage(),
      })

      const verifyRes = await fetch('/api/account/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message, signature }),
      })

      if (!verifyRes.ok) throw new Error('Error verifying message')

      setLoggedInAddress(address)
      const data = await verifyRes.json()
      if (data.ok) {
        setSecretContent(data.secretContent)
        // console.log(data.secretContent)
      } else {
        console.log('Something went wrong with that API request.')
      }
      toast({
        title: 'Verified ✅',
        position: 'top',
        description: 'We managed to authenticate the White Paper NFT ownership in the most official manner. Dive in and savor your reading!',
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
        description: "You don't own the White Paper NFT. Sorry for that.",
        status: 'error',
        variant: 'subtle',
        duration: 10000,
        isClosable: true,
      })
      setLoggedInAddress('')
    }
  }

  const download = () => {
    setLoading(true)
    const link = document.createElement('a')
    link.href = secretContent
    link.download = 'arthera-whitepaper.pdf'
    link.target = '_blank'
    link.click()
    setLoading(false)
  }

  return (
    <>
      <Head />
      <main>
        {/* <Heading as="h2">NFT-gated content</Heading> */}
        <br />

        {loggedInAddress ? (
          <>
            {/* <Image alt="whitepaper" src={secretContent} /> */}
            <Box width="100%" height="100vh" display="flex" justifyContent="center" alignItems="center">
              <iframe src={secretContent} title="pdf" width="100%" height="100%"></iframe>
            </Box>
            <br />
            {/* {!loading ? (
              !txLink ? (
                <Button colorScheme="blue" variant="outline" onClick={download}>
                  Download
                </Button>
              ) : (
                <Button disabled colorScheme="blue" variant="outline" onClick={download}>
                  Download
                </Button>
              )
            ) : (
              <Button isLoading colorScheme="blue" loadingText="Downloading..." variant="outline">
                Downloading...
              </Button>
            )} */}

            {/* <p>
              <b>
                <LinkComponent href="/access">Download PDF</LinkComponent>
              </b>
            </p> */}
          </>
        ) : (
          <>
            <Text fontSize="20px" mb={3}>
              If you&apos;re the owner of the White Paper NFT, please click on the &quot;Reveal&quot; button.
            </Text>
            <br />
            <Text fontSize="20px" mb={3}>
              Otherwise you can mint the NFT{' '}
              <LinkComponent href="/">
                <b>here</b>
              </LinkComponent>
              .
            </Text>
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
