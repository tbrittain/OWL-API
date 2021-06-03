import datetime
import os
import psycopg2
import psycopg2.errors
from dotenv import load_dotenv
import config

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
        cur = self.conn.cursor()

        cur.execute("""SELECT round_start_time FROM map_stats 
                    ORDER BY round_start_time DESC 
                    LIMIT 1;""")
        rows = cur.fetchall()
        cur.close()
        return rows[0][0]

    def batch_insert(self, table, column_names, row_list) -> int:
        cur = self.conn.cursor()


if __name__ == "__main__":
    db = DatabaseConnection()
    print(db.get_most_recent_match_timestamp())
