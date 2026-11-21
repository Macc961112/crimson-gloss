import { Composition } from 'remotion';
import { Cg, FPS } from './Cg';

const demo = { duration: 4, video: null, cutout: null, music: null, headTop: 780, scenes: [] };

export const Root = () => (
  <Composition
    id="Cg"
    component={Cg}
    width={1080}
    height={1920}
    fps={FPS}
    durationInFrames={FPS * demo.duration}
    defaultProps={{ plan: demo }}
    calculateMetadata={({ props }) => ({ durationInFrames: Math.ceil(props.plan.duration * FPS) })}
  />
);
