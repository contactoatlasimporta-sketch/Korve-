import React, {useLayoutEffect, useRef, useState} from 'react';
import {continueRender, delayRender} from 'remotion';
import {Stage, StageState} from '../three/stage';
import {fontsReady} from '../fonts';

export const StageCanvas: React.FC<{state: StageState; width: number; height: number; pixelRatio?: number}> = ({
  state,
  width,
  height,
  pixelRatio = 1,
}) => {
  const canvas = useRef<HTMLCanvasElement>(null);
  const stage = useRef<Stage | null>(null);
  const [ready, setReady] = useState(false);
  const [handle] = useState(() => delayRender('fonts + webgl'));

  useLayoutEffect(() => {
    let alive = true;
    fontsReady().then(() => {
      if (!alive) return;
      stage.current = new Stage(canvas.current!, width, height, pixelRatio);
      setReady(true);
    });
    return () => {
      alive = false;
      stage.current?.dispose();
      stage.current = null;
    };
  }, [width, height, pixelRatio]);

  useLayoutEffect(() => {
    if (!ready || !stage.current) return;
    stage.current.render(state);
    continueRender(handle);
  });

  return <canvas ref={canvas} style={{position: 'absolute', inset: 0, width, height}} />;
};
