'use strict';

const express = require('express');
const cors = require('cors');
const superagent = require('superagent');
require('dotenv').config()

const app = express();
app.use(cors());

const PORT = process.env.PORT;
const GEOCODE_API = process.env.GEOCODE_API_KEY;
const WEATHER_API_KEY = process.env.DARK_SKY_API_API;
const EVENTBRITE_API_KEY = process.env.EVENTBRITE_API_KEY

function Location(query, format, lat, lng) {
  this.search_query = query;
  this.formatted_query = format;
  this.latitude = lat;
  this.longitude = lng;
}

app.get('/location', (req, res) => {
  //the data lives in the query
  const query = req.query.data;
  const urlToVisit = `https://maps.googleapis.com/maps/api/geocode/json?address=${query}&key=${GEOCODE_API}`
  // const geoData = require('./data/geo.json');

  // No need to store this into a variable
  // Could also be refactored also into a function.
  superagent.get(urlToVisit).then(responseFromSuper => {
    // console.log('stuff', responseFromSuper.body);
    const geoData = responseFromSuper.body
    const specificGeoData = geoData.results[0];

    const formatted = specificGeoData.formatted_address;
    const lat = specificGeoData.geometry.location.lat;
    const lng = specificGeoData.geometry.location.lng;

    const newLocation = new Location(query, formatted, lat, lng)
    res.send(newLocation)
  }).catch(error => {
    res.status(500).send(error.message);
    console.log(error)
  })
})

app.get('/weather', getWeather)

app.get('/events', getEvents)



//Requires req, res from app.get
function getWeather(req, res) {
  const query = req.query.data;
  const urlToVisit = `https://api.darksky.net/forecast/${WEATHER_API_KEY}/${query.latitude},${query.longitude}`

  superagent.get(urlToVisit).then(responseFromSuper => {
    const weatherData = responseFromSuper.body
    const specificWeatherData = weatherData.daily.data;
    const formattedDays = specificWeatherData.map(day => new Day(day.summary, day.time));
    res.send(formattedDays)

  }).catch(error => {
    res.status(500).send(error.message);
    console.log(error)
  })
}

function getEvents(req, res) {

  let lastTwentyEvents = [];

  const query = req.query.data;
  const urlToVisit = `https://www.eventbriteapi.com/v3/events/search/?sort_by=date&location.latitude=${query.latitude}&location.longitude=${query.longitude}&token=${EVENTBRITE_API_KEY}`

  superagent.get(urlToVisit).then(responseFromSuper => {
    const eventData = responseFromSuper.body
    const specificEventData = eventData.events

    for (let i = 0; i < 20; i++) {
      let url = specificEventData[i].url;
      let name = specificEventData[i].name.text;
      let eventDate = specificEventData[i].start.local;
      let eventSummary = specificEventData[i].description.text;

      const formattedEvents = new Event(url, name, eventDate, eventSummary);
      lastTwentyEvents.push(formattedEvents);
    }
    res.send(lastTwentyEvents)
  }).catch(error => {
    res.status(500).send(error.message);
    console.log(error)
  })
}

function Day (summary, time) {
  this.forecast = summary;
  this.time = new Date(time * 1000).toDateString();
}

function Event (link, name, event_date, summary) {
  this.link = link;
  this.name = name;
  this.event_date = event_date;
  this.summary = summary;
}

app.listen(PORT, () => {console.log(`App up on PORT ${PORT}`)});


