import Image from "next/image";

export default function Home() {
  return (
    <main style={{ height:"100vh", display:"grid", placeItems:"center", background:"#f7f7ff" }}>
      <a href="/widget" style={{ textDecoration:"underline" }}>Open Queenie Bot Widget</a>
    </main>
  );
}
