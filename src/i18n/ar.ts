// DESIGN_SYSTEM.md §9 — Arabic column, verbatim.
export const catalogue = {
  site: {
    name: "معامل النيل مصر",
    campaignTitle: "عروض الافتتاح"
  },
  home: {
    heading: "عروض التحاليل الطبية",
    intro: "اختَر التحليل لعرض التفاصيل والسعر ومدة العرض ووسائل الطلب.",
    searchPlaceholder: "ابحث باسم التحليل...",
    noMatches: "لا توجد تحاليل مطابقة للبحث.",
    nothingVisible: "لا توجد عروض متاحة اليوم.",
    comingSoon: "العروض ستُتاح قريبًا.",
    viewDetails: "عرض التفاصيل"
  },
  campaignOffer: {
    pageHeading: "تفاصيل العرض — كود {code}",
    codeLabel: "كود العرض",
    priceLabel: "سعر العرض",
    currency: "جنيه مصري",
    endsOn: "ينتهي العرض في {end}",
    validFromTo: "العرض من {start} إلى {end}",
    conditionsHeading: "شروط العرض",
    galleryAlt: "صورة {position} — {name}",
    orderMessage: "أرغب في طلب العرض {code} — {name}",
    notFound: "هذا العرض غير متاح."
  },
  actions: {
    whatsapp: "واتساب",
    call: "اتصل {hotline}",
    order: "اطلب العرض"
  },
  footer: {
    whatsapp: "واتساب {number}",
    hotline: "الخط الساخن {number}",
    nelSite: "موقع معامل النيل مصر"
  },
  nav: {
    allCampaignOffers: "كل العروض",
    switchLocale: "English"
  },
  a11y: {
    mark: "شعار معامل النيل مصر"
  }
};

export type Catalogue = {
  [Group in keyof typeof catalogue]: {
    [Key in keyof (typeof catalogue)[Group]]: string;
  };
};
