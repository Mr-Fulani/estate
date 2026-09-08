"""Artificial HTTP/CI fixtures. Refuses databases other than the two dedicated SEO test databases."""
import asyncio
from datetime import datetime, timezone
from sqlalchemy import select, func, text
from app.database import AsyncSessionLocal
from app.models import Category, Property, PropertyTranslation, SiteSetting, NewsArticle, NewsTranslation, ExchangeRateSnapshot
from app.models.category import CategoryTranslation
from app.models.landing_page import LandingPage
from app.models.slug_alias import PropertySlugAlias
from app.models.property import PropertyUnitType


async def seed():
    async with AsyncSessionLocal() as db:
        database = await db.scalar(text('select current_database()'))
        assert database in {'estate_seo_test','estate_seo_test_b'}, 'Dedicated test database required'
        brand = 'Agency Gamma' if database.endswith('_b') else 'Agency Beta'
        email = 'test@agency-gamma.test' if database.endswith('_b') else 'test@agency-beta.test'
        assert await db.scalar(select(func.count(Property.id))) == 0, 'Fixture requires an empty test catalog'
        assert await db.get(SiteSetting, 1) is None, 'Fixture must not overwrite existing settings'
        image = '/residences/etro/exterior-01.webp'
        profile = {'brand_name':brand,'legal_name':f'{brand} Test','content_reviewed':True,'hero_image_url':image,'about_image_url':image,'og_image_url':image,'address_country':'PT','address_locality':'Lisbon','seo':{locale:{'home':{'title':f'{brand} | {locale} homes','description':f'Artificial {locale} company profile for local SEO validation.'}} for locale in ['en','tr']}}
        db.add(SiteSetting(id=1, profile=profile, email=email, phone='+351000000000', address='Fixture avenue', working_hours='09:00–18:00'))
        category=Category(name='Office',slug='fixture-office',schema_type='Place',translations=[CategoryTranslation(locale='en',name='Office'),CategoryTranslation(locale='tr',name='Ofis')])
        db.add(category)
        await db.flush()
        props=[]
        for index in range(1,102):
            prop=Property(content_locale='en',title=f'Test office {index}',description=f'Artificial office {index} with a meeting room and accessible entrance.',slug=f'fixture-office-{index}',price=100000+index,currency='EUR',city='Lisbon',area=80,category_id=category.id,images=[image,'/residences/etro/living.webp'],image_details={image:{'en':{'alt':'Exterior of the test building','caption':'Artificial property fixture'}}},is_featured=index<=6,translations=[PropertyTranslation(locale='tr',title=f'Test ofis {index}',description='Toplantı odası ve giriş alanı bulunan örnek ofis.' if index != 1 else '')])
            props.append(prop)
            db.add(prop)
        development=Property(content_locale='en',title='Test residences',description='Artificial apartment development for rendering tests.',slug='fixture-residences',price=200000,currency='EUR',category_id=category.id,city='Lisbon',listing_kind='development',images=[image],development={'is_demo':False,'developer':'Fixture Developer','design_brand':'','price_status':'indicative','images_are_renders':True,'interior_images':['/residences/etro/living.webp'],'translations':{}},unit_types=[PropertyUnitType(code=f'{index}+1',rooms=index,area_min=index*40,area_max=index*50,price_min=index*100000,price_max=index*150000,plans=['/residences/etro/plan-1-1.webp'],position=index) for index in [1,2,3]])
        db.add(development)
        db.add(NewsArticle(slug='fixture-guide',author='Test Author',author_type='Person',author_url='/en/about',is_published=True,published_at=datetime.now(timezone.utc),cover_image=image,translations=[NewsTranslation(locale='en',title='Test guide to offices',excerpt='An artificial guide to the local office catalog.',content='## Choose a workspace\n\n- Review access\n- Compare floor plans\n\n[Browse the collection](/en/collections/fixture-offices)')]))
        db.add(LandingPage(slug='fixture-offices',is_published=True,filters={'category_id':category.id,'transaction_type':'sale'},translations={locale:{'title':f'Test offices {locale}','description':'An authored fixture collection for SEO checks.','content':'## Available properties\n\n[Read our guide](/en/news/fixture-guide)'} for locale in ['en','tr']}))
        now=datetime.now(timezone.utc)
        db.add(ExchangeRateSnapshot(id=1,base_currency='RUB',rates={'RUB':1,'USD':0.012,'EUR':0.01,'TRY':0.4},effective_date=now.date(),fetched_at=now,source_url='https://rates.fixture.invalid'))
        await db.flush()
        db.add(PropertySlugAlias(slug='fixture-old-office',resource_id=props[0].id))
        await db.commit()
        print('Artificial fixture ready: 101 offices, 1 development, 1 article, 1 collection, EN/TR.')


if __name__ == '__main__':
    asyncio.run(seed())
