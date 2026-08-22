import type { Locale } from '@/i18n/config';

const legalCopy = {
  ru: {
    updated: 'Обновлено 22 августа 2026 года',
    privacy: { title: 'Политика конфиденциальности', intro: 'Мы используем персональные данные только для обработки ваших обращений и связи по вопросам недвижимости.', sections: [['Какие данные мы получаем', 'Имя, телефон, email, текст обращения и выбранный объект — только те сведения, которые вы отправляете через формы сайта.'], ['Как мы используем данные', 'Чтобы ответить на обращение, подобрать объекты и сопровождать работу с клиентом. Мы не продаём персональные данные.'], ['Хранение и защита', 'Доступ к обращениям ограничен сотрудниками, которым он необходим для работы. Срок хранения зависит от цели обращения и применимых требований.'], ['Ваши права', 'Вы можете запросить уточнение или удаление данных, написав на адрес, указанный в разделе контактов.']] },
    terms: { title: 'Пользовательское соглашение', intro: 'Используя сайт Rahat Home, вы соглашаетесь с правилами ниже.', sections: [['Информация на сайте', 'Материалы и цены носят информационный характер. Актуальные условия подтверждаются агентом перед принятием решения.'], ['Обращения', 'Отправляя форму, вы подтверждаете корректность указанных данных и разрешаете связаться с вами по вашему запросу.'], ['Интеллектуальные права', 'Тексты, оформление и материалы сайта нельзя копировать для коммерческого использования без разрешения правообладателя.'], ['Ответственность', 'Rahat Home стремится поддерживать информацию актуальной, но не гарантирует отсутствие технических ошибок или временных перерывов.']] },
  },
  en: {
    updated: 'Updated 22 August 2026',
    privacy: { title: 'Privacy policy', intro: 'We use personal data only to process your enquiry and contact you about real estate services.', sections: [['Data we receive', 'Your name, phone, email, message and selected property — only the information you submit through the website.'], ['How we use data', 'To reply, prepare a shortlist and manage our work with you. We do not sell personal data.'], ['Storage and security', 'Access is limited to team members who need the information. Retention depends on the purpose of the enquiry and applicable requirements.'], ['Your choices', 'You may ask us to correct or delete your data using the email shown on the contact page.']] },
    terms: { title: 'Terms of use', intro: 'By using the Rahat Home website, you agree to the terms below.', sections: [['Website information', 'Content and prices are indicative. An agent confirms current terms before you make a decision.'], ['Enquiries', 'By submitting a form, you confirm that the details are accurate and allow us to contact you about the request.'], ['Intellectual property', 'Website copy, design and materials may not be reused commercially without permission.'], ['Liability', 'Rahat Home works to keep information current but cannot guarantee that the website will always be free of technical errors or interruptions.']] },
  },
  tr: {
    updated: '22 Ağustos 2026 tarihinde güncellendi',
    privacy: { title: 'Gizlilik politikası', intro: 'Kişisel verileri yalnızca talebinizi işlemek ve gayrimenkul hizmetleri hakkında sizinle iletişim kurmak için kullanırız.', sections: [['Aldığımız veriler', 'Ad, telefon, e-posta, mesaj ve seçilen ilan — yalnızca site formları üzerinden gönderdiğiniz bilgiler.'], ['Verileri kullanma amacımız', 'Talebinize yanıt vermek, seçenek hazırlamak ve müşteri sürecini yönetmek. Kişisel verileri satmayız.'], ['Saklama ve güvenlik', 'Erişim, bilgiye işi gereği ihtiyaç duyan ekip üyeleriyle sınırlıdır. Saklama süresi talebin amacına ve geçerli gerekliliklere bağlıdır.'], ['Haklarınız', 'İletişim sayfasındaki e-posta üzerinden verilerin düzeltilmesini veya silinmesini talep edebilirsiniz.']] },
    terms: { title: 'Kullanım koşulları', intro: 'Rahat Home sitesini kullanarak aşağıdaki koşulları kabul etmiş olursunuz.', sections: [['Sitedeki bilgiler', 'İçerik ve fiyatlar bilgilendirme amaçlıdır. Güncel koşullar karar öncesinde danışman tarafından teyit edilir.'], ['Talepler', 'Form göndererek bilgilerin doğruluğunu onaylar ve talebiniz hakkında sizinle iletişime geçilmesine izin verirsiniz.'], ['Fikri mülkiyet', 'Site metinleri, tasarımı ve materyalleri izin olmadan ticari amaçla kullanılamaz.'], ['Sorumluluk', 'Rahat Home bilgileri güncel tutmaya çalışır; ancak teknik hata veya geçici kesinti olmayacağını garanti edemez.']] },
  },
  ar: {
    updated: 'آخر تحديث: 22 أغسطس 2026',
    privacy: { title: 'سياسة الخصوصية', intro: 'نستخدم البيانات الشخصية فقط لمعالجة طلباتك والتواصل معك بشأن العقارات.', sections: [['البيانات التي نجمعها', 'الاسم ورقم الهاتف والبريد الإلكتروني ونص الطلب والعقار المختار، وهي فقط المعلومات التي ترسلها عبر نماذج الموقع.'], ['كيفية استخدام البيانات', 'للرد على طلبك واختيار العقارات المناسبة ومتابعة العمل معك. نحن لا نبيع البيانات الشخصية.'], ['التخزين والحماية', 'يقتصر الوصول إلى الطلبات على الموظفين الذين يحتاجون إليها لأداء عملهم. تعتمد مدة التخزين على غرض الطلب والمتطلبات المطبقة.'], ['حقوقك', 'يمكنك طلب تصحيح بياناتك أو حذفها عبر البريد الإلكتروني المذكور في صفحة التواصل.']] },
    terms: { title: 'شروط الاستخدام', intro: 'باستخدام موقع Rahat Home فإنك توافق على الشروط التالية.', sections: [['معلومات الموقع', 'المحتوى والأسعار لأغراض إرشادية، ويؤكد المستشار الشروط الحالية قبل اتخاذ القرار.'], ['الطلبات', 'عند إرسال النموذج فإنك تؤكد صحة البيانات وتسمح لنا بالتواصل معك بشأن طلبك.'], ['الملكية الفكرية', 'لا يجوز استخدام نصوص الموقع وتصميمه ومواده تجارياً دون إذن.'], ['المسؤولية', 'تعمل Rahat Home على إبقاء المعلومات محدثة، لكنها لا تضمن خلو الموقع دائماً من الأخطاء التقنية أو الانقطاعات المؤقتة.']] },
  },
} as const;

export function LegalPage({ locale, type }: { locale: Locale; type: 'privacy' | 'terms' }) {
  const localeCopy = legalCopy[locale];
  const copy = localeCopy[type];
  return (
    <div className="min-h-screen bg-slate-50 py-12 md:py-16">
      <article className="container mx-auto max-w-4xl px-4 md:px-6">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-10">
          <p className="mb-3 text-sm font-semibold text-secondary-700">{localeCopy.updated}</p>
          <h1 className="mb-5 text-3xl font-bold text-slate-950 md:text-5xl">{copy.title}</h1>
          <p className="mb-10 text-lg leading-relaxed text-slate-600">{copy.intro}</p>
          <div className="space-y-8">
            {copy.sections.map(([title, content]) => <section key={title}><h2 className="mb-2 text-xl font-bold text-slate-900">{title}</h2><p className="leading-7 text-slate-600">{content}</p></section>)}
          </div>
        </div>
      </article>
    </div>
  );
}
