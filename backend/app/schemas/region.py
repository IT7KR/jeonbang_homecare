"""
Pydantic schemas for Region API
"""

from pydantic import BaseModel
from typing import List


class DistrictResponse(BaseModel):
    """시/군/구 응답 스키마"""
    code: str
    name: str

    class Config:
        from_attributes = True


class ProvinceResponse(BaseModel):
    """시/도 응답 스키마"""
    code: str
    name: str
    short_name: str

    class Config:
        from_attributes = True


class ProvinceWithDistrictsResponse(BaseModel):
    """시/도 + 시/군/구 목록 응답 스키마"""
    code: str
    name: str
    short_name: str
    districts: List[DistrictResponse]

    class Config:
        from_attributes = True
