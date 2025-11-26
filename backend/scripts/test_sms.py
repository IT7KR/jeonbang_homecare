#!/usr/bin/env python3
"""
SMS API 연동 테스트 스크립트
Usage: python scripts/test_sms.py --phone 01012345678
"""

import argparse
import asyncio
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app.core.config import settings


def check_config():
    """SMS 설정 상태 확인"""
    print("\n" + "=" * 50)
    print("📋 알리고 SMS API 설정 확인")
    print("=" * 50)

    has_api_key = bool(settings.ALIGO_API_KEY)
    has_user_id = bool(settings.ALIGO_USER_ID)
    has_sender = bool(settings.ALIGO_SENDER)

    print(f"  API Key 설정: {'✅ 설정됨' if has_api_key else '❌ 미설정'}")
    print(f"  User ID 설정: {'✅ 설정됨' if has_user_id else '❌ 미설정'}")
    print(f"  발신번호 설정: {'✅ 설정됨' if has_sender else '❌ 미설정'}")

    if has_sender:
        sender = settings.ALIGO_SENDER.replace("-", "")
        print(f"  발신번호: ***-****-{sender[-4:]}")

    print("=" * 50)

    if has_api_key and has_user_id and has_sender:
        print("✅ SMS API 설정이 완료되었습니다.")
        return True
    else:
        print("❌ SMS API 설정이 완료되지 않았습니다.")
        print("   .env 파일에서 ALIGO_API_KEY, ALIGO_USER_ID, ALIGO_SENDER를 설정해주세요.")
        return False


async def test_sms_send(phone: str):
    """SMS 발송 테스트"""
    from app.services.sms import send_sms
    from datetime import datetime

    print("\n" + "=" * 50)
    print("📱 SMS 발송 테스트")
    print("=" * 50)

    masked_phone = f"{phone[:3]}****{phone[-4:]}"
    print(f"  수신번호: {masked_phone}")

    # 테스트 메시지
    test_message = f"""[전방홈케어] SMS 연동 테스트
테스트 시간: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
이 메시지가 정상 수신되면 SMS 연동이 완료된 것입니다."""

    print(f"  메시지 길이: {len(test_message)}자")
    print(f"  발송 유형: {'SMS' if len(test_message) <= 90 else 'LMS'}")
    print("-" * 50)
    print("  발송 중...")

    try:
        result = await send_sms(phone, test_message, "[테스트]")

        print("-" * 50)
        print(f"  결과 코드: {result.get('result_code')}")
        print(f"  결과 메시지: {result.get('message')}")

        if result.get('msg_id'):
            print(f"  메시지 ID: {result.get('msg_id')}")

        success = result.get("result_code") == "1"

        print("=" * 50)
        if success:
            print("✅ SMS 발송 성공!")
            print(f"   {masked_phone}로 발송된 메시지를 확인해주세요.")
        else:
            print("❌ SMS 발송 실패!")
            print(f"   오류: {result.get('message')}")
            print("\n   확인사항:")
            print("   - 알리고 API 키가 올바른지 확인")
            print("   - 발신번호가 사전 등록된 번호인지 확인")
            print("   - 알리고 잔액이 충분한지 확인")

        return success

    except Exception as e:
        print("=" * 50)
        print(f"❌ SMS 발송 중 오류 발생: {str(e)}")
        return False


def main():
    parser = argparse.ArgumentParser(description="SMS API 연동 테스트")
    parser.add_argument("--phone", "-p", help="테스트 수신 번호 (예: 01012345678)")
    parser.add_argument("--check-only", "-c", action="store_true", help="설정만 확인 (발송 안함)")
    args = parser.parse_args()

    # 설정 확인
    config_ok = check_config()

    if args.check_only:
        return 0 if config_ok else 1

    if not config_ok:
        return 1

    if not args.phone:
        print("\n⚠️  테스트 발송을 위해 수신 번호를 입력해주세요.")
        print("   예: python scripts/test_sms.py --phone 01012345678")
        return 1

    # SMS 발송 테스트
    success = asyncio.run(test_sms_send(args.phone))
    return 0 if success else 1


if __name__ == "__main__":
    sys.exit(main())
