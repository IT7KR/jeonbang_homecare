"""
Region API endpoints
공개 API - 인증 불필요
"""

from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.region import Province, District
from app.schemas.region import (
    ProvinceResponse,
    DistrictResponse,
    ProvinceWithDistrictsResponse,
)

router = APIRouter(prefix="/regions", tags=["regions"])


@router.get("/provinces", response_model=List[ProvinceResponse])
def get_provinces(db: Session = Depends(get_db)):
    """
    시/도 목록 조회

    Returns:
        List[ProvinceResponse]: 시/도 목록 (정렬순)
    """
    provinces = (
        db.query(Province)
        .filter(Province.is_active == True)
        .order_by(Province.sort_order, Province.code)
        .all()
    )
    return provinces


@router.get("/provinces/{province_code}/districts", response_model=List[DistrictResponse])
def get_districts(province_code: str, db: Session = Depends(get_db)):
    """
    특정 시/도의 시/군/구 목록 조회

    Args:
        province_code: 시/도 코드 (예: "11" for 서울)

    Returns:
        List[DistrictResponse]: 시/군/구 목록 (정렬순)
    """
    # 시/도 존재 확인
    province = (
        db.query(Province)
        .filter(Province.code == province_code, Province.is_active == True)
        .first()
    )
    if not province:
        raise HTTPException(status_code=404, detail="Province not found")

    districts = (
        db.query(District)
        .filter(District.province_code == province_code, District.is_active == True)
        .order_by(District.sort_order, District.code)
        .all()
    )
    return districts


@router.get("/all", response_model=List[ProvinceWithDistrictsResponse])
def get_all_regions(db: Session = Depends(get_db)):
    """
    전체 지역 목록 조회 (시/도 + 시/군/구)
    캐싱에 적합한 단일 요청으로 모든 지역 데이터 반환

    Returns:
        List[ProvinceWithDistrictsResponse]: 시/도와 하위 시/군/구 포함 목록
    """
    provinces = (
        db.query(Province)
        .filter(Province.is_active == True)
        .order_by(Province.sort_order, Province.code)
        .all()
    )

    # 모든 district를 한번에 조회 (N+1 방지)
    all_districts = (
        db.query(District)
        .filter(District.is_active == True)
        .order_by(District.sort_order, District.code)
        .all()
    )

    # province_code로 그룹화
    districts_by_province = {}
    for district in all_districts:
        if district.province_code not in districts_by_province:
            districts_by_province[district.province_code] = []
        districts_by_province[district.province_code].append(district)

    # 응답 생성
    result = []
    for province in provinces:
        result.append(
            ProvinceWithDistrictsResponse(
                code=province.code,
                name=province.name,
                short_name=province.short_name,
                districts=districts_by_province.get(province.code, [])
            )
        )

    return result
