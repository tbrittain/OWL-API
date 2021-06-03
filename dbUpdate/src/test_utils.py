import os
import psycopg2
import pytest
from dotenv import load_dotenv

import utils

base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
load_dotenv(f'{base_dir}\\dev.env')
db_user = os.getenv("DB_USER")
db_pass = os.getenv("DB_PASS")
db_name = os.getenv("DB_NAME")


@pytest.fixture(scope="module")
def db_connection():
    """Connect to database"""
    conn = psycopg2.connect(dbname=db_name,
                            user=db_user,
                            password=db_pass,
                            host="localhost",
                            port=5432)

    # Yield database connection to tests
    yield conn

    conn.rollback()
    conn.close()


@pytest.fixture(scope="module")
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
    pass
    # TODO


if __name__ == "__main__":
    print(db_user, db_pass, db_name)
    print(os.getcwd())
    print(base_dir)
