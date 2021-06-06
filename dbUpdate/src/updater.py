import datetime
import re
import unicodedata
import utils
import pandas as pd
import os

# TODO: analyze the CSV files and insert relevant info into each table
# general idea: use sys.argv[argument index]
# TODO: figure out a way to determine new players for insertion into the players_teams table

base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def load_csv_to_df(file_path: str) -> pd.DataFrame:
    return pd.read_csv(file_path)


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


def remove_columns(df: pd.DataFrame) -> pd.DataFrame:
    pass


def main():
    match_path = f'{base_dir}\\matches.csv'
    players_path = f'{base_dir}\\players.csv'

    db = utils.DatabaseConnection()

    most_recent_match = db.get_most_recent_match_timestamp()
    try:
        truncated_match_df = truncate_df_after_date(date=most_recent_match,
                                                    file_path=match_path)
        truncated_players_df = truncate_df_after_date(date=most_recent_match,
                                                      file_path=players_path)
    except KeyError:
        print('CSV file MUST have round_start_time column for filtering, exiting')
        db.rollback()
        db.terminate()
        exit()
    except ValueError:
        print('No new data present that is not already in database, exiting')
        db.rollback()
        db.terminate()
        exit()

    truncated_match_df = dataframe_sanitize(truncated_match_df)
    truncated_players_df = dataframe_sanitize(truncated_players_df)

    # TODO: compare existing year, player, team


    # TODO: insert match and players data here using db.insert_copy_bulk_data()
    # will need to remove a few columns from each dataframe





    db.rollback()
    db.terminate()


if __name__ == "__main__":
    main()
