export function playPianoish(
    frequency: number,
    duration: number,
    audioContext: AudioContext,
    velocity = 0.9
  ): void {
    const now = audioContext.currentTime;
  
    // Output chain: gain -> mild saturation -> lowpass -> (optional) reverb -> destination
    const out = audioContext.createGain();
    out.gain.value = 0.9;
  
    const saturator = audioContext.createWaveShaper();
    saturator.curve = makeSoftClipCurve(0.6) as Float32Array<ArrayBuffer>;
    saturator.oversample = "2x";
  
    const lp = audioContext.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 9000;
    lp.Q.value = 0.2;
  
    // Small "body" bump
    const body = audioContext.createBiquadFilter();
    body.type = "peaking";
    body.frequency.value = 250;
    body.Q.value = 0.7;
    body.gain.value = 3;
  
    // Optional: gentle compressor to glue
    const comp = audioContext.createDynamicsCompressor();
    comp.threshold.value = -24;
    comp.knee.value = 18;
    comp.ratio.value = 2.2;
    comp.attack.value = 0.003;
    comp.release.value = 0.12;
  
    out.connect(saturator);
    saturator.connect(body);
    body.connect(lp);
    lp.connect(comp);
    comp.connect(audioContext.destination);
  
    // Master envelope (piano: fast attack, fast-ish decay, long-ish release tail)
    const master = audioContext.createGain();
    master.connect(out);
  
    const attack = 0.002;
    const decay = 0.08;
    const sustain = 0.18 * velocity;
    const release = Math.min(0.45, Math.max(0.12, duration * 0.35));
  
    master.gain.cancelScheduledValues(now);
    master.gain.setValueAtTime(0.0001, now);
    master.gain.exponentialRampToValueAtTime(velocity, now + attack);
    master.gain.exponentialRampToValueAtTime(Math.max(0.0001, sustain), now + attack + decay);
    master.gain.setValueAtTime(Math.max(0.0001, sustain), now + Math.max(0, duration - release));
    master.gain.exponentialRampToValueAtTime(0.0001, now + duration);
  
    // --- HAMMER NOISE TRANSIENT (key part of "piano") ---
    const noise = audioContext.createBufferSource();
    noise.buffer = makeNoiseBuffer(audioContext, 0.03); // 30ms
    const noiseGain = audioContext.createGain();
    noiseGain.gain.value = 0.18 * velocity;
  
    const noiseBP = audioContext.createBiquadFilter();
    noiseBP.type = "bandpass";
    noiseBP.frequency.value = Math.min(6000, Math.max(1200, frequency * 6));
    noiseBP.Q.value = 0.7;
  
    // Very short transient envelope
    noiseGain.gain.setValueAtTime(0.0001, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.18 * velocity, now + 0.002);
    noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.02);
  
    noise.connect(noiseBP);
    noiseBP.connect(noiseGain);
    noiseGain.connect(master);
  
    noise.start(now);
    noise.stop(now + 0.03);
  
    // --- STRINGS: 2–3 detuned "unison" strings + inharmonic partials ---
    const unisonCents = frequency < 220 ? [0, 0.6, -0.6] : [0, 1.2, -1.2];
    const partialCount = frequency < 130 ? 14 : 10;
  
    // Inharmonicity coefficient (rough-ish): higher notes more inharmonic
    // Real pianos vary a lot; this is just a perceptual hint.
    const B = frequency < 200 ? 0.00008 : 0.00018;
  
    const oscillators: OscillatorNode[] = [];
    const gains: GainNode[] = [];
  
    for (const cents of unisonCents) {
      const detunedBase = frequency * Math.pow(2, cents / 1200);
  
      for (let n = 1; n <= partialCount; n++) {
        // Inharmonic partial: f_n = n*f*sqrt(1 + B*n^2)
        const fn = detunedBase * n * Math.sqrt(1 + B * n * n);
  
        const osc = audioContext.createOscillator();
        osc.type = "sine";
        osc.frequency.setValueAtTime(fn, now);
  
        const g = audioContext.createGain();
  
        // Per-partial amplitude: ~1/n with extra rolloff
        const amp = (1 / n) * Math.exp(-n / 7);
        g.gain.value = 0.0;
  
        // Per-partial decay: higher partials die faster
        const partialAttack = 0.0015;
        const partialDecay = 0.05 + (0.35 / (1 + n * 0.9)); // n↑ => decay↓
        const partialSustain = 0.06 * amp * velocity;
        const partialPeak = 0.35 * amp * velocity;
  
        g.gain.setValueAtTime(0.0001, now);
        g.gain.exponentialRampToValueAtTime(Math.max(0.0001, partialPeak), now + partialAttack);
        g.gain.exponentialRampToValueAtTime(Math.max(0.0001, partialSustain), now + partialAttack + partialDecay);
  
        // small tail aligned with master release
        g.gain.setValueAtTime(Math.max(0.0001, partialSustain), now + Math.max(0, duration - release));
        g.gain.exponentialRampToValueAtTime(0.0001, now + duration);
  
        osc.connect(g);
        g.connect(master);
  
        osc.start(now);
        osc.stop(now + duration + 0.02);
  
        oscillators.push(osc);
        gains.push(g);
      }
    }
  }
  
  // Helpers
  
  function makeNoiseBuffer(ctx: AudioContext, seconds: number): AudioBuffer {
    const sampleRate = ctx.sampleRate;
    const length = Math.max(1, Math.floor(sampleRate * seconds));
    const buffer = ctx.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) data[i] = (Math.random() * 2 - 1) * 0.8;
    return buffer;
  }
  
  function makeSoftClipCurve(amount: number): Float32Array {
    // amount ~0.3–0.9
    const n = 2048;
    const curve = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      const x = (i * 2) / (n - 1) - 1;
      curve[i] = Math.tanh((1 + amount * 8) * x) / Math.tanh(1 + amount * 8);
    }
    return curve;
  }
  