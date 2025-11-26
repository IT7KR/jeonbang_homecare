"""
API v1 Router
모든 v1 엔드포인트를 통합
"""

from fastapi import APIRouter

from app.api.v1.endpoints import regions, applications, partners, services
from app.api.v1.endpoints.admin import auth, admins, dashboard, applications as admin_applications, partners as admin_partners, sms as admin_sms, schedule as admin_schedule, settings as admin_settings

api_router = APIRouter()

# 공개 API
api_router.include_router(regions.router)
api_router.include_router(applications.router)
api_router.include_router(partners.router)
api_router.include_router(services.router)

# 관리자 API
api_router.include_router(auth.router, prefix="/admin")
api_router.include_router(admins.router, prefix="/admin")
api_router.include_router(dashboard.router, prefix="/admin")
api_router.include_router(admin_applications.router, prefix="/admin")
api_router.include_router(admin_partners.router, prefix="/admin")
api_router.include_router(admin_sms.router, prefix="/admin")
api_router.include_router(admin_schedule.router, prefix="/admin")
api_router.include_router(admin_settings.router, prefix="/admin")
