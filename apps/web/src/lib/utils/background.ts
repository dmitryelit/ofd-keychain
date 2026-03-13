import type { CSSProperties } from "react";
import { getViewportBackgroundBaseColor, type ViewportBackground } from "@ofd-keychain/scene-core";

function clamp(value: number) {
  return Math.max(0, Math.min(255, value));
}

function parseHex(hexColor: string) {
  const normalized = hexColor.replace("#", "");
  const expanded = normalized.length === 3 ? normalized.split("").map((char) => char + char).join("") : normalized;

  if (!/^[\da-fA-F]{6}$/.test(expanded)) {
    return { r: 6, g: 6, b: 6 };
  }

  return {
    r: Number.parseInt(expanded.slice(0, 2), 16),
    g: Number.parseInt(expanded.slice(2, 4), 16),
    b: Number.parseInt(expanded.slice(4, 6), 16)
  };
}

function toHexChannel(value: number) {
  return clamp(Math.round(value)).toString(16).padStart(2, "0");
}

function mixHexColors(first: string, second: string, ratio: number) {
  const left = parseHex(first);
  const right = parseHex(second);
  const weight = Math.max(0, Math.min(1, ratio));

  return `#${toHexChannel(left.r + (right.r - left.r) * weight)}${toHexChannel(left.g + (right.g - left.g) * weight)}${toHexChannel(left.b + (right.b - left.b) * weight)}`;
}

export function createStageBackgroundStyle(background: ViewportBackground): CSSProperties {
  if (background.mode === "transparent") {
    return {
      backgroundColor: "transparent",
      backgroundImage: "none"
    };
  }

  if (background.mode === "solid") {
    return {
      backgroundColor: background.color,
      backgroundImage: "none"
    };
  }

  const middleColor = mixHexColors(background.topColor, background.bottomColor, 0.55);

  return {
    backgroundColor: getViewportBackgroundBaseColor(background),
    backgroundImage: [
      `radial-gradient(circle at 50% 76%, ${background.bottomColor} 0%, rgba(132, 214, 187, 0) 52%)`,
      `linear-gradient(180deg, ${background.topColor} 8%, ${middleColor} 56%, ${background.bottomColor} 100%)`
    ].join(", ")
  };
}
