import "./index.css";
import { Composition } from "remotion";
import { TinDungVideo, TOTAL_DURATION } from "./TinDungVideo";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="TinDungLaGi"
        component={TinDungVideo}
        durationInFrames={TOTAL_DURATION}
        fps={30}
        width={1080}
        height={1920}
      />
    </>
  );
};
