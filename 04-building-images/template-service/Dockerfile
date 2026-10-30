FROM python:3.12-alpine
RUN adduser -D ark
WORKDIR /app
COPY --chmod=644 requirements.txt ./
RUN pip install --no-cache-dir --only-binary=:all: -r requirements.txt
COPY --chmod=644 app.py serve.py ./
USER ark
CMD ["python", "/app/serve.py"]
