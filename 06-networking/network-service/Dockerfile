FROM python:3.12-alpine

RUN adduser -D ark

WORKDIR /app
COPY --chmod=644 api.py web.py /app/

USER ark

CMD ["python", "/app/api.py"]
