import Link from "next/link"
import { Zap, Mail, Github, MapPin } from "lucide-react"

const PRODUCT_LINKS = [
  { href: "/precios", label: "Precios" },
  { href: "/register", label: "Crear cuenta gratis" },
  { href: "/login", label: "Iniciar sesión" },
]

const LEGAL_LINKS = [
  { href: "/privacidad", label: "Política de privacidad" },
  { href: "/terminos", label: "Términos de uso" },
]

const PLATFORM_LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/analyze", label: "Análisis IA" },
  { href: "/alerts", label: "Alertas" },
  { href: "/sensors", label: "Sensores" },
  { href: "/farms", label: "Fincas" },
]

export function Footer() {
  return (
    <footer className="border-t border-white/[0.06] bg-black/20 backdrop-blur-sm">
      <div className="max-w-6xl mx-auto px-4 pt-16 pb-10">

        {/* Top grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-14">

          {/* Brand column */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <Zap className="w-5 h-5 text-surqo-green" />
              <span className="text-lg font-black tracking-tighter text-gradient">SURQO</span>
            </Link>
            <p className="text-sm text-surqo-text-muted font-medium leading-relaxed mb-5">
              Inteligencia agroclimática para el campo colombiano. IoT + IA al servicio del agricultor.
            </p>
            <div className="flex items-center gap-1.5 text-xs text-surqo-text-muted font-medium">
              <MapPin className="w-3.5 h-3.5 text-surqo-green shrink-0" />
              Montería, Córdoba · Colombia
            </div>
          </div>

          {/* Product */}
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.15em] text-surqo-text-muted mb-5">
              Producto
            </p>
            <ul className="space-y-3">
              {PRODUCT_LINKS.map(({ href, label }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="text-sm text-surqo-text-secondary font-medium hover:text-surqo-green transition-colors"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Platform */}
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.15em] text-surqo-text-muted mb-5">
              Plataforma
            </p>
            <ul className="space-y-3">
              {PLATFORM_LINKS.map(({ href, label }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="text-sm text-surqo-text-secondary font-medium hover:text-surqo-green transition-colors"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal + Contact */}
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.15em] text-surqo-text-muted mb-5">
              Legal
            </p>
            <ul className="space-y-3 mb-8">
              {LEGAL_LINKS.map(({ href, label }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="text-sm text-surqo-text-secondary font-medium hover:text-surqo-green transition-colors"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>

            <p className="text-xs font-bold uppercase tracking-[0.15em] text-surqo-text-muted mb-4">
              Contacto
            </p>
            <a
              href="mailto:hola@surqo.co"
              className="flex items-center gap-2 text-sm text-surqo-text-secondary font-medium hover:text-surqo-green transition-colors"
            >
              <Mail className="w-3.5 h-3.5" />
              hola@surqo.co
            </a>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-white/[0.06] pt-7 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-surqo-text-muted font-medium text-center md:text-left">
            © {new Date().getFullYear()} Surqo SAS · NIT en trámite · Todos los derechos reservados
          </p>
          <div className="flex items-center gap-5">
            <a
              href="https://github.com/ricardomb-tech/surqo"
              target="_blank"
              rel="noopener noreferrer"
              className="text-surqo-text-muted hover:text-surqo-green transition-colors"
              aria-label="GitHub"
            >
              <Github className="w-4 h-4" />
            </a>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-surqo-green animate-pulse" />
              <span className="text-xs text-surqo-green-bright font-bold">Sistema operativo</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
