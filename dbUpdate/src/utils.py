import datetime
import os
import psycopg2
import psycopg2.errors
from dotenv import load_dotenv
import config
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
        cur = self.conn.cursor()

        cur.execute("""SELECT round_start_time FROM map_stats 
                    ORDER BY round_start_time DESC 
                    LIMIT 1;""")
        rows = cur.fetchall()
        cur.close()
        return rows[0][0]

    def insert_copy_from_csv(self, table: str, column_names: tuple, row_list: list) -> int:
        cur = self.conn.cursor()
        try:
            num_params = len(row_list[0])
            params = "(%s," + ((num_params - 1) * "%s,") + ")"

            formatted_rows = map(lambda x: tuple(x), row_list)

            sql = f"""INSERT INTO {table} {column_names} VALUES """
            print(sql, params)
            sql += ','.join(cur.mogrify(params, x) for x in formatted_rows)  # dynamically add '%s'
            print(sql)
            # cur.execute()  # iteration?
        except Exception as e:
            error_code = psycopg2.errors.lookup(e.pgcode)
            raise error_code
        finally:
            cur.close()


if __name__ == "__main__":
    db = DatabaseConnection()
    columns = ("match_id", "player", "team_name", "stat_name", "hero", "stat_amount")
    test = [
        [37234, "Doha", "Dallas Fuel", "All Damage Done", "All Heroes", 13900.68009],
        [37234, "Doha", "Dallas Fuel", "Assists", "All Heroes", 8],
        [37234, "Doha", "Dallas Fuel", "Average Time Alive", "All Heroes", 56.48110171],
        [37234, "Doha", "Dallas Fuel", "Barrier Damage Done", "All Heroes", 1495.492155],
        [37234, "Doha", "Dallas Fuel", "Damage - Quick Melee", "All Heroes", 60]
    ]

    db.insert_copy_from_csv(table="match_stats", column_names=columns, row_list=test)
