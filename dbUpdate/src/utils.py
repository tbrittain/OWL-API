import datetime
import os
import config
import pandas as pd
import psycopg2
import psycopg2.errors

from dotenv import load_dotenv
from io import StringIO

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


class DatabaseConnection:
    def __init__(self):
        self.conn = psycopg2.connect(dbname=db_name,
                                     user=db_user,
                                     password=db_pass,
                                     host=db_host,
                                     port=db_port)

    def terminate(self):
        self.conn.close()

    def commit(self):
        self.conn.commit()

    def rollback(self):
        self.conn.rollback()

    def select_query(self, query_literal: str, table: str) -> list:
        """Executing literals not recommended as query parameterization is better,
        but this method will not be exposed to any end users"""
        if len(query_literal) == 0:
            raise ValueError('Query must not be empty')
        elif len(table) == 0:
            raise ValueError('Table must not be empty')

        cur = self.conn.cursor()
        try:
            cur.execute(f"SELECT {query_literal} FROM {table}")
            rows = cur.fetchall()
        except Exception as e:
            error_code = psycopg2.errors.lookup(e.pgcode)
            raise error_code
        finally:
            cur.close()

        return rows

    def get_most_recent_match_timestamp(self) -> datetime.datetime:
        """Pulls the most recent match timestamp from the database"""
        cur = self.conn.cursor()

        cur.execute("""SELECT round_start_time FROM map_stats 
                    ORDER BY round_start_time DESC 
                    LIMIT 1;""")
        rows = cur.fetchall()
        cur.close()
        return rows[0][0]

    def insert_copy_bulk_data(self, table: str, df: pd.DataFrame, columns: tuple) -> int:
        """Used for copying large amounts of player and match data efficiently
        into their respective databases"""
        cur = self.conn.cursor()

        buffer = StringIO()
        df.to_csv(path_or_buf=buffer, header=False, index=False)
        print(df.to_csv(header=False, index=False))
        buffer.seek(0)

        try:
            cur.copy_from(file=buffer, table=table, sep=",", columns=columns)
        except Exception as e:
            error_code = psycopg2.errors.lookup(e.pgcode)
            raise error_code
        finally:
            cur.close()
        return df.count()[0]

    def insert_single_row(self, table: str, columns: tuple, row: tuple) -> bool:
        cur = self.conn.cursor()

        num_params = len(row)
        params = ""
        if num_params == 1:
            params += ""
        elif num_params == 2:
            params += "(%s,%s)"
        else:
            params += "(%s," + ((num_params - 2) * "%s,") + "%s)"

        formatted_columns = str(columns).replace("'", "").replace('"', '')

        try:
            cur.execute(f"""INSERT INTO {table} {formatted_columns} VALUES {params}""", row)
        except Exception as e:
            error_code = psycopg2.errors.lookup(e.pgcode)
            raise error_code
        finally:
            cur.close()
        return True


if __name__ == "__main__":
    columns = ("year", "player", "team")
    data = (2021, "Doha", "Dallas Fuel")

    db = DatabaseConnection()
    returned_safely = db.insert_single_row("players_teams", columns=columns, row=data)
    print(returned_safely)
    db.rollback()
    db.terminate()
