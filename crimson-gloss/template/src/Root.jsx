import { Composition } from 'remotion';
import { Cg } from './Cg';

const demo = { duration: 4, video: null, cutout: null, music: null, headTop: 780, scenes: [] };

export const Root = () => (
  <Composition
    id="Cg"
    component={Cg}
    width={1080}
    height={1920}
    fps={30}
    durationInFrames={30 * demo.duration}
    defaultProps={{ plan: demo }}
    calculateMetadata={({ props }) => ({ durationInFrames: Math.ceil(props.plan.duration * (props.plan.fps ?? 30)), fps: props.plan.fps ?? 30 })}
  />
);
