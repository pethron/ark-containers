FROM python:3.12-alpine

RUN adduser -D ark && mkdir /data && chown ark:ark /data

WORKDIR /app
COPY --chmod=644 app.py /app/app.py

USER ark

CMD ["python", "/app/app.py"]
