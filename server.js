'use strict'

const express = require('express')
const cors = require('cors')
require('dotenv').config()

const app = express()
app.use(cors())

const PORT = process.env.PORT;

app.get('/hello', (req, res) => {
  try {
    res.send('My page is live.')
  } catch (error) {
    console.log(error);
  }
})

app.listen(PORT, () => {console.log(`Server has been started on ${PORT}`)});