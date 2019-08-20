'use strict'

const express = require('express')
const cors = require('cors')
require('dotenv').config()

const app = express()
app.use(cors())

const PORT = process.env.PORT;

const geoData = require('./data/geo.json')

GeoConstruct.geodata = [];
function GeoConstruct(longname, address, lat, lon) {
  this.longname = longname;
  this.address = address;
  this.lat = lat;
  this.lon = lon;

  GeoConstruct.geodata.push(this);
}
//for loop eventually?
new GeoConstruct(geoData.results[0].address_components[0].long_name, geoData.results[0].formatted_address, geoData.results[0].geometry.location.lat, geoData.results[0].geometry.location.lng)



DarkConstruct.darkskydata = []
function DarkConstruct(summary, time) {
  this.forecast = summary,
  this.time = time

  DarkConstruct.darkskydata.push(this);
}


app.get('/test', (req, res) => {
  // res.send(DarkConstruct.darkskydata);

  const darkSky = require('./data/darksky.json');

  let weekday = new Array(7);
  weekday[0] = "Sunday";
  weekday[1] = "Monday";
  weekday[2] = "Tuesday";
  weekday[3] = "Wednesday";
  weekday[4] = "Thursday";
  weekday[5] = "Friday";
  weekday[6] = "Saturday";

  let month = new Array();
  month[0] = "January";
  month[1] = "February";
  month[2] = "March";
  month[3] = "April";
  month[4] = "May";
  month[5] = "June";
  month[6] = "July";
  month[7] = "August";
  month[8] = "September";
  month[9] = "October";
  month[10] = "November";
  month[11] = "December";

  for (let i = 0; i < darkSky.daily.data.length; i++) {
    let forecast = darkSky.daily.data[i].summary;
    let time = darkSky.daily.data[i].time;
    // var d = new Date();
    // var n = d.getDay()
    let newTime = new Date(time*1000) ;
    let day = weekday[newTime.getDay()];
    let numOfMonth = month[newTime.getMonth()]
    //"Mon Jan 01 2001"
    let modifiedDate = `${day}, ${numOfMonth} ${newTime.getDate()} ${newTime.getFullYear()}`
    let constructWeather = new DarkConstruct(forecast, modifiedDate)
    DarkConstruct.darkskydata.push(constructWeather)
  }
  res.send(DarkConstruct.darkskydata);
})



app.get('/location', (req, res) => {
  try {
    const searchQuery = req.query.data;
    const longNameQuery = GeoConstruct.geodata[0].longname;
    const formattedQuery = GeoConstruct.geodata[0].address;
    const lat = GeoConstruct.geodata[0].lat;
    const lon = GeoConstruct.geodata[0].lon;

    const formattedData = {
      search_query: searchQuery,
      longname_query: longNameQuery,
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

    for (let i = 0; i < darkSky.daily.data.length; i++) {
      let forecast = darkSky.daily.data[i].summary;
      let time = darkSky.daily.data[i].time;
      let constructWeather = new DarkConstruct(forecast, time)
      DarkConstruct.darkskydata.push(constructWeather)
    }
    res.send(DarkConstruct.darkskydata);
  } catch (error) {
    console.log(error)
  }
})

app.listen(PORT, () => {console.log(`Server has been started on ${PORT}`)});
