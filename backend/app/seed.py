import asyncio
from sqlalchemy import func, select
from app.database import AsyncSessionLocal
from app.models.category import Category
from app.models.property import Property
from app.models.property_translation import PropertyTranslation
from app.models.news import NewsArticle, NewsTranslation

async def seed_data():
    async with AsyncSessionLocal() as db:
        existing_categories = await db.scalar(select(func.count(Category.id)))
        if existing_categories:
            print("Seed skipped: the database already contains categories.")
            return

        # Categories
        cat_flat = Category(name="Квартира", slug="kvartira", description="Городские квартиры")
        cat_house = Category(name="Дом", slug="dom", description="Частные дома и коттеджи")
        cat_land = Category(name="Участок", slug="uchastok", description="Земельные участки")
        cat_comm = Category(name="Коммерция", slug="kommerciya", description="Коммерческая недвижимость")
        cat_villa = Category(name="Вилла", slug="villa", description="Премиальные виллы и резиденции")
        
        db.add_all([cat_flat, cat_house, cat_land, cat_comm, cat_villa])
        await db.commit()

        # Properties
        props = [
            Property(
                title="Уютная 2-комнатная квартира в центре",
                slug="uyutnaya-2-komnatnaya-kvartira-v-centre",
                description="Отличная квартира с свежим ремонтом.",
                price=15000000,
                city="Москва",
                district="ЦАО",
                area=55.5,
                rooms=2,
                floor=5,
                total_floors=12,
                category_id=cat_flat.id,
                is_featured=True
            ),
            Property(
                title="Загородный дом с бассейном",
                slug="zagorodnyj-dom-s-bassejnom",
                description="Просторный коттедж для большой семьи.",
                price=45000000,
                city="Подмосковье",
                area=250.0,
                rooms=5,
                total_floors=2,
                year_built=2020,
                category_id=cat_house.id,
                is_featured=True
            ),
            Property(
                title="Земельный участок под ИЖС",
                slug="zemelnyj-uchastok-pod-izhs",
                description="Ровный участок правильной формы.",
                price=5000000,
                city="Ленинградская область",
                area=1000.0,
                category_id=cat_land.id
            ),
            Property(
                title="Офис класса А",
                slug="ofis-klassa-a",
                description="Светлое офисное помещение в бизнес-центре.",
                price=85000000,
                city="Санкт-Петербург",
                district="Петроградский",
                area=120.0,
                floor=3,
                category_id=cat_comm.id
            ),
            Property(
                title="Студия у метро",
                slug="studiya-u-metro",
                description="Отличный вариант для инвестиций.",
                price=8000000,
                city="Москва",
                district="САО",
                area=28.0,
                rooms=1,
                floor=10,
                total_floors=25,
                category_id=cat_flat.id
            ),
            Property(
                title="Таунхаус в закрытом поселке",
                slug="taunhaus-v-zakrytom-poselke",
                description="Комфортный таунхаус с гаражом.",
                price=22000000,
                city="Новая Москва",
                area=145.0,
                rooms=4,
                total_floors=3,
                year_built=2022,
                category_id=cat_house.id,
                is_featured=True
            )
        ]
        
        db.add_all(props)
        await db.flush()

        property_titles = {
            props[0].id: {
                "en": ("Cozy two-bedroom apartment in the city centre", "A renovated apartment in a central location."),
                "tr": ("Şehir merkezinde rahat iki odalı daire", "Merkezi konumda yenilenmiş ve ferah bir daire."),
            },
            props[1].id: {
                "en": ("Country house with a swimming pool", "A spacious family home with a private pool."),
                "tr": ("Havuzlu müstakil ev", "Özel havuzlu, geniş bir aile evi."),
            },
        }
        for prop in props:
            prop.translations.append(
                PropertyTranslation(locale="ru", title=prop.title, description=prop.description)
            )
            for locale, (title, description) in property_titles.get(prop.id, {}).items():
                prop.translations.append(
                    PropertyTranslation(locale=locale, title=title, description=description)
                )

        article = NewsArticle(
            slug="estate-market-guide-2026",
            cover_image="https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=1600&q=80",
            author="Estate Research",
            is_published=True,
            translations=[
                NewsTranslation(
                    locale="ru",
                    title="Как выбирать недвижимость в 2026 году",
                    excerpt="Короткий гид по локации, документам и потенциалу объекта.",
                    content="Покупка начинается не с просмотра фотографий, а с определения цели.\n\nОцените район, транспорт, документы и расходы на владение до внесения аванса.",
                    meta_title="Как выбрать недвижимость в 2026 году — Estate",
                    meta_description="Практический гид Estate по выбору объекта недвижимости.",
                ),
                NewsTranslation(
                    locale="en",
                    title="How to choose property in 2026",
                    excerpt="A concise guide to location, documents and long-term value.",
                    content="A successful purchase starts with a clear goal, not with listing photos.\n\nReview the neighbourhood, transport, documents and ownership costs before paying a deposit.",
                    meta_title="How to choose property in 2026 — Estate",
                    meta_description="Estate's practical guide to choosing the right property.",
                ),
                NewsTranslation(
                    locale="tr",
                    title="2026'da gayrimenkul nasıl seçilir?",
                    excerpt="Konum, belgeler ve uzun vadeli değer için kısa bir rehber.",
                    content="Başarılı bir satın alma ilan fotoğraflarıyla değil, net bir hedefle başlar.\n\nKapora vermeden önce bölgeyi, ulaşımı, belgeleri ve mülkiyet giderlerini inceleyin.",
                    meta_title="2026'da gayrimenkul seçimi — Estate",
                    meta_description="Doğru gayrimenkulü seçmek için Estate'in pratik rehberi.",
                ),
            ],
        )
        db.add(article)
        await db.commit()
        print("Database seeded successfully!")

if __name__ == "__main__":
    asyncio.run(seed_data())
