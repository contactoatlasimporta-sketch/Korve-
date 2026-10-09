import React from 'react';
import {Composition, Still} from 'remotion';
import {Film} from './film/Film';
import {DURATION, FPS} from './director/director';
import {HeroStill, RailMacroStill, TechSheetStill} from './film/Stills';

export const Root: React.FC = () => (
  <>
    <Composition id="KorveArmPro" component={Film} width={1920} height={1080} fps={FPS} durationInFrames={DURATION} defaultProps={{pixelRatio: 1}} />
    <Still id="HeroFrame" component={HeroStill} width={1920} height={1080} />
    <Still id="TechSheetLR" component={TechSheetStill} width={1920} height={1080} />
    <Still id="RailMacro" component={RailMacroStill} width={1920} height={1080} />
  </>
);
