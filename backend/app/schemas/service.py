"""
Service schemas for API responses
"""

from pydantic import BaseModel


class ServiceTypeResponse(BaseModel):
    """서비스 타입 응답"""

    code: str
    name: str
    category_code: str
    description: str | None = None
    sort_order: int
    is_active: bool = True

    class Config:
        from_attributes = True


class ServiceCategoryResponse(BaseModel):
    """서비스 카테고리 응답"""

    code: str
    name: str
    icon: str | None = None
    description: str | None = None
    sort_order: int

    class Config:
        from_attributes = True


class ServiceCategoryWithTypesResponse(BaseModel):
    """서비스 카테고리 + 서비스 타입 목록 응답"""

    code: str
    name: str
    icon: str | None = None
    description: str | None = None
    sort_order: int
    services: list[ServiceTypeResponse]

    class Config:
        from_attributes = True


class ServicesListResponse(BaseModel):
    """전체 서비스 목록 응답"""

    categories: list[ServiceCategoryWithTypesResponse]
