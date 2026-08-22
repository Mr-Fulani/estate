"""Idempotently complete property translations and SEO metadata.

The script only fills missing values. Existing non-empty editorial content is
left untouched, so it is safe to run again after manual changes in the admin.
"""

import asyncio

from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.database import AsyncSessionLocal
from app.models.property import Property
from app.models.property_translation import PropertyTranslation


LocalizedFields = dict[str, str | None]


RU_SEO: dict[str, tuple[str, str]] = {
    "uyutnaya-2-komnatnaya-kvartira-v-centre": (
        "2-комнатная квартира в центре Москвы — Rahat Home",
        "Уютная 2-комнатная квартира 55,5 м² со свежим ремонтом в ЦАО Москвы. 5-й этаж 12-этажного дома. Подробности и консультация Rahat Home.",
    ),
    "zagorodnyj-dom-s-bassejnom": (
        "Загородный дом с бассейном в Подмосковье — Rahat Home",
        "Просторный загородный дом 250 м² с бассейном для большой семьи. 5 комнат, 2 этажа, 2020 год постройки. Подробности от Rahat Home.",
    ),
    "zemelnyj-uchastok-pod-izhs": (
        "Участок под ИЖС в Ленинградской области — Rahat Home",
        "Ровный земельный участок площадью 1000 м² под индивидуальное жилищное строительство в Ленинградской области. Консультация Rahat Home.",
    ),
    "ofis-klassa-a": (
        "Офис класса А в Санкт-Петербурге — Rahat Home",
        "Светлый офис класса А площадью 120 м² в бизнес-центре Петроградского района Санкт-Петербурга. Помещение расположено на 3-м этаже.",
    ),
    "studiya-u-metro": (
        "Студия у метро в Москве — Rahat Home",
        "Студия 28 м² рядом с метро в Северном административном округе Москвы. 10-й этаж 25-этажного дома, подходящий вариант для инвестиций.",
    ),
    "taunhaus-v-zakrytom-poselke": (
        "Таунхаус в закрытом посёлке в Новой Москве — Rahat Home",
        "Таунхаус 145 м² с гаражом в закрытом посёлке Новой Москвы. 4 комнаты, 3 этажа, 2022 год постройки. Подробности от Rahat Home.",
    ),
    "prostornaya-3-komnatnaya-kvartira-9bc440": (
        "3-комнатная квартира в Бейликдюзю, Стамбул — Rahat Home",
        "Просторная квартира 90 м² на улице Неше в районе Бейликдюзю, Стамбул. 3 комнаты, 2-й этаж, дом 2020 года. Доступна рассрочка 0%.",
    ),
    "elitnaya-villa-s-infiniti-basseynom-i-vidom-na-more-ebd797": (
        "Вилла с инфинити-бассейном и видом на море в Сочи — Rahat Home",
        "Премиальная вилла 420 м² в Сириусе с видом на море, инфинити-бассейном, спа-зоной и ландшафтным садом. 6 комнат, отделка мрамором и тиком.",
    ),
    "villa-na-beregu-mramornogo-morya-210c29": (
        "Вилла на берегу Мраморного моря в Стамбуле — Rahat Home",
        "Вилла 400 м² в закрытом охраняемом комплексе у Мраморного моря в Бейликдюзю. 6 комнат, 2 этажа, 2020 год постройки.",
    ),
}


