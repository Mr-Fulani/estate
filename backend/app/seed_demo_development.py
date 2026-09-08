"""Create one explicitly fictional local QA development, without replacing existing data.

All illustrations are authored schematic SVGs; no real project, prices or developer
are represented. The demo flag disables enquiries, SEO indexing and featuring.
Run: docker compose exec -T api python -m app.seed_demo_development
"""
import asyncio
from sqlalchemy import select
from app.database import AsyncSessionLocal
from app.models.category import Category
from app.models.property import Property
from app.models.property_translation import PropertyTranslation
from app.services.developments import sync_development

BASE = "/residences/demo-beylikduzu"
SLUG = "demo-beylikduzu-park"
TEXT = {
    "ru": {
        "city": "Стамбул", "district": "Бейликдюзю",
        "description": "Beylikdüzü Park — вымышленный жилой комплекс для проверки сайта. Все цены, площади, планировки и иллюстрации демонстрационные. Реального объекта с этими характеристиками мы не предлагаем.",
        "eyebrow": "DEMO / Архитектура спокойствия",
        "headline": "Свет, пространство и тихий ритм города.",
        "story_title": "Другой характер. Тот же стандарт подачи.",
        "story": "Светлая палитра, тёплое дерево и лаконичные формы — учебная концепция интерьеров. Это схематичные иллюстрации, не фотографии и не визуализации реального объекта.",
        "location_description": "Демонстрационный сценарий для района Бейликдюзю в Стамбуле. Точный адрес и отметка на карте намеренно не указаны: комплекс вымышленный.",
        "purchase_note": "Тестовая страница: квартиры не продаются, заявки не отправляются. Суммы и площади нужны только для проверки фильтров и выбора планировок.",
        "amenities": ["Демо: зелёный двор", "Демо: зона отдыха", "Демо: камерные лобби"],
    },
    "en": {
        "city": "Istanbul", "district": "Beylikdüzü",
        "description": "Beylikdüzü Park is a fictional development for website testing. All prices, areas, layouts and illustrations are samples. No real property with these specifications is offered.",
        "eyebrow": "DEMO / The architecture of calm",
        "headline": "Light, space and a quieter city rhythm.",
        "story_title": "A different character. The same design standard.",
        "story": "A light palette, warm wood and simple forms: an interior concept study. These are schematic illustrations, not photographs or renders of a real development.",
        "location_description": "A sample scenario in Istanbul’s Beylikdüzü district. No street address or map pin is provided because this project is fictional.",
        "purchase_note": "Test page only: no apartments are for sale and no enquiries are sent. Prices and areas only test filtering and layout selection.",
        "amenities": ["Demo: green courtyard", "Demo: lounge spaces", "Demo: intimate lobbies"],
    },
    "tr": {
        "city": "İstanbul", "district": "Beylikdüzü",
        "description": "Beylikdüzü Park, siteyi test etmek için oluşturulmuş hayalî bir projedir. Tüm fiyat, alan, plan ve çizimler örnektir. Bu özelliklerde gerçek bir gayrimenkul sunulmamaktadır.",
        "eyebrow": "DEMO / Sakinliğin mimarisi",
        "headline": "Işık, ferahlık ve şehrin sakin ritmi.",
        "story_title": "Farklı bir karakter. Aynı sunum standardı.",
        "story": "Açık tonlar, sıcak ahşap ve yalın biçimler: bir iç mekân konsept çalışması. Bunlar gerçek bir projenin fotoğrafları veya görselleştirmeleri değildir.",
        "location_description": "İstanbul Beylikdüzü için örnek senaryo. Proje hayalî olduğu için açık adres veya harita konumu belirtilmemiştir.",
        "purchase_note": "Yalnızca test sayfasıdır: daire satışı ve talep gönderimi yoktur. Fiyat ve alanlar filtre ve plan seçimini test etmek içindir.",
        "amenities": ["Demo: yeşil avlu", "Demo: dinlenme alanı", "Demo: özel lobiler"],
    },
    "ar": {
        "city": "إسطنبول", "district": "بيليك دوزو",
        "description": "Beylikdüzü Park مشروع خيالي لاختبار الموقع. جميع الأسعار والمساحات والمخططات والرسوم تجريبية. لا نعرض عقاراً حقيقياً بهذه المواصفات.",
        "eyebrow": "DEMO / عمارة الهدوء",
        "headline": "ضوء ومساحة وإيقاع مدينة أكثر هدوءاً.",
        "story_title": "طابع مختلف. ومعيار عرض واحد.",
        "story": "ألوان فاتحة وخشب دافئ وأشكال بسيطة: دراسة تصميم داخلي. هذه رسوم تخطيطية وليست صوراً أو تصورات لمشروع حقيقي.",
        "location_description": "سيناريو تجريبي في بيليك دوزو بإسطنبول. لا يوجد عنوان محدد أو موقع على الخريطة لأن المشروع خيالي.",
        "purchase_note": "صفحة اختبار فقط: لا توجد شقق للبيع ولا ترسل الاستفسارات. الأسعار والمساحات لاختبار التصفية واختيار المخططات.",
        "amenities": ["تجريبي: فناء أخضر", "تجريبي: مساحة استراحة", "تجريبي: ردهات خاصة"],
    },
}


