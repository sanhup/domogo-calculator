"""
Logging Configuration

Provides dual-mode logging:
- Development: Human-readable colored console output
- Production: JSON-structured logs for observability platforms (DataDog, ELK, etc.)

Usage:
    from logging_config import get_logger

    logger = get_logger(__name__)
    logger.info("User created", user_id=123, email="user@example.com")
"""

import logging
import sys
import os
from typing import Any
import json
from datetime import datetime


# Determine environment
ENV = os.getenv("ENVIRONMENT", "development")
IS_DEVELOPMENT = ENV in ("development", "dev", "local")


class ColoredFormatter(logging.Formatter):
    """
    Colored console formatter for development environments.

    Provides human-readable, colored output with context information.
    """

    # ANSI color codes
    COLORS = {
        'DEBUG': '\033[36m',      # Cyan
        'INFO': '\033[32m',       # Green
        'WARNING': '\033[33m',    # Yellow
        'ERROR': '\033[31m',      # Red
        'CRITICAL': '\033[35m',   # Magenta
    }
    RESET = '\033[0m'
    BOLD = '\033[1m'
    DIM = '\033[2m'

    def format(self, record: logging.LogRecord) -> str:
        """Format log record with colors"""
        # Get color for log level
        color = self.COLORS.get(record.levelname, self.RESET)

        # Format timestamp
        timestamp = datetime.fromtimestamp(record.created).strftime('%H:%M:%S.%f')[:-3]

        # Format level name (fixed width for alignment)
        level = f"{color}{record.levelname:8s}{self.RESET}"

        # Format logger name (truncate if too long)
        name = record.name
        if len(name) > 25:
            name = "..." + name[-22:]

        # Build base message
        parts = [
            f"{self.DIM}{timestamp}{self.RESET}",
            level,
            f"{self.DIM}{name:25s}{self.RESET}",
            f"{self.BOLD}{record.getMessage()}{self.RESET}"
        ]

        # Add extra context fields if present
        extra_fields = {
            k: v for k, v in record.__dict__.items()
            if k not in logging.LogRecord.__dict__ and k not in ('message', 'asctime')
        }

        if extra_fields:
            context = " ".join(f"{k}={v}" for k, v in extra_fields.items())
            parts.append(f"{self.DIM}{context}{self.RESET}")

        # Add exception info if present
        message = " │ ".join(parts)

        if record.exc_info:
            exc_text = self.formatException(record.exc_info)
            message += f"\n{self.COLORS['ERROR']}{exc_text}{self.RESET}"

        return message


class JsonFormatter(logging.Formatter):
    """
    JSON formatter for production/observability environments.

    Outputs structured JSON logs compatible with log aggregation platforms
    like DataDog, ELK, Splunk, CloudWatch, etc.
    """

    def format(self, record: logging.LogRecord) -> str:
        """Format log record as JSON"""
        # Base log object
        log_obj = {
            "timestamp": datetime.fromtimestamp(record.created).isoformat() + "Z",
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "module": record.module,
            "function": record.funcName,
            "line": record.lineno,
        }

        # Add process/thread info
        if record.process:
            log_obj["process_id"] = record.process
        if record.thread:
            log_obj["thread_id"] = record.thread

        # Add extra context fields
        extra_fields = {
            k: v for k, v in record.__dict__.items()
            if k not in logging.LogRecord.__dict__ and k not in ('message', 'asctime')
        }
        if extra_fields:
            log_obj["context"] = extra_fields

        # Add exception info if present
        if record.exc_info:
            log_obj["exception"] = {
                "type": record.exc_info[0].__name__ if record.exc_info[0] else None,
                "message": str(record.exc_info[1]) if record.exc_info[1] else None,
                "traceback": self.formatException(record.exc_info)
            }

        # Add stack trace if available
        if record.stack_info:
            log_obj["stack_trace"] = record.stack_info

        return json.dumps(log_obj)


def setup_logging(
    level: int = logging.INFO,
    force_json: bool = False,
    force_colored: bool = False
) -> None:
    """
    Configure application-wide logging.

    Args:
        level: Minimum log level (default: INFO)
        force_json: Force JSON output even in development
        force_colored: Force colored output even in production
    """
    # Determine formatter
    if force_json or (not IS_DEVELOPMENT and not force_colored):
        formatter = JsonFormatter()
    else:
        formatter = ColoredFormatter()

    # Configure root logger
    root_logger = logging.getLogger()
    root_logger.setLevel(level)

    # Remove existing handlers
    for handler in root_logger.handlers[:]:
        root_logger.removeHandler(handler)

    # Add console handler
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setFormatter(formatter)
    root_logger.addHandler(console_handler)

    # Reduce noise from external libraries
    logging.getLogger("uvicorn").setLevel(logging.WARNING)
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
    logging.getLogger("sqlalchemy.engine").setLevel(logging.WARNING)


def get_logger(name: str) -> logging.Logger:
    """
    Get a logger instance for a module.

    Args:
        name: Logger name (typically __name__)

    Returns:
        Configured logger instance

    Usage:
        logger = get_logger(__name__)
        logger.info("Operation completed", user_id=123, duration_ms=45)
    """
    return logging.getLogger(name)


# Auto-configure logging on import
setup_logging(
    level=logging.DEBUG if IS_DEVELOPMENT else logging.INFO
)


# Convenience function for structured logging
class StructuredLogger:
    """
    Wrapper for logging with structured context.

    Makes it easy to add consistent context to all log messages.
    """

    def __init__(self, logger: logging.Logger, **default_context):
        self.logger = logger
        self.default_context = default_context

    def _log(self, level: int, message: str, **context):
        """Log with merged context"""
        merged_context = {**self.default_context, **context}
        self.logger.log(level, message, extra=merged_context)

    def debug(self, message: str, **context):
        self._log(logging.DEBUG, message, **context)

    def info(self, message: str, **context):
        self._log(logging.INFO, message, **context)

    def warning(self, message: str, **context):
        self._log(logging.WARNING, message, **context)

    def error(self, message: str, **context):
        self._log(logging.ERROR, message, **context)

    def critical(self, message: str, **context):
        self._log(logging.CRITICAL, message, **context)

    def bind(self, **additional_context) -> 'StructuredLogger':
        """Create a new logger with additional context"""
        merged = {**self.default_context, **additional_context}
        return StructuredLogger(self.logger, **merged)


def get_structured_logger(name: str, **context) -> StructuredLogger:
    """
    Get a structured logger with default context.

    Args:
        name: Logger name (typically __name__)
        **context: Default context to include in all log messages

    Returns:
        StructuredLogger instance

    Usage:
        logger = get_structured_logger(__name__, service="api", component="auth")
        logger.info("User logged in", user_id=123)
    """
    return StructuredLogger(get_logger(name), **context)
