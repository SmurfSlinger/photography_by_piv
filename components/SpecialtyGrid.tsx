import PhotoCard from "@/components/PhotoCard";
import { specialtyCards } from "@/lib/marketing-content";

export default function SpecialtyGrid() {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {specialtyCards.map((card) => (
        <PhotoCard
          key={card.title}
          src={card.src}
          alt={card.alt}
          title={card.title}
          subtitle={card.subtitle}
          className="h-full"
        />
      ))}
    </div>
  );
}
