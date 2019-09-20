'use strict';

const express = require('express');
const cors = require('cors');
const superagent = require('superagent');
const pg = require('pg');
require('dotenv').config()

const app = express();
app.use(cors());

const PORT = process.env.PORT;
const GEOCODE_API = process.env.GEOCODE_API_KEY;
const WEATHER_API_KEY = process.env.DARK_SKY_API_API;
const EVENTBRITE_API_KEY = process.env.EVENTBRITE_API_KEY;
const YELP_API_KEY = process.env.YELP_API_KEY;
const MOVIE_KEY_API = process.env.THEMOVIEDB_API_KEY;
const TRAIL_API_KEY = process.env.TRAIL_API_KEY;

const client = new pg.Client(process.env.DATABASE_URL);
client.connect();
client.on('error', (error) => console.error(error));

app.get('/location', getLocation);
app.get('/weather', getWeather);
app.get('/events', getEvents);
app.get('/movies', getMovies);
app.get('/yelp', getReviews);
// app.get('/trails', getTrails);

function getLocation(request, response) {
  const query = request.query.data;
  const tableName = 'locations';
  const API_URL = `https://maps.googleapis.com/maps/api/geocode/json?address=${query}&key=${GEOCODE_API}`
  const superAgentGet = superagent.get(`${API_URL}`);
  const ageOfMyDataInSeconds = 0;
  queryData(tableName, query, superAgentGet, ageOfMyDataInSeconds, response);
}

function getWeather(request, response) {
  const query = request.query.data;
  const tableName = 'weather';
  const API_URL = `https://api.darksky.net/forecast/${WEATHER_API_KEY}/${query.latitude},${query.longitude}`;
  const superAgentGet = superagent.get(`${API_URL}`);
  const ageOfMyDataInSeconds = 15;
  queryData(tableName, query, superAgentGet, ageOfMyDataInSeconds, response);
}

function getEvents(request, response) {
  let query = request.query.data;
  const tableName = 'events';
  const API_URL = `https://www.eventbriteapi.com/v3/events/search/?sort_by=date&location.latitude=${query.latitude}&location.longitude=${query.longitude}&token=${EVENTBRITE_API_KEY}`;
  const superAgentGet = superagent.get(`${API_URL}`);
  const ageOfMyDataInSeconds = 10;
  queryData(tableName, query, superAgentGet, ageOfMyDataInSeconds, response);
}

function getMovies(request, response) {
  const query = request.query.data;
  const tableName = 'movies';
  const API_URL = `https://api.themoviedb.org/3/search/movie?api_key=${MOVIE_KEY_API}&query=${query.search_query}`;
  const superAgentGet = superagent.get(`${API_URL}`);
  const ageOfMyDataInSeconds = 2592000;
  queryData(tableName, query, superAgentGet, ageOfMyDataInSeconds, response);
}

function getReviews(request, response) {
  const query = request.query.data;
  const tableName = 'reviews';
  const API_URL = `https://api.yelp.com/v3/businesses/search?latitude=${query.latitude}&longitude=${query.longitude}`;
  const superAgentGet = superagent.get(`${API_URL}`).set('Authorization', `Bearer ${YELP_API_KEY}`);
  const ageOfMyDataInSeconds = 10;
  queryData(tableName, query, superAgentGet, ageOfMyDataInSeconds, response);
}

