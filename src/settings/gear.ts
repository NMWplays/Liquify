const GEAR_ID = "liquify-settings-gear-btn";

function getGearSvg() {
  return `
    <svg role="img" viewBox="0 0 24 24" aria-hidden="true" focusable="false"
      fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="butt" stroke-linejoin="miter">
      <path vector-effect="non-scaling-stroke" d="M10.325 4.317c.426 -1.756 2.924 -1.756 3.35 0a1.724 1.724 0 0 0 2.573 1.066c1.543 -.94 3.31 .826 2.37 2.37a1.724 1.724 0 0 0 1.065 2.572c1.756 .426 1.756 2.924 0 3.35a1.724 1.724 0 0 0 -1.066 2.573c.94 1.543 -.826 3.31 -2.37 2.37a1.724 1.724 0 0 0 -2.572 1.065c-.426 1.756 -2.924 1.756 -3.35 0a1.724 1.724 0 0 0 -2.573 -1.066c-1.543 .94 -3.31 -.826 -2.37 -2.37a1.724 1.724 0 0 0 -1.065 -2.572c-1.756 -.426 -1.756 -2.924 0 -3.35a1.724 1.724 0 0 0 1.066 -2.573c-.94 -1.543 .826 -3.31 2.37 -2.37c1 .608 2.296 .07 2.572 -1.065" />
      <path vector-effect="non-scaling-stroke" d="M9 12a3 3 0 1 0 6 0a3 3 0 0 0 -6 0" />
    </svg>
  `;
}

let gearButton: any = null;

export function initLiquifyGearInjection(t: any) {
  if (gearButton) return;
  try {
    gearButton = SpotiKit.Topbar.add({
      label: t.settingsTitle || "Liquify Settings",
      icon: getGearSvg(),
      side: "right",
      onClick: () => {
        if (typeof (window as any).showLiquifySettingsMenu === "function") (window as any).showLiquifySettingsMenu();
      },
    });
    gearButton.element.id = GEAR_ID;
    console.info("[Liquify] Settings button successfully loaded.");
  } catch (e) {
    console.error("[Liquify] Settings button failed to load:", e);
  }
}
