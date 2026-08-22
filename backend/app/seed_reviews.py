import asyncio
from datetime import datetime, timedelta, timezone

from sqlalchemy import select

from app.database import AsyncSessionLocal
from app.models.review import Review, ReviewTranslation


REVIEWS = [
    {
        "reviewer_name": "Анна К.",
        "rating": 5,
        "is_featured": True,
        "display_order": 0,
        "published_days_ago": 5,
        "translations": [
            {
                "locale": "ru",
                "reviewer_role": "Демонстрационный отзыв · Покупка квартиры",
                "content": "Команда помогла сравнить несколько районов Стамбула и спокойно объяснила разницу в документах и расходах. В результате выбрали квартиру, которая действительно подошла по бюджету и образу жизни.",
            },
            {
                "locale": "en",
                "reviewer_role": "Sample review · Apartment purchase",
                "content": "The team helped us compare several Istanbul districts and clearly explained the differences in documents and ownership costs. We ultimately chose an apartment that genuinely matched our budget and lifestyle.",
            },
            {
                "locale": "tr",
                "reviewer_role": "Demo yorum · Daire alımı",
                "content": "Ekip İstanbul’daki farklı bölgeleri karşılaştırmamıza yardımcı oldu; belgeler ve masraflar arasındaki farkları sakin ve anlaşılır biçimde anlattı. Sonunda bütçemize ve yaşam tarzımıza gerçekten uyan bir daire seçtik.",
            },
            {
                "locale": "ar",
                "reviewer_role": "تقييم تجريبي · شراء شقة",
                "content": "ساعدنا الفريق على مقارنة عدة مناطق في إسطنبول وشرح الفروق في المستندات وتكاليف التملك بوضوح. وفي النهاية اخترنا شقة تناسب ميزانيتنا وأسلوب حياتنا فعلاً.",
            },
        ],
    },
    {
        "reviewer_name": "Mehmet D.",
        "rating": 5,
        "is_featured": True,
        "display_order": 1,
        "published_days_ago": 12,
        "translations": [
            {
                "locale": "ru",
                "reviewer_role": "Демонстрационный отзыв · Семейная недвижимость",
                "content": "Искали жильё для семьи в Бейликдюзю. Нам не просто показали объекты, а проверили транспорт, школы, ежемесячные платежи и реальные виды из окон. Такой подход сильно упростил решение.",
            },
            {
                "locale": "en",
                "reviewer_role": "Sample review · Family home",
                "content": "We were looking for a family home in Beylikdüzü. The team went beyond viewings and checked transport, schools, monthly charges and the actual views from each property. That made the decision much easier.",
            },
            {
                "locale": "tr",
                "reviewer_role": "Demo yorum · Aile konutu",
                "content": "Beylikdüzü’nde ailemiz için bir ev arıyorduk. Ekip yalnızca daireleri göstermedi; ulaşımı, okulları, aylık giderleri ve gerçek manzarayı da kontrol etti. Bu yaklaşım karar vermemizi çok kolaylaştırdı.",
            },
            {
                "locale": "ar",
                "reviewer_role": "تقييم تجريبي · منزل عائلي",
                "content": "كنا نبحث عن منزل لعائلتنا في بيليك دوزو. لم يكتفِ الفريق بعرض العقارات، بل تحقق أيضاً من المواصلات والمدارس والرسوم الشهرية والإطلالات الفعلية. وقد سهّل ذلك قرارنا كثيراً.",
            },
        ],
    },
    {
        "reviewer_name": "Елена М.",
        "rating": 5,
        "is_featured": True,
        "display_order": 2,
        "published_days_ago": 24,
        "translations": [
            {
                "locale": "ru",
                "reviewer_role": "Демонстрационный отзыв · Инвестиционная покупка",
                "content": "Понравилось, что мне показали не только красивые презентации, но и расчёт всех расходов, возможной аренды и рисков перепродажи. Общение было быстрым, а рекомендации — конкретными.",
            },
            {
                "locale": "en",
                "reviewer_role": "Sample review · Investment purchase",
                "content": "I appreciated seeing more than polished presentations. The team also prepared a clear view of total costs, realistic rent and resale risks. Communication was quick and every recommendation was specific.",
            },
            {
                "locale": "tr",
                "reviewer_role": "Demo yorum · Yatırım amaçlı alım",
                "content": "Yalnızca güzel sunumlar değil; toplam maliyet, gerçekçi kira beklentisi ve yeniden satış riskleri de açıkça gösterildi. İletişim hızlı, öneriler ise somut ve anlaşılırdı.",
            },
            {
                "locale": "ar",
                "reviewer_role": "تقييم تجريبي · شراء استثماري",
                "content": "أعجبني أن العرض لم يقتصر على الصور الجميلة، بل شمل أيضاً التكاليف الكاملة والإيجار الواقعي ومخاطر إعادة البيع. كان التواصل سريعاً والتوصيات محددة وواضحة.",
            },
        ],
    },
    {
        "reviewer_name": "Алексей Р.",
        "rating": 4,
        "is_featured": False,
        "display_order": 3,
        "published_days_ago": 40,
        "translations": [
            {
                "locale": "ru",
                "reviewer_role": "Демонстрационный отзыв · Долгосрочная аренда",
                "content": "Подбор и просмотры организовали хорошо, договор разобрали подробно. На одном этапе пришлось чуть дольше ждать перевод документа, но менеджер оставался на связи и довёл процесс до результата.",
                "company_response": "Спасибо за обратную связь. Мы уже уточнили внутренний процесс перевода документов, чтобы следующие этапы проходили быстрее.",
            },
            {
                "locale": "en",
                "reviewer_role": "Sample review · Long-term rental",
                "content": "The shortlist and viewings were organised well, and the agreement was explained in detail. One document translation took a little longer than expected, but the manager stayed in touch and completed the process.",
                "company_response": "Thank you for the feedback. We have refined our document-translation workflow so that future stages can move faster.",
            },
            {
                "locale": "tr",
                "reviewer_role": "Demo yorum · Uzun dönem kiralama",
                "content": "Portföy seçimi ve gösterimler iyi organize edildi, sözleşme ayrıntılı biçimde açıklandı. Bir belgenin çevirisi beklediğimden biraz uzun sürdü ancak danışman iletişimi kesmeden süreci tamamladı.",
                "company_response": "Geri bildiriminiz için teşekkür ederiz. Sonraki işlemlerin daha hızlı ilerlemesi için belge çeviri sürecimizi güncelledik.",
            },
            {
                "locale": "ar",
                "reviewer_role": "تقييم تجريبي · إيجار طويل الأجل",
                "content": "تم تنظيم القائمة المختصرة والمعاينات جيداً، وشرح العقد بالتفصيل. استغرقت ترجمة إحدى الوثائق وقتاً أطول قليلاً من المتوقع، لكن المستشار بقي على تواصل حتى اكتملت العملية.",
                "company_response": "شكراً لملاحظتك. لقد حسّنا آلية ترجمة المستندات لدينا لتسريع المراحل المقبلة.",
            },
        ],
    },
    {
        "reviewer_name": "Aylin S.",
        "rating": 5,
        "is_featured": False,
        "display_order": 4,
        "published_days_ago": 65,
        "translations": [
            {
                "locale": "ru",
                "reviewer_role": "Демонстрационный отзыв · Продажа недвижимости",
                "content": "Процесс продажи был прозрачным: заранее согласовали позиционирование, подготовили материалы и фильтровали обращения. Я понимала, что происходит на каждом этапе, и не тратила время на неподходящие просмотры.",
            },
            {
                "locale": "en",
                "reviewer_role": "Sample review · Property sale",
                "content": "The sales process was transparent from the start. We agreed on positioning, prepared the materials and screened enquiries. I understood every stage and did not lose time on unsuitable viewings.",
            },
            {
                "locale": "tr",
                "reviewer_role": "Demo yorum · Gayrimenkul satışı",
                "content": "Satış süreci baştan itibaren şeffaftı. Konumlandırmayı birlikte belirledik, tanıtım materyalleri hazırlandı ve talepler filtrelendi. Her aşamada ne olduğunu biliyor, uygun olmayan gösterimlerle vakit kaybetmiyordum.",
            },
            {
                "locale": "ar",
                "reviewer_role": "تقييم تجريبي · بيع عقار",
                "content": "كانت عملية البيع شفافة منذ البداية. اتفقنا على التموضع وأُعدّت المواد التسويقية وفُرزت الطلبات. كنت أعرف ما يحدث في كل مرحلة ولم أضيّع وقتي في معاينات غير مناسبة.",
            },
        ],
    },
]


async def seed_reviews() -> None:
    now = datetime.now(timezone.utc)
    created = 0
    normalized = 0

    async with AsyncSessionLocal() as db:
        for item in REVIEWS:
            existing = await db.scalar(
                select(Review).where(Review.reviewer_name == item["reviewer_name"])
            )
            if existing:
                if existing.is_verified:
                    existing.is_verified = False
                    normalized += 1
                print(f"Skipped existing review: {item['reviewer_name']}")
                continue

            review = Review(
                reviewer_name=item["reviewer_name"],
                rating=item["rating"],
                source_locale="ru",
                status="published",
                is_verified=False,
                is_featured=item["is_featured"],
                display_order=item["display_order"],
                consent_given=False,
                published_at=now - timedelta(days=item["published_days_ago"]),
                translations=[
                    ReviewTranslation(**translation) for translation in item["translations"]
                ],
            )
            db.add(review)
            created += 1

        await db.commit()

    print(f"Review seed complete. Created: {created}; normalized demo reviews: {normalized}")


if __name__ == "__main__":
    asyncio.run(seed_reviews())
