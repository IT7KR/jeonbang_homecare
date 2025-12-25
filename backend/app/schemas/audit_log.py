"""
Audit Log schemas
변경 이력 관련 Pydantic 스키마
"""

from typing import Optional, Any, List
from datetime import datetime
from pydantic import BaseModel, Field


class AuditLogResponse(BaseModel):
    """변경 이력 응답"""
    id: int
    entity_type: str
    entity_id: int
    action: str
    old_value: Optional[dict] = None
    new_value: Optional[dict] = None
    summary: Optional[str] = None
    admin_id: Optional[int] = None
    admin_name: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class AuditLogListResponse(BaseModel):
    """변경 이력 목록 응답"""
    items: List[AuditLogResponse]
    total: int
    page: int
    page_size: int
    total_pages: int
