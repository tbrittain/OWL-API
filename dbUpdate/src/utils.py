import os
import psycopg2
from dotenv import load_dotenv

base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
load_dotenv(f'{base_dir}\\dev.env')
db_user = os.getenv("DB_USER")
db_pass = os.getenv("DB_PASS")
db_name = os.getenv("DB_NAME")


class DatabaseConnection:
    def __init__(self):
        self.conn = psycopg2.connect(dbname=db_name,
                                     user=db_user,
                                     password=db_pass,
                                     host="localhost",
                                     port=5432)

    def terminate(self):
        self.conn.close()

    def commit(self):
        self.conn.commit()

    def rollback(self):
        self.conn.rollback()

    def select_query(self, query, table):
        cur = self.conn.cursor()
        # TODO

    def batch_insert(self, table, column_names, row_list):
        cur = self.conn.cursor()
        # TODO
