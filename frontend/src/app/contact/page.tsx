import { ContactForm } from '@/app/properties/[id]/ContactForm';
import { MapPin, Phone, Mail, Clock } from 'lucide-react';

export default function ContactPage() {
  return (
    <div className="bg-slate-50 min-h-[calc(100vh-80px)] py-12">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h1 className="text-4xl font-bold text-slate-900 mb-4">Свяжитесь с нами</h1>
          <p className="text-lg text-slate-600">
            Мы всегда готовы ответить на ваши вопросы и помочь с выбором недвижимости.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
          {/* Contact Info */}
          <div className="bg-primary-900 rounded-2xl p-8 md:p-12 text-white">
            <h2 className="text-3xl font-bold mb-8">Контактная информация</h2>
            
            <div className="space-y-8">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center shrink-0">
                  <MapPin className="text-secondary" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Наш офис</h3>
                  <p className="text-primary-100 leading-relaxed">
                    г. Москва, Пресненская набережная, 12<br />
                    Башня Федерация, офис 45
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center shrink-0">
                  <Phone className="text-secondary" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Телефон</h3>
                  <a href="tel:+74951234567" className="text-primary-100 hover:text-white transition-colors">
                    +7 (495) 123-45-67
                  </a>
                  <br />
                  <a href="tel:+79991234567" className="text-primary-100 hover:text-white transition-colors">
                    +7 (999) 123-45-67
                  </a>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center shrink-0">
                  <Mail className="text-secondary" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Email</h3>
                  <a href="mailto:info@estate-agency.ru" className="text-primary-100 hover:text-white transition-colors">
                    info@estate-agency.ru
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center shrink-0">
                  <Clock className="text-secondary" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Режим работы</h3>
                  <p className="text-primary-100">
                    Пн - Пт: 09:00 - 20:00<br />
                    Сб - Вс: 10:00 - 18:00
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 md:p-12">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Напишите нам</h2>
            <ContactForm />
          </div>
        </div>
      </div>
    </div>
  );
}
