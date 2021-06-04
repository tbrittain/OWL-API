import datetime
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

    # TODO: insert match and players data here using db.insert_copy_bulk_data()
    # will need to remove a few columns from each dataframe

    # TODO: pull existing distinct year, player, team from players_teams table

    # TODO: compare existing year, player, team

    db.rollback()
    db.terminate()


if __name__ == "__main__":
    main()
