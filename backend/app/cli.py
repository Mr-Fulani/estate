import argparse
import asyncio
import getpass

from sqlalchemy import select

from app.database import AsyncSessionLocal
from app.models.admin_user import AdminUser
from app.security import hash_password


async def create_founder(
    email: str,
    username: str,
    full_name: str,
    allow_weak_password: bool = False,
) -> None:
    password = getpass.getpass("Founder password: ")
    confirmation = getpass.getpass("Repeat password: ")
    if password != confirmation:
        raise SystemExit("Passwords do not match")
    if len(password) < 12 and not allow_weak_password:
        raise SystemExit("Password must be at least 12 characters")

    normalized_email = email.strip().lower()
    normalized_username = username.strip().lower()
    async with AsyncSessionLocal() as db:
        user = await db.scalar(
            select(AdminUser).where(
                (AdminUser.email == normalized_email) | (AdminUser.username == normalized_username)
            )
        )
        if user:
            user.username = normalized_username
            user.email = normalized_email
            user.full_name = full_name.strip()
            user.role = "founder"
            user.is_active = True
            user.password_hash = hash_password(password)
            message = f"Founder account updated: {normalized_email}"
        else:
            db.add(
                AdminUser(
                    username=normalized_username,
                    email=normalized_email,
                    full_name=full_name.strip(),
                    role="founder",
                    is_active=True,
                    password_hash=hash_password(password),
                )
            )
            message = f"Founder account created: {normalized_email}"
        await db.commit()
    print(message)


def main() -> None:
    parser = argparse.ArgumentParser(description="Rahat Home administration commands")
    subparsers = parser.add_subparsers(dest="command", required=True)
    founder = subparsers.add_parser("create-founder", help="Create or reset the founder account")
    founder.add_argument("--email", required=True)
    founder.add_argument("--username")
    founder.add_argument("--name", required=True)
    founder.add_argument(
        "--allow-weak-password",
        action="store_true",
        help="Allow a password shorter than 12 characters for local development only",
    )
    args = parser.parse_args()
    if args.command == "create-founder":
        username = args.username or args.email.split("@", 1)[0]
        asyncio.run(
            create_founder(
                args.email,
                username,
                args.name,
                allow_weak_password=args.allow_weak_password,
            )
        )


if __name__ == "__main__":
    main()
