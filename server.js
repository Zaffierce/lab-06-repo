'use strict'

const express = require('express')
const cors = require('cors')
require('dotenv').config()

const app = express()
app.use(cors())

const PORT = process.env.PORT;

const geoData = require('./data/geo.json')

let testArr = [];
function GeoConstruct(address, lat, lon) {
  this.address = address;
  this.lat = lat;
  this.long = lon;

  testArr.push(this);
}

new GeoConstruct(geoData.results[0].formatted_address, geoData.results[0].geometry.location.lat, geoData.results[0].geometry.location.long)


app.get('/test', (req, res) => {


  res.send(testArr);
})



app.get('/location', (req, res) => {
  try {
    const geoData = require('./data/geo.json')
    const searchQuery = req.query.data;
    const formattedQuery = geoData.results[0].formatted_address;
    const lat = geoData.results[0].geometry.location.lat;
    const lon = geoData.results[0].geometry.location.lon;

    const formattedData = {
      search_query: searchQuery,
      formatted_query: formattedQuery,
      latitude: lat,
      longitude: lon
    }

    res.send(formattedData)
  } catch(error) {
    console.log(error)
  }
})

app.get('/weather', (req, res) => {
  try {
    const darkSky = require('./data/darksky.json');
    // const searchQuery = req.query.data;
    const summary = darkSky.daily.data[0].summary

    const formattedData = {
      // search_query: searchQuery;
      summary_query: summary
    }
    res.send(formattedData)
  } catch (error) {
    console.log(error)
  }
})

app.listen(PORT, () => {console.log(`Server has been started on ${PORT}`)});
