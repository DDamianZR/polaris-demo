type Props = {
  className?: string;
};

/**
 * Wordmark con Inter (la única familia). La A del logo no tiene travesaño; la Λ de Inter es
 * esa misma forma. Los lectores de pantalla leen "Polaris", no las letras sueltas.
 */
export function Wordmark({ className = "" }: Props) {
  return (
    <span className={`font-normal tracking-[0.32em] ${className}`}>
      <span aria-hidden="true">POLΛRIS</span>
      <span className="sr-only">Polaris</span>
    </span>
  );
}
