import React, {useMemo} from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {StageCanvas} from '../components/StageCanvas';
import {stageAt} from '../director/director';
import {Backdrop, Hud, Overlays} from './Overlays';

export const Film: React.FC<{pixelRatio?: number}> = ({pixelRatio = 1}) => {
  const f = useCurrentFrame();
  const {width, height} = useVideoConfig();
  const state = useMemo(() => stageAt(f), [f]);
  return (
    <AbsoluteFill style={{background: '#060708', overflow: 'hidden'}}>
      <Backdrop f={f} state={state} />
      <StageCanvas state={state} width={width} height={height} pixelRatio={pixelRatio} />
      <Overlays f={f} state={state} />
      <Hud f={f} />
    </AbsoluteFill>
  );
};
