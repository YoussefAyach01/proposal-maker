"use client";
import dynamic from "next/dynamic";

// Studio reads localStorage, so it only renders in the browser.
const Studio = dynamic(() => import("./Studio"), {
  ssr: false,
  loading: () => <p className="p-6">Loading…</p>,
});

export default function StudioLoader() {
  return <Studio />;
}
