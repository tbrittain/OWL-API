import datetime
import re
import traceback
import unicodedata
import numpy as np
import utils
import pandas as pd
import os
import config
from project_logging import logger

base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def load_csv_to_df(file_path: str) -> pd.DataFrame:
    return pd.read_csv(file_path, na_values=np.NaN)


def truncate_df_after_date(date: datetime.datetime, file_path: str) -> pd.DataFrame:
    raw_df = load_csv_to_df(file_path=file_path)
    # pd.set_option('display.max_columns', None)
    try:
        raw_df['round_start_time'] = pd.to_datetime(raw_df['round_start_time'])
    except KeyError:
        raise KeyError('CSV file MUST have round_start_time column for filtering')

    filtered_df = raw_df.loc[(raw_df['round_start_time'] > date)]

    if filtered_df.count()[0] > 0:
        return filtered_df
    else:
        raise ValueError('No new data present that is not already in database')


def dataframe_sanitize(df: pd.DataFrame) -> pd.DataFrame:
    def strip_accents(text: str) -> str:
        """helper function for removing accented characters,
        such as Lúcio -> Lucio and blasé -> blase"""
        text = unicodedata.normalize('NFD', text) \
            .encode('ascii', 'ignore') \
            .decode("utf-8")
        return str(text)

    columns = list(df.columns)

    if 'player' and 'hero' in columns:  # players.csv
        # this may not be necessary as string columns in pandas do not support UTF-8 by default
        # https://stackoverflow.com/questions/46271560/applying-a-function-on-a-pandas-dataframe-column-using-map
        df['player'] = list(map(lambda x: strip_accents(x), df['player']))
        df['hero'] = list(map(lambda x: strip_accents(x), df['hero']))

    elif 'map_name' in columns:  # matches.csv
        # https://stackoverflow.com/questions/43768023/remove-characters-from-pandas-column
        df["map_name"] = list(map(lambda x: re.sub("[':]", '', x), df['map_name']))

    return df


def generate_new_players(players_df: pd.DataFrame, existing_players) -> list:
    filtered_players_df = players_df[['year', 'player', 'team']]
    filtered_players_df = filtered_players_df.drop_duplicates()
    # https://stackoverflow.com/questions/38516664/anti-join-pandas
    new_players = []
    # iterrows generally slow, but it does not need to iterate over very many rows in this case
    for index, row in filtered_players_df.iterrows():
        player = tuple(row.values)
        if player not in existing_players:
            new_players.append(player)
    return new_players


def remove_columns(df: pd.DataFrame, columns_to_remove: list) -> pd.DataFrame:
    df_columns = list(df.columns)
    filtered_df_columns = [i for i in df_columns if i not in columns_to_remove]
    return df[filtered_df_columns]


def main():
    logger.info("Beginning match update")

    match_path = f'{base_dir}/matches.csv'
    players_path = f'{base_dir}/players.csv'

    logger.debug(f"Path to matches: ${match_path}")
    logger.debug(f"Path to players: ${players_path}")

    db = utils.DatabaseConnection()

    most_recent_match = db.get_most_recent_match_timestamp()
    time_since_most_recent_match = datetime.datetime.now() - most_recent_match
    logger.info(f"Most recent match in database was on {most_recent_match}, "
                f"{time_since_most_recent_match.days} days ago")
    try:
        truncated_match_df = truncate_df_after_date(date=most_recent_match,
                                                    file_path=match_path)
        truncated_players_df = truncate_df_after_date(date=most_recent_match,
                                                      file_path=players_path)
    except KeyError:
        logger.error('CSV file MUST have round_start_time column for filtering, exiting')
        db.rollback()
        db.terminate()
        exit()
    except ValueError:
        logger.warning('No new data present that is not already in database, exiting')
        db.rollback()
        db.terminate()
        exit()

    if truncated_match_df.count()[0] == 0:
        logger.warning("No new match info present, exiting")
        db.rollback()
        db.terminate()
        exit()

    truncated_match_df = dataframe_sanitize(truncated_match_df)
    truncated_players_df = dataframe_sanitize(truncated_players_df)

    raw_existing_players = db.select_query("*", "players_teams")
    new_players = generate_new_players(truncated_players_df, raw_existing_players)

    if new_players:
        logger.info(f"{len(new_players)} new player appearances identified since last database update")
        players_teams_columns = ("year", "player", "team")
        for player in new_players:
            db.insert_single_row(table="players_teams",
                                 columns=players_teams_columns,
                                 row=player)
    logger.info("New players added to players_teams table")

    # no columns from matches need to be removed, but date columns may need to be
    # handled with raw_df['round_start_time'] = pd.to_datetime(raw_df['round_start_time'])
    players_columns_to_remove = ["round_start_time", "team"]
    truncated_players_df = remove_columns(truncated_players_df, players_columns_to_remove)

    # copy matches
    try:
        map_table = "map_stats"
        columns = ('round_start_time', 'round_end_time', 'year', 'stage', 'playoffs', 'postseason', 'match_id',
                   'game_number', 'match_winner', 'map_winner', 'map_loser', 'map_name', 'map_type', 'map_round',
                   'winning_team_final_map_score', 'losing_team_final_map_score', 'control_round_name', 'attacker',
                   'defender', 'attacker_payload_distance', 'defender_payload_distance', 'attacker_time_banked',
                   'defender_time_banked', 'attacker_control_perecent', 'defender_control_perecent',
                   'attacker_round_end_score', 'defender_round_end_score')
        affected_rows = db.insert_copy_bulk_data(table=map_table,
                                                 df=truncated_match_df,
                                                 columns=columns)
        logger.info(f"Copying {affected_rows} rows into table {map_table}")
    except Exception as e:
        logger.error(f"An error occurred during copying over {map_table} data, rolling back changes")
        traceback.print_exc()
        db.rollback()
        db.terminate()
        exit()

    # copy players
    try:
        player_table = "player_stats"
        columns = ('year', 'match_id', 'player', 'stat_name', 'hero', 'stat_amount')
        affected_rows = db.insert_copy_bulk_data(table=player_table,
                                                 df=truncated_players_df,
                                                 columns=columns)
        logger.info(f"Copying {affected_rows} rows into table {player_table}")
    except Exception as e:
        logger.error(f"An error occurred during copying over {player_table} data, rolling back changes")
        traceback.print_exc()
        db.rollback()
        db.terminate()
        exit()

    if config.environment == "dev":
        db.rollback()
        logger.info("New data processed successfully, rolling back changes")
    else:
        db.commit()
        logger.info("New data committed to database")
    db.terminate()


if __name__ == "__main__":
    main()
