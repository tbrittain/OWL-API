# OWL-API
This (unofficial, of course) **O**ver**w**atch **L**eague API allows you to query data from OWL eSports results. It is made up of a REST and GraphQL API built upon publicly-available data from the [Stats Lab section of the OWL website](https://overwatchleague.com/en-us/statslab).

# Installation

In both the REST and GraphQL directories, run
```
npm install --production
```
and in the dbUpdate directory, run

```
pip install -r requirements.txt
```

Since this project is fully Dockerized, in the directory containing `docker-compose.yml`, you can build the application stack using

```
docker compose up
```

# Configuration

## Environment

Create a .env file in the directory where `docker-compose.yml` is in with the following keys:
1. `POSTGRES_USER`
2. `POSTGRES_HOST`
3. `POSTGRES_PASSWORD`
4. `POSTGRES_DATABASE`
5. `POSTGRES_PORT`
6. `PGADMIN_DEFAULT_EMAIL`
7. `PGADMIN_DEFAULT_PASSWORD`

*(Note: the pgAdmin keys may be omitted if you choose to not include pgAdmin, in which case you can also remove the pgAdmin container from `docker-compose.yml`)*

## Postgres

The REST API pulls statistic information from a PostgreSQL database, and you can use the functions of the dbUpdate module to initially populate and update the database.

To set up the database, follow the steps in `postgres.md`

# Endpoints

## REST

## GraphQL
