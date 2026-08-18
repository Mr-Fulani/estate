import { Hero } from '@/components/home/Hero';
import { FeaturedProperties } from '@/components/home/FeaturedProperties';
import { Services } from '@/components/home/Services';
import { Testimonials } from '@/components/home/Testimonials';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';

export default function Home() {
  return (
    <>
      <Hero />
      <FeaturedProperties />
      <Services />
      <Testimonials />
      
      {/* CTA Section */}
      <section className="py-20 bg-primary text-white">
        <div className="container mx-auto px-4 md:px-6 text-center max-w-4xl">
          <h2 className="text-3xl md:text-5xl font-bold mb-6">Готовы найти дом своей мечты?</h2>
          <p className="text-lg md:text-xl text-primary-100 mb-10">
            Оставьте заявку, и наши специалисты подберут лучшие варианты под ваши требования в кратчайшие сроки.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link href="/contact">
              <Button size="lg" variant="secondary" className="w-full sm:w-auto">
                Получить консультацию
              </Button>
            </Link>
            <Link href="/properties">
              <Button size="lg" variant="outline" className="w-full sm:w-auto border-white text-white hover:bg-white/10 hover:text-white">
                Смотреть каталог
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
