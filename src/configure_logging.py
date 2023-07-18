import logging
import logging.handlers
import os
import sys
from dotenv import load_dotenv
load_dotenv()
sys.stdout.reconfigure(encoding='utf-8')

log_path = os.environ["LOGGING_PATH"]
# data_date_format = "%Y-%m-%d %H:%M:%S"

def configure(name="") :

    # configure logging
    logger = logging.getLogger(name)
    logger.setLevel(logging.DEBUG)
    # data = logging.getLogger("data")
    # data.setLevel(logging.DEBUG)

    # timed rotating handler to log to file at DEBUG level, rotate every 100 KB
    debug_file_handler = logging.handlers.RotatingFileHandler(log_path + "debug.log", mode="a", maxBytes=100000, backupCount=10, encoding='utf-8', delay=False)
    debug_file_handler.setLevel(logging.DEBUG)
    formatter = logging.Formatter("%(asctime)s %(name)s.%(funcName)s() line %(lineno)s %(levelname).5s :: %(message)s")
    debug_file_handler.setFormatter(formatter)
    logger.addHandler(debug_file_handler)

    # log debug messages to sdout
    debug_stream_handler = logging.StreamHandler(sys.stdout)
    debug_stream_handler.setLevel(logging.DEBUG)
    debug_stream_handler.setFormatter(formatter)
    logger.addHandler(debug_stream_handler)

    # handler to log to a different file at ERROR level, rotate every 100 KB
    error_handler = logging.handlers.RotatingFileHandler(log_path + "error.log", mode="a", maxBytes=1000000, backupCount=10, encoding='utf-8', delay=False)
    error_handler.setLevel(logging.ERROR)
    # formatter = logging.Formatter("%(asctime)s %(levelname).5s :: %(message)s")
    error_handler.setFormatter(formatter)
    logger.addHandler(error_handler)

    # separate logger and handler to log the data for display, rotate every 10 KB (keep it small since we're doing more manipulation on it)
    # data_format = "%(asctime)s.%(msecs)06d :: %(message)s"
    # data_file_handler = logging.handlers.RotatingFileHandler(log_path + "data.log", mode="a", maxBytes=10000, backupCount=1000, encoding='utf-8', delay=False)
    # data_file_handler.setLevel(logging.INFO)
    # formatter = logging.Formatter(data_format,data_date_format)
    # data_file_handler.setFormatter(formatter)
    # data.addHandler(data_file_handler)

    # data_stream_handler = logging.StreamHandler(sys.stdout)
    # data_stream_handler.setLevel(logging.DEBUG)
    # formatter = logging.Formatter(data_format,data_date_format)
    # data_stream_handler.setFormatter(formatter)
    # data.addHandler(data_stream_handler)

    return logger