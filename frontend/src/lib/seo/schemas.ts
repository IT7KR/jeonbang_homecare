/**
 * SEO 구조화 데이터 (JSON-LD) 스키마 유틸리티
 */

const SITE_URL = "https://geonbang.com/homecare";
const COMPANY_NAME = "전방 홈케어";
const COMPANY_PHONE = "031-797-4004";
const COMPANY_EMAIL = "mycron37@naver.com";

export interface BreadcrumbItem {
  name: string;
  url: string;
}

export interface FAQItem {
  question: string;
  answer: string;
}

/**
 * Organization 스키마 생성
 */
export function generateOrganizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: COMPANY_NAME,
    url: SITE_URL,
    logo: `${SITE_URL}/logo.png`,
    description: "양평, 가평 지역 전원주택 관리 전문 서비스",
    telephone: COMPANY_PHONE,
    email: COMPANY_EMAIL,
    address: {
      "@type": "PostalAddress",
      addressRegion: "경기도",
      addressLocality: "양평군",
      addressCountry: "KR",
    },
    areaServed: [
      {
        "@type": "AdministrativeArea",
        name: "양평군",
      },
      {
        "@type": "AdministrativeArea",
        name: "가평군",
      },
    ],
    sameAs: [],
  };
}

/**
 * WebSite 스키마 생성 (사이트 검색 지원)
 */
export function generateWebSiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: COMPANY_NAME,
    url: SITE_URL,
    description: "전원주택 관리의 새로운 기준",
    inLanguage: "ko-KR",
    publisher: {
      "@type": "Organization",
      name: COMPANY_NAME,
      url: SITE_URL,
    },
  };
}

/**
 * LocalBusiness 스키마 생성 (향상된 버전)
 */
export function generateLocalBusinessSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": `${SITE_URL}/#organization`,
    name: COMPANY_NAME,
    description:
      "양평, 가평 지역 전원주택 관리 전문 서비스. 제초, 조경, 청소, 시공까지 원스톱 제공.",
    url: SITE_URL,
    telephone: COMPANY_PHONE,
    email: COMPANY_EMAIL,
    address: {
      "@type": "PostalAddress",
      addressRegion: "경기도",
      addressLocality: "양평군",
      addressCountry: "KR",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: "37.4916",
      longitude: "127.4875",
    },
    areaServed: [
      {
        "@type": "AdministrativeArea",
        name: "양평군",
      },
      {
        "@type": "AdministrativeArea",
        name: "가평군",
      },
    ],
    priceRange: "$$",
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        opens: "09:00",
        closes: "18:00",
      },
    ],
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "전원주택 관리 서비스",
      itemListElement: [
        {
          "@type": "Offer",
          itemOffered: {
            "@type": "Service",
            name: "제초 서비스",
            description: "잔디 깎기, 잡초 제거, 정원 관리",
          },
        },
        {
          "@type": "Offer",
          itemOffered: {
            "@type": "Service",
            name: "조경 서비스",
            description: "정원 설계, 수목 관리, 조경 시공",
          },
        },
        {
          "@type": "Offer",
          itemOffered: {
            "@type": "Service",
            name: "청소 서비스",
            description: "외벽 청소, 입주 청소, 정기 청소",
          },
        },
        {
          "@type": "Offer",
          itemOffered: {
            "@type": "Service",
            name: "시공 서비스",
            description: "인테리어, 수리, 리모델링",
          },
        },
      ],
    },
  };
}

/**
 * BreadcrumbList 스키마 생성
 */
export function generateBreadcrumbSchema(items: BreadcrumbItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

/**
 * FAQPage 스키마 생성
 */
export function generateFAQPageSchema(faqs: FAQItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
}

/**
 * Service 스키마 생성
 */
export function generateServiceSchema(
  name: string,
  description: string,
  serviceType: string
) {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name,
    description,
    serviceType,
    provider: {
      "@type": "LocalBusiness",
      name: COMPANY_NAME,
      url: SITE_URL,
    },
    areaServed: [
      {
        "@type": "AdministrativeArea",
        name: "양평군",
      },
      {
        "@type": "AdministrativeArea",
        name: "가평군",
      },
    ],
  };
}

/**
 * 여러 스키마를 결합하여 스크립트 태그용 문자열 생성
 */
export function combineSchemas(...schemas: object[]): string {
  if (schemas.length === 1) {
    return JSON.stringify(schemas[0]);
  }
  return JSON.stringify(schemas);
}
