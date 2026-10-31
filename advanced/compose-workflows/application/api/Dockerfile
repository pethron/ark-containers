FROM python:3.13.7-slim
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1
RUN useradd --create-home --uid 10001 app
WORKDIR /app
COPY api/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY --chown=app:app api/src ./src
COPY --chown=app:app tests ./tests
USER app
EXPOSE 8000
CMD ["python", "src/app.py"]
