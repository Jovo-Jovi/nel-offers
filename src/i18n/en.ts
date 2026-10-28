// DESIGN_SYSTEM.md §9 — English column, verbatim. Shape follows the Arabic catalogue.
import type { Catalogue } from "./ar";

export const catalogue: Catalogue = {
  site: {
    name: "Nile Egypt Labs",
    campaignTitle: "Opening offers"
  },
  home: {
    heading: "Analysis offers",
    intro: "Choose an analysis to see its details, price, offer period and how to order.",
    searchPlaceholder: "Search by analysis name…",
    noMatches: "No analysis matches your search.",
    nothingVisible: "No offers are available today.",
    comingSoon: "Offers will be available soon.",
    viewDetails: "View details"
  },
  campaignOffer: {
    pageHeading: "Offer details — code {code}",
    codeLabel: "Offer code",
    priceLabel: "Offer price",
    currency: "EGP",
    endsOn: "Offer ends on {end}",
    validFromTo: "Offer runs from {start} to {end}",
    conditionsHeading: "Offer conditions",
    galleryAlt: "Image {position} — {name}",
    orderMessage: "I would like to order offer {code} — {name}",
    notFound: "This offer is not available."
  },
  actions: {
    whatsapp: "WhatsApp",
    call: "Call {hotline}",
    order: "Order this offer"
  },
  footer: {
    whatsapp: "WhatsApp {number}",
    hotline: "Hotline {number}",
    nelSite: "Nile Egypt Labs website"
  },
  nav: {
    allCampaignOffers: "All offers",
    switchLocale: "العربية"
  },
  a11y: {
    mark: "Nile Egypt Labs logo"
  }
};
