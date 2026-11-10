import logging
import sys

def setup_logging():
    log_format = "%(asctime)s [%(levelname)s] [TRACE-X] %(name)s: %(message)s"
    logging.basicConfig(
        level=logging.INFO,
        format=log_format,
        handlers=[
            logging.StreamHandler(sys.stdout)
        ]
    )
    return logging.getLogger("tracex")

logger = setup_logging()
