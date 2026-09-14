import { ICONS, IconName } from "./icons";

export const Icon: React.FC<{
  name: IconName;
  size?: number;
  color?: string;
}> = ({ name, size = 64, color = "currentColor" }) => (
  <div
    style={{ width: size, height: size, color, display: "inline-block", lineHeight: 0 }}
    dangerouslySetInnerHTML={{ __html: ICONS[name] }}
  />
);
