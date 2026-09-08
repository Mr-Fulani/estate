import argparse
import asyncio
import getpass
import json
from pathlib import Path

from sqlalchemy import select

from app.database import AsyncSessionLocal
from app.models.admin_user import AdminUser
from app.security import hash_password


async def apply_site_profile(filename: str) -> None:
    from app.models.settings import SiteSetting
    from app.services.site_profile_import import fill_missing_profile

    incoming = json.loads(Path(filename).read_text(encoding='utf-8'))
    async with AsyncSessionLocal() as db:
        settings = await db.scalar(select(SiteSetting).where(SiteSetting.id == 1).with_for_update())
        if settings is None:
            settings = SiteSetting(id=1, profile={})
            db.add(settings)
        settings.profile = fill_missing_profile(settings.profile or {}, incoming)
        await db.commit()
    print('Project profile applied; existing CMS values and contacts preserved.')


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
    parser = argparse.ArgumentParser(description="Real estate administration commands")
    subparsers = parser.add_subparsers(dest="command", required=True)
    profile = subparsers.add_parser('apply-site-profile', help='Fill missing company profile fields from a project JSON file')
    profile.add_argument('--file', required=True)
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
    if args.command == 'apply-site-profile':
        asyncio.run(apply_site_profile(args.file))
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
