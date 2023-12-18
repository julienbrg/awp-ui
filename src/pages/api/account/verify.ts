import { NextApiRequest, NextApiResponse } from 'next'
import { SiweMessage } from 'siwe'
import { withSessionRoute } from '../../../utils/server'
import { ethers } from 'ethers'
import { NFT_CONTRACT_ADDRESS, NFT_CONTRACT_ABI } from '../../../lib/consts'

export default withSessionRoute(async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log(req.method, '/api/account/verify', req.session)

  const verifyNftOwnership = async (addr: any) => {
    const provider = new ethers.JsonRpcProvider('https://rpc-test.arthera.net')
    const nft = new ethers.Contract(NFT_CONTRACT_ADDRESS, NFT_CONTRACT_ABI, provider)
    const nftBal = await nft.balanceOf(addr)
    console.log('nftBal:', nftBal)
    if (Number(nftBal) > 0) {
      return true
    }
  }

  if (req.method === 'POST') {
    try {
      const { message, signature } = req.body
      const siweMessage = new SiweMessage(message)
      const fields = await siweMessage.validate(signature)
      if (fields.nonce !== req.session.nonce) return res.status(422).json({ message: 'Invalid nonce.' })

      const isNftOwner = await verifyNftOwnership(message.address)

      if (!isNftOwner) return res.status(422).json({ message: 'Could not verify the NFT ownership.' })

      const secretContent = isNftOwner ? process.env.NEXT_PUBLIC_SECRET : 'oh!'

      const responseObj = {
        ok: true,
        secretContent: secretContent,
      }

      req.session.siwe = fields
      await req.session.save()
      return res.json(responseObj)
    } catch (ex) {
      console.error(ex)
      return res.json({ ok: false })
    }
  }

  res.setHeader('Allow', ['POST'])
  return res.status(405).end(`Method ${req.method} Not Allowed`)
})
