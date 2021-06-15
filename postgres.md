# Initial population of data

Download the map and player data CSVs from the [Stats Lab website](https://overwatchleague.com/en-us/statslab) in the "Download the Data" section near the bottom.

There is not currently a straightforward method of populating the database with all of the data all at once, but the dbUpdate module that is used to update the database can perform this operation, albeit with some manual editing of the data. This is partially due to how the data is presented by OWL in the form of large, individual CSVs.

## Database creation

Below are a few SQL commands to create the required tables. By default, these should be created in the database `root` created by the Docker instance of Postgres.

Table `map_stats`:
```sql
-- Table: public.map_stats

-- DROP TABLE public.map_stats;

CREATE TABLE public.map_stats
(
    round_start_time timestamp without time zone,
    round_end_time timestamp without time zone,
    year integer,
    stage integer,
    playoffs boolean,
    postseason boolean,
    match_id integer NOT NULL,
    game_number integer NOT NULL,
    match_winner character varying(50) COLLATE pg_catalog."default",
    map_winner character varying(50) COLLATE pg_catalog."default",
    map_loser character varying(50) COLLATE pg_catalog."default",
    map_name character varying(50) COLLATE pg_catalog."default" NOT NULL,
    map_type character varying(50) COLLATE pg_catalog."default",
    map_round integer NOT NULL,
    winning_team_final_map_score integer,
    losing_team_final_map_score integer,
    control_round_name character varying(50) COLLATE pg_catalog."default",
    attacker character varying(50) COLLATE pg_catalog."default",
    defender character varying(50) COLLATE pg_catalog."default",
    attacker_payload_distance numeric,
    defender_payload_distance numeric,
    attacker_time_banked numeric,
    defender_time_banked numeric,
    attacker_control_perecent numeric,
    defender_control_perecent numeric,
    attacker_round_end_score integer,
    defender_round_end_score integer,
    CONSTRAINT map_stats_pkey PRIMARY KEY (match_id, game_number, map_name, map_round)
)

TABLESPACE pg_default;

ALTER TABLE public.map_stats
    OWNER to postgres;
```

Table `player_stats`:

```sql
-- Table: public.player_stats

-- DROP TABLE public.player_stats;

CREATE TABLE public.player_stats
(
    year integer,
    match_id integer,
    player character varying(50) COLLATE pg_catalog."default",
    stat_name character varying(100) COLLATE pg_catalog."default",
    hero character varying(50) COLLATE pg_catalog."default",
    stat_amount numeric
)

TABLESPACE pg_default;

ALTER TABLE public.player_stats
    OWNER to postgres;
-- Index: player_stats_distinct_match_id_player

-- DROP INDEX public.player_stats_distinct_match_id_player;

CREATE INDEX player_stats_distinct_match_id_player
    ON public.player_stats USING btree
    (match_id ASC NULLS LAST, player COLLATE pg_catalog."default" ASC NULLS LAST)
    TABLESPACE pg_default;
```

Table `players_teams`:
```sql
-- Table: public.players_teams

-- DROP TABLE public.players_teams;

CREATE TABLE public.players_teams
(
    year integer NOT NULL,
    player character varying(50) COLLATE pg_catalog."default" NOT NULL,
    team character varying(100) COLLATE pg_catalog."default" NOT NULL,
    CONSTRAINT players_teams_pkey PRIMARY KEY (year, player, team)
)

TABLESPACE pg_default;

ALTER TABLE public.players_teams
    OWNER to root;
```

Once these three tables are created, data can then start to be inserted into them. Essentially what needs to happen is that the update process below needs to be repeated for the data from each year.

So for each year of data being inserted, perform the steps below. Be sure to insert each season's data chronologically to prevent any problems from occurring.

# Updating database with fresh data

Download the map and player data CSVs *(for the relevant year to be updated in the case of the player data)* from the [Stats Lab website](https://overwatchleague.com/en-us/statslab) in the "Download the Data" section near the bottom.

## Map Data

1. Rename the map data CSV to `matches.csv`
2. Isolate the rows to only show matches from the current year
3. Create `year`, `stage`, `playoffs`, and `postseason` columns
   1. `year` is the same for all matches (i.e. 2019)
   2. `stage` refers to the numerical stage the match took place in (i.e. `1` for May Melee, `2` for June Joust, etc.)
   3. `playoffs` and `postseason` are booleans for whether the match was a stage playoff or postseason
      1. Stage playoff → `true` for `playoffs` column
      2. Postseason → `true` for both `playoffs` and `postseason` columns
   4. The above details can be found through [Liquipedia](https://liquipedia.net/overwatch/Overwatch_League/Season_4/Regular_Season)
4. Delete `team_one` and `team_two` columns
5. Create a `map_type` column for each map type. Handy Excel function to easily determine based on map_name:
```excel
=IF(OR(L2="Hanamura",L2="Horizon Lunar Colony",L2="Paris",L2="Temple of Anubis",L2="Volskaya Industries"),"assault",IF(OR(L2="Busan",L2="Ilios",L2="Lijiang Tower",L2="Nepal",L2="Oasis"),"control",IF(OR(L2="Blizzard World",L2="Eichenwalde",L2="Hollywood",L2="King's Row",L2="Numbani"),"hybrid",IF(OR(L2="Dorado",L2="Havana",L2="Junkertown",L2="Rialto",L2="Route 66",L2="Watchpoint: Gibraltar"),"payload"))))
```

Place `matches.csv` in the directory `dbUpdate` (not `dbUpdate/src`)

## Player data

1. Rename the player data CSV to `players.csv`
2. Remove the following columns: `tournament_title`, `map_type`, `map_name`
3. Rename the following columns:
   1. `esports_match_id` to `match_id`
   2. `player_name` to `player`
   3. `hero_name` to `hero`
   4. `team_name` to `team`
   5. `start_time` to `round_start_time`
4. Add `year` column 

Place `players.csv` in the same directory as `matches.csv`

# Performing the update

Once the steps above are completed, all that needs to be done is to run the application in the usual manner with

```
docker compose up
```

The dbUpdate container will automatically analyze the contents of `matches.csv` and `players.csv` and add the appropriate data to each of the corresponding tables. From there, the REST and GraphQL APIs should be ready to use.