TRANSLATIONS: dict[str, dict[str, LocalizedFields]] = {
    "uyutnaya-2-komnatnaya-kvartira-v-centre": {
        "en": {
            "title": "Cosy two-bedroom apartment in central Moscow",
            "description": "A cosy 55.5 m² two-bedroom apartment with a fresh renovation in Moscow's Central Administrative District. The apartment is on the fifth floor of a 12-storey building.",
            "city": "Moscow", "district": "Central Administrative District", "address": None,
            "meta_title": "Two-bedroom apartment in central Moscow — Rahat Home",
            "meta_description": "A renovated 55.5 m² two-bedroom apartment in central Moscow, on the fifth floor of a 12-storey building. View details and contact Rahat Home.",
            "status_badge": "Available",
        },
        "tr": {
            "title": "Moskova merkezinde konforlu iki odalı daire",
            "description": "Moskova Merkez İdari Bölgesi'nde, yeni tadilatlı 55,5 m² büyüklüğünde konforlu iki odalı daire. Daire 12 katlı binanın 5. katındadır.",
            "city": "Moskova", "district": "Merkez İdari Bölgesi", "address": None,
            "meta_title": "Moskova merkezinde iki odalı daire — Rahat Home",
            "meta_description": "Moskova merkezinde yeni tadilatlı 55,5 m² iki odalı daire. 12 katlı binanın 5. katında. Ayrıntılar ve danışmanlık için Rahat Home.",
            "status_badge": "Satışta",
        },
        "ar": {
            "title": "شقة مريحة بغرفتي نوم في وسط موسكو",
            "description": "شقة مريحة بغرفتي نوم ومساحة 55.5 م² في المنطقة الإدارية المركزية بموسكو، مع تجديد حديث. تقع الشقة في الطابق الخامس من مبنى مكوّن من 12 طابقاً.",
            "city": "موسكو", "district": "المنطقة الإدارية المركزية", "address": None,
            "meta_title": "شقة بغرفتي نوم في وسط موسكو — Rahat Home",
            "meta_description": "شقة مجددة بغرفتي نوم ومساحة 55.5 م² في وسط موسكو، بالطابق الخامس من مبنى مكوّن من 12 طابقاً. اطلب التفاصيل من Rahat Home.",
            "status_badge": "متاح",
        },
    },
    "zagorodnyj-dom-s-bassejnom": {
        "en": {
            "title": "Country house with a swimming pool near Moscow",
            "description": "A spacious 250 m² country house with a swimming pool for a large family. The two-storey home has five rooms and was completed in 2020.",
            "city": "Moscow Region", "district": None, "address": None,
            "meta_title": "Country house with a pool near Moscow — Rahat Home",
            "meta_description": "A 250 m² family country house with a swimming pool near Moscow. Five rooms, two floors and completed in 2020. Contact Rahat Home for details.",
            "status_badge": "Available",
        },
        "tr": {
            "title": "Moskova bölgesinde havuzlu kır evi",
            "description": "Büyük bir aile için uygun, yüzme havuzlu 250 m² geniş kır evi. İki katlı ev beş odalıdır ve 2020 yılında tamamlanmıştır.",
            "city": "Moskova Bölgesi", "district": None, "address": None,
            "meta_title": "Moskova bölgesinde havuzlu kır evi — Rahat Home",
            "meta_description": "Moskova bölgesinde yüzme havuzlu 250 m² aile evi. Beş oda, iki kat ve 2020 yapımı. Ayrıntılar için Rahat Home ile iletişime geçin.",
            "status_badge": "Satışta",
        },
        "ar": {
            "title": "منزل ريفي مع مسبح بالقرب من موسكو",
            "description": "منزل ريفي واسع بمساحة 250 م² مع مسبح، مناسب لعائلة كبيرة. يتكوّن المنزل من طابقين وخمس غرف، وتم إنجازه عام 2020.",
            "city": "مقاطعة موسكو", "district": None, "address": None,
            "meta_title": "منزل ريفي مع مسبح قرب موسكو — Rahat Home",
            "meta_description": "منزل عائلي بمساحة 250 م² مع مسبح قرب موسكو. خمس غرف وطابقان، بُني عام 2020. تواصل مع Rahat Home لمعرفة التفاصيل.",
            "status_badge": "متاح",
        },
    },
    "zemelnyj-uchastok-pod-izhs": {
        "en": {
            "title": "Residential building plot in Leningrad Region",
            "description": "A level, regularly shaped 1,000 m² plot designated for individual residential construction in Leningrad Region.",
            "city": "Leningrad Region", "district": None, "address": None,
            "meta_title": "Residential building plot in Leningrad Region — Rahat Home",
            "meta_description": "A level 1,000 m² land plot for individual residential construction in Leningrad Region. View the listing and request details from Rahat Home.",
            "status_badge": "Available",
        },
        "tr": {
            "title": "Leningrad Bölgesi'nde konut imarlı arsa",
            "description": "Leningrad Bölgesi'nde bireysel konut inşaatına uygun, düz ve düzenli biçimli 1.000 m² arsa.",
            "city": "Leningrad Bölgesi", "district": None, "address": None,
            "meta_title": "Leningrad Bölgesi'nde konut imarlı arsa — Rahat Home",
            "meta_description": "Leningrad Bölgesi'nde bireysel konut inşaatına uygun 1.000 m² düz arsa. İlan ayrıntıları ve danışmanlık için Rahat Home.",
            "status_badge": "Satışta",
        },
        "ar": {
            "title": "قطعة أرض للبناء السكني في مقاطعة لينينغراد",
            "description": "قطعة أرض مستوية ومنتظمة الشكل بمساحة 1,000 م²، مخصصة للبناء السكني الفردي في مقاطعة لينينغراد.",
            "city": "مقاطعة لينينغراد", "district": None, "address": None,
            "meta_title": "أرض للبناء السكني في مقاطعة لينينغراد — Rahat Home",
            "meta_description": "قطعة أرض مستوية بمساحة 1,000 م² مخصصة للبناء السكني الفردي في مقاطعة لينينغراد. اطلب التفاصيل من Rahat Home.",
            "status_badge": "متاح",
        },
    },
    "ofis-klassa-a": {
        "en": {
            "title": "Class A office in Saint Petersburg",
            "description": "A bright 120 m² Class A office in a business centre in Saint Petersburg's Petrogradsky District. The premises are on the third floor.",
            "city": "Saint Petersburg", "district": "Petrogradsky District", "address": None,
            "meta_title": "Class A office in Saint Petersburg — Rahat Home",
            "meta_description": "A bright 120 m² Class A office on the third floor of a business centre in Saint Petersburg's Petrogradsky District. Contact Rahat Home.",
            "status_badge": "Available",
        },
        "tr": {
            "title": "Sankt-Peterburg'da A sınıfı ofis",
            "description": "Sankt-Peterburg'un Petrogradski Bölgesi'ndeki bir iş merkezinde yer alan, 120 m² büyüklüğünde aydınlık A sınıfı ofis. Ofis 3. kattadır.",
            "city": "Sankt-Peterburg", "district": "Petrogradski Bölgesi", "address": None,
            "meta_title": "Sankt-Peterburg'da A sınıfı ofis — Rahat Home",
            "meta_description": "Petrogradski Bölgesi'ndeki bir iş merkezinin 3. katında 120 m² aydınlık A sınıfı ofis. Ayrıntılar için Rahat Home ile iletişime geçin.",
            "status_badge": "Satışta",
        },
        "ar": {
            "title": "مكتب من الفئة A في سانت بطرسبرغ",
            "description": "مكتب مشرق من الفئة A بمساحة 120 م² داخل مركز أعمال في منطقة بتروغرادسكي بمدينة سانت بطرسبرغ. يقع المكتب في الطابق الثالث.",
            "city": "سانت بطرسبرغ", "district": "منطقة بتروغرادسكي", "address": None,
            "meta_title": "مكتب من الفئة A في سانت بطرسبرغ — Rahat Home",
            "meta_description": "مكتب مشرق من الفئة A بمساحة 120 م² في الطابق الثالث من مركز أعمال بمنطقة بتروغرادسكي في سانت بطرسبرغ.",
            "status_badge": "متاح",
        },
    },
    "studiya-u-metro": {
        "en": {
            "title": "Studio apartment near the metro in Moscow",
            "description": "A 28 m² studio apartment near the metro in Moscow's Northern Administrative District. Located on the tenth floor of a 25-storey building, it is a practical investment option.",
            "city": "Moscow", "district": "Northern Administrative District", "address": None,
            "meta_title": "Studio near the metro in Moscow — Rahat Home",
            "meta_description": "A 28 m² studio near the metro in northern Moscow, on the tenth floor of a 25-storey building. A practical investment property from Rahat Home.",
            "status_badge": "Available",
        },
        "tr": {
            "title": "Moskova'da metroya yakın stüdyo daire",
            "description": "Moskova Kuzey İdari Bölgesi'nde metroya yakın 28 m² stüdyo daire. 25 katlı binanın 10. katında yer alan daire, yatırım için uygun bir seçenektir.",
            "city": "Moskova", "district": "Kuzey İdari Bölgesi", "address": None,
            "meta_title": "Moskova'da metroya yakın stüdyo — Rahat Home",
            "meta_description": "Kuzey Moskova'da metroya yakın 28 m² stüdyo daire. 25 katlı binanın 10. katında, yatırım için uygun bir seçenek.",
            "status_badge": "Satışta",
        },
        "ar": {
            "title": "شقة استوديو بالقرب من المترو في موسكو",
            "description": "شقة استوديو بمساحة 28 م² بالقرب من المترو في المنطقة الإدارية الشمالية بموسكو. تقع في الطابق العاشر من مبنى مكوّن من 25 طابقاً، وتناسب الاستثمار.",
            "city": "موسكو", "district": "المنطقة الإدارية الشمالية", "address": None,
            "meta_title": "استوديو قرب المترو في موسكو — Rahat Home",
            "meta_description": "شقة استوديو بمساحة 28 م² قرب المترو في شمال موسكو، بالطابق العاشر من مبنى مكوّن من 25 طابقاً. خيار مناسب للاستثمار.",
            "status_badge": "متاح",
        },
    },
    "taunhaus-v-zakrytom-poselke": {
        "en": {
            "title": "Townhouse in a gated community in New Moscow",
            "description": "A comfortable 145 m² townhouse with a garage in a gated community in New Moscow. The property has four rooms across three floors and was built in 2022.",
            "city": "New Moscow", "district": None, "address": None,
            "meta_title": "Townhouse in a gated New Moscow community — Rahat Home",
            "meta_description": "A 145 m² townhouse with a garage in a gated New Moscow community. Four rooms, three floors and built in 2022. Contact Rahat Home.",
            "status_badge": "Available",
        },
        "tr": {
            "title": "Yeni Moskova'da kapalı sitede townhouse",
            "description": "Yeni Moskova'da kapalı bir site içinde garajlı, 145 m² konforlu townhouse. Dört odalı, üç katlı konut 2022 yılında inşa edilmiştir.",
            "city": "Yeni Moskova", "district": None, "address": None,
            "meta_title": "Yeni Moskova'da kapalı sitede townhouse — Rahat Home",
            "meta_description": "Yeni Moskova'da kapalı sitede garajlı 145 m² townhouse. Dört oda, üç kat ve 2022 yapımı. Ayrıntılar için Rahat Home.",
            "status_badge": "Satışta",
        },
        "ar": {
            "title": "تاون هاوس داخل مجمع مغلق في موسكو الجديدة",
            "description": "تاون هاوس مريح بمساحة 145 م² مع مرآب داخل مجمع مغلق في موسكو الجديدة. يضم أربع غرف موزعة على ثلاثة طوابق، وبُني عام 2022.",
            "city": "موسكو الجديدة", "district": None, "address": None,
            "meta_title": "تاون هاوس في مجمع مغلق بموسكو الجديدة — Rahat Home",
            "meta_description": "تاون هاوس بمساحة 145 م² مع مرآب داخل مجمع مغلق في موسكو الجديدة. أربع غرف وثلاثة طوابق، بُني عام 2022.",
            "status_badge": "متاح",
        },
    },
    "prostornaya-3-komnatnaya-kvartira-9bc440": {
        "en": {
            "title": "Spacious three-room apartment in Beylikdüzü",
            "description": "A spacious 90 m² three-room apartment on Neşe Street in Beylikdüzü, Istanbul. The apartment is on the second floor of a five-storey building completed in 2020, with 0% instalments available.",
            "city": "Istanbul", "district": "Beylikdüzü", "address": "Neşe Street",
            "meta_title": "Three-room apartment in Beylikdüzü, Istanbul — Rahat Home",
            "meta_description": "A 90 m² three-room apartment on Neşe Street in Beylikdüzü, Istanbul. Second floor, 2020 building and 0% instalments available.",
            "status_badge": "0% instalments",
        },
        "tr": {
            "title": "Beylikdüzü'nde geniş üç odalı daire",
            "description": "İstanbul Beylikdüzü Neşe Sokak'ta 90 m² geniş üç odalı daire. 2020 yapımı beş katlı binanın 2. katında yer alan daire için %0 taksit seçeneği mevcuttur.",
            "city": "İstanbul", "district": "Beylikdüzü", "address": "Neşe Sokak",
            "meta_title": "Beylikdüzü İstanbul'da üç odalı daire — Rahat Home",
            "meta_description": "Beylikdüzü Neşe Sokak'ta 90 m² üç odalı daire. 2020 yapımı binanın 2. katında ve %0 taksit seçeneği mevcut.",
            "status_badge": "%0 taksit",
        },
        "ar": {
            "title": "شقة واسعة من ثلاث غرف في بيليك دوزو",
            "description": "شقة واسعة من ثلاث غرف بمساحة 90 م² في شارع نيشه بمنطقة بيليك دوزو في إسطنبول. تقع في الطابق الثاني من مبنى مكوّن من خمسة طوابق أُنجز عام 2020، مع تقسيط 0%.",
            "city": "إسطنبول", "district": "بيليك دوزو", "address": "شارع نيشه",
            "meta_title": "شقة من ثلاث غرف في بيليك دوزو، إسطنبول — Rahat Home",
            "meta_description": "شقة من ثلاث غرف بمساحة 90 م² في شارع نيشه ببيليك دوزو، إسطنبول. الطابق الثاني، مبنى 2020، مع تقسيط 0%.",
            "status_badge": "تقسيط 0%",
        },
    },
    "elitnaya-villa-s-infiniti-basseynom-i-vidom-na-more-ebd797": {
        "en": {
            "title": "Luxury villa with an infinity pool and sea views",
            "description": "An exclusive 420 m² premium villa in Sirius, Sochi, with panoramic glazing, a heated infinity pool, spa area and landscaped garden. The designer interior features natural marble and teak.",
            "city": "Sochi", "district": "Sirius / Maritime Quarter", "address": "7 Morskaya Riviera Street",
            "meta_title": "Luxury villa with an infinity pool in Sochi — Rahat Home",
            "meta_description": "A 420 m² premium villa in Sirius, Sochi, with sea views, a heated infinity pool, spa and landscaped garden. Six rooms and designer finishes.",
            "status_badge": "Exclusive",
        },
        "tr": {
            "title": "Sonsuzluk havuzlu ve deniz manzaralı lüks villa",
            "description": "Soçi Sirius'ta panoramik camları, ısıtmalı sonsuzluk havuzu, spa alanı ve peyzajlı bahçesi bulunan 420 m² özel premium villa. Tasarım iç mekânda doğal mermer ve tik ağacı kullanılmıştır.",
            "city": "Soçi", "district": "Sirius / Deniz Mahallesi", "address": "Morskaya Riviera Caddesi 7",
            "meta_title": "Soçi'de sonsuzluk havuzlu lüks villa — Rahat Home",
            "meta_description": "Soçi Sirius'ta deniz manzaralı, ısıtmalı sonsuzluk havuzlu, spa alanlı ve peyzajlı bahçeli 420 m² premium villa.",
            "status_badge": "Özel",
        },
        "ar": {
            "title": "فيلا فاخرة بمسبح إنفينيتي وإطلالة بحرية",
            "description": "فيلا حصرية فاخرة بمساحة 420 م² في سيريوس، سوتشي، مع واجهات زجاجية بانورامية ومسبح إنفينيتي مدفأ ومنطقة سبا وحديقة منسقة. يتميز التصميم الداخلي بالرخام الطبيعي وخشب الساج.",
            "city": "سوتشي", "district": "سيريوس / الحي البحري", "address": "شارع مورسكايا ريفييرا، 7",
            "meta_title": "فيلا فاخرة بمسبح إنفينيتي في سوتشي — Rahat Home",
            "meta_description": "فيلا فاخرة بمساحة 420 م² في سيريوس، سوتشي، مع إطلالة بحرية ومسبح إنفينيتي مدفأ وسبا وحديقة منسقة. ست غرف وتشطيبات مصممة.",
            "status_badge": "حصري",
        },
    },
    "villa-na-beregu-mramornogo-morya-210c29": {
        "en": {
            "title": "Villa on the Sea of Marmara coast",
            "description": "A luxurious 400 m² six-room villa in a gated, secure complex near the Sea of Marmara in Beylikdüzü, Istanbul. The two-storey home was completed in 2020.",
            "city": "Istanbul", "district": "Beylikdüzü", "address": "Sahil Neighbourhood",
            "meta_title": "Villa on the Sea of Marmara in Istanbul — Rahat Home",
            "meta_description": "A 400 m² six-room villa in a gated secure complex by the Sea of Marmara in Beylikdüzü, Istanbul. Two floors and completed in 2020.",
            "status_badge": "Exclusive",
        },
        "tr": {
            "title": "Marmara Denizi kıyısında villa",
            "description": "İstanbul Beylikdüzü'nde Marmara Denizi yakınında, güvenlikli kapalı bir site içinde 400 m², altı odalı lüks villa. İki katlı konut 2020 yılında tamamlanmıştır.",
            "city": "İstanbul", "district": "Beylikdüzü", "address": "Sahil Mahallesi",
            "meta_title": "İstanbul'da Marmara Denizi kıyısında villa — Rahat Home",
            "meta_description": "Beylikdüzü İstanbul'da Marmara Denizi kıyısında güvenlikli sitede 400 m² altı odalı villa. İki katlı ve 2020 yapımı.",
            "status_badge": "Özel",
        },
        "ar": {
            "title": "فيلا على ساحل بحر مرمرة",
            "description": "فيلا فاخرة من ست غرف بمساحة 400 م² داخل مجمع مغلق وآمن بالقرب من بحر مرمرة في بيليك دوزو، إسطنبول. يتكوّن المنزل من طابقين وتم إنجازه عام 2020.",
            "city": "إسطنبول", "district": "بيليك دوزو", "address": "حي الساحل",
            "meta_title": "فيلا على بحر مرمرة في إسطنبول — Rahat Home",
            "meta_description": "فيلا من ست غرف بمساحة 400 م² داخل مجمع مغلق وآمن على بحر مرمرة في بيليك دوزو، إسطنبول. طابقان، بُنيت عام 2020.",
            "status_badge": "حصري",
        },
    },
}


