import { BrandReview } from "./review/BrandReview";
import { Tokens } from "./review/Tokens";

/** D0: solo la hoja de revisión de marca. La demo llega en D2. */
export function App() {
  return (
    <main className="mx-auto flex max-w-[1100px] flex-col gap-24 px-4 py-12 md:px-8 md:py-16">
      <BrandReview />
      <Tokens />
    </main>
  );
}
