import Link from "next/link"
import { Footer } from "@/components/Footer"

const LAST_UPDATED = "12 de junio de 2026"

export const metadata = {
  title: "Términos de Uso — Surqo",
  description: "Términos y condiciones de uso de la plataforma Surqo.",
}

export default function TerminosPage() {
  return (
    <div className="min-h-screen bg-surqo-bg">
      <div className="max-w-3xl mx-auto px-4 pt-28 pb-16">

        {/* Header */}
        <div className="mb-12">
          <p className="text-xs font-bold tracking-[0.2em] uppercase text-surqo-green-bright mb-3">Legal</p>
          <h1 className="text-4xl font-black tracking-tight text-surqo-text mb-3">Términos de Uso</h1>
          <p className="text-sm text-surqo-text-muted font-medium">Última actualización: {LAST_UPDATED}</p>
        </div>

        {/* Content */}
        <div className="space-y-10 text-surqo-text-secondary text-sm font-medium leading-relaxed">

          <Section title="1. Aceptación de los términos">
            <p>
              Al crear una cuenta o usar la plataforma Surqo, aceptas estos Términos de Uso en su totalidad. Si no estás de acuerdo con alguno de los términos, no debes usar el servicio.
            </p>
          </Section>

          <Section title="2. Descripción del servicio">
            <p>
              Surqo es una plataforma de inteligencia agroclimática que permite a los usuarios:
            </p>
            <ul>
              <li>Conectar dispositivos IoT (ESP32 y sensores) para monitorear condiciones de suelo y clima en fincas.</li>
              <li>Recibir análisis agronómicos generados por inteligencia artificial.</li>
              <li>Configurar alertas automáticas por condiciones críticas en el cultivo.</li>
              <li>Visualizar datos históricos y en tiempo real desde un dashboard web.</li>
            </ul>
            <p>
              Surqo está en fase de desarrollo activo. Las funciones pueden cambiar sin previo aviso.
            </p>
          </Section>

          <Section title="3. Registro y cuenta">
            <ul>
              <li>Debes proporcionar un correo electrónico válido para crear una cuenta.</li>
              <li>Eres responsable de mantener la confidencialidad de tus credenciales.</li>
              <li>Debes notificarnos inmediatamente si sospechas acceso no autorizado a tu cuenta.</li>
              <li>Una cuenta es de uso personal; no puede ser compartida con terceros.</li>
              <li>Surqo se reserva el derecho de suspender cuentas que infrinjan estos términos.</li>
            </ul>
          </Section>

          <Section title="4. Plan gratuito y limitaciones">
            <p>
              El plan gratuito de Surqo incluye 1 finca, análisis de IA ilimitados y alertas por correo. Nos reservamos el derecho de modificar las limitaciones del plan gratuito con un aviso previo de al menos 30 días por correo electrónico.
            </p>
          </Section>

          <Section title="5. Uso aceptable">
            <p>Al usar Surqo te comprometes a <strong>no</strong>:</p>
            <ul>
              <li>Usar el servicio para fines ilegales o no autorizados.</li>
              <li>Intentar acceder a datos de otros usuarios o fincas.</li>
              <li>Sobrecargar la infraestructura con solicitudes automatizadas masivas (scraping, DoS).</li>
              <li>Publicar datos falsos de sensores para manipular el sistema de alertas.</li>
              <li>Revender o sublicenciar el acceso a la plataforma.</li>
            </ul>
          </Section>

          <Section title="6. Propiedad intelectual">
            <p>
              Surqo y todo su contenido (código, diseño, logotipos, textos) son propiedad de Ricardo Martínez. El código del firmware ESP32 y las partes de código abierto se rigen por sus respectivas licencias.
            </p>
            <p>
              Los <strong>datos de tu finca y tus sensores son tuyos</strong>. Surqo no reclama propiedad sobre ellos. Al usar el servicio nos otorgas una licencia limitada para procesar esos datos y proveerte el servicio.
            </p>
          </Section>

          <Section title="7. Disponibilidad del servicio">
            <p>
              Surqo se provee &quot;tal como está&quot; y &quot;según disponibilidad&quot;. No garantizamos disponibilidad ininterrumpida del servicio. Podemos realizar mantenimientos programados, que anunciaremos con anticipación cuando sea posible.
            </p>
            <p>
              La plataforma depende de servicios de terceros (Supabase, Fly.io, Groq, HiveMQ). Las interrupciones de estos proveedores pueden afectar el servicio sin responsabilidad de nuestra parte.
            </p>
          </Section>

          <Section title="8. Limitación de responsabilidad">
            <p>
              Surqo provee recomendaciones agronómicas como <strong>apoyo a la toma de decisiones</strong>, no como sustituto del criterio profesional de un agrónomo certificado. Las decisiones de riego, fertilización y manejo de cultivos son responsabilidad exclusiva del usuario.
            </p>
            <p>
              En ningún caso Surqo será responsable por pérdidas de cosecha, daños al cultivo u otras pérdidas económicas derivadas del uso o no uso de las recomendaciones del sistema.
            </p>
            <p>
              La responsabilidad máxima de Surqo ante cualquier reclamación estará limitada al valor pagado por el servicio en los últimos 3 meses (que en el plan gratuito es $0).
            </p>
          </Section>

          <Section title="9. Privacidad">
            <p>
              El uso de tu información personal se rige por nuestra{" "}
              <Link href="/privacidad" className="text-surqo-green-bright hover:underline">
                Política de Privacidad
              </Link>
              , que forma parte integral de estos términos.
            </p>
          </Section>

          <Section title="10. Terminación">
            <p>
              Puedes cerrar tu cuenta en cualquier momento escribiendo a <a href="mailto:hola@surqo.co" className="text-surqo-green-bright hover:underline">hola@surqo.co</a>. Surqo puede suspender o terminar tu acceso si violas estos términos, con o sin previo aviso según la gravedad de la infracción.
            </p>
          </Section>

          <Section title="11. Ley aplicable">
            <p>
              Estos términos se rigen por las leyes de la República de Colombia. Cualquier disputa se resolverá en los tribunales competentes de Montería, Córdoba, Colombia.
            </p>
          </Section>

          <Section title="12. Cambios a estos términos">
            <p>
              Podemos actualizar estos términos. Te notificaremos por correo con al menos 15 días de anticipación ante cambios materiales. El uso continuado del servicio después de esa fecha constituye aceptación de los nuevos términos.
            </p>
          </Section>

          <Section title="13. Contacto">
            <p>
              Para cualquier pregunta sobre estos términos escríbenos a{" "}
              <a href="mailto:hola@surqo.co" className="text-surqo-green-bright hover:underline">hola@surqo.co</a>.
            </p>
          </Section>

        </div>

        <div className="mt-12 pt-8 border-t border-white/[0.06] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <Link href="/" className="text-sm text-surqo-green-bright font-bold hover:underline">
            ← Volver al inicio
          </Link>
          <Link href="/privacidad" className="text-sm text-surqo-text-secondary font-medium hover:text-surqo-green transition-colors">
            Política de Privacidad →
          </Link>
        </div>
      </div>

      <Footer />
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-base font-black text-surqo-text mb-3">{title}</h2>
      <div className="space-y-3 [&_strong]:text-surqo-text [&_a]:text-surqo-green-bright [&_ul]:list-disc [&_ul]:ml-5 [&_ul]:space-y-2">
        {children}
      </div>
    </div>
  )
}
