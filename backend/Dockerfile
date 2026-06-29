FROM python:3.11-slim

WORKDIR /app

# Instalar uv
RUN pip install uv

# Copiar archivos de dependencias
COPY pyproject.toml uv.lock ./

# Instalar dependencias (sin dev)
RUN uv sync --frozen --no-dev

# Copiar código fuente
COPY app/ app/

# Exponer puerto (Fly.io usa 8080 por defecto)
EXPOSE 8080

# Iniciar servidor
CMD ["uv", "run", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8080"]
