"""
Service API endpoints
공개 API - 인증 불필요
"""

from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.service import ServiceCategory, ServiceType
from app.schemas.service import (
    ServiceTypeResponse,
    ServiceCategoryResponse,
    ServiceCategoryWithTypesResponse,
    ServicesListResponse,
)

router = APIRouter(prefix="/services", tags=["services"])


@router.get("/categories", response_model=List[ServiceCategoryResponse])
def get_service_categories(db: Session = Depends(get_db)):
    """
    서비스 카테고리 목록 조회

    Returns:
        List[ServiceCategoryResponse]: 카테고리 목록 (정렬순)
    """
    categories = (
        db.query(ServiceCategory)
        .filter(ServiceCategory.is_active == True)
        .order_by(ServiceCategory.sort_order)
        .all()
    )
    return categories


@router.get("/types", response_model=List[ServiceTypeResponse])
def get_service_types(
    category_code: str | None = None,
    db: Session = Depends(get_db),
):
    """
    서비스 타입 목록 조회

    Args:
        category_code: 카테고리 코드 (optional, 필터링용)

    Returns:
        List[ServiceTypeResponse]: 서비스 타입 목록 (정렬순)
    """
    query = db.query(ServiceType).filter(ServiceType.is_active == True)

    if category_code:
        query = query.filter(ServiceType.category_code == category_code)

    service_types = query.order_by(
        ServiceType.category_code, ServiceType.sort_order
    ).all()

    return service_types


@router.get("", response_model=ServicesListResponse)
def get_all_services(db: Session = Depends(get_db)):
    """
    전체 서비스 목록 조회 (카테고리 + 서비스 타입)
    캐싱에 적합한 단일 요청으로 모든 서비스 데이터 반환

    Returns:
        ServicesListResponse: 카테고리별 서비스 목록
    """
    categories = (
        db.query(ServiceCategory)
        .filter(ServiceCategory.is_active == True)
        .order_by(ServiceCategory.sort_order)
        .all()
    )

    # 모든 서비스 타입을 한번에 조회 (N+1 방지)
    all_types = (
        db.query(ServiceType)
        .filter(ServiceType.is_active == True)
        .order_by(ServiceType.sort_order)
        .all()
    )

    # category_code로 그룹화
    types_by_category = {}
    for service_type in all_types:
        if service_type.category_code not in types_by_category:
            types_by_category[service_type.category_code] = []
        types_by_category[service_type.category_code].append(service_type)

    # 응답 생성
    result_categories = []
    for category in categories:
        result_categories.append(
            ServiceCategoryWithTypesResponse(
                code=category.code,
                name=category.name,
                icon=category.icon,
                description=category.description,
                sort_order=category.sort_order,
                services=types_by_category.get(category.code, []),
            )
        )

    return ServicesListResponse(categories=result_categories)
