"""Import the approved ETRO development once; never replace existing content.

Source: user-supplied Google Drive folder 1x1X8zAy022W7Pwrb5BDJiP33BoYHBV9e.
Brochure (July 2025): pages 9, 15-18, 23, 25, 28-32.
Price Range file: last modified 24 June 2025, NOT a current verified offer.
"""
from app.demo_import import require_demo_import
import asyncio
import argparse
from sqlalchemy import select
from app.database import AsyncSessionLocal
from app.models.category import Category, CategoryTranslation
from app.models.property import Property, PropertyUnitType
from app.models.property_translation import PropertyTranslation
from app.services.developments import sync_development

BASE = "/residences/etro"
TEXT = {
    "ru": {
        "city": "Стамбул", "district": "Маслак",
        "description": "ETRO Residences Istanbul объединяет итальянский дизайн ETRO и архитектурный проект RAMS на Büyükdere Caddesi в Маслаке. Фирменные узоры, выразительные материалы и виды на город создают индивидуальный характер резиденций. В представленной коллекции — варианты 1+1, 2+1 и 3+1.",
        "eyebrow": "Итальянский характер. Стамбульский адрес.",
        "headline": "Искусство итальянского дома — над ритмом Стамбула.",
        "story_title": "Когда архитектура становится образом жизни.",
        "story": "Натуральное дерево, выразительный текстиль и фирменный Paisley. Интерьеры ETRO создают дом, который хочется рассматривать. В презентации предусмотрены комплектации Standard и Premium; состав отделки и меблировки уточняется для конкретной резиденции.",
        "location_description": "Маслак, Büyükdere Caddesi — на пересечении деловых маршрутов Левента, Сарыера и Бешикташа. Городская архитектура и панорамы Стамбула становятся частью повседневного пространства.",
        "purchase_note": "Подберём конкретную резиденцию, уточним актуальный прайс, срок сдачи и условия оплаты. Дизайн на визуализациях и комплектация выбранной квартиры могут отличаться.",
        "amenities": ["Панорамный бассейн", "Wellness & SPA", "Фитнес-пространство", "Рестораны и бутики", "Коворкинг", "Консьерж-сервис"],
    },
    "en": {
        "city": "Istanbul", "district": "Maslak",
        "description": "ETRO Residences Istanbul brings ETRO’s Italian design together with RAMS’ architectural project on Büyükdere Caddesi in Maslak. Signature patterns, expressive materials and city views give the residences their distinctive character. The presented collection includes 1+1, 2+1 and 3+1 layouts.",
        "eyebrow": "Italian character. An Istanbul address.",
        "headline": "The art of the Italian home, above the rhythm of Istanbul.",
        "story_title": "When architecture becomes a way of life.",
        "story": "Natural wood, expressive textiles and signature Paisley. ETRO interiors invite a closer look. The brochure presents Standard and Premium specifications; finishes and furnishings are confirmed for each residence.",
        "location_description": "Maslak, Büyükdere Caddesi, at the meeting point of Levent, Sarıyer and Beşiktaş. Urban architecture and Istanbul’s panoramas become part of your everyday surroundings.",
        "purchase_note": "We will help select a specific residence and confirm current prices, completion dates and payment terms. Renderings and the specifications of your chosen apartment may differ.",
        "amenities": ["Infinity pool", "Wellness & SPA", "Fitness spaces", "Dining & boutiques", "Coworking", "Concierge services"],
    },
    "tr": {
        "city": "İstanbul", "district": "Maslak",
        "description": "ETRO Residences Istanbul, ETRO’nun İtalyan tasarımını RAMS’ın mimari projesiyle Maslak, Büyükdere Caddesi’nde buluşturuyor. İkonik desenler, özenli malzemeler ve şehir manzaraları rezidanslara özgün bir karakter kazandırıyor. Sunulan koleksiyon 1+1, 2+1 ve 3+1 daire tiplerini kapsıyor.",
        "eyebrow": "İtalyan karakteri. İstanbul adresi.",
        "headline": "İstanbul’un ritmi üzerinde İtalyan yaşam sanatı.",
        "story_title": "Mimari, bir yaşam tarzına dönüştüğünde.",
        "story": "Doğal ahşap, özgün dokular ve ikonik Paisley. ETRO iç mekânları her detayda keşfe davet ediyor. Broşürde Standard ve Premium seçenekleri sunuluyor; kaplama ve mobilya kapsamı seçilen daire için teyit edilir.",
        "location_description": "Maslak, Büyükdere Caddesi; Levent, Sarıyer ve Beşiktaş’ın kesiştiği noktada. Kent mimarisi ve İstanbul panoramaları günlük yaşamınızın bir parçasına dönüşüyor.",
        "purchase_note": "Size uygun daireyi belirleyip güncel fiyatı, teslim tarihini ve ödeme koşullarını teyit edelim. Görseller ile seçilen dairenin donanımı farklılık gösterebilir.",
        "amenities": ["Sonsuzluk havuzu", "Wellness & SPA", "Fitness alanları", "Restoranlar ve butikler", "Ortak çalışma alanı", "Concierge hizmetleri"],
    },
    "ar": {
        "city": "إسطنبول", "district": "مسلك",
        "description": "يجمع ETRO Residences Istanbul بين التصميم الإيطالي من ETRO ومشروع RAMS المعماري في شارع بويوك ديره في مسلك. تمنح النقوش المميزة والمواد المختارة وإطلالات المدينة المساكن طابعاً خاصاً. تضم المجموعة المعروضة مخططات 1+1 و2+1 و3+1.",
        "eyebrow": "طابع إيطالي. عنوان في إسطنبول.",
        "headline": "فن المنزل الإيطالي فوق إيقاع إسطنبول.",
        "story_title": "حين تصبح العمارة أسلوب حياة.",
        "story": "خشب طبيعي وأقمشة مميزة ونقوش Paisley. تدعو تصاميم ETRO إلى تأمل التفاصيل. يعرض الكتيّب فئتي Standard وPremium؛ تؤكد مواصفات التشطيب والأثاث لكل مسكن على حدة.",
        "location_description": "مسلك، شارع بويوك ديره، عند التقاء ليفنت وساريير وبشكتاش. تصبح عمارة المدينة وإطلالات إسطنبول جزءاً من حياتك اليومية.",
        "purchase_note": "نساعدك في اختيار مسكن محدد وتأكيد الأسعار الحالية وموعد التسليم وشروط الدفع. قد تختلف التصورات المعمارية عن تجهيزات الشقة المختارة.",
        "amenities": ["مسبح إنفينيتي", "العافية والسبا", "مساحات اللياقة", "مطاعم ومتاجر", "مساحات عمل مشتركة", "خدمات الكونسيرج"],
    },
}


