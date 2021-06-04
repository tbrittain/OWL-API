import datetime
import os
import psycopg2
import psycopg2.errors
import pytest
from dotenv import load_dotenv
import utils
import config
import pandas as pd

base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if config.environment == "dev":
    load_dotenv(f'{base_dir}\\dev.env')
elif config.environment == "prod":
    load_dotenv(f'{base_dir}\\prod.env')
else:
    print("Invalid environment setting, exiting")
    exit()

db_user = os.getenv("DB_USER")
db_pass = os.getenv("DB_PASS")
db_name = os.getenv("DB_NAME")
db_host = os.getenv("DB_HOST")
db_port = os.getenv("DB_PORT")


@pytest.fixture(scope="module")
def db_connection():
    """Connect to database"""
    conn = psycopg2.connect(dbname=db_name,
                            user=db_user,
                            password=db_pass,
                            host=db_host,
                            port=db_port)

    # Yield database connection to tests
    yield conn

    conn.rollback()
    conn.close()


# https://docs.pytest.org/en/latest/how-to/fixtures.html#scope-sharing-fixtures-across-classes-modules-packages-or-session
@pytest.fixture(scope="function")
def db_connection_class():
    """Connect to database through Database Connection object"""
    db = utils.DatabaseConnection()

    yield db

    db.rollback()
    db.terminate()


def test_database_connection(db_connection):
    """Connection to database established"""
    conn = db_connection
    cur = conn.cursor()

    cur.execute('SELECT COUNT(*) FROM map_stats')
    rows = cur.fetchall()
    # raw rows data: [(9567,)]
    assert rows[0][0] > 0, "Existing data present in database"
    cur.close()


def test_database_connection_class(db_connection_class):
    db = db_connection_class

    rows = db.select_query(query_literal="COUNT(*)", table="map_stats")
    assert rows[0][0] > 0, "Existing data present in database using Database Connection class and single select query"


def test_db_class_invalid_query(db_connection_class):
    db = db_connection_class

    # empty query
    with pytest.raises(ValueError) as e_info:
        db.select_query(query_literal="", table="map_stats")

    # empty table
    with pytest.raises(ValueError) as e_info:
        db.select_query(query_literal="COUNT(*)", table="")

    # malformed query literal
    # see psycopg.errorcodes for list of postgres error codes
    with pytest.raises(psycopg2.errors.lookup("42703")) as e_info:
        db.select_query(query_literal="COUNT", table="map_stats")

    # table does not exist
    # actually throws psycopg2.errors.InFailedSqlTransaction
    with pytest.raises(psycopg2.errors.lookup("25P02")) as e_info:
        db.select_query(query_literal="COUNT(*)", table="map_sats")


def test_select_most_recent_match_date(db_connection_class):
    db = db_connection_class

    timestamp = db.get_most_recent_match_timestamp()
    assert isinstance(timestamp, datetime.datetime), "Get most recent match timestamp method returns a " \
                                                     "datetime.datetime object"


def test_db_class_batch_insert(db_connection_class):
    db = db_connection_class

    data = {
        "year": [2021, 2021, 2021, 2021, 2021],
        "match_id": [37234, 37234, 37234, 37234, 37234],
        "player": ["Doha", "Doha", "Doha", "Doha", "Doha"],
        "stat_name": ["All Damage Done", "Assists", "Average Time Alive", "Barrier Damage Done",
                      "Damage - Quick Melee"],
        "hero": ["All Heroes", "All Heroes", "All Heroes", "All Heroes", "All Heroes"],
        "stat_amount": [13900.68009, 8, 56.48110171, 1495.492155, 60]
    }
    columns = ("year", "match_id", "player", "stat_name", "hero", "stat_amount")
    test_df = pd.DataFrame.from_dict(data)

    num_inserted = db.insert_copy_bulk_data(table="player_stats", df=test_df, columns=columns)
    assert num_inserted == len(test_df), "Successful insertion of data to database returns number of rows inserted"


def test_db_single_insert(db_connection_class):
    db = db_connection_class

    columns = ("year", "player", "team")
    data = (2021, "Doha", "Dallas Fuel")
    inserted_safely = db.insert_single_row(table="players_teams", columns=columns, row=data)
    assert inserted_safely == True, "Successful insertion of single row returns True"


if __name__ == "__main__":
    pass
