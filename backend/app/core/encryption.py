"""
Encryption utilities for sensitive data
고객 정보(customer_name, customer_phone, customer_address 등) 암호화
"""

import base64
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC

from app.core.config import settings


def _get_fernet() -> Fernet:
    """Generate Fernet instance from SECRET_KEY"""
    # Derive a key from SECRET_KEY using PBKDF2
    kdf = PBKDF2HMAC(
        algorithm=hashes.SHA256(),
        length=32,
        salt=b"jeonbang_homecare_salt",  # Fixed salt for consistency
        iterations=100000,
    )
    key = base64.urlsafe_b64encode(kdf.derive(settings.SECRET_KEY.encode()))
    return Fernet(key)


def encrypt_value(value: str | None) -> str | None:
    """Encrypt a string value"""
    if value is None or value == "":
        return value

    fernet = _get_fernet()
    encrypted = fernet.encrypt(value.encode())
    return encrypted.decode()


def decrypt_value(encrypted_value: str | None) -> str | None:
    """Decrypt an encrypted string value"""
    if encrypted_value is None or encrypted_value == "":
        return encrypted_value

    try:
        fernet = _get_fernet()
        decrypted = fernet.decrypt(encrypted_value.encode())
        return decrypted.decode()
    except Exception:
        # Return original value if decryption fails (for backward compatibility)
        return encrypted_value
