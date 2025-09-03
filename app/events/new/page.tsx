// app/events/new/page.tsx
import { createEvent } from "@/app/actions";
import MapPicker from "../../components/MapPicker";


export default function NewEventPage() {
  return (
    <div className="max-w-2xl mx-auto boho-card p-6">
      <h1 className="boho-h2 mb-4" style={{ fontFamily: "var(--font-serif)" }}>
        Crear evento
      </h1>
      <form action={createEvent} className="space-y-4">
        <div>
          <label>Título *</label>
          <input name="title" placeholder="Boda de Ana & Diego" required />
        </div>
        <div className="form-row">
          <div>
            <label>Fecha *</label>
            <input type="date" name="date" required />
          </div>
          <div>
            <label>Hora *</label>
            <input type="time" name="time" required />
          </div>
        </div>
        <div className="form-row">
          <div>
            <label>Lugar *</label>
            <input
              name="venueName"
              placeholder="Hacienda Los Olivos"
              required
            />
          </div>
          <div>
            <label hidden>Dirección *</label>
            <input
              name="venueAddress"
              placeholder="Camino Viejo 123, Santiago"
              hidden
              required
            />
          </div>
        </div>

        <MapPicker defaultPosition={{ lat: -33.4489, lng: -70.6693 }} addressFieldName="venueAddress"/>

        <div>
          <label>Acompañantes permitidos</label>
          <select name="maxPlusOnesPerGuest" defaultValue="0">
            <option value="0">Sin acompañantes</option>
            <option value="1">Hasta 1</option>
            <option value="2">Hasta 2</option>
            <option value="3">Hasta 3</option>
            <option value="5">Hasta 5</option>
            <option value="">Selección libre (sin límite)</option>
          </select>
          <p className="boho-muted text-sm mt-1">0 = no se permiten acompañantes; vacío = sin límite; valores positivos = máximo permitido.</p>
        </div>
        <div>
          <label>Descripción</label>
          <textarea
            name="description"
            rows={4}
            placeholder="¡Nos casamos! Acompáñanos en..."
          />
        </div>

        <div className="boho-divider">
          <span className="text-xs tracking-widest uppercase boho-muted">Visibilidad</span>
        </div>
        <select name="visibility" defaultValue="PUBLIC">
          <option value="PUBLIC">Público (acceso libre)</option>
          <option value="PRIVATE">Privado (con enlace de invitación)</option>
        </select>


        <div className="boho-divider">
          <span className="text-xs tracking-widest uppercase boho-muted">Estilo & detalles</span>
        </div>

        <div className="form-row">
          <div>
            <label>Dress code</label>
            <input name="dressCode" placeholder="Boho Chic · tonos tierra" />
          </div>
          <div>
            <label>Código de alimentación</label>
            <input name="cateringCode" placeholder="Ej: Menú #A-VEG / Niños #K" />
          </div>
        </div>

        <div className="flex flex-wrap gap-4 items-center">
          <label className="inline-flex items-center gap-2">
            <input type="checkbox" name="hasGiftList" defaultChecked />
            Lista de regalos
          </label>
          <label className="inline-flex items-center gap-2">
            <input type="checkbox" name="openBar" defaultChecked />
            Barra libre
          </label>
          <label className="inline-flex items-center gap-2">
            <input type="checkbox" name="askDietaryRestrictions" />
            Preguntar restricciones alimentarias en RSVP
          </label>
        </div>

        <div className="boho-divider">
          <span className="text-xs tracking-widest uppercase boho-muted">Cronograma (opcional)</span>
        </div>
        <textarea
          name="timeline"
          rows={5}
          placeholder={`
            19:00 | Ceremonia | Jardín principal
            20:00 | Cóctel
            21:00 | Cena
            23:00 | Primer baile
            00:00 | Fiesta
          `}
          className="w-full"
        />
        <p className="boho-muted text-xs mt-1">
          Puedes pegar una lista en líneas “HH:mm | Título | Descripción” o un JSON con items <code>[&#123; time, title, description &#125;]</code>.
        </p>

        <button className="boho-btn" type="submit">
          Guardar
        </button>
      </form>
    </div>
  );
}
