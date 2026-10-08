import { Isotipo } from "./Isotipo";

type Props = {
  size?: number;
  /** Lo que está cargando, para lectores de pantalla. */
  label?: string;
};

/**
 * Loading de docs/ux.md: el anillo gira y la estrella se queda quieta.
 * "El mundo se mueve. El centro permanece." Con reduced motion, el anillo no gira.
 */
export function Loader({ size = 32, label = "Cargando" }: Props) {
  return (
    <span role="status" className="inline-flex">
      <Isotipo
        size={size}
        ringClassName="origin-center [transform-box:fill-box] animate-[spin_2.4s_linear_infinite] motion-reduce:animate-none"
      />
      <span className="sr-only">{label}</span>
    </span>
  );
}
