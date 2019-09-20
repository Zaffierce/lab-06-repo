DROP TABLE IF EXISTS locations;
DROP TABLE IF EXISTS weather;
DROP TABLE IF EXISTS events;
DROP TABLE IF EXISTS movies;
DROP TABLE IF EXISTS reviews;

CREATE TABLE locations (
    id SERIAL PRIMARY KEY,
    search_query VARCHAR(255),
    formatted_query VARCHAR(255),
    latitude NUMERIC(10,7),
    longitude NUMERIC(10,7)
);

CREATE TABLE weather (
    id SERIAL PRIMARY KEY,
    search_query VARCHAR(255),
    forecast VARCHAR(255),
    time VARCHAR(255),
    created_at BIGINT
);

CREATE TABLE events (
    id SERIAL PRIMARY KEY,
    search_query VARCHAR(255),
    link VARCHAR(255),
    name VARCHAR(255),
    event_date VARCHAR(255),
    summary VARCHAR,
    created_at BIGINT
);

CREATE TABLE movies (
  id SERIAL PRIMARY KEY,
  search_query VARCHAR(255),
  title VARCHAR(255),
  overview VARCHAR,
  average_votes NUMERIC(10,7),
  image_URL VARCHAR,
  popularity NUMERIC(10,7),
  released_on VARCHAR,
  created_at BIGINT
);

CREATE TABLE reviews(
  id SERIAL PRIMARY KEY,
  search_query VARCHAR(255),
  name VARCHAR(255),
  image_url VARCHAR,
  price VARCHAR,
  rating NUMERIC(10,7),
  url VARCHAR,
  created_at BIGINT
);