function queryData(tableName, query, superAgentGet, ageOfMyDataInSeconds, response) {
  return client.query(`SELECT * FROM ${tableName} WHERE (search_query=$1 OR search_query=$2)`, [query, query.search_query]).then(sqlResult => {
    if (tableName === 'locations') {
      if (sqlResult.rowCount > 0) {
        response.send(sqlResult.rows[0]);
      } else {
        console.log(`This place doesn't exist yet.`);
        superAgentGet.then(responseFromSuper => {
          const newLocation = new Location(query, responseFromSuper);
          sqlInsert(tableName, newLocation);
          response.send(newLocation);
        }).catch(error => response.status(500).send(error.message));
      }
    }
    else {
      let notTooOld = true;
      if (sqlResult.rowCount > 0) {
        const age = sqlResult.rows[0].created_at;
        const ageInSeconds = (Date.now() - age) / 1000;
        if (ageInSeconds > ageOfMyDataInSeconds) {
          notTooOld = false;
          console.log(`Deleting from ${tableName} as this data is older than ${ageOfMyDataInSeconds} seconds!`);
          client.query(`DELETE FROM ${tableName} where search_query=$1;`, [query.search_query]);
        }
        if (sqlResult.rowCount > 0 && notTooOld) {
          response.send(sqlResult.rows)
        }
        else {
          console.log(`this does not exist in ${tableName}, adding ${query.search_query} now.`);
          superAgentGet.then(responseFromSuper => {
            if (tableName === 'weather') {
              const eightDays = responseFromSuper.body.daily.data;
              const formattedDays = eightDays.map(day => new Day(query, day.summary, day.time));
              formattedDays.forEach(day => sqlInsert(tableName, day));
              response.send(formattedDays)
            }
            if (tableName === 'events') {
              const dailyEvents = responseFromSuper.body.events;
              const formattedEvents = dailyEvents.slice(0, 20).map(day => new Event(query, day));
              formattedEvents.forEach(event => sqlInsert(tableName, event));
              response.send(formattedEvents);
            }
            if (tableName === 'movies') {
              const movieResults = responseFromSuper.body.results;
              const formattedMovies = movieResults.slice(0, 20).map(movie => new Movie(query, movie))
              formattedMovies.forEach(movie => sqlInsert(tableName, movie));
              response.send(formattedMovies);
            }
            if (tableName === 'reviews') {
              const yelpResults = responseFromSuper.body.businesses;
              const formattedYelp = yelpResults.slice(0, 20).map(result => new Yelp(query, result));
              formattedYelp.forEach(yelp => sqlInsert(tableName, yelp));
              response.send(formattedYelp);
            }
          }).catch(error => console.error(error))
        }}
    }
  })
}

function sqlInsert(tableName, constructor) {
  let sqlValueArr = []
  let sqlQueryInsert;
  if (tableName === 'locations') {
    sqlQueryInsert = `INSERT INTO ${tableName} (search_query, formatted_query, latitude, longitude) VALUES ($1, $2, $3, $4);`;
    sqlValueArr = [constructor.search_query, constructor.formatted_query, constructor.latitude, constructor.longitude];
  }
  if (tableName === 'weather') {
    sqlQueryInsert = `INSERT INTO ${tableName} (search_query, forecast, time, created_at) VALUES ($1, $2, $3, $4);`;
    sqlValueArr = [constructor.search_query, constructor.forecast, constructor.time, constructor.created_at]
  }
  if (tableName === 'events') {
    sqlQueryInsert = `INSERT INTO ${tableName} (search_query, link, name, event_date, summary, created_at) VALUES ($1, $2, $3, $4, $5, $6);`;
    sqlValueArr = [constructor.search_query, constructor.link, constructor.name, constructor.date, constructor.summary, constructor.created_at];
  }
  if (tableName === 'movies') {
    sqlQueryInsert = `INSERT INTO ${tableName} (search_query, title, overview, average_votes, image_url, popularity, released_on, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8);`;
    sqlValueArr = [constructor.search_query, constructor.title, constructor.overview, constructor.average_votes, constructor.image_url, constructor.popularity, constructor.released_on, constructor.created_at];
  }
  if (tableName === 'reviews') {
    sqlQueryInsert = `INSERT INTO ${tableName} (search_query, name, image_url, price, rating, url, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7);`;
    sqlValueArr = [constructor.search_query, constructor.name, constructor.image_url, constructor.price, constructor.rating, constructor.url, constructor.created_at];
  }
  client.query(sqlQueryInsert, sqlValueArr)
}

function Location(query, responseFromSuper) {
  this.search_query = query;
  this.formatted_query = responseFromSuper.body.results[0].formatted_address;
  this.latitude = responseFromSuper.body.results[0].geometry.location.lat;
  this.longitude = responseFromSuper.body.results[0].geometry.location.lng;
}

function Day(query, forecast, time) {
  this.search_query = query.search_query;
  this.forecast = forecast;
  this.time = new Date(time * 1000).toDateString();
  this.created_at = Date.now();
}

function Event(query, day) {
  this.search_query = query.search_query;
  this.link = day.url;
  this.name = day.name.text;
  this.event_date = new Date(day.start.local).toDateString();
  this.summary = day.description.text;
  this.created_at = Date.now();
}

function Movie(query, movie) {
  this.search_query = query.search_query;
  this.title = movie.title;
  this.overview = movie.overview;
  this.average_votes = movie.average_votes;
  this.image_url = `https://image.tmdb.org/t/p/w500${movie.poster_path}`;
  this.popularity = movie.popularity;
  this.released_on = movie.released_on;
  this.created_at = Date.now();
}

function Yelp(query, result) {
  this.search_query = query.search_query;
  this.name = result.name;
  this.image_url = result.image_url;
  this.price = result.price;
  this.rating = result.rating;
  this.url = result.url;
  this.created_at = Date.now();
}

app.listen(PORT, () => { console.log(`app is up on PORT ${PORT}`) });
