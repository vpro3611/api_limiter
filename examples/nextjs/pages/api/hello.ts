import type { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  res.status(200).json({ 
    message: 'Success! You accessed the Next.js API route.',
    note: 'The rate limit was enforced by the middleware.ts file.'
  });
}
