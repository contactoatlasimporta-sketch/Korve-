import {Config} from '@remotion/cli/config';

// WebGL in headless Chromium: SwiftShader via ANGLE works on GPU-less machines.
// On a workstation with a GPU, switch to 'angle' for much faster renders.
Config.setChromiumOpenGlRenderer('swangle');
Config.setVideoImageFormat('jpeg');
Config.setJpegQuality(95);
Config.setCodec('h264');
Config.setCrf(17);
Config.setPixelFormat('yuv420p');
Config.setOverwriteOutput(true);
Config.setBrowserExecutable(process.env.REMOTION_BROWSER ?? null);
