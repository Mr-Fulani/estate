import unittest

from fastapi import Request
from pydantic import ValidationError

from app.audit import client_ip
from app.rate_limit import rate_limit_key
from app.schemas.contact import ContactCreate
from app.security import hash_token


def request_from(host: str, forwarded_for: str | None = None) -> Request:
    headers = []
    if forwarded_for:
        headers.append((b"x-forwarded-for", forwarded_for.encode("ascii")))
    return Request(
        {
            "type": "http",
            "method": "POST",
            "path": "/",
            "headers": headers,
            "client": (host, 12345),
        }
    )


class ClientIdentityTests(unittest.TestCase):
    def test_uses_forwarded_ip_only_from_trusted_proxy(self):
        trusted = request_from("172.20.0.4", "203.0.113.50, 172.20.0.1")
        untrusted = request_from("198.51.100.20", "203.0.113.50")

        self.assertEqual(client_ip(trusted), "203.0.113.50")
        self.assertEqual(client_ip(untrusted), "198.51.100.20")

    def test_rate_limit_identity_is_stable_and_does_not_store_raw_ip(self):
        request = request_from("198.51.100.20")

        first = rate_limit_key(request)
        second = rate_limit_key(request)

        self.assertEqual(first, second)
        self.assertEqual(len(first), 64)
        self.assertNotIn("198.51.100.20", first)


class PublicSubmissionTests(unittest.TestCase):
    def test_contact_honeypot_rejects_bot_submission(self):
        with self.assertRaises(ValidationError):
            ContactCreate(
                name="Spam Bot",
                email="bot@example.com",
                message="Automated message",
                website="https://spam.example",
            )

    def test_tokens_are_compared_as_hashes(self):
        token = "a-private-review-token"
        digest = hash_token(token)

        self.assertNotEqual(digest, token)
        self.assertEqual(len(digest), 64)
        self.assertEqual(digest, hash_token(token))


if __name__ == "__main__":
    unittest.main()
