"""Create only the named secondary database on the explicitly supplied SEO test server."""
import asyncio
import os
from urllib.parse import urlsplit
import asyncpg


async def main():
    url = os.environ['SEO_TEST_DATABASE_URL'].replace('postgresql+asyncpg:', 'postgresql:')
    assert urlsplit(url).path == '/estate_seo_test', 'Dedicated test server required'
    connection = await asyncpg.connect(url)
    try:
        assert await connection.fetchval('select current_database()') == 'estate_seo_test'
        await connection.execute('CREATE DATABASE estate_seo_test_b')
    finally:
        await connection.close()


if __name__ == '__main__':
    asyncio.run(main())
