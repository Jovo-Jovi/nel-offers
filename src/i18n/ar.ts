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
  },
  operator: {
    signInHeading: "دخول المشغّل",
    emailLabel: "البريد",
    passwordLabel: "كلمة المرور",
    submit: "دخول",
    signInError: "البريد أو كلمة المرور غير صحيحة.",
    recovery: "استعادة الدخول يقوم بها صاحب المشروع.",
    enrolHeading: "تفعيل رمز التحقق",
    verifyHeading: "رمز التحقق",
    enrolLead: "امسح الرمز أو أدخل السر، ثم اكتب رمزًا من ستة أرقام.",
    verifyLead: "اكتب رمزًا من ستة أرقام.",
    secretLabel: "السر",
    codeLabel: "الرمز",
    verify: "تحقق",
    totpError: "الرمز غير صحيح.",
    overviewHeading: "نظرة عامة",
    signedIn: "المشغّل مسجّل الدخول.",
    signOut: "خروج",
    qrAlt: "رمز التحقق"
  }
};

export type Catalogue = {
  [Group in keyof typeof catalogue]: {
    [Key in keyof (typeof catalogue)[Group]]: string;
  };
};
