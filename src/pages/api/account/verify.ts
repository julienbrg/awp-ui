import { NextApiRequest, NextApiResponse } from 'next'
import { SiweMessage } from 'siwe'
import { withSessionRoute } from '../../../utils/server'
import { ethers } from 'ethers'
import { NFT_CONTRACT_ADDRESS, NFT_CONTRACT_ABI } from '../../../lib/consts'

export default withSessionRoute(async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log(req.method, '/api/account/verify', req.session)

  const verifyNftOwnership = async (addr) => {
    const provider = new ethers.providers.JsonRpcProvider('https://rpc-test.arthera.net')
    const nft = new ethers.Contract(NFT_CONTRACT_ADDRESS, NFT_CONTRACT_ABI, provider)
    const nftBal = await nft.balanceOf(addr)
    console.log('nftBal:', nftBal)
    if (Number(nftBal) > 0) {
      return true
    }
  }

  const decrypt = async (msg) => {
    // TODO: process.env.NEXT_PUBLIC_SECRET
    return 'https://bafybeiebgibloauyw6jynmbma2jrfaykqgvcd2p4gxbgm5pyjzvainndw4.ipfs.w3s.link/old-book.png'
  }

  if (req.method === 'POST') {
    try {
      const { message, signature } = req.body
      console.log('message.address', message.address)
      const siweMessage = new SiweMessage(message)
      const fields = await siweMessage.validate(signature)
      if (fields.nonce !== req.session.nonce) return res.status(422).json({ message: 'Invalid nonce.' })

      const isNftOwner = await verifyNftOwnership(message.address)
      if (!isNftOwner) return res.status(422).json({ message: 'Could not verify the NFT ownership.' })
      let secretContent
      if (isNftOwner) {
        secretContent = await decrypt('hello')
      } else {
        secretContent = 'oh!'
      }

      const responseObj = {
        ok: true,
        secretContent: secretContent, // Add the additional string here
      }

      req.session.siwe = fields
      await req.session.save()
      console.log('res:', res)
      return res.json(responseObj)
    } catch (ex) {
      console.error(ex)
      return res.json({ ok: false })
    }
  }

  res.setHeader('Allow', ['POST'])
  return res.status(405).end(`Method ${req.method} Not Allowed`)
})
