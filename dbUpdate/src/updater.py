import sys
import utils
import pandas as pd
import os


# TODO: analyze the CSV files and insert relevant info into each table
# general idea: use sys.argv[argument index]
# TODO: figure out a way to determine new players for insertion into the players_teams table

if __name__ == "__main__":
    # a = int(sys.argv[1])
    # b = int(sys.argv[2])
    # print(a + b)
    os.chdir("..")
    players = pd.read_csv(f'{os.getcwd()}\\players.csv')
    print(list(players.columns))
