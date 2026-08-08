import { useLanguage } from '../../i18n';
import { HEADLINE_GRADIENT, PERSONA_GRADIENTS, PERSONA_ICONS, isPersonaId } from './cardStyles';
import type { PersonaCardData } from '../../pages/buildStoryCards';

const MAX_PERSONAS = 4;

interface SummaryCardProps {
  personas: PersonaCardData[];
}

export function SummaryCard({ personas }: SummaryCardProps) {
  const { dictionary } = useLanguage();
  const topPersonas = personas.slice(0, MAX_PERSONAS);

  return (
    <div
      className={`flex h-[640px] w-[360px] flex-col items-center justify-between bg-gradient-to-br ${HEADLINE_GRADIENT} p-8 text-center text-white`}
    >
      <div>
        <p className="text-sm font-semibold uppercase tracking-widest text-white/80">{dictionary.app.title}</p>
        <p className="mt-1 text-xs text-white/70">{dictionary.app.tagline}</p>
      </div>

      <div className="w-full space-y-3">
        {topPersonas.map((persona) => {
          const gradient = isPersonaId(persona.id) ? PERSONA_GRADIENTS[persona.id] : HEADLINE_GRADIENT;
          const icon = isPersonaId(persona.id) ? PERSONA_ICONS[persona.id] : '✨';

          return (
            <div
              key={persona.id}
              className={`flex items-center gap-3 rounded-2xl bg-gradient-to-r ${gradient} p-3 text-start`}
            >
              <span className="text-2xl">{icon}</span>
              <p className="text-sm font-bold leading-snug">{persona.text}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
