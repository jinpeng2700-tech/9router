import CodexCatalogClient from "./CodexCatalogClient";

export const metadata = {
  title: "Codex Catalog | 9Router",
  description: "Customize which models appear in OpenAI Codex Desktop App and CLI",
};

export default function CodexCatalogPage() {
  return <CodexCatalogClient />;
}
