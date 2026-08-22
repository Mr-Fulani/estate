import secrets
from datetime import datetime, timedelta, timezone
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, Request, Response, status
from sqlalchemy import func, or_, select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.audit import add_audit_log, client_ip
from app.config import get_settings
from app.database import get_db
from app.models.admin_user import AdminAuditLog, AdminLoginAttempt, AdminSession, AdminUser
from app.schemas.auth import (
    AdminUserCreate,
    AdminUserResponse,
    AdminUserUpdate,
    AuditLogListResponse,
    AuthResponse,
    LoginRequest,
)
from app.security import (
    AuthContext,
    hash_password,
    hash_token,
    require_auth_context,
    require_permission,
    verify_password,
)


router = APIRouter(prefix="/api/v1/auth", tags=["Authentication"])
settings = get_settings()
_DUMMY_PASSWORD_HASH = hash_password("not-a-real-administrator-password")


def _set_auth_cookies(response: Response, session_token: str, csrf_token: str, max_age: int) -> None:
    secure = settings.AUTH_COOKIE_SECURE or settings.ENVIRONMENT.lower() == "production"
    response.set_cookie(
        settings.AUTH_COOKIE_NAME,
        session_token,
        max_age=max_age,
        httponly=True,
        secure=secure,
        samesite="lax",
        path="/",
    )
    response.set_cookie(
        settings.AUTH_CSRF_COOKIE_NAME,
        csrf_token,
        max_age=max_age,
        httponly=False,
        secure=secure,
        samesite="lax",
        path="/",
    )


def _clear_auth_cookies(response: Response) -> None:
    secure = settings.AUTH_COOKIE_SECURE or settings.ENVIRONMENT.lower() == "production"
    response.delete_cookie(settings.AUTH_COOKIE_NAME, path="/", secure=secure, samesite="lax")
    response.delete_cookie(settings.AUTH_CSRF_COOKIE_NAME, path="/", secure=secure, samesite="lax")


