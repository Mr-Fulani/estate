import asyncio
from datetime import datetime, timedelta, timezone

from sqlalchemy import select

from app.database import AsyncSessionLocal
from app.models.news import NewsArticle, NewsTranslation


ARTICLES = [
    {
        "slug": "study-in-turkiye-admission-costs-recognition",
        "cover_image": "/news/study-in-turkiye.webp",
        "author": "Rahat Home Editorial",
        "published_offset_minutes": 0,
        "translations": [
            {
                "locale": "ru",
                "title": "Учёба в Турции: поступление, стоимость и признание диплома в Европе",
                "excerpt": "Разбираем, как иностранному абитуриенту выбрать турецкий университет, спланировать бюджет и заранее проверить признание будущего диплома.",
                "content": """Турция привлекает иностранных студентов большим выбором программ, университетами в крупных международных городах и возможностью подобрать обучение под разный бюджет. При этом выгодная стоимость — не единый тариф для всей страны: государственные и частные университеты самостоятельно публикуют цены по факультетам, а итоговая сумма зависит от программы и языка обучения.

Турция участвует в Болонском процессе и входит в Европейское пространство высшего образования с 2001 года. Национальная система квалификаций сопоставлена с европейскими рамками, а учебная нагрузка описывается через ECTS. Это делает структуру программ и полученную квалификацию понятнее для европейских университетов и работодателей.

Однако фраза «диплом автоматически признаётся во всей Европе» слишком упрощает ситуацию. Решение зависит от страны, конкретного университета, уровня программы и профессии. Для медицины, права, архитектуры и других регулируемых направлений могут потребоваться отдельное подтверждение, экзамены или профессиональная регистрация. До поступления стоит проверить выбранный университет в официальном реестре YÖK и уточнить правила в центре ENIC/NARIC нужной страны.

Условия поступления различаются. Государственные университеты могут учитывать результаты TR-YÖS или признанные школьные квалификации, включая IB, Abitur и GCE A Level. Частные университеты устанавливают собственные требования. Обычно заранее готовят аттестат и приложение, переводы, паспорт, подтверждение языка и мотивационные документы — точный список всегда нужно сверять на сайте выбранного вуза.

При сравнении стоимости важно считать не только обучение. В бюджет входят жильё, медицинская страховка, вид на жительство, транспорт, питание, учебные материалы и возможные подготовительные языковые курсы. Цены и условия меняются, поэтому безопаснее сравнивать несколько программ по полной годовой стоимости, а не только по рекламной цене семестра.

Практичный порядок действий: выбрать направление и язык обучения, проверить аккредитацию университета, запросить актуальную стоимость, изучить требования к поступлению и признанию диплома, а затем рассчитать жильё и повседневные расходы. Такой подход позволяет использовать ценовые преимущества Турции без неожиданных расходов и юридических сложностей.

Информация носит ознакомительный характер. Актуальные сроки, требования и стоимость необходимо подтверждать на официальных сайтах YÖK, Study in Türkiye и выбранного университета.""",
                "meta_title": "Поступление в вузы Турции: цены и признание диплома",
                "meta_description": "Как выбрать университет в Турции, оценить стоимость обучения, подготовиться к поступлению и проверить признание диплома в европейских странах.",
            },
            {
                "locale": "en",
                "title": "Studying in Türkiye: admission, costs and degree recognition in Europe",
                "excerpt": "A practical guide to choosing a Turkish university, planning the full study budget and checking how a future degree may be recognised abroad.",
                "content": """Türkiye attracts international students with a broad choice of programmes, universities in globally connected cities and options for different budgets. There is no single nationwide “affordable price”, however: public and foundation universities publish tuition by faculty, and the final amount depends on the programme and language of instruction.

Türkiye has participated in the Bologna Process and the European Higher Education Area since 2001. Its national qualifications framework is referenced to European frameworks, while student workload is expressed through ECTS. This makes programme structure and qualifications easier for European universities and employers to understand.

The statement that every Turkish degree is “automatically accepted throughout Europe” is still too broad. Recognition depends on the destination country, institution, qualification level and profession. Medicine, law, architecture and other regulated fields may require a separate assessment, examinations or professional registration. Before applying, candidates should verify the institution in the official CoHE register and check the relevant country’s ENIC/NARIC guidance.

Admission criteria vary by institution. Public universities may consider TR-YÖS results or recognised secondary-school qualifications such as the IB, Abitur and GCE A Level. Foundation universities set their own requirements. Applicants commonly prepare a school diploma and transcript, certified translations, passport, language evidence and supporting documents, but the exact list must be confirmed with the chosen university.

A realistic budget includes more than tuition. Housing, health insurance, residence-permit costs, transport, food, study materials and possible language-preparation courses all matter. Fees and living costs change, so programmes should be compared by their complete annual cost rather than an advertised semester price alone.

A sensible sequence is to choose the subject and teaching language, verify the university and programme, request current fees, review admission and recognition requirements, and only then calculate accommodation and everyday expenses. This approach helps students benefit from Türkiye’s competitive options without overlooking legal or financial details.

This article is for general information. Always confirm current deadlines, requirements and fees through CoHE, Study in Türkiye and the selected university’s official website.""",
                "meta_title": "Study in Türkiye: admissions, costs and degree recognition",
                "meta_description": "How to choose a university in Türkiye, compare total study costs, prepare an international application and check European degree recognition.",
            },
            {
                "locale": "tr",
                "title": "Türkiye’de üniversite eğitimi: kabul, maliyet ve Avrupa’da diploma tanınırlığı",
                "excerpt": "Uluslararası öğrenciler için üniversite seçimi, toplam eğitim bütçesi ve diplomanın yurt dışında tanınması hakkında pratik bir rehber.",
                "content": """Türkiye; geniş program seçeneği, uluslararası bağlantıları güçlü şehirleri ve farklı bütçelere uygun alternatifleriyle yabancı öğrencilerin ilgisini çekiyor. Ancak ülke genelinde geçerli tek bir “uygun fiyat” yoktur: devlet ve vakıf üniversiteleri ücretlerini fakülte ve programa göre açıklar; toplam tutar eğitim dili ve bölüme göre değişir.

Türkiye 2001’den beri Bologna Süreci’ne ve Avrupa Yükseköğretim Alanı’na dahildir. Türkiye Yükseköğretim Yeterlilikler Çerçevesi Avrupa çerçeveleriyle ilişkilidir ve öğrenci iş yükü AKTS üzerinden ifade edilir. Bu yapı, programların ve yeterliliklerin Avrupa’daki üniversiteler ve işverenler tarafından daha kolay anlaşılmasına yardımcı olur.

Bununla birlikte, “Türk üniversitelerinin tüm diplomaları Avrupa’da otomatik olarak geçerlidir” ifadesi fazla geneldir. Tanıma kararı ülkeye, kuruma, yeterlilik düzeyine ve mesleğe göre değişir. Tıp, hukuk, mimarlık ve diğer düzenlemeye tabi alanlarda ek değerlendirme, sınav veya mesleki kayıt gerekebilir. Başvuru öncesinde üniversite YÖK’ün resmî listesinde kontrol edilmeli ve hedef ülkenin ENIC/NARIC merkezi incelenmelidir.

Kabul koşulları üniversiteden üniversiteye değişir. Devlet üniversiteleri TR-YÖS sonucunu veya IB, Abitur ve GCE A Level gibi tanınan lise yeterliliklerini değerlendirebilir. Vakıf üniversiteleri kendi ölçütlerini belirler. Genellikle diploma ve transkript, onaylı tercümeler, pasaport, dil belgesi ve destekleyici evraklar hazırlanır; kesin liste seçilen üniversiteden doğrulanmalıdır.

Gerçekçi bir bütçe yalnızca öğrenim ücretinden oluşmaz. Konaklama, sağlık sigortası, ikamet izni giderleri, ulaşım, yemek, eğitim materyalleri ve gerekirse dil hazırlık programı da hesaba katılmalıdır. Ücretler değişebildiği için programları yalnızca dönem fiyatına göre değil, toplam yıllık maliyet üzerinden karşılaştırmak daha güvenlidir.

En sağlıklı yol; bölüm ve eğitim dilini seçmek, üniversite ile programı doğrulamak, güncel ücreti istemek, kabul ve tanıma koşullarını incelemek, ardından konaklama ve yaşam giderlerini hesaplamaktır. Böylece Türkiye’deki rekabetçi eğitim seçenekleri beklenmeyen maliyetler olmadan değerlendirilebilir.

Bu içerik genel bilgilendirme amaçlıdır. Güncel tarih, koşul ve ücretleri YÖK, Study in Türkiye ve seçilen üniversitenin resmî sitesinden mutlaka doğrulayın.""",
                "meta_title": "Türkiye’de üniversite: kabul, maliyet ve diploma tanıma",
                "meta_description": "Türkiye’de üniversite seçimi, toplam eğitim maliyeti, uluslararası öğrenci kabulü ve diplomanın Avrupa’da tanınması için pratik rehber.",
            },
        ],
    },
    {
        "slug": "denizistanbul-beylikduzu-coastal-living",
        "cover_image": "/news/deniz-istanbul-beylikduzu.webp",
        "author": "Rahat Home Property Team",
        "published_offset_minutes": -10,
        "translations": [
            {
                "locale": "ru",
                "title": "Denizİstanbul в Бейликдюзю: формат прибрежной жизни у Мраморного моря",
                "excerpt": "Разбираем концепцию масштабного жилого проекта в Якуплу: резиденции и виллы, марина, инфраструктура и вопросы, которые важно проверить инвестору.",
                "content": """Denizİstanbul — масштабный прибрежный проект в районе Якуплу, Бейликдюзю, на европейской стороне Стамбула. Его концепция строится не вокруг одного жилого корпуса, а вокруг полноценной среды у Мраморного моря с разными типами резиденций и вилл.

По материалам проекта, в состав территории входят марина, прогулочные зоны, кафе и рестораны, торговые пространства, школа, медицинская инфраструктура, пляжные и спортивные объекты. Такой набор сервисов рассчитан на повседневную жизнь внутри района, а не только на сезонное проживание у воды.

Проект развивается очередями. На официальном сайте представлены Marina Residence, Sedef Mansions и Marina Houses, а также другие завершённые и реализуемые этапы. Планировки, видовые характеристики и готовность зависят от конкретного корпуса, поэтому название проекта само по себе не заменяет проверку выбранной квартиры или виллы.

Бейликдюзю ценят за современную жилую застройку, зелёные пространства и близость к побережью. Для Denizİstanbul особенно важна именно первая линия у моря и соседство с мариной. Одновременно дорога в центральные районы Стамбула зависит от трафика, поэтому рекламные минуты в пути лучше проверять в привычное время поездок.

С инвестиционной точки зрения нужно оценивать не только вид на море. Важны право собственности и статус объекта, готовность конкретного этапа, ежемесячные сборы комплекса, качество управления, ликвидность выбранной планировки и реалистичная ставка аренды. Доходность и рост цены не гарантированы и должны рассчитываться для конкретного лота.

Для собственного проживания стоит отдельно проверить инсоляцию, ветер на побережье, приватность террасы, расстояние до социальных объектов и фактический вид из окон. Две квартиры в одном корпусе могут заметно отличаться по комфорту и будущей ликвидности.

Denizİstanbul интересен как пример комплексного освоения побережья Бейликдюзю: здесь жильё объединено с мариной, ландшафтом и повседневной инфраструктурой. Следующий шаг перед покупкой — запросить актуальные предложения, документы и расходы по конкретному объекту, а затем сравнить их с альтернативами в западной части Стамбула.""",
                "meta_title": "Denizİstanbul в Бейликдюзю: обзор жилого комплекса",
                "meta_description": "Обзор Denizİstanbul у Мраморного моря: расположение, марина, инфраструктура, форматы жилья и важные пункты проверки перед покупкой.",
            },
            {
                "locale": "en",
                "title": "Denizİstanbul in Beylikdüzü: a coastal lifestyle on the Sea of Marmara",
                "excerpt": "A closer look at the large Yakuplu development: residences and villas, marina living, on-site amenities and the checks every buyer should make.",
                "content": """Denizİstanbul is a large coastal development in Yakuplu, Beylikdüzü, on Istanbul’s European side. Rather than a single apartment building, its concept brings together several types of residences and villas within a waterfront district on the Sea of Marmara.

According to the project’s official material, the site includes a marina, landscaped promenades, cafés and restaurants, retail, a school, healthcare facilities, beach access and sports amenities. The intention is to support everyday life within the neighbourhood rather than create a seasonal waterfront address only.

The development is delivered in phases. The official website presents Marina Residence, Sedef Mansions and Marina Houses alongside other completed and current stages. Layouts, views and completion status vary by building, so the project name never replaces due diligence on the particular apartment or villa.

Beylikdüzü is known for modern residential areas, green spaces and access to the Marmara coast. Denizİstanbul’s defining advantages are its waterfront position and proximity to the marina. Travel to central Istanbul still depends heavily on traffic, so advertised journey times should be tested at the hours a resident expects to travel.

From an investment perspective, a sea view is only one part of the calculation. Buyers should examine title and legal status, the readiness of the selected phase, monthly service charges, management quality, the liquidity of the layout and a realistic rental level. Neither rental yield nor price growth can be guaranteed and both must be assessed for the individual unit.

Owner-occupiers should also check sunlight, coastal wind, terrace privacy, walking distance to daily services and the actual view from the unit. Two homes in the same building can differ significantly in comfort and resale appeal.

Denizİstanbul is a useful example of integrated coastal development in Beylikdüzü, combining homes with a marina, landscaping and daily infrastructure. Before purchasing, the sensible next step is to request current availability, legal documents and all recurring costs for a specific property, then compare it with alternatives across western Istanbul.""",
                "meta_title": "Denizİstanbul Beylikdüzü: coastal property overview",
                "meta_description": "Explore Denizİstanbul on the Marmara coast: location, marina, amenities, property types and the key checks to complete before buying.",
            },
            {
                "locale": "tr",
                "title": "Beylikdüzü Denizİstanbul: Marmara kıyısında bütüncül bir yaşam",
                "excerpt": "Yakuplu’daki büyük ölçekli projeyi; rezidans ve villa seçenekleri, marina yaşamı, sosyal olanaklar ve alıcıların kontrol etmesi gereken noktalarla inceliyoruz.",
                "content": """Denizİstanbul, İstanbul’un Avrupa yakasında Beylikdüzü Yakuplu’da yer alan büyük ölçekli bir sahil projesidir. Tek bir apartman bloğu yerine, Marmara Denizi kıyısında farklı rezidans ve villa tiplerini bir araya getiren bütüncül bir yaşam alanı olarak planlanmıştır.

Projenin resmî tanıtımına göre alanda marina, peyzajlı yürüyüş yolları, kafe ve restoranlar, ticari alanlar, okul, sağlık birimleri, sahil ve spor olanakları bulunuyor. Amaç yalnızca yazlık bir adres değil, günlük ihtiyaçların karşılanabildiği sürekli bir yaşam çevresi oluşturmak.

Denizİstanbul etaplar hâlinde gelişiyor. Resmî sitede Marina Residence, Sedef Konakları ve Marina Evleri ile tamamlanan veya devam eden diğer etaplar yer alıyor. Plan, manzara ve teslim durumu bloktan bloğa değiştiği için yalnızca proje adına bakmak yeterli değildir; seçilen daire veya villa ayrıca incelenmelidir.

Beylikdüzü modern konut bölgeleri, yeşil alanları ve Marmara kıyısına erişimiyle öne çıkıyor. Denizİstanbul’un ayırt edici tarafı doğrudan sahil konumu ve marina komşuluğudur. Bununla birlikte İstanbul merkezine ulaşım trafik yoğunluğuna bağlıdır; tanıtımlardaki süreler, kullanıcının seyahat edeceği saatlerde ayrıca test edilmelidir.

Yatırım açısından deniz manzarası tek başına yeterli bir ölçüt değildir. Tapu ve hukuki durum, seçilen etabın hazır olma seviyesi, aylık aidat, yönetim kalitesi, plan tipinin likiditesi ve gerçekçi kira değeri birlikte değerlendirilmelidir. Kira getirisi ve fiyat artışı garanti değildir; her bağımsız bölüm için ayrı hesaplanmalıdır.

Kendi kullanımı için alım yapanlar güneş alma durumu, kıyı rüzgârı, teras mahremiyeti, sosyal alanlara yürüme mesafesi ve daireden görülen gerçek manzarayı kontrol etmelidir. Aynı bloktaki iki konutun konforu ve ikinci el değeri önemli ölçüde farklı olabilir.

Denizİstanbul; konutu marina, peyzaj ve günlük hizmetlerle birleştiren Beylikdüzü kıyı gelişiminin dikkat çekici örneklerinden biridir. Satın alma öncesindeki doğru adım, belirli bir konut için güncel seçenekleri, belgeleri ve düzenli giderleri istemek ve bunları İstanbul’un batısındaki alternatiflerle karşılaştırmaktır.""",
                "meta_title": "Denizİstanbul Beylikdüzü: sahil projesi incelemesi",
                "meta_description": "Denizİstanbul’un konumu, marinası, sosyal olanakları ve konut seçenekleri ile satın alma öncesi kontrol edilmesi gereken noktalar.",
            },
        ],
    },
]


async def seed_news() -> None:
    now = datetime.now(timezone.utc)
    created = 0

    async with AsyncSessionLocal() as db:
        for item in ARTICLES:
            existing = await db.scalar(
                select(NewsArticle.id).where(NewsArticle.slug == item["slug"])
            )
            if existing:
                print(f"Skipped existing article: {item['slug']}")
                continue

            article = NewsArticle(
                slug=item["slug"],
                cover_image=item["cover_image"],
                author=item["author"],
                is_published=True,
                published_at=now + timedelta(minutes=item["published_offset_minutes"]),
                translations=[
                    NewsTranslation(**translation) for translation in item["translations"]
                ],
            )
            db.add(article)
            created += 1

        await db.commit()

    print(f"News seed complete. Created: {created}")


if __name__ == "__main__":
    asyncio.run(seed_news())
