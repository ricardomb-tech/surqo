FROM python:3.11-slim

WORKDIR /app

# Instalar uv
RUN pip install uv

# Copiar archivos de dependencias
COPY pyproject.toml .

# Instalar dependencias (sin dev)
RUN uv sync --no-dev

# Copiar código fuente
COPY app/ app/

# Exponer puerto
EXPOSE 8000

# Iniciar servidor
CMD ["uv", "run", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
