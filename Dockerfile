# Use the official Python base image
FROM python:3.9-slim

WORKDIR /app

COPY ./backend/src/*.py /app

COPY ./backend/src/components/*.py /app/components/

COPY ./backend/requirements.txt .

ENV UPLOAD_FOLDER=/app/profiles

RUN pip install --no-cache-dir -r requirements.txt

EXPOSE 5000

# Start the application
CMD ["python", "app.py"]