@router.post("/login", response_model=AuthResponse)
async def login(
    payload: LoginRequest,
    request: Request,
    response: Response,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    now = datetime.now(timezone.utc)
    ip_address = client_ip(request) or "unknown"
    cutoff = now - timedelta(minutes=settings.AUTH_LOGIN_WINDOW_MINUTES)
    recent_failures = await db.scalar(
        select(func.count(AdminLoginAttempt.id)).where(
            AdminLoginAttempt.success.is_(False),
            AdminLoginAttempt.created_at >= cutoff,
            or_(
                AdminLoginAttempt.ip_address == ip_address,
                AdminLoginAttempt.email == payload.identifier,
            ),
        )
    )
    if (recent_failures or 0) >= settings.AUTH_LOGIN_MAX_ATTEMPTS:
        raise HTTPException(status_code=429, detail="Too many login attempts. Try again later")

    user = await db.scalar(
        select(AdminUser).where(
            or_(AdminUser.username == payload.identifier, AdminUser.email == payload.identifier)
        )
    )
    password_valid = verify_password(
        payload.password,
        user.password_hash if user else _DUMMY_PASSWORD_HASH,
    )
    is_locked = bool(user and user.locked_until and user.locked_until > now)
    is_valid = bool(user and user.is_active and not is_locked and password_valid)

    db.add(
        AdminLoginAttempt(
            email=payload.identifier,
            ip_address=ip_address,
            success=is_valid,
        )
    )
    if not is_valid:
        if user and user.is_active:
            user.failed_login_attempts += 1
            if user.failed_login_attempts >= 5:
                user.locked_until = now + timedelta(minutes=15)
                user.failed_login_attempts = 0
        add_audit_log(
            db,
            request,
            user,
            "auth.login_failed",
            "admin_user",
            user.id if user else None,
            {"identifier": payload.identifier},
        )
        await db.commit()
        raise HTTPException(status_code=401, detail="Invalid email or password")

    user.failed_login_attempts = 0
    user.locked_until = None
    user.last_login_at = now
    session_token = secrets.token_urlsafe(48)
    csrf_token = secrets.token_urlsafe(32)
    max_age = settings.AUTH_SESSION_HOURS * 60 * 60
    expires_at = now + timedelta(seconds=max_age)
    session = AdminSession(
        user_id=user.id,
        token_hash=hash_token(session_token),
        csrf_token_hash=hash_token(csrf_token),
        ip_address=ip_address,
        user_agent=request.headers.get("user-agent", "")[:500] or None,
        expires_at=expires_at,
    )
    db.add(session)
    add_audit_log(db, request, user, "auth.login", "admin_user", user.id)
    await db.commit()
    await db.refresh(user)
    _set_auth_cookies(response, session_token, csrf_token, max_age)
    return AuthResponse(user=user, csrf_token=csrf_token, expires_at=expires_at)


@router.get("/me", response_model=AdminUserResponse)
async def current_user(
    context: Annotated[AuthContext, Depends(require_auth_context)],
):
    return context.user


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(
    request: Request,
    response: Response,
    context: Annotated[AuthContext, Depends(require_auth_context)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    csrf_header = request.headers.get("x-csrf-token")
    csrf_cookie = request.cookies.get(settings.AUTH_CSRF_COOKIE_NAME)
    if not csrf_header or not csrf_cookie or csrf_header != csrf_cookie:
        raise HTTPException(status_code=403, detail="Invalid CSRF token")
    if hash_token(csrf_header) != context.session.csrf_token_hash:
        raise HTTPException(status_code=403, detail="Invalid CSRF token")
    context.session.revoked_at = datetime.now(timezone.utc)
    add_audit_log(db, request, context.user, "auth.logout", "admin_user", context.user.id)
    await db.commit()
    _clear_auth_cookies(response)


@router.get("/users", response_model=list[AdminUserResponse])
async def list_admin_users(
    _: Annotated[AdminUser, Depends(require_permission("users:manage"))],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    result = await db.execute(select(AdminUser).order_by(AdminUser.created_at.asc()))
    return result.scalars().all()


@router.post("/users", response_model=AdminUserResponse, status_code=status.HTTP_201_CREATED)
async def create_admin_user(
    payload: AdminUserCreate,
    request: Request,
    current: Annotated[AdminUser, Depends(require_permission("users:manage", csrf=True))],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    if await db.scalar(select(AdminUser.id).where(AdminUser.email == payload.email)):
        raise HTTPException(status_code=409, detail="A user with this email already exists")
    if await db.scalar(select(AdminUser.id).where(AdminUser.username == payload.username)):
        raise HTTPException(status_code=409, detail="A user with this username already exists")
    user = AdminUser(
        username=payload.username,
        email=payload.email,
        full_name=payload.full_name.strip(),
        role=payload.role,
        password_hash=hash_password(payload.password),
        is_active=True,
    )
    db.add(user)
    await db.flush()
    add_audit_log(
        db,
        request,
        current,
        "admin_user.created",
        "admin_user",
        user.id,
        {"username": user.username, "email": user.email, "role": user.role},
    )
    await db.commit()
    await db.refresh(user)
    return user


@router.patch("/users/{user_id}", response_model=AdminUserResponse)
async def update_admin_user(
    user_id: int,
    payload: AdminUserUpdate,
    request: Request,
    current: Annotated[AdminUser, Depends(require_permission("users:manage", csrf=True))],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    user = await db.get(AdminUser, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Administrator not found")
    changes = payload.model_dump(exclude_unset=True)
    if user.id == current.id and changes.get("is_active") is False:
        raise HTTPException(status_code=422, detail="You cannot deactivate your own account")
    if "username" in changes:
        duplicate_username = await db.scalar(
            select(AdminUser.id).where(
                AdminUser.username == changes["username"], AdminUser.id != user.id
            )
        )
        if duplicate_username:
            raise HTTPException(status_code=409, detail="A user with this username already exists")

    removes_founder = user.role == "founder" and (
        changes.get("role", "founder") != "founder" or changes.get("is_active") is False
    )
    if removes_founder:
        active_founders = await db.scalar(
            select(func.count(AdminUser.id)).where(
                AdminUser.role == "founder", AdminUser.is_active.is_(True)
            )
        )
        if (active_founders or 0) <= 1:
            raise HTTPException(status_code=422, detail="At least one active founder is required")

    password = changes.pop("password", None)
    for field, value in changes.items():
        setattr(user, field, value.strip() if field == "full_name" and value else value)
    if password:
        user.password_hash = hash_password(password)
        await db.execute(
            update(AdminSession)
            .where(AdminSession.user_id == user.id, AdminSession.revoked_at.is_(None))
            .values(revoked_at=datetime.now(timezone.utc))
        )
    if changes.get("is_active") is False:
        await db.execute(
            update(AdminSession)
            .where(AdminSession.user_id == user.id, AdminSession.revoked_at.is_(None))
            .values(revoked_at=datetime.now(timezone.utc))
        )
    add_audit_log(
        db,
        request,
        current,
        "admin_user.updated",
        "admin_user",
        user.id,
        {"fields": sorted([*changes.keys(), *(["password"] if password else [])])},
    )
    await db.commit()
    await db.refresh(user)
    return user


@router.get("/audit", response_model=AuditLogListResponse)
async def list_audit_logs(
    _: Annotated[AdminUser, Depends(require_permission("audit:view"))],
    page: Annotated[int, Query(ge=1)] = 1,
    per_page: Annotated[int, Query(ge=1, le=100)] = 30,
    db: AsyncSession = Depends(get_db),
):
    total = await db.scalar(select(func.count(AdminAuditLog.id)))
    result = await db.execute(
        select(AdminAuditLog)
        .options(selectinload(AdminAuditLog.user))
        .order_by(AdminAuditLog.created_at.desc())
        .offset((page - 1) * per_page)
        .limit(per_page)
    )
    return AuditLogListResponse(
        items=result.scalars().all(),
        total=total or 0,
        page=page,
        per_page=per_page,
    )
