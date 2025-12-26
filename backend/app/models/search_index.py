"""
Search Index model for encrypted field search
암호화된 필드 검색을 위한 인덱스 테이블

암호화된 고객정보(이름, 전화번호)를 DB 레벨에서 검색할 수 없으므로,
별도의 검색 인덱스를 구축하여 검색 가능하게 함

- search_token: 정규화된 검색 토큰 (부분 검색용)
- hash_value: SHA256 해시 (정확 매칭용)
"""

from sqlalchemy import Column, BigInteger, String, DateTime, Index
from sqlalchemy.sql import func

from app.core.database import Base


class SearchIndex(Base):
    """검색 인덱스 테이블"""

    __tablename__ = "search_indexes"

    id = Column(BigInteger, primary_key=True, autoincrement=True)

    # 엔티티 타입 및 ID
    entity_type = Column(String(50), nullable=False)  # 'application' / 'partner'
    entity_id = Column(BigInteger, nullable=False)

    # 필드 타입
    field_type = Column(String(50), nullable=False)  # 'name' / 'phone'

    # 검색용 토큰 (정규화된 값, 부분 검색용)
    search_token = Column(String(500), nullable=False)

    # 해시값 (정확 매칭용)
    hash_value = Column(String(128), nullable=False)

    # 타임스탬프
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # 복합 인덱스 정의
    __table_args__ = (
        # 엔티티별 조회용
        Index('idx_search_entity', 'entity_type', 'entity_id'),
        # 토큰 검색용 (부분 매칭)
        Index('idx_search_token', 'entity_type', 'field_type', 'search_token'),
        # 해시 검색용 (정확 매칭)
        Index('idx_search_hash', 'entity_type', 'field_type', 'hash_value'),
    )

    def __repr__(self):
        return f"<SearchIndex {self.entity_type}:{self.entity_id} {self.field_type}>"
