import { useEffect, useRef } from 'react';

const VERT = `attribute vec4 a_position; void main(){ gl_Position = a_position; }`;

const FRAG = `
precision mediump float;
uniform float u_time;
uniform vec2  u_resolution;
uniform float u_pixel;

/* ── 1-D smooth noise (drives speech amplitude envelope) ─────────── */
float h1(float x){ return fract(sin(x*127.1)*43758.545); }
float sn(float x){
  float i=floor(x), f=fract(x);
  f=f*f*(3.0-2.0*f);
  return mix(h1(i), h1(i+1.0), f);
}

/* ── Speech envelope: slow bursts that feel like words/syllables ─── */
float speechEnv(float x, float t){
  float a = sn(x*1.10 + t*0.18)*0.38
           + sn(x*2.80 - t*0.14)*0.26
           + sn(x*6.50 + t*0.30)*0.22
           + sn(x*13.0 - t*0.09)*0.14;
  return pow(clamp(a, 0.0, 1.0), 0.55);
}

/* ── Paper grain: 2-D smooth noise at paper scale ───────────────── */
float paperGrain(vec2 uv){
  return sn(uv.x*72.0 + uv.y*111.0)*0.55
       + sn(uv.x*180.0 - uv.y*240.0)*0.45;
}

/* ── Bayer 4×4 ordered dither threshold ────────────────────────── */
float bayer(vec2 p){
  float x=mod(floor(p.x),4.0), y=mod(floor(p.y),4.0), t;
  if      (y<1.0){if(x<1.0)t= 0.;else if(x<2.0)t= 8.;else if(x<3.0)t= 2.;else t=10.;}
  else if (y<2.0){if(x<1.0)t=12.;else if(x<2.0)t= 4.;else if(x<3.0)t=14.;else t= 6.;}
  else if (y<3.0){if(x<1.0)t= 3.;else if(x<2.0)t=11.;else if(x<3.0)t= 1.;else t= 9.;}
  else           {if(x<1.0)t=15.;else if(x<2.0)t= 7.;else if(x<3.0)t=13.;else t= 5.;}
  return t/16.0;
}

/* ── 3-step palette ─────────────────────────────────────────────── */
vec3 pal(float t){
  vec3 black=vec3(0.027,0.027,0.027);
  vec3 teal =vec3(0.030,0.140,0.095);
  vec3 mint =vec3(0.173,0.835,0.612);
  if(t<0.5) return mix(black,teal,t*2.0);
  return mix(teal,mint,(t-0.5)*2.0);
}

void main(){
  vec2 uv = gl_FragCoord.xy / u_resolution;
  uv.y = 1.0 - uv.y;

  /* Non-linear time warp — speed breathes in and out organically   */
  float tBase = u_time * 0.28;
  float t     = tBase
              + sin(tBase * 0.53) * 0.40    /* slow swell          */
              + sin(tBase * 1.17) * 0.18    /* medium irregularity */
              + sin(tBase * 2.31) * 0.07;   /* subtle flutter      */

  float x    = uv.x;
  float absY = abs(uv.y - 0.5);   /* distance from center spine */

  /* ── Waveform half-height at this x ──────────────────────────── */
  float env  = speechEnv(x, t);

  /* sin×sin product = irregular "beat" pattern, feels organic      */
  float osc  = sin(x*55.0 + t*4.8) * sin(x*91.0 - t*6.5);
  float hf   = sin(x*160.0+ t*8.7) * 0.30;
  float peak = env * (0.50 + osc*0.35 + hf*0.15);
  float halfH = max(peak * 0.26, 0.0030);  /* 0.003 = idle spine  */

  /* ── Build scalar intensity n ∈ [0,1] from waveform geometry ── */
  /* This is what gets dithered — not the color, the VALUE itself   */
  float inside   = step(absY, halfH);
  float gradient = clamp(1.0 - absY / halfH, 0.0, 1.0);  /* spine=1, edge=0 */
  float outerFade= exp(-max(absY - halfH, 0.0) * 16.0);   /* soft glow zone  */

  float n = inside   * (0.36 + gradient * 0.64)
           + (1.0-inside) * outerFade * 0.30;

  /* ── Paper grain nudges n (creates texture even in flat zones) ── */
  float grain = paperGrain(uv) * 0.5 + 0.5;
  n = clamp(n + (grain - 0.5) * 0.055, 0.0, 1.0);

  /* ── Vignette applied to n BEFORE dithering ─────────────────── */
  /* (keeps dither coherent — no abrupt color borders at edges)     */
  vec2 c = uv - 0.5;
  n *= clamp(1.0 - dot(c,c)*1.85, 0.0, 1.0);

  /* ── Bayer ordered dither: quantize n → 3 palette levels ─────── */
  float levels = 3.0;
  float scaled = n * (levels - 1.0);
  float lo     = floor(scaled);
  float hi     = min(lo + 1.0, levels - 1.0);
  float thresh = bayer(gl_FragCoord.xy / u_pixel);
  float chosen = (fract(scaled) > thresh) ? hi : lo;

  gl_FragColor = vec4(pal(chosen / (levels - 1.0)), 1.0);
}`;

export default function DitherCanvas({ pixelSize = 2 }) {
  const ref = useRef(null);
  const raf = useRef(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) return;

    const mkShader = (type, src) => {
      const sh = gl.createShader(type);
      gl.shaderSource(sh, src);
      gl.compileShader(sh);
      return sh;
    };
    const prog = gl.createProgram();
    gl.attachShader(prog, mkShader(gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, mkShader(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);
    const pos = gl.getAttribLocation(prog, 'a_position');
    gl.enableVertexAttribArray(pos);
    gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);

    const uT  = gl.getUniformLocation(prog, 'u_time');
    const uR  = gl.getUniformLocation(prog, 'u_resolution');
    const uPx = gl.getUniformLocation(prog, 'u_pixel');

    let start = null;
    const draw = ts => {
      if (!start) start = ts;
      const dpr = window.devicePixelRatio || 1;
      const w   = Math.floor(canvas.clientWidth  * dpr);
      const h   = Math.floor(canvas.clientHeight * dpr);
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w; canvas.height = h;
        gl.viewport(0, 0, w, h);
      }
      gl.uniform1f(uT,  (ts - start) / 1000);
      gl.uniform2f(uR,  w, h);
      gl.uniform1f(uPx, pixelSize * dpr);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      raf.current = requestAnimationFrame(draw);
    };
    raf.current = requestAnimationFrame(draw);
    return () => { if (raf.current) cancelAnimationFrame(raf.current); };
  }, [pixelSize]);

  return (
    <canvas
      ref={ref}
      className="absolute inset-0 w-full h-full"
      style={{ display: 'block' }}
    />
  );
}