PLAN_DETAILS = {
    "plan-1-1": {"code": "T1 A1", "area_gross": 113.10, "area_net": 60.71, "area_with_balcony": 68.91},
    "plan-2-1": {"code": "A07", "area_gross": 170.16, "area_net": 97.68, "area_with_balcony": 106.72},
    "plan-3-1-a": {"code": "A05", "area_gross": 271.82, "area_net": 154.32, "area_with_balcony": 170.38},
    "plan-3-1-b": {"code": "T1 A2", "area_gross": 216.81, "area_net": 122.16, "area_with_balcony": 138.42},
}
EXTRA_LAYOUT_COPY = {
    "ru": "В презентации проекта также указан формат 4+1. Его площадь, планировка и стоимость уточняются по запросу.",
    "en": "The project brochure also lists 4+1 residences. Their area, floor plan and pricing are available on request.",
    "tr": "Proje broşüründe 4+1 daire tipi de yer alıyor. Alan, kat planı ve fiyat bilgisi talep üzerine teyit edilir.",
    "ar": "يتضمن كتيّب المشروع أيضاً مساكن 4+1. تؤكد المساحة والمخطط والأسعار عند الطلب.",
}


def complete_layouts(item: Property):
    """Add source-backed missing details only; preserve existing editorial edits and figures."""
    if item.listing_kind != "development":
        raise ValueError("ETRO must be a residential development before enriching layouts")
    for unit in item.unit_types:
        details = list(unit.plan_details or [])
        known = {detail["image"] for detail in details}
        for name, values in PLAN_DETAILS.items():
            url = f"{BASE}/{name}.webp"
            if url in unit.plans and url not in known:
                details.append({"image": url, **values})
        unit.plan_details = details
    if not any(unit.code == "4+1" for unit in item.unit_types):
        item.unit_types.append(PropertyUnitType(code="4+1", rooms=4, plans=[], plan_details=[],
            area_min=None, area_max=None, price_min=None, price_max=None, position=len(item.unit_types)))
    if "4+1" not in (item.description or ""):
        item.description = f"{item.description or ''}\n\n{EXTRA_LAYOUT_COPY['ru']}".strip()
    for translation in item.translations:
        if translation.locale in EXTRA_LAYOUT_COPY and "4+1" not in (translation.description or ""):
            translation.description = f"{translation.description or ''}\n\n{EXTRA_LAYOUT_COPY[translation.locale]}".strip()
    sync_development(item)


