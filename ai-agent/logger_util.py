# logger_util.py
import logging
import os
import json
from logging.handlers import RotatingFileHandler
from datetime import datetime

# Optional: color support
try:
    from colorama import Fore, Style, init
    init(autoreset=True)
    COLOR_ENABLED = True
except ImportError:
    COLOR_ENABLED = False


class JsonFormatter(logging.Formatter):
    """Structured JSON logs for cloud environments."""
    def format(self, record):
        log_record = {
            "timestamp": datetime.utcnow().isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "module": record.module,
            "line": record.lineno,
        }
        return json.dumps(log_record)


class ColorFormatter(logging.Formatter):
    """Colored logs for console output."""
    COLORS = {
        "DEBUG": Fore.CYAN,
        "INFO": Fore.GREEN,
        "WARNING": Fore.YELLOW,
        "ERROR": Fore.RED,
        "CRITICAL": Fore.RED + Style.BRIGHT,
    }

    def format(self, record):
        color = self.COLORS.get(record.levelname, "")
        message = super().format(record)
        return f"{color}{message}{Style.RESET_ALL}" if COLOR_ENABLED else message


def get_logger(name: str):
    os.makedirs("logs", exist_ok=True)

    logger = logging.getLogger(name)
    logger.setLevel(logging.DEBUG)

    if logger.handlers:
        return logger

    # --- Console Handler (Colored) ---
    console_handler = logging.StreamHandler()
    console_handler.setLevel(logging.INFO)
    console_handler.setFormatter(ColorFormatter(
        "%(asctime)s | %(levelname)s | %(name)s | %(message)s"
    ))
    logger.addHandler(console_handler)

    # --- Rotating File Handler (Plain Text) ---
    rotating_handler = RotatingFileHandler(
        "logs/app.log",
        maxBytes=5 * 1024 * 1024,  # 5 MB
        backupCount=5
    )
    rotating_handler.setLevel(logging.DEBUG)
    rotating_handler.setFormatter(logging.Formatter(
        "%(asctime)s | %(levelname)s | %(name)s | %(message)s"
    ))
    logger.addHandler(rotating_handler)

    # --- JSON Log Handler ---
    json_handler = RotatingFileHandler(
        "logs/app.json",
        maxBytes=5 * 1024 * 1024,
        backupCount=5
    )
    json_handler.setLevel(logging.INFO)
    json_handler.setFormatter(JsonFormatter())
    logger.addHandler(json_handler)

    return logger


# --- Performance Timer Decorator ---
def log_timing(logger, label="operation"):
    def decorator(func):
        def wrapper(*args, **kwargs):
            start = datetime.now()
            try:
                return func(*args, **kwargs)
            finally:
                duration = (datetime.now() - start).total_seconds()
                logger.info(f"{label} completed in {duration:.4f}s")
        return wrapper
    return decorator