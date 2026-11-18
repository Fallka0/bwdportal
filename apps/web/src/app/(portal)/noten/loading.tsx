import { SkeletonArea, SkLine } from "@/components/ui";

export default function Loading() {
  return (
    <SkeletonArea label="Noten werden geladen">
      <div className="ph">
        <h1>Noten</h1>
      </div>
      <div className="kpis">
        {[1, 2, 3].map((i) => (
          <div key={i} className="sk-card">
            <SkLine w="40%" size="s" />
            <SkLine w="30%" size="xl" />
          </div>
        ))}
      </div>
      <div className="sk-card">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="sk-row">
            <span className="sk" style={{ height: 44 }} />
            <span>
              <SkLine w="40%" />
              <SkLine w="25%" size="s" />
            </span>
          </div>
        ))}
      </div>
    </SkeletonArea>
  );
}
