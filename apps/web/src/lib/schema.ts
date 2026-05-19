import { site } from "./site";

export function mobileApplicationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "MobileApplication",
    name: site.name,
    description: site.description,
    url: site.url,
    operatingSystem: "iOS, Android",
    applicationCategory: "HealthApplication",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "CAD",
    },
  };
}

export function faqPageSchema(faqs: Array<{ q: string; a: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.a,
      },
    })),
  };
}
