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
    load_dotenv(f'{base_dir}/dev.env')
elif config.environment == "prod":
    test_db_user = os.getenv("DB_USER")
    test_db_pass = os.getenv("DB_PASS")
    test_db_name = os.getenv("DB_NAME")
    test_db_host = os.getenv("DB_HOST")
    test_db_port = os.getenv("DB_PORT")
    if None in [test_db_user, test_db_pass, test_db_name, test_db_host, test_db_port]:
        print("Invalid environment setting in docker-compose.yml, exiting")
        exit()
elif config.environment == "prod_local":
    load_dotenv(f'{base_dir}/prod_local.env')
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

    # TODO: return a default timestamp (like 1/1/70) if no rows are found
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
        # print(df.to_csv(header=False, index=False))
        buffer.seek(0)

        try:
            cur.copy_from(file=buffer, table=table, sep=",", columns=columns, null="")
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
    db = DatabaseConnection()
    print(db.select_query("*", "players_teams"))
    db.rollback()
    db.terminate()
