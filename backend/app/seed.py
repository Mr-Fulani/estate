import asyncio
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import AsyncSessionLocal, engine, Base
from app.models.category import Category
from app.models.property import Property

async def seed_data():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as db:
        # Categories
        cat_flat = Category(name="Квартира", slug="kvartira", description="Городские квартиры")
        cat_house = Category(name="Дом", slug="dom", description="Частные дома и коттеджи")
        cat_land = Category(name="Участок", slug="uchastok", description="Земельные участки")
        cat_comm = Category(name="Коммерция", slug="kommerciya", description="Коммерческая недвижимость")
        
        db.add_all([cat_flat, cat_house, cat_land, cat_comm])
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
        await db.commit()
        print("Database seeded successfully!")

if __name__ == "__main__":
    asyncio.run(seed_data())
