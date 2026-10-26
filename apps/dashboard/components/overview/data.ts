/*
 * App links for the overview KPI row. Static: "#" = link not set yet.
 */

export const kpis = [
  {
    id: "monitoring",
    label: "Ramus Daily Monitoring",
    href: "#",
    domain: "",
    tone: "dark",
  },
  {
    id: "openvpn",
    label: "Ramus OpenVPN (UDP)",
    href: "#",
    domain: "",
    tone: "brand",
  },
  {
    id: "thingsboard",
    label: "Ramus Thingsboard",
    href: "#",
    domain: "",
    tone: "muted",
  },
  { id: "emqx", label: "Ramus EMQX", href: "#", domain: "", tone: "default" },
  {
    id: "ramus",
    label: "Aplikasi Ramus",
    href: "https://app.ramus.id",
    domain: "app.ramus.id",
    tone: "dark",
  },
  {
    id: "ramus-asia",
    label: "Aplikasi Ramus Asia",
    href: "https://app.ramus.asia",
    domain: "app.ramus.asia",
    tone: "brand",
  },
  {
    id: "pinisi",
    label: "Aplikasi Pinisi",
    href: "https://pinisi.telkomsat.co.id",
    domain: "pinisi.telkomsat.co.id",
    tone: "muted",
  },
  {
    id: "bki",
    label: "Aplikasi BKI",
    href: "https://bki.ramus.asia",
    domain: "bki.ramus.asia",
    tone: "default",
  },
] as const;
