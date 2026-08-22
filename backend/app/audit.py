from fastapi import Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.admin_user import AdminAuditLog, AdminUser


def client_ip(request: Request) -> str | None:
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",", 1)[0].strip()[:64]
    return request.client.host[:64] if request.client else None


def add_audit_log(
    db: AsyncSession,
    request: Request,
    user: AdminUser | None,
    action: str,
    resource_type: str,
    resource_id: int | str | None = None,
    details: dict | None = None,
) -> None:
    db.add(
        AdminAuditLog(
            user_id=user.id if user else None,
            action=action,
            resource_type=resource_type,
            resource_id=str(resource_id) if resource_id is not None else None,
            details=details,
            ip_address=client_ip(request),
        )
    )
