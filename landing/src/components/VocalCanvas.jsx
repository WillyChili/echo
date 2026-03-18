import { useEffect, useRef } from 'react';

const VERT = `attribute vec4 a_position; void main(){ gl_Position = a_position; }`;

const FRAG = `
precision mediump float;
uniform float u_time;
uniform vec2  u_resolution;

/* ── 1-D smooth noise ─────────────────────────────────────────────── */
float h1(float x){ return fract(sin(x*127.1)*43758.545); }
float sn(float x){
  float i=floor(x), f=fract(x);
  f=f*f*(3.0-2.0*f);
  return mix(h1(i), h1(i+1.0), f);
}

/* ── Speech envelope: slow-moving loudness that mimics real speech ── */
/* Layered at different scales to create word/syllable-like rhythm     */
float speechEnv(float x, float t){
  float a = sn(x*1.10 + t*0.18) * 0.38   /* word rhythm   */
           + sn(x*2.80 - t*0.14) * 0.26   /* syllables     */
           + sn(x*6.50 + t*0.30) * 0.22   /* phonemes      */
           + sn(x*13.0 - t*0.09) * 0.14;  /* micro detail  */
  return pow(clamp(a, 0.0, 1.0), 0.55);   /* sharpen peaks */
}

void main(){
  vec2 uv = gl_FragCoord.xy / u_resolution;
  uv.y = 1.0 - uv.y;

  float t    = u_time * 0.85;
  float x    = uv.x;
  float y    = uv.y - 0.5; /* 0 = center, ±0.5 = edges */
  float absY = abs(y);

  /* ── Waveform half-height at each x column ─────────────────────── */
  float env = speechEnv(x, t);

  /* High-freq oscillation ripple — simulates the actual vibration      */
  /* sin*sin product creates irregular "beats" that look organic        */
  float osc = sin(x*55.0 + t*10.5) * sin(x*91.0 - t*14.2);  /* -1..1  */
  float hf  = sin(x*160.0 + t*19.0) * 0.30;                  /* detail */

  /* peak = envelope shape × (carrier oscillation, always positive)    */
  float peak = env * (0.50 + osc*0.35 + hf*0.15);
  float halfH = max(peak * 0.24, 0.0025);  /* 0.0025 = thin idle line  */

  /* ── Distance from waveform boundary ───────────────────────────── */
  float inside   = step(absY, halfH);
  float gradient = clamp(1.0 - absY / halfH, 0.0, 1.0);  /* 1=spine, 0=edge */
  float outerGlow= exp(-max(absY - halfH, 0.0) * 30.0) * (1.0 - inside) * 0.45;

  float intensity = inside * (0.28 + gradient * 0.72) + outerGlow;

  /* ── Always-visible center spine (silent state) ─────────────────── */
  float spine = smoothstep(0.003, 0.0005, absY) * 0.18;
  intensity  += spine;

  /* ── Color: mint at spine → teal at waveform edge → glow ─────────── */
  vec3 bg   = vec3(0.027);
  vec3 mint = vec3(0.173, 0.835, 0.612);
  vec3 teal = vec3(0.038, 0.200, 0.138);

  float edgeT  = clamp(absY / max(halfH, 0.001), 0.0, 1.0);
  vec3 waveCol = mix(mint, teal, edgeT * 0.82);

  vec3 col = mix(bg, waveCol, clamp(intensity, 0.0, 1.0));

  /* ── Film grain (analog feel) ─────────────────────────────────────── */
  float grain = fract(sin(dot(gl_FragCoord.xy, vec2(12.9898,78.233)))*43758.5453);
  col += (grain - 0.5) * 0.018;

  /* ── Vignette ─────────────────────────────────────────────────────── */
  vec2 c = uv - 0.5;
  col *= clamp(1.0 - dot(c,c)*1.9, 0.0, 1.0);

  gl_FragColor = vec4(col, 1.0);
}`;

export default function VocalCanvas() {
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

    const uT = gl.getUniformLocation(prog, 'u_time');
    const uR = gl.getUniformLocation(prog, 'u_resolution');

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
      gl.uniform1f(uT, (ts - start) / 1000);
      gl.uniform2f(uR, w, h);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      raf.current = requestAnimationFrame(draw);
    };
    raf.current = requestAnimationFrame(draw);
    return () => { if (raf.current) cancelAnimationFrame(raf.current); };
  }, []);

  return (
    <canvas
      ref={ref}
      className="absolute inset-0 w-full h-full"
      style={{ display: 'block' }}
    />
  );
}
