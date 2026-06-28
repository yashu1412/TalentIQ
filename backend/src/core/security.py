import os
import base64
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC

def get_encryption_key() -> bytes:
    # Use environment variable key if provided (must be base64-encoded Fernet key)
    env_key = os.getenv("AUTOBOT_ENCRYPTION_KEY")
    if env_key:
        try:
            # Validate it is a valid Fernet key
            Fernet(env_key.encode())
            return env_key.encode()
        except Exception:
            pass

    # Fallback key derivation (for ease of development/setup)
    # Using a fixed salt and app secret/identifier to derive a consistent key
    salt = b"TalentIQ_Autobot_Salt_2026"
    kdf = PBKDF2HMAC(
        algorithm=hashes.SHA256(),
        length=32,
        salt=salt,
        iterations=100000,
    )
    secret = os.getenv("CLERK_SECRET_KEY", "TalentIQ_Default_Development_Secret_Key_Change_In_Production")
    key = base64.urlsafe_b64encode(kdf.derive(secret.encode()))
    return key

def encrypt_password(password: str) -> str:
    if not password:
        return ""
    key = get_encryption_key()
    f = Fernet(key)
    return f.encrypt(password.encode()).decode()

def decrypt_password(token: str) -> str:
    if not token or not token.strip():
        return ""
    key = get_encryption_key()
    f = Fernet(key)
    try:
        return f.decrypt(token.encode()).decode()
    except Exception:
        # If decryption fails (e.g. key changed), return empty
        return ""
