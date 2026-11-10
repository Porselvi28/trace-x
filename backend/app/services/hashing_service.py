import hashlib
from pathlib import Path
from typing import Tuple

class HashingService:
    @staticmethod
    def calculate_sha256(file_path: Path | str) -> str:
        """
        Calculates SHA-256 hash by streaming the file in 64KB blocks.
        """
        sha256 = hashlib.sha256()
        path = Path(file_path)
        if not path.exists():
            raise FileNotFoundError(f"Target file does not exist: {file_path}")

        with open(path, "rb") as f:
            for byte_block in iter(lambda: f.read(65536), b""):
                sha256.update(byte_block)

        return sha256.hexdigest().lower()

    @staticmethod
    def verify_file_integrity(file_path: Path | str, reference_hash: str) -> Tuple[str, str, str]:
        """
        Recalculates file hash and compares with reference hash.
        Returns: (verification_status, current_hash, reference_hash)
        Statuses: 'HASH MATCH', 'HASH MISMATCH', 'VERIFICATION FAILED'
        """
        try:
            current_hash = HashingService.calculate_sha256(file_path)
            if current_hash.lower() == reference_hash.lower():
                status = "HASH MATCH"
            else:
                status = "HASH MISMATCH"
            return status, current_hash, reference_hash
        except Exception as e:
            return "VERIFICATION FAILED", "", reference_hash

hashing_service = HashingService()
