from ipaddress import ip_address, ip_network

from fastapi import Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.admin_user import AdminAuditLog, AdminUser
from app.config import get_settings


settings = get_settings()


def _is_trusted_proxy(host: str) -> bool:
    try:
        address = ip_address(host)
    except ValueError:
        return False
    for raw_network in settings.TRUSTED_PROXY_NETWORKS.split(","):
        try:
            if address in ip_network(raw_network.strip(), strict=False):
                return True
        except ValueError:
            continue
    return False


def client_ip(request: Request) -> str | None:
    direct_host = request.client.host if request.client else None
    forwarded = request.headers.get("x-forwarded-for")
    if direct_host and forwarded and _is_trusted_proxy(direct_host):
        return forwarded.split(",", 1)[0].strip()[:64]
    return direct_host[:64] if direct_host else None


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