async def seed():
    async with AsyncSessionLocal() as db:
        existing = await db.scalar(select(Property).where(Property.slug == SLUG))
        if existing:
            print(f"{SLUG} already exists (#{existing.id}); no data changed.")
            return
        category = await db.scalar(select(Category).where(Category.slug == "residential-development"))
        if not category:
            raise RuntimeError("Create the residential-development category before seeding the demo")
        item = Property(
            title="Beylikdüzü Park — DEMO", slug=SLUG, description=TEXT["ru"]["description"],
            price=150000, currency="USD", city=TEXT["ru"]["city"], district=TEXT["ru"]["district"], address="",
            category_id=category.id, listing_kind="development", is_active=True, is_featured=False,
            transaction_type="sale", market_status="available", status_badge="DEMO", unit_types=[],
            images=[f"{BASE}/cover.svg", f"{BASE}/courtyard.svg"],
            development={
                "is_demo": True, "developer": "", "design_brand": "", "price_date": None,
                "price_status": "indicative", "images_are_renders": False,
                "interior_images": [f"{BASE}/interior-living.svg", f"{BASE}/interior-bedroom.svg"],
                "translations": {locale: {key: value for key, value in copy.items() if key not in {"city", "district", "description"}} for locale, copy in TEXT.items()},
            },
            translations=[PropertyTranslation(locale=locale, title="Beylikdüzü Park — DEMO", description=copy["description"], city=copy["city"], district=copy["district"], address="", status_badge="DEMO") for locale, copy in TEXT.items()],
        )
        types = []
        for rooms, minimum, maximum, price_min, price_max in [(1, 60, 70, 150000, 180000), (2, 90, 110, 230000, 280000), (3, 125, 145, 320000, 380000)]:
            image = f"{BASE}/plan-{rooms}-1.svg"
            types.append({"code": f"{rooms}+1", "rooms": rooms, "area_min": minimum, "area_max": maximum, "price_min": price_min, "price_max": price_max, "plans": [image], "plan_details": [{"image": image, "code": f"DEMO-{rooms}A", "area_gross": minimum, "area_net": minimum - 12, "area_with_balcony": minimum - 7}]})
        types.append({"code": "4+1", "rooms": 4, "area_min": None, "area_max": None, "price_min": None, "price_max": None, "plans": [], "plan_details": []})
        sync_development(item, types)
        db.add(item)
        await db.commit()
        print(f"Created fictional development #{item.id}: {SLUG}; four types, four languages, enquiries disabled.")


if __name__ == "__main__":
    asyncio.run(seed())
