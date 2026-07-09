from datetime import date

from app.auth.jwt import hash_password
from app.db.session import SessionLocal
from app.users.models import User

DEV_USERS = [
    {
        "name": "Admin User",
        "email": "admin@example.com",
        "password": "password123",
        "role": "admin",
        "warehouse_id": "all",
        "status": "active",
        "joined_date": date(2024, 1, 1),
    },
    {
        "name": "Manager User",
        "email": "manager@example.com",
        "password": "password123",
        "role": "manager",
        "warehouse_id": "1",
        "status": "active",
        "joined_date": date(2024, 1, 1),
    },
]


def seed() -> None:
    db = SessionLocal()
    try:
        for data in DEV_USERS:
            if db.query(User).filter(User.email == data["email"]).first():
                continue
            user = User(
                name=data["name"],
                email=data["email"],
                hashed_password=hash_password(data["password"]),
                role=data["role"],
                warehouse_id=data["warehouse_id"],
                status=data["status"],
                joined_date=data["joined_date"],
            )
            db.add(user)
        db.commit()
    finally:
        db.close()


if __name__ == "__main__":
    seed()
    print("Seed complete.")
