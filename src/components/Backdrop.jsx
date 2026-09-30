// Soft colour orbs fixed behind the page. They give the frosted-glass
// surfaces something to blur and tint; purely decorative.
export default function Backdrop() {
  return (
    <div className="backdrop" aria-hidden="true">
      <span className="orb orb--indigo" />
      <span className="orb orb--cyan" />
      <span className="orb orb--violet" />
      <span className="orb orb--amber" />
    </div>
  )
}
