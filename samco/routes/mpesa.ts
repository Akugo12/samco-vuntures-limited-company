const express = require('express');
const axios = require('axios');
const router = express.Router();

// Generate timestamp
const getTimestamp = () => {
  const now = new Date();
  return now.getFullYear().toString()
    + String(now.getMonth() + 1).padStart(2, '0')
    + String(now.getDate()).padStart(2, '0')
    + String(now.getHours()).padStart(2, '0')
    + String(now.getMinutes()).padStart(2, '0')
    + String(now.getSeconds()).padStart(2, '0');
};

// Generate STK Push password
const getPassword = (timestamp) => Buffer.from(
  process.env.BUSINESS_SHORT_CODE + process.env.PASS_KEY + timestamp
).toString('base64');

// Get access token
const getAccessToken = async () => {
  const url = 'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials';
  const auth = Buffer.from(`${process.env.CONSUMER_KEY}:${process.env.CONSUMER_SECRET}`).toString('base64');
  const response = await axios.get(url, { headers: { Authorization: `Basic ${auth}` } });
  return response.data.access_token;
};

// STK Push initiation
router.post('/stk-push', async (req, res) => {
  try {
    const { phone, amount } = req.body;
    const accessToken = await getAccessToken();
    const timestamp = getTimestamp();
    const password = getPassword(timestamp);
    const data = {
      BusinessShortCode: process.env.BUSINESS_SHORT_CODE,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: amount,
      PartyA: phone,
      PartyB: process.env.BUSINESS_SHORT_CODE,
      PhoneNumber: phone,
      CallBackURL: process.env.CALLBACK_URL,
      AccountReference: 'SamcoOrder',
      TransactionDesc: `Payment from ${phone}`
    };
    const mpesaRes = await axios.post(
      'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest',
      data,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    res.json(mpesaRes.data);
  } catch (err) {
    console.error(err.response?.data || err);
    res.status(500).json({ error: 'Payment initiation failed' });
  }
});

// Callback endpoint
router.post('/callback', (req, res) => {
  console.log('MPESA Callback:', req.body);
  res.json({ status: 'received' });
});

module.exports = router;