async def seed(enrich_existing=False):
    require_demo_import()
    async with AsyncSessionLocal() as db:
        existing = await db.scalar(select(Property).where(Property.slug == "etro-residences-istanbul"))
        if existing:
            if enrich_existing:
                complete_layouts(existing)
                await db.commit()
                print(f"ETRO #{existing.id}: completed missing plan details and 4+1; existing prices and edits preserved.")
            else:
                print("ETRO already exists; no data changed. Use --complete-layouts to add missing plan details.")
            return
        category = await db.scalar(select(Category).where(Category.slug == "residential-development"))
        if not category:
            names = {"ru": "Жилой комплекс", "en": "Residential development", "tr": "Konut projesi", "ar": "مجمع سكني"}
            category = Category(name=names["ru"], slug="residential-development", translations=[CategoryTranslation(locale=locale, name=name) for locale, name in names.items()])
            db.add(category)
            await db.flush()
        item = Property(
            title="ETRO Residences Istanbul", slug="etro-residences-istanbul",
            description=TEXT["ru"]["description"], price=990000, currency="USD",
            city="Стамбул", district="Маслак", address="Büyükdere Caddesi",
            category_id=category.id, listing_kind="development", is_active=True, is_featured=True,
            transaction_type="sale", market_status="available", status_badge="",
            images=[f"{BASE}/{name}.webp" for name in ["exterior-01", "exterior-04", "living", "bedroom", "lobby", "study"]],
            development={
                "developer": "RAMS", "design_brand": "ETRO", "price_date": "2025-06-24",
                "price_status": "indicative", "images_are_renders": True,
                "interior_images": [f"{BASE}/{name}.webp" for name in ["living", "bedroom", "study", "lobby"]],
                "brochure_url": f"{BASE}/brochure.pdf",
                "translations": {locale: {key: value for key, value in values.items() if key not in {"city", "district", "description"}} for locale, values in TEXT.items()},
            },
            unit_types=[],
            translations=[PropertyTranslation(locale=locale, title="ETRO Residences Istanbul", description=values["description"], city=values["city"], district=values["district"], address="Büyükdere Caddesi", meta_title=f"ETRO Residences Istanbul | {values['district']} | Rahat Home", meta_description=values["description"][:300], status_badge="") for locale, values in TEXT.items()],
        )
        sync_development(item, [
            {"code": "1+1", "rooms": 1, "area_min": 101.35, "area_max": 113.10, "price_min": 990000, "price_max": 1509000, "plans": [f"{BASE}/plan-1-1.webp"]},
            {"code": "2+1", "rooms": 2, "area_min": 144.87, "area_max": 172.71, "price_min": 1824000, "price_max": 2179000, "plans": [f"{BASE}/plan-2-1.webp"]},
            {"code": "3+1", "rooms": 3, "area_min": 210.55, "area_max": 274.7, "price_min": 2435000, "price_max": 3540000, "plans": [f"{BASE}/plan-3-1-a.webp", f"{BASE}/plan-3-1-b.webp"]},
        ])
        complete_layouts(item)
        db.add(item)
        await db.commit()
        print(f"Created ETRO #{item.id} with {len(item.unit_types)} apartment types and four languages.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--complete-layouts", action="store_true", help="Enrich an existing ETRO record without replacing edits")
    asyncio.run(seed(parser.parse_args().complete_layouts))