FIELDS = (
    "title", "description", "city", "district", "address",
    "meta_title", "meta_description", "status_badge",
)


def russian_fields(prop: Property) -> LocalizedFields:
    meta_title, meta_description = RU_SEO[prop.slug]
    return {
        "title": prop.title,
        "description": prop.description,
        "city": prop.city,
        "district": prop.district,
        "address": prop.address,
        "meta_title": meta_title,
        "meta_description": meta_description,
        "status_badge": prop.status_badge,
    }


async def seed_property_localizations() -> None:
    expected_slugs = set(TRANSLATIONS)
    inserted = 0
    completed_fields = 0

    async with AsyncSessionLocal() as db:
        result = await db.execute(
            select(Property)
            .options(selectinload(Property.translations))
            .where(Property.slug.in_(expected_slugs))
            .order_by(Property.id)
        )
        properties = result.scalars().all()

        found_slugs = {prop.slug for prop in properties}
        missing = sorted(expected_slugs - found_slugs)
        if missing:
            raise RuntimeError(f"Properties not found: {', '.join(missing)}")

        for prop in properties:
            requested: dict[str, LocalizedFields] = {
                "ru": russian_fields(prop),
                **TRANSLATIONS[prop.slug],
            }
            existing = {item.locale: item for item in prop.translations}

            for locale, fields in requested.items():
                translation = existing.get(locale)
                if translation is None:
                    translation = PropertyTranslation(
                        property_id=prop.id,
                        locale=locale,
                        **fields,
                    )
                    db.add(translation)
                    inserted += 1
                    continue

                for field in FIELDS:
                    current = getattr(translation, field)
                    incoming = fields[field]
                    if (current is None or (isinstance(current, str) and not current.strip())) and incoming:
                        setattr(translation, field, incoming)
                        completed_fields += 1

        await db.commit()

    print(
        "Property localization complete. "
        f"Inserted translations: {inserted}; filled fields: {completed_fields}."
    )


if __name__ == "__main__":
    asyncio.run(seed_property_localizations())
