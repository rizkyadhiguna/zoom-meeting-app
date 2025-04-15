import axios from 'axios';
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    try {
      const backendURL = 'http://localhost:8080/api/create-meeting';
      const response = await axios.post(backendURL, req.body);
      res.status(response.status).json(response.data);
    } catch (error: any) {
      console.error('Error forwarding to backend:', error);
      res.status(500).json({ error: 'Failed to create meeting', details: error.message });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}