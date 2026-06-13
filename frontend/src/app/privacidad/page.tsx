import Link from "next/link"
import { Footer } from "@/components/Footer"

const LAST_UPDATED = "12 de junio de 2026"

export const metadata = {
  title: "Política de Privacidad — Surqo",
  description: "Conoce cómo Surqo recopila, usa y protege tus datos personales.",
}

export default function PrivacidadPage() {
  return (
    <div className="min-h-screen bg-surqo-bg">
      <div className="max-w-3xl mx-auto px-4 pt-28 pb-16">

        {/* Header */}
        <div className="mb-12">
          <p className="text-xs font-bold tracking-[0.2em] uppercase text-surqo-green-bright mb-3">Legal</p>
          <h1 className="text-4xl font-black tracking-tight text-surqo-text mb-3">Política de Privacidad</h1>
          <p className="text-sm text-surqo-text-muted font-medium">Última actualización: {LAST_UPDATED}</p>
        </div>

        {/* Content */}
        <div className="prose-surqo space-y-10 text-surqo-text-secondary text-sm font-medium leading-relaxed">

          <Section title="1. Quiénes somos">
            <p>
              Surqo (&quot;nosotros&quot;, &quot;nuestro&quot; o &quot;la plataforma&quot;) es una plataforma de inteligencia agroclimática para el campo colombiano, desarrollada por Ricardo Martínez. Operamos desde Montería, Córdoba, Colombia. Puedes contactarnos en <a href="mailto:hola@surqo.co" className="text-surqo-green-bright hover:underline">hola@surqo.co</a>.
            </p>
          </Section>

          <Section title="2. Información que recopilamos">
            <p>Recopilamos la siguiente información cuando usas Surqo:</p>
            <ul>
              <li><strong>Datos de cuenta:</strong> dirección de correo electrónico y contraseña cifrada (gestionada por Supabase Auth).</li>
              <li><strong>Datos de finca:</strong> nombre, ubicación geográfica (latitud/longitud), tipo de cultivo, área en hectáreas y altitud.</li>
              <li><strong>Datos de sensores:</strong> lecturas de temperatura, humedad de suelo, humedad del aire, índice UV, batería y señal RSSI enviadas por tu dispositivo ESP32.</li>
              <li><strong>Datos de uso:</strong> análisis de IA solicitados, alertas generadas y sesiones de conexión.</li>
              <li><strong>Datos técnicos:</strong> dirección IP, tipo de navegador y sistema operativo (para seguridad y diagnóstico).</li>
            </ul>
          </Section>

          <Section title="3. Cómo usamos tu información">
            <p>Usamos tu información exclusivamente para:</p>
            <ul>
              <li>Proveerte el servicio de monitoreo y análisis agronómico.</li>
              <li>Generar alertas automáticas cuando se detectan condiciones críticas en tu finca.</li>
              <li>Mejorar los modelos de recomendación agrícola de la plataforma.</li>
              <li>Enviarte correos de alerta y notificaciones del sistema (no publicidad).</li>
              <li>Garantizar la seguridad y estabilidad del servicio.</li>
            </ul>
            <p>
              <strong>Nunca vendemos, alquilamos ni compartimos tus datos personales con terceros con fines comerciales.</strong>
            </p>
          </Section>

          <Section title="4. Proveedores de servicios (subprocesadores)">
            <p>Para operar, Surqo utiliza los siguientes servicios de confianza:</p>
            <ul>
              <li><strong>Supabase</strong> — autenticación de usuarios y base de datos PostgreSQL.</li>
              <li><strong>Fly.io</strong> — infraestructura del servidor backend (FastAPI).</li>
              <li><strong>Vercel</strong> — alojamiento del frontend (Next.js).</li>
              <li><strong>Groq / Meta (Llama 3.3 70B)</strong> — procesamiento de análisis de IA. Los datos enviados al modelo incluyen el nombre de tu finca, cultivo y métricas climáticas. No incluyen datos personales identificables.</li>
              <li><strong>HiveMQ Cloud</strong> — broker MQTT para comunicación con sensores IoT.</li>
              <li><strong>Open-Meteo</strong> — pronóstico climático. Solo se envía la latitud/longitud de tu finca.</li>
            </ul>
          </Section>

          <Section title="5. Seguridad de tus datos">
            <ul>
              <li>Toda comunicación usa HTTPS/TLS.</li>
              <li>La conexión MQTT entre el sensor y el servidor usa TLS en el puerto 8883.</li>
              <li>Las contraseñas nunca se almacenan en texto plano; Supabase usa bcrypt.</li>
              <li>Los tokens de sesión JWT tienen caducidad configurada y se invalidan al cerrar sesión.</li>
              <li>El acceso a la base de datos está restringido por Row Level Security (RLS) — cada usuario solo puede ver sus propios datos.</li>
            </ul>
          </Section>

          <Section title="6. Retención de datos">
            <p>
              Conservamos tus datos mientras tu cuenta esté activa. Si eliminas tu cuenta, eliminamos tus datos personales en un plazo máximo de 30 días, excepto los que tengamos obligación legal de conservar.
            </p>
            <p>
              Las lecturas de sensores se conservan indefinidamente para garantizar el historial agronómico, pero puedes solicitar su eliminación escribiendo a <a href="mailto:hola@surqo.co" className="text-surqo-green-bright hover:underline">hola@surqo.co</a>.
            </p>
          </Section>

          <Section title="7. Tus derechos">
            <p>Como usuario tienes derecho a:</p>
            <ul>
              <li><strong>Acceso:</strong> solicitar una copia de los datos que tenemos sobre ti.</li>
              <li><strong>Rectificación:</strong> corregir datos inexactos.</li>
              <li><strong>Eliminación:</strong> solicitar la eliminación de tu cuenta y datos.</li>
              <li><strong>Portabilidad:</strong> exportar tus datos en formato CSV.</li>
              <li><strong>Oposición:</strong> oponerte al procesamiento de tus datos en cualquier momento.</li>
            </ul>
            <p>
              Para ejercer cualquiera de estos derechos escríbenos a <a href="mailto:hola@surqo.co" className="text-surqo-green-bright hover:underline">hola@surqo.co</a> con el asunto &quot;Solicitud de privacidad&quot;. Responderemos en máximo 15 días hábiles.
            </p>
          </Section>

          <Section title="8. Cookies y rastreo">
            <p>
              Surqo utiliza únicamente las cookies estrictamente necesarias para mantener tu sesión iniciada (cookie de Supabase Auth). No utilizamos cookies de rastreo publicitario, Google Analytics ni ningún pixel de terceros.
            </p>
          </Section>

          <Section title="9. Menores de edad">
            <p>
              Surqo no está dirigido a menores de 18 años. Si eres padre o tutor y crees que tu hijo ha creado una cuenta, contáctanos para eliminarla.
            </p>
          </Section>

          <Section title="10. Cambios a esta política">
            <p>
              Podemos actualizar esta política ocasionalmente. Te notificaremos por correo si los cambios son materiales. La fecha de última actualización siempre aparece en la parte superior.
            </p>
          </Section>

          <Section title="11. Contacto">
            <p>
              Para cualquier duda relacionada con privacidad escríbenos a{" "}
              <a href="mailto:hola@surqo.co" className="text-surqo-green-bright hover:underline">hola@surqo.co</a>.
            </p>
          </Section>

        </div>

        <div className="mt-12 pt-8 border-t border-white/[0.06]">
          <Link href="/" className="text-sm text-surqo-green-bright font-bold hover:underline">
            ← Volver al inicio
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
