import { SkeletonArea, SkLine } from "@/components/ui";

export default function Loading() {
  return (
    <SkeletonArea label="Stundenplan wird geladen">
      <div className="ph">
        <h1>Stundenplan</h1>
      </div>
      <div className="sk-card">
        <SkLine w="30%" size="xl" />
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="sk-row">
            <SkLine w="42px" />
            <span className="sk" style={{ height: 44 }} />
          </div>
        ))}
      </div>
    </SkeletonArea>
  );
}
