import { NextResponse } from "next/server";
import { getCodexCatalogConfig, setCodexCatalogConfig, resetCodexCatalogConfig } from "@/lib/localDb";
import { buildModelsList } from "@/app/api/v1/models/route.js";
import { getAvailableCodexCandidates } from "open-sse/services/codexModels.js";

export const dynamic = "force-dynamic";

// GET /api/cli-tools/codex-settings/catalog
export async function GET() {
  try {
    const config = await getCodexCatalogConfig();
    const allModels = await buildModelsList(["llm"]);
    const { candidates, recommendedIds } = getAvailableCodexCandidates(allModels);

    return NextResponse.json({
      mode: config.mode || "auto",
      selectedModelIds: config.selectedModelIds || [],
      customDisplayNames: config.customDisplayNames || {},
      candidates,
      recommendedIds,
    });
  } catch (error) {
    console.log("Error fetching codex catalog config:", error);
    return NextResponse.json(
      { error: "Failed to fetch codex catalog configuration" },
      { status: 500 }
    );
  }
}

// POST /api/cli-tools/codex-settings/catalog
export async function POST(request) {
  try {
    const body = await request.json();
    const { mode, selectedModelIds, customDisplayNames } = body || {};

    const updated = await setCodexCatalogConfig({
      mode: mode === "custom" ? "custom" : "auto",
      selectedModelIds: Array.isArray(selectedModelIds) ? selectedModelIds : [],
      customDisplayNames: customDisplayNames && typeof customDisplayNames === "object" ? customDisplayNames : {},
    });

    return NextResponse.json({
      success: true,
      config: updated,
    });
  } catch (error) {
    console.log("Error saving codex catalog config:", error);
    return NextResponse.json(
      { error: "Failed to save codex catalog configuration" },
      { status: 500 }
    );
  }
}

// DELETE /api/cli-tools/codex-settings/catalog
export async function DELETE() {
  try {
    const config = await resetCodexCatalogConfig();
    return NextResponse.json({
      success: true,
      config,
    });
  } catch (error) {
    console.log("Error resetting codex catalog config:", error);
    return NextResponse.json(
      { error: "Failed to reset codex catalog configuration" },
      { status: 500 }
    );
  }
}
