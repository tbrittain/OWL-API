import datetime
import sys
import utils
import pandas as pd
import os


# TODO: analyze the CSV files and insert relevant info into each table
# general idea: use sys.argv[argument index]
# TODO: figure out a way to determine new players for insertion into the players_teams table

def load_csv_to_df(file_path: str) -> pd.DataFrame:
    return pd.read_csv(file_path)


def truncate_df_after_date(date: datetime.datetime, file_path: str) -> pd.DataFrame:
    pass


if __name__ == "__main__":
    # a = int(sys.argv[1])
    # b = int(sys.argv[2])
    # print(a + b)
    pass
