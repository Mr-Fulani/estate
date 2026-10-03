'use client';

import Image from 'next/image';
import { PropertyVideo } from './PropertyVideo';
import { PropertyMediaPlaceholder } from './PropertyMediaPlaceholder';
import Link from 'next/link';
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { ArrowDown, ArrowLeft, ArrowUpRight, ChevronLeft, ChevronRight, Expand, MapPin, Pause, Play, X } from 'lucide-react';
import type { Property } from '@/types';
import { type Locale, localizeHref, localeTags } from '@/i18n/config';
import { localizedProperty } from '@/i18n/domain';
import { developmentCopy } from '@/i18n/development';
import { CurrencyPrice } from '@/components/currency/CurrencyPrice';
import { developmentSections, developmentUnitPath, developmentVideoSections } from '@/lib/development-view';
import { displayImageUrl, isDriveImage, videoPosterUrl } from '@/lib/video-media';
import { developmentDemoCopy } from '@/i18n/development-demo';
import styles from './DevelopmentPage.module.css';

export function DevelopmentPage({ property: source, locale, preview = false }: { property: Property; locale: Locale; preview?: boolean }) {
  const property = localizedProperty(source, locale);
  const profile = property.development!;
  const sections = developmentSections(property, locale);
  const { editorial, interiors, amenities } = sections;
  const demoCopy = developmentDemoCopy[locale];
  const sandboxed = preview || profile.is_demo;
  const copy = developmentCopy[locale];
  const units = property.unit_types || [];
  const titleParts = property.title.split(/\s+—\s+/);
  const projectName = titleParts[0];
  const projectDescription = titleParts.slice(1).join(" — ");
  const videoSections = developmentVideoSections(profile, property.videos);
  const heroVideos = videoSections.hero;
  const galleryMedia = [...videoSections.gallery.map(url => ({ url, video: true })), ...interiors.map(url => ({ url, video: false }))];
  const [heroRatios, setHeroRatios] = useState<Record<string, number>>({});
  const [heroMediaIndex, setHeroMediaIndex] = useState(0);
  const [roomIndex, setRoomIndex] = useState(0);
  const [motion, setMotion] = useState(true);
  const [expanded, setExpanded] = useState<{ url: string; label: string } | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const hero = useRef<HTMLElement>(null);
  const heroMediaCount = property.images.length + heroVideos.length;
  const activeHeroIndex = heroMediaCount ? heroMediaIndex % heroMediaCount : 0;
  const heroVideo = activeHeroIndex < heroVideos.length ? heroVideos[activeHeroIndex] : null;
  const heroImage = property.images[activeHeroIndex - heroVideos.length] || property.images[0];
  const location = [property.district, property.city].filter(Boolean).join(' · ');
  const price = (value: number) => <CurrencyPrice amount={value} sourceCurrency={property.currency} locale={locale} />;
  const area = (value: number) => `${value.toLocaleString(localeTags[locale])} m²`;
  const range = (min: number | null, max: number | null) => min === null || max === null ? copy.areaOnRequest : min === max ? area(min) : `${min.toLocaleString(localeTags[locale])}–${area(max)}`;
  const date = profile.price_date ? new Intl.DateTimeFormat(localeTags[locale], { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(`${profile.price_date}T12:00:00`)) : '';

  useEffect(() => {
    const element = hero.current;
    if (!element) return;
    // Let a tall hero scroll to its bottom before pinning its media controls.
    const measure = () => element.style.setProperty('--hero-height', `${element.getBoundingClientRect().height}px`);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!expanded) { dialog.current?.close(); return; }
    dialog.current?.showModal();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previousOverflow; };
  }, [expanded]);

  return (
    <article className={styles.page} data-motion={motion} data-preview={preview} dir={locale === 'ar' ? 'rtl' : 'ltr'}>
      {sandboxed && <aside className={styles.demoNotice} role="note"><strong>{profile.is_demo ? demoCopy.badge : demoCopy.preview}</strong><span>{profile.is_demo ? demoCopy.notice : demoCopy.form} {demoCopy.disabled}</span></aside>}
      <section ref={hero} className={styles.hero} data-video={Boolean(heroVideo)} data-no-image={!property.images[0] && !heroVideos.length} aria-labelledby="development-title">
          {heroMediaCount > 1 && <div className={styles.heroControlsShelf} aria-label={copy.heroGallery}>
            <div className={styles.heroMediaControls}><span>{heroVideo ? copy.video : copy.image}</span><button type="button" aria-label={copy.previous} onClick={() => setHeroMediaIndex((heroMediaIndex - 1 + heroMediaCount) % heroMediaCount)}><ChevronLeft size={19} /></button>
            <span>{activeHeroIndex + 1} / {heroMediaCount}</span>
            <button type="button" aria-label={copy.next} onClick={() => setHeroMediaIndex((heroMediaIndex + 1) % heroMediaCount)}><ChevronRight size={19} /></button>
            </div>
          </div>}
        <div className={styles.heroContent}>
          <Link href={localizeHref(locale, '/properties')} className={styles.back}><ArrowLeft size={14} className="rtl:rotate-180" />{copy.back}</Link>
          <p className={styles.eyebrow}>{editorial?.eyebrow || copy.collection}</p>
          <h1 id="development-title" className={styles.title}><span className={styles.projectName}>{projectName}</span>{projectDescription && <><span className="sr-only"> — </span><span className={styles.projectDescription}>{projectDescription}</span></>}</h1>
          {editorial?.headline && <p className={styles.heroHeadline}>{editorial.headline}</p>}
          {location && <p className={styles.locationLine}><MapPin size={14} />{location}</p>}
          <a href={sections.residences ? "#residences" : "#residence-enquiry"} className={styles.goldButton}>{copy.explore}<ArrowUpRight size={18} /></a>
          <div className={styles.heroBottom}>
            <div><span>{profile.is_demo ? demoCopy.price : profile.price_status === 'indicative' ? copy.indicative : copy.from}</span><strong><small>{copy.from} </small><bdi>{property.price > 0 ? price(property.price) : copy.priceOnRequest}</bdi></strong></div>
          <a href={sections.concept ? "#concept" : "#residences"} aria-label={copy.overview} className={styles.circle}><ArrowDown size={18} /></a>
          </div>
        </div>
        {heroMediaCount > 0 && <div className={styles.heroImage} style={{ '--hero-media-ratio': heroRatios[heroVideo || heroImage] || 16 / 9 } as CSSProperties}>
          {heroVideo ? <VideoFrame key={heroVideo} url={heroVideo} title={`${property.title} — ${copy.video} ${activeHeroIndex + 1}`} onAspectRatio={ratio => setHeroRatios(previous => previous[heroVideo] === ratio ? previous : { ...previous, [heroVideo]: ratio })} /> : <Image src={displayImageUrl(heroImage)} alt={`${property.title} — ${copy.render}`} fill priority unoptimized={isDriveImage(heroImage)} sizes="100vw" className={styles.heroPhoto} onLoad={event => { const image = event.currentTarget; if (image.naturalWidth && image.naturalHeight) { const ratio = image.naturalWidth / image.naturalHeight; setHeroRatios(previous => previous[heroImage] === ratio ? previous : { ...previous, [heroImage]: ratio }); } }} />}
          {!heroVideo && <span className={styles.heroImageLabel}>{location}</span>}
          {!heroVideo && profile.images_are_renders && <span className={styles.renderLabel}>{copy.render}</span>}

        </div>}
      </section>

      {sections.concept && <section id="concept" className={`${styles.section} ${styles.concept}`}>
        <div><p className={styles.eyebrow}>01 / {copy.overview}</p><h2>{editorial?.story_title || property.title}</h2></div>
        <div>{property.description && <p className={styles.prose}>{property.description}</p>}{!interiors.length && editorial?.story && <p className={styles.prose}>{editorial.story}</p>}<div className={styles.facts}>
          {[[copy.developer, profile.developer], [copy.design, profile.design_brand], [copy.types, units.map(item => item.code).join(' / ')]].filter(([, value]) => value).map(([label, value]) => <div key={label}><span>{label}</span><strong dir="auto">{value}</strong></div>)}
        </div>{profile.brochure_url && <a className={styles.textLink} href={profile.brochure_url} target="_blank" rel="noopener noreferrer">{copy.brochure}<ArrowUpRight size={16} /></a>}</div>
      </section>}

      {galleryMedia.length > 0 && <section id="interiors" className={styles.showroom}>
        <div className={styles.showroomHeader}><div><p className={styles.eyebrow}>02 / {copy.mediaGallery}</p><h2>{copy.mediaGalleryTitle}</h2></div><button className={styles.motionToggle} onClick={() => setMotion(!motion)} aria-label={motion ? copy.motionOff : copy.motionOn} title={motion ? copy.motionOff : copy.motionOn}>{motion ? <Pause size={15} /> : <Play size={15} />}</button></div>
        {galleryMedia[roomIndex] && <div className={styles.roomFrame}>
          {galleryMedia[roomIndex].video ? <VideoFrame key={galleryMedia[roomIndex].url} url={galleryMedia[roomIndex].url} title={`${property.title} — ${copy.video} ${roomIndex + 1}`} /> : <>
            <Image key={galleryMedia[roomIndex].url} src={displayImageUrl(galleryMedia[roomIndex].url)} alt={`${property.title} — ${copy.interiors} ${roomIndex + 1}`} fill unoptimized={isDriveImage(galleryMedia[roomIndex].url)} sizes="90vw" className={styles.roomPhoto} />
            <button className={styles.expandButton} onClick={() => setExpanded({ url: galleryMedia[roomIndex].url, label: copy.interiors })}><Expand size={15} />{copy.open}</button>
          </>}
        </div>}
        <div className={styles.galleryFooter}>
          <div className={styles.thumbnails} aria-label={copy.mediaGallery}>{galleryMedia.map((media, i) => <button key={`${media.url}-${i}`} onClick={() => setRoomIndex(i)} aria-label={`${media.video ? copy.video : copy.image} ${i + 1}`} aria-pressed={i === roomIndex}><Image src={media.video ? videoPosterUrl(media.url) || '/og.png' : displayImageUrl(media.url, 240)} alt="" fill unoptimized={media.video || isDriveImage(media.url)} sizes="88px" />{media.video && <Play size={18} className={styles.videoThumbnailIcon} />}</button>)}</div>
          <div className={styles.galleryControls}><button className={styles.circle} aria-label={copy.previous} onClick={() => setRoomIndex((roomIndex - 1 + galleryMedia.length) % galleryMedia.length)}><ChevronLeft size={18} /></button><span>{roomIndex + 1} / {galleryMedia.length}</span><button className={styles.circle} aria-label={copy.next} onClick={() => setRoomIndex((roomIndex + 1) % galleryMedia.length)}><ChevronRight size={18} /></button></div>
        </div>
        {!galleryMedia[roomIndex]?.video && profile.images_are_renders && <p className={styles.caption}>{copy.render}</p>}
        {editorial?.story && <p className={styles.showroomStory}>{editorial.story}</p>}
      </section>}

      {amenities.length ? <section className={`${styles.section} ${styles.amenities}`}><p className={styles.eyebrow}>{copy.concept}</p><div>{amenities.map((label, i) => <p key={label}><span>{String(i + 1).padStart(2, '0')}</span>{label}</p>)}</div><p className={styles.caption}>{copy.amenitiesNote}</p></section> : null}

      {sections.residences && <section id="residences" className={`${styles.section} ${styles.residences}`}>
        <div className={styles.sectionHeading}><div><p className={styles.eyebrow}>03 / {copy.residences}</p><h2>{copy.selectTitle}</h2></div><p>{copy.selectDescription}</p></div>
        <div className={styles.unitCards}>
          {units.map(item => {
            const detailHref = localizeHref(locale, `/properties/${property.slug}/${developmentUnitPath(item.code)}`);
            const contactHref = `${localizeHref(locale, '/contact')}?property=${encodeURIComponent(property.slug)}&unit=${encodeURIComponent(item.code)}`;
            return <article key={item.code} className={styles.unitCard}>
              <div className={styles.unitCardMedia}>
                {item.media_images?.[0] ? <Link href={detailHref} aria-label={`${copy.details}: ${item.code}`}><Image src={displayImageUrl(item.media_images[0])} alt={`${property.title} — ${item.code}`} fill unoptimized={isDriveImage(item.media_images[0])} sizes="(max-width: 760px) 100vw, (max-width: 1100px) 50vw, 33vw" /></Link>
                  : item.video_url ? <VideoFrame url={item.video_url} title={`${property.title} — ${item.code}`} />
                    : item.plans?.[0] ? <Link href={detailHref} aria-label={`${copy.details}: ${item.code} — ${copy.plan}`}><Image src={displayImageUrl(item.plans[0])} alt={`${property.title} — ${item.code} — ${copy.plan}`} fill unoptimized={isDriveImage(item.plans[0])} sizes="(max-width: 760px) 100vw, (max-width: 1100px) 50vw, 33vw" className={styles.unitCardPlan} /></Link>
                      : <Link href={detailHref} aria-label={`${copy.details}: ${item.code}`}><PropertyMediaPlaceholder locale={locale} /></Link>}
                {item.video_url && item.media_images?.[0] && <span className={styles.unitCardVideo}>{copy.video}</span>}
              </div>
              <div className={styles.unitCardDetails}>
                <h3 dir="ltr">{item.code}</h3>
                <p><span>{copy.area}</span><bdi>{range(item.area_min, item.area_max)}</bdi></p>
                <p><span>{copy.price}</span><bdi>{item.price_min !== null && item.price_max !== null ? <>{price(item.price_min)}{item.price_max !== item.price_min && <> — {price(item.price_max)}</>}</> : copy.priceOnRequest}</bdi></p>
                {date && item.price_min !== null && <p className={styles.unitCardPriceDate}>{profile.price_status === 'verified' ? copy.verified : copy.dated} {date}</p>}
                <Link className={styles.textLink} href={detailHref}>{copy.details}<ArrowUpRight size={16} /></Link>
                <Link className={`${styles.darkButton} mt-3`} href={contactHref}>{copy.availability}<ArrowUpRight size={18} /></Link>
              </div>
            </article>;
          })}
        </div>
        <div className={styles.notes}><p>{copy.planNote}</p><p>{copy.typePriceNote} {profile.price_status === 'indicative' && copy.priceNote}</p></div>
      </section>}

      {sections.location && <section id="location" className={styles.locationSection} data-no-image={!property.images[1]}>
        {property.images[1] && <div className={styles.locationImage}><Image src={displayImageUrl(property.images[1])} alt={`${property.title} — ${copy.location}`} fill unoptimized={isDriveImage(property.images[1])} sizes="(max-width: 760px) 100vw, 50vw" /></div>}
        <div className={styles.locationContent}><p className={styles.eyebrow}>04 / {copy.location}</p><h2>{location}</h2><p className={styles.prose}>{editorial?.location_description || property.address}</p><p className={styles.street}>{property.address}</p>{!profile.is_demo && <a className={styles.textLink} href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([property.title, property.address, property.city].filter(Boolean).join(', '))}`} target="_blank" rel="noopener noreferrer">{copy.map}<ArrowUpRight size={16} /></a>}</div>
      </section>}

      <dialog ref={dialog} className={styles.lightbox} onCancel={() => setExpanded(null)} onClick={event => { if (event.target === dialog.current) setExpanded(null); }} aria-label={expanded?.label || copy.image}><button onClick={() => setExpanded(null)} aria-label={copy.close} className={styles.lightboxClose}><X size={24} /></button>{expanded && <div className={styles.lightboxImage}><Image src={expanded.url} alt={expanded.label} fill sizes="95vw" unoptimized loading="eager" /></div>}<p>{expanded?.label}</p></dialog>
    </article>
  );
}

function VideoFrame({ url, title, onAspectRatio }: { url: string; title: string; onAspectRatio?: (ratio: number) => void }) {
  return <div className={styles.videoFrame}><PropertyVideo url={url} title={title} onAspectRatio={onAspectRatio} /></div>;
}
