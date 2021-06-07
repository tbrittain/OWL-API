FROM python:3.8
WORKDIR /code
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY ./src ./src
COPY *.csv .
COPY prod.env .
CMD ["python","src/updater.py"]
