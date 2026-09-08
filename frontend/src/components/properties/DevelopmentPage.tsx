'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { ArrowDown, ArrowLeft, ArrowUpRight, ChevronLeft, ChevronRight, Expand, MapPin, Pause, Play, X } from 'lucide-react';
import type { Property } from '@/types';
import { type Locale, localizeHref, localeTags } from '@/i18n/config';
import { localizedProperty } from '@/i18n/domain';
import { developmentCopy } from '@/i18n/development';
import { CurrencyPrice } from '@/components/currency/CurrencyPrice';
import { ContactForm } from '@/app/properties/[id]/ContactForm';
import { PropertyContactActions } from '@/components/contact/PropertyContactActions';
import { developmentSections } from '@/lib/development-view';
import { developmentDemoCopy } from '@/i18n/development-demo';
import styles from './DevelopmentPage.module.css';

export function DevelopmentPage({ property: source, locale, preview = false }: { property: Property; locale: Locale; preview?: boolean }) {
  const property = localizedProperty(source, locale);
  const profile = property.development!;
  const sections = developmentSections(property, locale);
  const { editorial, interiors, amenities } = sections;
  const demoCopy = developmentDemoCopy[locale];
  const sandboxed = preview || profile.is_demo;
  const navItems = [[sections.concept, 'concept', developmentCopy[locale].overview], [interiors.length > 0, 'interiors', developmentCopy[locale].interiors], [sections.residences, 'residences', developmentCopy[locale].residences], [sections.location, 'location', developmentCopy[locale].location]] as const;
  const copy = developmentCopy[locale];
  const units = property.unit_types || [];
  const [unitIndex, setUnitIndex] = useState(0);
  const [planIndex, setPlanIndex] = useState(0);
  const [roomIndex, setRoomIndex] = useState(0);
  const [motion, setMotion] = useState(true);
  const [selection, setSelection] = useState('');
  const [selectedPlanLabel, setSelectedPlanLabel] = useState('');
  const [expanded, setExpanded] = useState<{ url: string; label: string } | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const unit = units[unitIndex];
  const planDetail = unit?.plan_details?.find(detail => detail.image === unit.plans[planIndex]);
  const location = [property.district, property.city].filter(Boolean).join(' · ');
  const price = (value: number) => <CurrencyPrice amount={value} sourceCurrency={property.currency} locale={locale} />;
  const area = (value: number) => `${value.toLocaleString(localeTags[locale])} m²`;
  const range = (min: number | null, max: number | null) => min === null || max === null ? copy.areaOnRequest : min === max ? area(min) : `${min.toLocaleString(localeTags[locale])}–${area(max)}`;
  const date = profile.price_date ? new Intl.DateTimeFormat(localeTags[locale], { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(`${profile.price_date}T12:00:00`)) : '';

  useEffect(() => {
    if (!expanded) { dialog.current?.close(); return; }
    dialog.current?.showModal();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previousOverflow; };
  }, [expanded]);

  const enquire = (code: string) => {
    setSelection(code);
    setSelectedPlanLabel(planDetail ? `${planDetail.code}${planDetail.area_gross ? ` · ${area(planDetail.area_gross)}` : ''}` : '');
    document.getElementById('residence-enquiry')?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
    window.setTimeout(() => document.getElementById('residence-enquiry-title')?.focus({ preventScroll: true }), 450);
  };

  return (
    <article className={styles.page} data-motion={motion} data-preview={preview} dir={locale === 'ar' ? 'rtl' : 'ltr'}>
      {sandboxed && <aside className={styles.demoNotice} role="note"><strong>{profile.is_demo ? demoCopy.badge : demoCopy.preview}</strong><span>{profile.is_demo ? demoCopy.notice : demoCopy.form} {demoCopy.disabled}</span></aside>}
      <section className={styles.hero} data-no-image={!property.images[0]} aria-labelledby="development-title">
        <div className={styles.heroContent}>
          <Link href={localizeHref(locale, '/properties')} className={styles.back}><ArrowLeft size={14} className="rtl:rotate-180" />{copy.back}</Link>
          <p className={styles.eyebrow}>{editorial?.eyebrow || copy.collection}</p>
          <h1 id="development-title" className={styles.title}>{property.title}</h1>
          {editorial?.headline && <p className={styles.heroHeadline}>{editorial.headline}</p>}
          {location && <p className={styles.locationLine}><MapPin size={14} />{location}</p>}
          <a href={sections.residences ? "#residences" : "#residence-enquiry"} className={styles.goldButton}>{copy.explore}<ArrowUpRight size={18} /></a>
          <div className={styles.heroBottom}>
            <div><span>{profile.is_demo ? demoCopy.price : profile.price_status === 'indicative' ? copy.indicative : copy.from}</span><strong><small>{copy.from} </small><bdi>{property.price > 0 ? price(property.price) : copy.priceOnRequest}</bdi></strong></div>
            <a href={sections.concept ? "#concept" : "#residence-enquiry"} aria-label={copy.overview} className={styles.circle}><ArrowDown size={18} /></a>
          </div>
        </div>
        {property.images[0] && <div className={styles.heroImage}>
          <Image src={property.images[0]} alt={`${property.title} — ${copy.render}`} fill priority sizes="(max-width: 760px) 100vw, 56vw" className={styles.heroPhoto} />
          <span className={styles.heroImageLabel}>{location}</span>
          {profile.images_are_renders && <span className={styles.renderLabel}>{copy.render}</span>}
        </div>}
      </section>

      <nav className={styles.sectionNav} aria-label={copy.project}>
        <span className={styles.navBrand}>{profile.design_brand || property.title}</span>
        <div>{navItems.filter(([visible]) => visible).map(([, id, title]) => <a href={`#${id}`} key={id}>{title}</a>)}</div>
        <a href="#residence-enquiry" className={styles.navCta}>{copy.enquiry}<ArrowUpRight size={14} /></a>
      </nav>

      {sections.concept && <section id="concept" className={`${styles.section} ${styles.concept}`}>
        <div><p className={styles.eyebrow}>01 / {copy.overview}</p><h2>{editorial?.story_title || property.title}</h2></div>
        <div>{property.description && <p className={styles.prose}>{property.description}</p>}{!interiors.length && editorial?.story && <p className={styles.prose}>{editorial.story}</p>}<div className={styles.facts}>
          {[[copy.developer, profile.developer], [copy.design, profile.design_brand], [copy.types, units.map(item => item.code).join(' / ')]].filter(([, value]) => value).map(([label, value]) => <div key={label}><span>{label}</span><strong dir="auto">{value}</strong></div>)}
        </div></div>
      </section>}

      {interiors.length > 0 && <section id="interiors" className={styles.showroom}>
        <div className={styles.showroomHeader}><div><p className={styles.eyebrow}>02 / {copy.interiors}</p><h2>{copy.livingTitle}</h2></div><button className={styles.motionToggle} onClick={() => setMotion(!motion)} aria-label={motion ? copy.motionOff : copy.motionOn} title={motion ? copy.motionOff : copy.motionOn}>{motion ? <Pause size={15} /> : <Play size={15} />}</button></div>
        {interiors[roomIndex] && <div className={styles.roomFrame}>
          <Image key={interiors[roomIndex]} src={interiors[roomIndex]} alt={`${property.title} — ${copy.interiors} ${roomIndex + 1}`} fill sizes="(max-width: 760px) 100vw, 90vw" className={styles.roomPhoto} />
          <button className={styles.expandButton} onClick={() => setExpanded({ url: interiors[roomIndex], label: `${copy.interiors} ${roomIndex + 1}` })}><Expand size={15} />{copy.open}</button>
          <span className={styles.roomCaption}>{String(roomIndex + 1).padStart(2, '0')} / {String(interiors.length).padStart(2, '0')}</span>
        </div>}
        <div className={styles.galleryFooter}>
          <div className={styles.thumbnails} aria-label={copy.gallery}>{interiors.map((url, i) => <button key={`${url}-${i}`} onClick={() => setRoomIndex(i)} aria-label={`${copy.image} ${i + 1}`} aria-pressed={i === roomIndex}><Image src={url} alt="" fill sizes="88px" /></button>)}</div>
          <div className={styles.galleryControls}><button className={styles.circle} aria-label={copy.previous} onClick={() => setRoomIndex((roomIndex - 1 + interiors.length) % interiors.length)} disabled={!interiors.length}><ChevronLeft size={18} /></button><button className={styles.circle} aria-label={copy.next} onClick={() => setRoomIndex((roomIndex + 1) % interiors.length)} disabled={!interiors.length}><ChevronRight size={18} /></button></div>
        </div>
        {profile.images_are_renders && <p className={styles.caption}>{copy.render}</p>}
        {editorial?.story && <p className={styles.showroomStory}>{editorial.story}</p>}
      </section>}

      {amenities.length ? <section className={`${styles.section} ${styles.amenities}`}><p className={styles.eyebrow}>{copy.concept}</p><div>{amenities.map((label, i) => <p key={label}><span>{String(i + 1).padStart(2, '0')}</span>{label}</p>)}</div><p className={styles.caption}>{copy.amenitiesNote}</p></section> : null}

      {sections.residences && <section id="residences" className={`${styles.section} ${styles.residences}`}>
        <div className={styles.sectionHeading}><div><p className={styles.eyebrow}>03 / {copy.residences}</p><h2>{copy.selectTitle}</h2></div><p>{copy.selectDescription}</p></div>
        <div className={styles.unitTabs} role="tablist" aria-label={copy.types}>{units.map((item, i) => <button key={item.code} type="button" role="tab" aria-selected={unitIndex === i} aria-controls="unit-panel" id={`unit-tab-${i}`} tabIndex={unitIndex === i ? 0 : -1} onClick={() => { setUnitIndex(i); setPlanIndex(0); }} onKeyDown={event => { if (['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) { event.preventDefault(); const next = event.key === 'Home' ? 0 : event.key === 'End' ? units.length - 1 : (i + (event.key === 'ArrowRight' ? 1 : -1) + units.length) % units.length; setUnitIndex(next); setPlanIndex(0); document.getElementById(`unit-tab-${next}`)?.focus(); } }}><bdi>{item.code}</bdi><span><bdi>{range(item.area_min, item.area_max)}</bdi></span></button>)}</div>
        {unit && <div id="unit-panel" role="tabpanel" aria-labelledby={`unit-tab-${unitIndex}`} className={styles.unitPanel}>
          <div className={styles.planArea}>
            {unit.plans[planIndex] ? <button className={styles.planImage} aria-label={`${copy.open}: ${copy.plan} ${unit.code}`} onClick={() => setExpanded({ url: unit.plans[planIndex], label: `${copy.plan} ${unit.code}` })}><Image key={unit.plans[planIndex]} src={unit.plans[planIndex]} alt={`${copy.plan} ${unit.code}`} fill sizes="(max-width: 760px) 100vw, 60vw" /><Expand className={styles.planExpand} size={20} /></button> : <p className={styles.noPlan}>{copy.noPlan}</p>}
            {unit.plans.length > 1 && <div className={styles.planOptions}>{unit.plans.map((url, i) => {
              const detail = unit.plan_details?.find(item => item.image === url);
              return <button key={url} aria-pressed={planIndex === i} onClick={() => setPlanIndex(i)}><bdi>{detail?.code || `${copy.plan} ${i + 1}`}{detail?.area_gross ? ` · ${area(detail.area_gross)}` : ''}</bdi></button>;
            })}</div>}
            {planDetail && <div className={styles.planFacts} aria-live="polite">
              <p>{copy.plan} <bdi>{planDetail.code}</bdi></p>
              <dl>{([[copy.grossArea, planDetail.area_gross], [copy.netArea, planDetail.area_net], [copy.withBalcony, planDetail.area_with_balcony]] as const).filter(([, value]) => value !== null).map(([label, value]) => <div key={label}><dt>{label}</dt><dd><bdi>{area(value!)}</bdi></dd></div>)}</dl>
            </div>}
          </div>
          <div className={styles.unitDetails}><p className={styles.eyebrow}>{copy.residences}</p><h3 dir="ltr">{unit.code}</h3><dl><div><dt>{copy.area}</dt><dd><bdi>{range(unit.area_min, unit.area_max)}</bdi></dd></div><div><dt>{copy.price}</dt><dd className={styles.unitPrice}>{unit.price_min !== null && unit.price_max !== null ? <><bdi>{price(unit.price_min)}</bdi><span>— <bdi>{price(unit.price_max)}</bdi></span></> : copy.priceOnRequest}</dd></div></dl><button className={styles.darkButton} onClick={() => enquire(unit.code)}>{copy.availability}<ArrowUpRight size={18} /></button>{date && unit.price_min !== null && <p className={styles.caption}>{profile.price_status === 'verified' ? copy.verified : copy.dated} {date}</p>}</div>
        </div>}
        <details className="mx-4 my-6 rounded-xl border border-slate-200 p-4 md:mx-8">
          <summary className="cursor-pointer font-semibold">{copy.residences} · {units.length}</summary>
          <ul className="mt-4 grid gap-5 md:grid-cols-3">{units.map(item => <li key={item.code}><h3>{item.code}</h3><p>{copy.area}: <bdi>{range(item.area_min, item.area_max)}</bdi></p><ul>{item.plans.map((url, index) => <li key={`${url}-${index}`}><a className="underline" href={url}>{copy.plan} {item.plan_details?.find(detail => detail.image === url)?.code || `${item.code} · ${index + 1}`}</a></li>)}</ul></li>)}</ul>
        </details>
        <div className={styles.notes}><p>{copy.planNote}</p><p>{copy.typePriceNote} {profile.price_status === 'indicative' && copy.priceNote}</p></div>
      </section>}

      {sections.location && <section id="location" className={styles.locationSection} data-no-image={!property.images[1]}>
        {property.images[1] && <div className={styles.locationImage}><Image src={property.images[1]} alt={`${property.title} — ${copy.location}`} fill sizes="(max-width: 760px) 100vw, 50vw" /></div>}
        <div className={styles.locationContent}><p className={styles.eyebrow}>04 / {copy.location}</p><h2>{location}</h2><p className={styles.prose}>{editorial?.location_description || property.address}</p><p className={styles.street}>{property.address}</p>{!profile.is_demo && <a className={styles.textLink} href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([property.title, property.address, property.city].filter(Boolean).join(', '))}`} target="_blank" rel="noopener noreferrer">{copy.map}<ArrowUpRight size={16} /></a>}</div>
      </section>}

      <section id="residence-enquiry" className={`${styles.section} ${styles.contact}`}>
        <div><p className={styles.eyebrow}>{copy.contactEyebrow}</p><h2 id="residence-enquiry-title" tabIndex={-1}>{copy.contactTitle}</h2><p className={styles.prose}>{copy.contactText}</p><p className={styles.purchaseNote}>{editorial?.purchase_note || copy.delivery}</p>{profile.brochure_url && <a href={profile.brochure_url} target="_blank" rel="noopener noreferrer" className={styles.textLink}>{copy.brochure}<ArrowUpRight size={16} /></a>}{!sandboxed && <PropertyContactActions propertyId={property.id} />}</div>
        <div className={styles.contactForm}><label className={styles.selectLabel} htmlFor="enquiry-unit">{copy.selected}</label><select id="enquiry-unit" value={selection} onChange={event => { setSelection(event.target.value); setSelectedPlanLabel(''); }}><option value="">{copy.any}</option>{units.map(item => <option key={item.code} value={item.code}>{item.code}</option>)}</select>{selectedPlanLabel && <p className={styles.enquiryPlan}>{copy.plan}: <bdi>{selectedPlanLabel}</bdi></p>}{sandboxed ? <div className={styles.sandboxForm} data-testid="sandbox-enquiry"><p>{demoCopy.disabled}</p><p>{demoCopy.selection}: <bdi>{selection || copy.any}{selectedPlanLabel ? ` · ${selectedPlanLabel}` : ''}</bdi></p><button type="button" className={styles.darkButton} disabled>{copy.enquiry}</button></div> : <ContactForm propertyId={property.id} contextMessage={`${copy.message} ${property.title}${selection ? `, ${selection}` : ''}${selectedPlanLabel ? `, ${selectedPlanLabel}` : ''}. ${copy.request}`} />}</div>
      </section>

      <dialog ref={dialog} className={styles.lightbox} onCancel={() => setExpanded(null)} onClick={event => { if (event.target === dialog.current) setExpanded(null); }} aria-label={expanded?.label || copy.image}><button onClick={() => setExpanded(null)} aria-label={copy.close} className={styles.lightboxClose}><X size={24} /></button>{expanded && <div className={styles.lightboxImage}><Image src={expanded.url} alt={expanded.label} fill sizes="95vw" unoptimized loading="eager" /></div>}<p>{expanded?.label}</p></dialog>
    </article>
  );
}
