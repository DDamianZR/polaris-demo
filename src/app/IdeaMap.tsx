import { UI } from "../copy/es";
import { ideaNeurons } from "../demo/selectors";
import { SynapseField } from "../synapse/SynapseField";
import { useDemo } from "./DemoContext";

type Props = {
  variant: "full" | "compact";
  /** Muestra el conteo debajo del cerebro. */
  withStats?: boolean;
  className?: string;
};

/** El cerebro con las ideas de la demo y, si cabe, el conteo de sueltas y conectadas. */
export function IdeaMap({ variant, withStats = false, className = "" }: Props) {
  const { session } = useDemo();
  const { neurons, counts } = ideaNeurons(session.demo);

  return (
    <figure className={`flex min-h-0 flex-col ${className}`}>
      <div className="relative min-h-0 flex-1">
        <SynapseField
          neurons={neurons}
          fresh={session.fresh}
          minute={Math.floor(session.now)}
          variant={variant}
          className="absolute inset-0"
        />
      </div>
      <figcaption
        className={withStats ? "etiqueta flex flex-wrap gap-x-3 gap-y-1 text-niebla" : "sr-only"}
      >
        <span className="sr-only">
          {UI.brain.describe(counts.ideas, counts.conectadas, counts.sueltas)}
        </span>
        <span aria-hidden="true">
          <span className="cifras text-crema">{counts.ideas}</span> {UI.brain.ideas}
        </span>
        <span aria-hidden="true" className="inline-flex items-center gap-2">
          <span className="size-1.5 rounded-full bg-crema" />
          <span className="cifras text-crema">{counts.conectadas}</span> {UI.brain.connected}
        </span>
        <span aria-hidden="true" className="inline-flex items-center gap-2">
          <span className="size-2 rounded-full border border-chispa" />
          <span className="cifras text-crema">{counts.sueltas}</span> {UI.brain.loose}
        </span>
      </figcaption>
    </figure>
  );
}
