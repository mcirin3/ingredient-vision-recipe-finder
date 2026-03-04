from pathlib import Path

from sqlmodel import SQLModel, create_engine, Session

DB_PATH = Path(__file__).resolve().parent / "data"
DB_PATH.mkdir(exist_ok=True)

DATABASE_URL = f"sqlite:///{(DB_PATH / 'app.db').as_posix()}"

# `check_same_thread=False` allows reuse in async context via sync engine; acceptable for small workloads.
engine = create_engine(DATABASE_URL, echo=False, connect_args={"check_same_thread": False})


def init_db() -> None:
    """Create tables if they do not exist."""
    SQLModel.metadata.create_all(engine)


def get_session() -> Session:
    with Session(engine) as session:
        yield session
