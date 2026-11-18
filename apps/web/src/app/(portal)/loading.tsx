import { SkBox, SkeletonArea, SkLine } from "@/components/ui";

/** Übersicht lädt: graue Balken in der Form des Inhalts (BWD-Loading). */
export default function Loading() {
  return (
    <SkeletonArea label="Übersicht wird geladen">
      <div className="hi">
        <SkLine w="45%" size="xl" />
        <SkLine w="25%" />
      </div>
      <div className="g12 home-grid">
        <div className="stack">
          <div className="sk-card h-next" style={{ borderRadius: "var(--r-xxl)" }}>
            <SkLine w="30%" />
            <SkLine w="70%" size="xl" />
            <SkLine w="50%" />
          </div>
          <div className="sk-card h-today">
            <SkLine w="18%" />
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="sk-row">
                <SkLine w="42px" />
                <span>
                  <SkLine w="60%" />
                  <SkLine w="30%" size="s" />
                </span>
              </div>
            ))}
          </div>
        </div>
        <div className="stack">
          <div className="qa h-qa">
            {[1, 2, 3, 4].map((i) => (
              <SkBox key={i} h={96} style={{ borderRadius: "var(--r-xl)", background: "var(--panel)" }} />
            ))}
          </div>
          <div className="sk-card h-abs">
            <SkLine w="40%" />
            <SkLine w="80%" />
            <SkLine w="55%" size="s" />
          </div>
          <div className="sk-card h-gr">
            <SkLine w="35%" />
            <SkLine w="70%" />
            <SkLine w="40%" size="s" />
          </div>
        </div>
      </div>
    </SkeletonArea>
  );
}
