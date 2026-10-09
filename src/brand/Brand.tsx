import { Isotipo } from "./Isotipo";
import { Wordmark } from "./Wordmark";

/** Isotipo y wordmark en una línea. El isotipo es decorativo: el nombre lo dice el wordmark. */
export function Brand({ className = "" }: { className?: string }) {
  return (
    <span className={`flex items-center gap-3 ${className}`}>
      <Isotipo size={22} />
      <Wordmark className="text-[13px] font-medium text-crema" />
    </span>
  );
}
